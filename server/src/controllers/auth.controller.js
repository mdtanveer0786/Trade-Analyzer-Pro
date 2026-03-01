import User from '../models/User.js'
import Trade from '../models/Trade.js'
import Strategy from '../models/Strategy.js'
import AISummary from '../models/AISummary.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            })
        }

        await User.create({
            name,
            email,
            password,
        })

        // Requirement: DO NOT generate token or set cookies here
        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please login.',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Google login
// @route   POST /api/auth/google-login
// @access  Public
export const googleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required',
            })
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        })

        const { sub, email, name, picture } = ticket.getPayload()

        let user = await User.findOne({ 
            $or: [
                { googleId: sub },
                { email }
            ]
        })

        if (!user) {
            // Create user if not found
            user = await User.create({
                googleId: sub,
                email,
                name,
                avatar: picture,
                isVerified: true // Google accounts are verified
            })
        } else if (!user.googleId) {
            // Link Google account to existing user with same email
            user.googleId = sub
            if (!user.avatar) user.avatar = picture
            await user.save()
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: '30d',
        })
        
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '7d',
        })

        res.status(200).json({
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                subscription: user.subscription
            }
        })
    } catch (error) {
        console.error('Google Login Error:', error)
        res.status(401).json({
            success: false,
            message: 'Google authentication failed',
        })
    }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            })
        }

        const user = await User.findOne({ email }).select('+password')
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: '30d',
        })
        
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '7d',
        })

        res.status(200).json({
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscription: user.subscription
            }
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body

        const user = await User.findById(req.userId).select('+password')

        // Check if user has a password (OAuth users might not)
        if (user.password) {
            const isMatch = await user.comparePassword(currentPassword)
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect',
                })
            }
        }

        user.password = newPassword
        await user.save()

        res.json({
            success: true,
            message: 'Password updated successfully',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        // Delete all user data
        await Trade.deleteMany({ user: req.userId })
        await Strategy.deleteMany({ user: req.userId })
        await AISummary.deleteMany({ user: req.userId })
        await User.findByIdAndDelete(req.userId)

        res.json({
            success: true,
            message: 'Account and all associated data deleted successfully',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Export user data
// @route   GET /api/auth/export-data
// @access  Private
export const exportUserData = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        const trades = await Trade.find({ user: req.userId }).populate('strategy')
        const strategies = await Strategy.find({ user: req.userId })

        const userData = {
            profile: user,
            trades,
            strategies,
            exportDate: new Date(),
        }

        res.json({
            success: true,
            data: userData,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            })
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        const user = await User.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
            })
        }

        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: '15m',
        })

        res.json({
            success: true,
            data: { accessToken },
        })
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
        })
    }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logout successful',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        res.json({
            success: true,
            data: user,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
    try {
        const { name, preferences } = req.body
        const user = await User.findByIdAndUpdate(
            req.userId,
            { name, preferences },
            { new: true, runValidators: true }
        )
        res.json({
            success: true,
            data: user,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        const resetToken = user.createPasswordResetToken()
        await user.save({ validateBeforeSave: false })

        // In a real app, you would send this via email
        res.json({
            success: true,
            message: 'Password reset token generated (Check server logs in dev)',
            resetToken, // Returning for testing purposes in this demo
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params
        const { password } = req.body

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        })

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token',
            })
        }

        user.password = password
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save()

        res.json({
            success: true,
            message: 'Password reset successful',
        })
    } catch (error) {
        next(error)
    }
}
