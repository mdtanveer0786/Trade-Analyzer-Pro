import mongoose from 'mongoose'

const subscriptionChangeSchema = new mongoose.Schema({
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true,
        index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE',
            'UPDATE',
            'CANCEL',
            'RENEW',
            'UPGRADE',
            'DOWNGRADE',
            'PAUSE',
            'RESUME',
            'APPLY_COUPON',
            'REMOVE_COUPON',
            'PAYMENT_SUCCESS',
            'PAYMENT_FAILED',
            'TRIAL_EXTENDED',
            'FEATURE_CHANGE',
        ],
    },
    changes: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    changedBy: {
        type: String,
        required: true, // 'system', 'user', 'admin'
    },
    ip: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
})

// Indexes
subscriptionChangeSchema.index({ subscription: 1, timestamp: -1 })
subscriptionChangeSchema.index({ user: 1, timestamp: -1 })
subscriptionChangeSchema.index({ action: 1, timestamp: -1 })
subscriptionChangeSchema.index({ changedBy: 1 })

const SubscriptionChange = mongoose.model('SubscriptionChange', subscriptionChangeSchema)

export default SubscriptionChange