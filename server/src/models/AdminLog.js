import mongoose from 'mongoose'

const adminLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'LOGOUT',
            'CREATE_USER',
            'UPDATE_USER',
            'DELETE_USER',
            'UPDATE_SUBSCRIPTION',
            'SEND_NOTIFICATION',
            'UPDATE_FEATURE_FLAG',
            'EXPORT_DATA',
            'SYSTEM_UPDATE',
        ],
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    targetSubscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
    },
    changes: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
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
adminLogSchema.index({ admin: 1, timestamp: -1 })
adminLogSchema.index({ action: 1 })
adminLogSchema.index({ targetUser: 1 })
adminLogSchema.index({ timestamp: -1 })

const AdminLog = mongoose.model('AdminLog', adminLogSchema)

export default AdminLog