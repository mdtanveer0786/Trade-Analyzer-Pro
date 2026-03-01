import Notification from '../models/Notification.js'

/**
 * Send a notification to one or more users
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type ('info', 'warning', 'success', 'error', 'announcement')
 * @param {string} [options.targetUsers='specific'] - Target user group ('all', 'specific')
 * @param {string[]} [options.specificUsers=[]] - Array of User IDs (if targetUsers is 'specific')
 * @param {string} [options.sentBy] - User ID of sender (e.g. admin or system)
 * @param {Object} [options.io] - Socket.io instance for real-time update
 * @returns {Promise<Object>} The created notification
 */
export const sendNotification = async ({
    title,
    message,
    type = 'info',
    targetUsers = 'specific',
    specificUsers = [],
    sentBy,
    io,
}) => {
    try {
        const notification = new Notification({
            title,
            message,
            type,
            targetUsers,
            specificUsers: targetUsers === 'specific' ? specificUsers : [],
            sentTo: targetUsers === 'specific' ? specificUsers : [],
            sentBy: sentBy || '000000000000000000000000', // System ID if not provided
            status: 'sent',
            sentAt: Date.now(),
        })

        await notification.save()

        // Real-time update via Socket.io if instance provided
        if (io) {
            if (targetUsers === 'all') {
                io.emit('new-notification', { ...notification.toObject(), isRead: false })
            } else {
                specificUsers.forEach(userId => {
                    io.to(`dashboard-${userId}`).emit('new-notification', { ...notification.toObject(), isRead: false })
                })
            }
        }

        return notification
    } catch (error) {
        console.error('Error sending notification:', error)
        throw error
    }
}
