import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error', 'announcement', 'maintenance'],
        default: 'info',
    },
    targetUsers: {
        type: String,
        enum: ['all', 'active', 'free', 'premium', 'inactive', 'specific'],
        default: 'all',
    },
    specificUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sentTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        readAt: {
            type: Date,
            default: Date.now,
        },
    }],
    scheduledFor: Date,
    sentAt: Date,
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
        default: 'draft',
    },
    metadata: mongoose.Schema.Types.Mixed,
}, {
    timestamps: true,
})

// Indexes
notificationSchema.index({ sentBy: 1, createdAt: -1 })
notificationSchema.index({ status: 1 })
notificationSchema.index({ scheduledFor: 1 })
notificationSchema.index({ type: 1 })
notificationSchema.index({ 'readBy.user': 1 })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification