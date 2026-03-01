import express from 'express'
import {
    register,
    login,
    googleLogin,
    refreshToken,
    getMe,
    updateProfile,
    forgotPassword,
    resetPassword,
    logout,
    changePassword,
    deleteAccount,
    exportUserData,
} from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate, userSchema } from '../utils/validation.js'

const router = express.Router()

// Public routes
router.post('/register', validate(userSchema), register)
router.post('/login', login)
router.post('/google-login', googleLogin)
router.post('/refresh-token', refreshToken)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

// Protected routes
router.get('/me', authMiddleware, getMe)
router.put('/profile', authMiddleware, updateProfile)
router.put('/change-password', authMiddleware, changePassword)
router.delete('/account', authMiddleware, deleteAccount)
router.get('/export-data', authMiddleware, exportUserData)
router.post('/logout', authMiddleware, logout)

export default router
