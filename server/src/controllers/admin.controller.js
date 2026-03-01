import User from '../models/User.js'
import Trade from '../models/Trade.js'
import Subscription from '../models/Subscription.js'
import Payment from '../models/Payment.js'
import Notification from '../models/Notification.js'
import AdminLog from '../models/AdminLog.js'
import { sendEmail } from '../utils/email.js'
import mongoose from 'mongoose'

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin
export const getStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalTrades,
            totalRevenue,
            monthlyRevenue,
            activeSubscriptions,
            newUsersToday,
            newUsersThisWeek,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ 'subscription.status': 'active' }),
            Trade.countDocuments(),
            Payment.aggregate([
                { $match: { status: 'captured' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Payment.aggregate([
                {
                    $match: {
                        status: 'captured',
                        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Subscription.countDocuments({ status: 'active' }),
            User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }),
            User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }),
        ])

        // User growth data (last 30 days)
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $limit: 30 },
        ])

        // Revenue by plan
        const revenueByPlan = await Payment.aggregate([
            {
                $match: { status: 'captured' },
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: 'razorpaySubscriptionId',
                    foreignField: 'razorpaySubscriptionId',
                    as: 'subscription',
                },
            },
            { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$subscription.plan',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ])

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    activeUsers,
                    totalTrades,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    monthlyRevenue: monthlyRevenue[0]?.total || 0,
                    activeSubscriptions,
                    newUsersToday,
                    newUsersThisWeek,
                    conversionRate: ((activeUsers / totalUsers) * 100).toFixed(1),
                },
                userGrowth,
                revenueByPlan: revenueByPlan.reduce((acc, curr) => {
                    acc[curr._id || 'one_time'] = {
                        total: curr.total / 100,
                        count: curr.count,
                    }
                    return acc
                }, {}),
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Admin
export const getUsers = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            role,
            subscriptionStatus,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query

        const query = {}

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ]
        }

        // Filter by role
        if (role) query.role = role

        // Filter by subscription status
        if (subscriptionStatus) query['subscription.status'] = subscriptionStatus

        const skip = (parseInt(page) - 1) * parseInt(limit)

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -refreshTokens')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query),
        ])

        // Get additional stats for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const [tradeCount, subscription, totalPnl] = await Promise.all([
                    Trade.countDocuments({ user: user._id }),
                    Subscription.findOne({ user: user._id }).sort({ createdAt: -1 }),
                    Trade.aggregate([
                        { $match: { user: user._id, status: 'closed' } },
                        { $group: { _id: null, total: { $sum: '$pnl' } } },
                    ]),
                ])

                return {
                    ...user.toObject(),
                    tradeCount,
                    subscription: subscription || null,
                    totalPnl: totalPnl[0]?.total || 0,
                }
            })
        )

        res.json({
            success: true,
            data: usersWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get specific user details
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password -refreshTokens')

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        // Get user statistics
        const [
            tradeStats,
            subscriptions,
            payments,
            recentTrades,
        ] = await Promise.all([
            Trade.aggregate([
                { $match: { user: user._id, status: 'closed' } },
                {
                    $group: {
                        _id: null,
                        totalTrades: { $sum: 1 },
                        winningTrades: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
                        losingTrades: { $sum: { $cond: [{ $lt: ['$pnl', 0] }, 1, 0] } },
                        totalPnL: { $sum: '$pnl' },
                        avgWin: { $avg: { $cond: [{ $gt: ['$pnl', 0] }, '$pnl', null] } },
                        avgLoss: { $avg: { $cond: [{ $lt: ['$pnl', 0] }, '$pnl', null] } },
                    },
                },
            ]),
            Subscription.find({ user: user._id }).sort({ createdAt: -1 }),
            Payment.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
            Trade.find({ user: user._id })
                .sort({ entryDate: -1 })
                .limit(10)
                .populate('strategy'),
        ])

        const stats = tradeStats[0] || {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: 0,
            avgWin: 0,
            avgLoss: 0,
        }

        res.json({
            success: true,
            data: {
                user,
                stats: {
                    ...stats,
                    winRate: stats.totalTrades > 0
                        ? (stats.winningTrades / stats.totalTrades) * 100
                        : 0,
                },
                subscriptions,
                payments,
                recentTrades,
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Admin
export const updateUser = async (req, res, next) => {
    try {
        const { name, email, role, subscription, preferences } = req.body

        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        // Update user
        const updateData = {}
        if (name) updateData.name = name
        if (email) updateData.email = email
        
        if (role && role !== user.role) {
            // Prevent self-demotion
            if (req.userId.toString() === user._id.toString() && role !== 'admin') {
                return res.status(400).json({
                    success: false,
                    message: 'CRITICAL ERROR: Self-demotion protocol blocked. You cannot revoke your own admin access.',
                })
            }

            // Ensure at least one admin exists
            if (user.role === 'admin' && role !== 'admin') {
                const adminCount = await User.countDocuments({ role: 'admin' })
                if (adminCount <= 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'SYSTEM LOCK: Final admin account detected. Demotion denied to prevent complete lockout.',
                    })
                }
            }
            updateData.role = role
        }

        if (preferences) updateData.preferences = { ...user.preferences, ...preferences }

        if (subscription) {
            updateData.subscription = { ...user.subscription, ...subscription }

            // If updating subscription status, also update role
            if (subscription.status === 'active' && subscription.plan !== 'free') {
                updateData.role = 'premium'
            } else if (subscription.status === 'cancelled' || subscription.status === 'expired') {
                updateData.role = 'user'
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -refreshTokens')

        // Log the admin action
        await createAdminLog({
            admin: req.userId,
            action: 'UPDATE_USER',
            targetUser: user._id,
            changes: req.body,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        })

        res.json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        // Safeguard against deleting self or other admins
        if (user.role === 'admin') {
            // Prevent self-deletion
            if (req.userId.toString() === user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'CRITICAL ERROR: Self-deletion protocol blocked. You cannot de-provision your own admin account.',
                })
            }

            // Ensure at least one admin exists if trying to delete another admin
            const adminCount = await User.countDocuments({ role: 'admin' })
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'SYSTEM LOCK: Final admin account detected. De-provisioning denied to prevent complete lockout.',
                })
            }
        }

        // PERFORM HARD DELETE (FULL CONTROL)
        // 1. Delete all trades associated with the user
        await Trade.deleteMany({ user: user._id })

        // 2. Delete all AI Summaries associated with the user
        await AISummary.deleteMany({ user: user._id })

        // 3. Delete any notifications sent specifically to this user
        // (Optional: depending on your Notification model structure)
        
        // 4. Cancel active subscription in DB
        if (user.subscription.razorpaySubscriptionId) {
            await Subscription.deleteOne({
                razorpaySubscriptionId: user.subscription.razorpaySubscriptionId,
            })
        }

        // 5. Delete the User record itself
        await User.findByIdAndDelete(user._id)

        // Log the admin action
        await createAdminLog({
            admin: req.userId,
            action: 'HARD_DELETE_USER',
            targetUser: user._id,
            metadata: {
                email: user.email,
                name: user.name,
                reason: 'Permanent de-provisioning by Admin'
            },
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        })

        res.json({
            success: true,
            message: 'OPERATOR PURGED: User and all associated data have been permanently removed from the system.',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get revenue analytics
// @route   GET /api/admin/revenue
// @access  Admin
export const getRevenue = async (req, res, next) => {
    try {
        const { period = 'monthly', startDate, endDate } = req.query

        let dateFilter = {}
        if (startDate || endDate) {
            dateFilter.createdAt = {}
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate)
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate)
        } else {
            // Default to last 30 days
            dateFilter.createdAt = {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            }
        }

        // Revenue over time
        const revenueOverTime = await Payment.aggregate([
            {
                $match: {
                    ...dateFilter,
                    status: 'captured',
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: period === 'daily' ? '%Y-%m-%d' : '%Y-%m',
                            date: '$createdAt',
                        },
                    },
                    revenue: { $sum: '$amount' },
                    transactions: { $sum: 1 },
                    avgTransaction: { $avg: '$amount' },
                },
            },
            { $sort: { _id: 1 } },
        ])

        // Revenue by plan
        const revenueByPlan = await Payment.aggregate([
            {
                $match: {
                    ...dateFilter,
                    status: 'captured',
                },
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: 'razorpaySubscriptionId',
                    foreignField: 'razorpaySubscriptionId',
                    as: 'subscription',
                },
            },
            { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$subscription.plan',
                    revenue: { $sum: '$amount' },
                    transactions: { $sum: 1 },
                },
            },
        ])

        // Payment method distribution
        const paymentMethods = await Payment.aggregate([
            {
                $match: {
                    ...dateFilter,
                    status: 'captured',
                    method: { $exists: true, $ne: null },
                },
            },
            {
                $group: {
                    _id: '$method',
                    revenue: { $sum: '$amount' },
                    transactions: { $sum: 1 },
                },
            },
            { $sort: { revenue: -1 } },
        ])

        // MRR (Monthly Recurring Revenue)
        const activeSubscriptions = await Subscription.aggregate([
            {
                $match: {
                    status: 'active',
                    currentEnd: { $gte: new Date() },
                },
            },
            {
                $group: {
                    _id: '$plan',
                    count: { $sum: 1 },
                    totalMRR: {
                        $sum: {
                            $cond: [
                                { $eq: ['$plan', 'monthly'] },
                                { $divide: ['$amount', 100] },
                                { $divide: ['$amount', 1200] }, // Yearly to monthly
                            ],
                        },
                    },
                },
            },
        ])

        const totalMRR = activeSubscriptions.reduce((sum, plan) => sum + plan.totalMRR, 0)

        res.json({
            success: true,
            data: {
                revenueOverTime: revenueOverTime.map(item => ({
                    date: item._id,
                    revenue: item.revenue / 100,
                    transactions: item.transactions,
                    avgTransaction: item.avgTransaction / 100,
                })),
                revenueByPlan: revenueByPlan.reduce((acc, item) => {
                    acc[item._id || 'one_time'] = {
                        revenue: item.revenue / 100,
                        transactions: item.transactions,
                    }
                    return acc
                }, {}),
                paymentMethods: paymentMethods.map(item => ({
                    method: item._id,
                    revenue: item.revenue / 100,
                    transactions: item.transactions,
                    percentage: ((item.revenue / revenueOverTime.reduce((sum, r) => sum + r.revenue, 0)) * 100).toFixed(1),
                })),
                mrr: {
                    total: totalMRR,
                    byPlan: activeSubscriptions.reduce((acc, plan) => {
                        acc[plan._id] = {
                            count: plan.count,
                            mrr: plan.totalMRR,
                        }
                        return acc
                    }, {}),
                },
                metrics: {
                    totalRevenue: revenueOverTime.reduce((sum, r) => sum + r.revenue, 0) / 100,
                    totalTransactions: revenueOverTime.reduce((sum, r) => sum + r.transactions, 0),
                    avgTransactionValue: revenueOverTime.reduce((sum, r) => sum + r.avgTransaction, 0) / revenueOverTime.length / 100,
                    churnRate: await calculateChurnRate(),
                    lifetimeValue: await calculateLTV(),
                },
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get all subscriptions
// @route   GET /api/admin/subscriptions
// @access  Admin
export const getSubscriptions = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            plan,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query

        const query = {}
        if (status) query.status = status
        if (plan) query.plan = plan

        const skip = (parseInt(page) - 1) * parseInt(limit)

        const [subscriptions, total] = await Promise.all([
            Subscription.find(query)
                .populate('user', 'name email')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Subscription.countDocuments(query),
        ])

        res.json({
            success: true,
            data: subscriptions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Update subscription
// @route   PUT /api/admin/subscriptions/:id
// @access  Admin
export const updateSubscription = async (req, res, next) => {
    try {
        const { status, plan, currentEnd, notes } = req.body

        const subscription = await Subscription.findById(req.params.id)
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found',
            })
        }

        const updateData = {}
        if (status) updateData.status = status
        if (plan) updateData.plan = plan
        if (currentEnd) updateData.currentEnd = new Date(currentEnd)
        if (notes) updateData.notes = notes

        const updatedSubscription = await Subscription.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'name email')

        // Update user role if subscription status changes
        if (status && updatedSubscription.user) {
            const user = await User.findById(updatedSubscription.user._id)
            if (user) {
                if (status === 'active' && plan !== 'free') {
                    user.role = 'premium'
                } else if (status === 'cancelled' || status === 'expired') {
                    user.role = 'user'
                }
                user.subscription.status = status
                await user.save()
            }
        }

        // Log the admin action
        await createAdminLog({
            admin: req.userId,
            action: 'UPDATE_SUBSCRIPTION',
            targetSubscription: subscription._id,
            changes: req.body,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        })

        res.json({
            success: true,
            data: updatedSubscription,
            message: 'Subscription updated successfully',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Send notification to users
// @route   POST /api/admin/notifications
// @access  Admin
export const sendNotification = async (req, res, next) => {
    try {
        const { title, message, type, targetUsers, sendEmail: shouldSendEmail } = req.body

        // Validate input
        if (!title || !message || !type) {
            return res.status(400).json({
                success: false,
                message: 'Title, message, and type are required',
            })
        }

        let usersQuery = {}

        // Filter users based on target
        if (targetUsers === 'all') {
            // All users
        } else if (targetUsers === 'active') {
            usersQuery['subscription.status'] = 'active'
        } else if (targetUsers === 'free') {
            usersQuery['subscription.plan'] = 'free'
        } else if (targetUsers === 'premium') {
            usersQuery.role = 'premium'
        } else if (targetUsers === 'inactive') {
            usersQuery['subscription.status'] = { $ne: 'active' }
        }

        const users = await User.find(usersQuery).select('email name')

        // Store notification in database
        const notification = await createNotification({
            title,
            message,
            type,
            targetUsers,
            sentBy: req.userId,
            sentTo: users.map(u => u._id),
            status: 'sent',
            sentAt: Date.now(),
        })

        // Send emails if requested
        if (shouldSendEmail) {
            const emailPromises = users.map(user =>
                sendEmail({
                    to: user.email,
                    template: 'admin-notification',
                    context: {
                        name: user.name,
                        title,
                        message,
                        type,
                        date: new Date().toLocaleDateString('en-IN'),
                    },
                }).catch(err => {
                    console.error(`Failed to send email to ${user.email}:`, err)
                    return null
                })
            )

            await Promise.all(emailPromises)
        }

        // Log the admin action
        await createAdminLog({
            admin: req.userId,
            action: 'SEND_NOTIFICATION',
            metadata: {
                title,
                type,
                targetUsers,
                sentToCount: users.length,
                sentEmail: shouldSendEmail,
            },
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        })

        res.json({
            success: true,
            data: {
                notification,
                sentTo: users.length,
                sentEmail: shouldSendEmail,
            },
            message: `Notification sent to ${users.length} users`,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get system metrics
// @route   GET /api/admin/metrics
// @access  Admin
export const getSystemMetrics = async (req, res, next) => {
    try {
        // Database metrics
        const dbStats = await mongoose.connection.db.stats()

        // Collection sizes
        const collections = await mongoose.connection.db.listCollections().toArray()
        const collectionStats = await Promise.all(
            collections.map(async (collection) => {
                const stats = await mongoose.connection.db.collection(collection.name).stats()
                return {
                    name: collection.name,
                    size: stats.size,
                    count: stats.count,
                    avgObjSize: stats.avgObjSize,
                    storageSize: stats.storageSize,
                }
            })
        )

        // API metrics (you might want to store these in Redis or another store)
        const apiMetrics = {
            totalRequests: 0, // Implement request tracking
            avgResponseTime: 0,
            errorRate: 0,
            endpoints: [],
        }

        // System health
        const systemHealth = {
            database: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
            redis: 'healthy', // Implement Redis health check
            storage: 'healthy', // Implement storage health check
            api: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        }

        res.json({
            success: true,
            data: {
                database: {
                    ...dbStats,
                    collections: collectionStats,
                },
                api: apiMetrics,
                system: systemHealth,
                alerts: await getSystemAlerts(),
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Admin
export const getLogs = async (req, res, next) => {
    try {
        const { type, level, startDate, endDate, page = 1, limit = 50 } = req.query

        const query = {}
        if (type) query.type = type
        if (level) query.level = level
        if (startDate || endDate) {
            query.timestamp = {}
            if (startDate) query.timestamp.$gte = new Date(startDate)
            if (endDate) query.timestamp.$lte = new Date(endDate)
        }

        const skip = (parseInt(page) - 1) * parseInt(limit)

        // You should have a Log model for storing logs
        // const [logs, total] = await Promise.all([
        //   Log.find(query)
        //     .sort({ timestamp: -1 })
        //     .skip(skip)
        //     .limit(parseInt(limit)),
        //   Log.countDocuments(query),
        // ])

        // For now, return mock data
        const logs = []
        const total = 0

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get feature flags
// @route   GET /api/admin/feature-flags
// @access  Admin
export const getFeatureFlags = async (req, res, next) => {
    try {
        // You should have a FeatureFlag model
        // const featureFlags = await FeatureFlag.find()

        // For now, return default feature flags
        const featureFlags = [
            { key: 'AI_ANALYSIS', enabled: true, description: 'Enable AI trade analysis' },
            { key: 'CSV_IMPORT', enabled: true, description: 'Enable CSV import feature' },
            { key: 'PSYCHOLOGY_TRACKING', enabled: true, description: 'Enable psychology tracking' },
            { key: 'TEAM_FEATURES', enabled: false, description: 'Enable team collaboration features' },
            { key: 'API_ACCESS', enabled: false, description: 'Enable API access for premium users' },
            { key: 'BETA_FEATURES', enabled: false, description: 'Enable beta features for testers' },
        ]

        res.json({
            success: true,
            data: featureFlags,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Update feature flag
// @route   PUT /api/admin/feature-flags/:key
// @access  Admin
export const updateFeatureFlag = async (req, res, next) => {
    try {
        const { enabled, description } = req.body
        const { key } = req.params

        // Update feature flag in database
        // await FeatureFlag.findOneAndUpdate(
        //   { key },
        //   { enabled, description, updatedBy: req.userId, updatedAt: new Date() },
        //   { upsert: true, new: true }
        // )

        // Log the admin action
        await createAdminLog({
            admin: req.userId,
            action: 'UPDATE_FEATURE_FLAG',
            metadata: {
                key,
                enabled,
                description,
            },
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        })

        // Clear cache if using Redis
        // await redisClient.del('feature_flags')

        res.json({
            success: true,
            message: `Feature flag ${key} ${enabled ? 'enabled' : 'disabled'}`,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Export admin data
// @route   POST /api/admin/export
// @access  Admin
export const exportData = async (req, res, next) => {
    try {
        const { type, format, startDate, endDate } = req.body

        let data
        let filename

        switch (type) {
            case 'users':
                data = await exportUsers(startDate, endDate)
                filename = `users_export_${Date.now()}.${format}`
                break
            case 'transactions':
                data = await exportTransactions(startDate, endDate)
                filename = `transactions_export_${Date.now()}.${format}`
                break
            case 'trades':
                data = await exportTrades(startDate, endDate)
                filename = `trades_export_${Date.now()}.${format}`
                break
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid export type',
                })
        }

        // Convert to requested format
        let exportData, contentType
        if (format === 'csv') {
            exportData = convertToCSV(data)
            contentType = 'text/csv'
        } else if (format === 'json') {
            exportData = JSON.stringify(data, null, 2)
            contentType = 'application/json'
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid format',
            })
        }

        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.send(exportData)
    } catch (error) {
        next(error)
    }
}

// Helper functions
const createAdminLog = async (logData) => {
    try {
        await AdminLog.create(logData)
    } catch (error) {
        console.error('Failed to create admin log:', error)
    }
}

const createNotification = async (notificationData) => {
    try {
        const notification = new Notification(notificationData)
        return await notification.save()
    } catch (error) {
        console.error('Failed to create notification:', error)
        throw error
    }
}

const calculateChurnRate = async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [cancelledSubs, activeSubs] = await Promise.all([
        Subscription.countDocuments({
            status: 'cancelled',
            cancelledAt: { $gte: thirtyDaysAgo },
        }),
        Subscription.countDocuments({
            status: 'active',
            currentEnd: { $gte: new Date() },
        }),
    ])

    return activeSubs > 0 ? (cancelledSubs / activeSubs) * 100 : 0
}

const calculateLTV = async () => {
    const payments = await Payment.aggregate([
        { $match: { status: 'captured' } },
        {
            $group: {
                _id: '$user',
                totalSpent: { $sum: '$amount' },
                transactions: { $sum: 1 },
            },
        },
    ])

    const avgSpent = payments.reduce((sum, p) => sum + p.totalSpent, 0) / payments.length
    return avgSpent / 100 // Convert to rupees
}

const getSystemAlerts = async () => {
    const alerts = []

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
        alerts.push({
            level: 'critical',
            message: 'Database connection lost',
            timestamp: new Date(),
        })
    }

    // Check for failed payments in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const failedPayments = await Payment.countDocuments({
        status: 'failed',
        createdAt: { $gte: oneHourAgo },
    })

    if (failedPayments > 10) {
        alerts.push({
            level: 'warning',
            message: `${failedPayments} failed payments in the last hour`,
            timestamp: new Date(),
        })
    }

    return alerts
}

const exportUsers = async (startDate, endDate) => {
    const query = {}
    if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const users = await User.find(query)
        .select('name email role subscription.createdAt subscription.plan subscription.status createdAt')
        .lean()

    return users.map(user => ({
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.subscription.plan,
        status: user.subscription.status,
        createdAt: user.createdAt,
        subscriptionDate: user.subscription.createdAt,
    }))
}

const exportTransactions = async (startDate, endDate) => {
    const query = { status: 'captured' }
    if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const payments = await Payment.find(query)
        .populate('user', 'name email')
        .lean()

    return payments.map(payment => ({
        paymentId: payment.razorpayPaymentId,
        user: payment.user?.email || 'Unknown',
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: payment.createdAt,
    }))
}

const exportTrades = async (startDate, endDate) => {
    const query = {}
    if (startDate || endDate) {
        query.entryDate = {}
        if (startDate) query.entryDate.$gte = new Date(startDate)
        if (endDate) query.entryDate.$lte = new Date(endDate)
    }

    const trades = await Trade.find(query)
        .populate('user', 'name email')
        .lean()

    return trades.map(trade => ({
        tradeId: trade.tradeId,
        user: trade.user?.email || 'Unknown',
        symbol: trade.symbol,
        market: trade.market,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        pnl: trade.pnl,
        pnlPercentage: trade.pnlPercentage,
        status: trade.status,
        entryDate: trade.entryDate,
        exitDate: trade.exitDate,
    }))
}

const convertToCSV = (data) => {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const rows = data.map(row =>
        headers.map(header =>
            JSON.stringify(row[header] || '')
        ).join(',')
    )

    return [headers.join(','), ...rows].join('\n')
}