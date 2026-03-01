import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    razorpayPaymentId: {
        type: String,
        required: true,
        unique: true,
    },
    razorpayOrderId: String,
    razorpaySubscriptionId: String,
    razorpayInvoiceId: String,
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    status: {
        type: String,
        enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
        default: 'created',
    },
    method: String,
    bank: String,
    wallet: String,
    cardId: String,
    description: String,
    notes: mongoose.Schema.Types.Mixed,
    refundStatus: String,
    refundAmount: Number,
    errorCode: String,
    errorDescription: String,
    errorSource: String,
    errorReason: String,
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
})

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 })
paymentSchema.index({ razorpayPaymentId: 1 }, { unique: true })
paymentSchema.index({ razorpaySubscriptionId: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ createdAt: 1 })

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment