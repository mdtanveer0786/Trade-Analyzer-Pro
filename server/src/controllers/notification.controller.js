import Notification from '../models/Notification.js'

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { targetUsers: 'all' },
                { targetUsers: 'specific', specificUsers: req.userId },
                { sentTo: req.userId }
            ],
            status: 'sent'
        }).sort({ createdAt: -1 }).limit(50)

        // Add 'isRead' field based on readBy array
        const formattedNotifications = notifications.map(notif => {
            const notifObj = notif.toObject()
            notifObj.isRead = notif.readBy.some(read => read.user.toString() === req.userId)
            return notifObj
        })

        res.json({
            success: true,
            data: formattedNotifications
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id)

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            })
        }

        // Check if already read
        const isAlreadyRead = notification.readBy.some(
            read => read.user.toString() === req.userId
        )

        if (!isAlreadyRead) {
            notification.readBy.push({
                user: req.userId,
                readAt: Date.now()
            })
            await notification.save()
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { targetUsers: 'all' },
                { targetUsers: 'specific', specificUsers: req.userId },
                { sentTo: req.userId }
            ],
            status: 'sent',
            'readBy.user': { $ne: req.userId }
        })

        for (const notification of notifications) {
            notification.readBy.push({
                user: req.userId,
                readAt: Date.now()
            })
            await notification.save()
        }

        res.json({
            success: true,
            message: 'All notifications marked as read'
        })
    } catch (error) {
        next(error)
    }
}
