import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const authMiddleware = async (req, res, next) => {
    try {
        let token

        // Check for token in Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            })
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

        // Get user from token
        const user = await User.findById(decoded.userId).select('-password -refreshTokens')

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            })
        }

        // Check if user is active
        if (user.subscription.status === 'expired' || user.subscription.status === 'cancelled') {
            return res.status(403).json({
                success: false,
                message: 'Your subscription has expired. Please renew to continue.',
            })
        }

        req.userId = user._id
        req.user = user
        next()
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            })
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
            })
        }

        next(error)
    }
}

export const adminMiddleware = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized as admin',
            })
        }
        next()
    } catch (error) {
        next(error)
    }
}

export const premiumMiddleware = async (req, res, next) => {
    try {
        if (req.user.subscription.plan === 'free') {
            return res.status(403).json({
                success: false,
                message: 'Premium feature. Upgrade your plan to access.',
            })
        }
        next()
    } catch (error) {
        next(error)
    }
}