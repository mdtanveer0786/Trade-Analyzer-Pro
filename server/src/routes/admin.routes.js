import express from 'express'
import {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    getStats,
    getRevenue,
    getSubscriptions,
    updateSubscription,
    sendNotification,
    getSystemMetrics,
    getLogs,
    updateFeatureFlag,
    getFeatureFlags,
    exportData
} from '../controllers/admin.controller.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Apply admin middleware to all routes
router.use(authMiddleware, adminMiddleware)

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/stats', getStats)

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Admin
router.get('/users', getUsers)

// @route   GET /api/admin/users/:id
// @desc    Get specific user details
// @access  Admin
router.get('/users/:id', getUser)

// @route   PUT /api/admin/users/:id
// @desc    Update user details
// @access  Admin
router.put('/users/:id', updateUser)

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', deleteUser)

// @route   GET /api/admin/revenue
// @desc    Get revenue analytics
// @access  Admin
router.get('/revenue', getRevenue)

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions
// @access  Admin
router.get('/subscriptions', getSubscriptions)

// @route   PUT /api/admin/subscriptions/:id
// @desc    Update subscription
// @access  Admin
router.put('/subscriptions/:id', updateSubscription)

// @route   POST /api/admin/notifications
// @desc    Send notification to users
// @access  Admin
router.post('/notifications', sendNotification)

// @route   GET /api/admin/metrics
// @desc    Get system metrics
// @access  Admin
router.get('/metrics', getSystemMetrics)

// @route   GET /api/admin/logs
// @desc    Get system logs
// @access  Admin
router.get('/logs', getLogs)

// @route   GET /api/admin/feature-flags
// @desc    Get feature flags
// @access  Admin
router.get('/feature-flags', getFeatureFlags)

// @route   PUT /api/admin/feature-flags/:key
// @desc    Update feature flag
// @access  Admin
router.put('/feature-flags/:key', updateFeatureFlag)

// @route   POST /api/admin/export
// @desc    Export admin data
// @access  Admin
router.post('/export', exportData)

export default router