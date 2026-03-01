import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // Razorpay Identifiers
    razorpaySubscriptionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    razorpayCustomerId: {
        type: String,
        index: true,
    },
    razorpayPlanId: {
        type: String,
        required: true,
    },

    // Subscription Details
    plan: {
        type: String,
        enum: ['free', 'monthly', 'yearly'],
        required: true,
        default: 'free',
    },
    planName: {
        type: String,
        default: 'Free Plan',
    },

    // Status Management
    status: {
        type: String,
        enum: [
            'created',           // Subscription created but not active
            'authenticated',     // Payment authenticated
            'active',            // Subscription active
            'pending',           // Payment pending
            'halted',           // Payment failed, subscription halted
            'paused',           // Manually paused
            'cancelled',        // User cancelled
            'expired',          // Subscription expired
            'completed',        // Completed all cycles
            'failed',           // Payment failed
        ],
        default: 'created',
        index: true,
    },

    // Billing Period
    currentStart: {
        type: Date,
        required: true,
        default: Date.now,
    },
    currentEnd: {
        type: Date,
        required: true,
    },
    nextBillingDate: {
        type: Date,
    },

    // Pricing
    amount: {
        type: Number, // in paise
        required: true,
    },
    discountedAmount: {
        type: Number, // in paise
    },
    originalAmount: {
        type: Number, // in paise
    },
    currency: {
        type: String,
        default: 'INR',
    },

    // Discounts & Promotions
    couponCode: {
        type: String,
    },
    discount: {
        type: Number, // in paise
        default: 0,
    },
    discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
    },

    // Trial Period
    isTrial: {
        type: Boolean,
        default: false,
    },
    trialStart: Date,
    trialEnd: Date,
    trialDays: {
        type: Number,
        default: 0,
    },

    // Payment History
    payments: [{
        razorpayPaymentId: {
            type: String,
            required: true,
        },
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
            required: true,
        },
        method: String,
        bank: String,
        wallet: String,
        cardId: String,
        invoiceId: String,
        description: String,
        createdAt: {
            type: Date,
            default: Date.now,
        },
        metadata: mongoose.Schema.Types.Mixed,
    }],

    lastPaymentDate: Date,
    lastPaymentStatus: String,
    totalPayments: {
        type: Number,
        default: 0,
    },
    totalAmountPaid: {
        type: Number,
        default: 0,
    },

    // Cancellation Details
    cancelledAt: Date,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    cancellationReason: String,
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
    },
    willCancelAt: Date,

    // Renewal & Retry
    autoRenew: {
        type: Boolean,
        default: true,
    },
    retryCount: {
        type: Number,
        default: 0,
    },
    nextRetryAt: Date,

    // Feature Access
    features: {
        maxTrades: {
            type: Number,
            default: 20, // Free tier limit
        },
        aiAnalysis: {
            type: Boolean,
            default: false,
        },
        advancedAnalytics: {
            type: Boolean,
            default: false,
        },
        psychologyTracking: {
            type: Boolean,
            default: false,
        },
        csvImport: {
            type: Boolean,
            default: false,
        },
        apiAccess: {
            type: Boolean,
            default: false,
        },
        prioritySupport: {
            type: Boolean,
            default: false,
        },
        customReports: {
            type: Boolean,
            default: false,
        },
        teamCollaboration: {
            type: Boolean,
            default: false,
        },
        betaFeatures: {
            type: Boolean,
            default: false,
        },
    },

    // Metadata
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,

    // Audit Trail
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

// Virtuals
subscriptionSchema.virtual('amountInRupees').get(function () {
    return this.amount / 100
})

subscriptionSchema.virtual('discountedAmountInRupees').get(function () {
    return this.discountedAmount ? this.discountedAmount / 100 : null
})

subscriptionSchema.virtual('originalAmountInRupees').get(function () {
    return this.originalAmount ? this.originalAmount / 100 : null
})

subscriptionSchema.virtual('totalAmountPaidInRupees').get(function () {
    return this.totalAmountPaid / 100
})

subscriptionSchema.virtual('isActive').get(function () {
    return this.status === 'active' || this.status === 'authenticated'
})

subscriptionSchema.virtual('isExpired').get(function () {
    return this.status === 'expired' || this.status === 'completed'
})

subscriptionSchema.virtual('isCancelled').get(function () {
    return this.status === 'cancelled'
})

subscriptionSchema.virtual('isTrialActive').get(function () {
    if (!this.isTrial || !this.trialEnd) return false
    return new Date() <= this.trialEnd
})

subscriptionSchema.virtual('daysUntilExpiry').get(function () {
    if (!this.currentEnd) return null
    const diff = this.currentEnd - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

subscriptionSchema.virtual('nextPaymentAmount').get(function () {
    return this.discountedAmount || this.amount
})

subscriptionSchema.virtual('nextPaymentAmountInRupees').get(function () {
    const amount = this.discountedAmount || this.amount
    return amount / 100
})

// Indexes for performance
subscriptionSchema.index({ user: 1, status: 1 })
subscriptionSchema.index({ razorpaySubscriptionId: 1 }, { unique: true })
subscriptionSchema.index({ razorpayCustomerId: 1 })
subscriptionSchema.index({ status: 1, currentEnd: 1 })
subscriptionSchema.index({ plan: 1, status: 1 })
subscriptionSchema.index({ currentEnd: 1 })
subscriptionSchema.index({ 'payments.razorpayPaymentId': 1 })
subscriptionSchema.index({ createdAt: -1 })
subscriptionSchema.index({ updatedAt: -1 })

// Pre-save middleware
subscriptionSchema.pre('save', function (next) {
    this.updatedAt = new Date()

    // Set plan name based on plan type
    if (this.plan === 'free') {
        this.planName = 'Free Plan'
        this.features = getFreeFeatures()
    } else if (this.plan === 'monthly') {
        this.planName = 'Monthly Plan'
        this.features = getMonthlyFeatures()
    } else if (this.plan === 'yearly') {
        this.planName = 'Annual Plan'
        this.features = getYearlyFeatures()
    }

    // Calculate next billing date
    if (this.status === 'active' && this.currentEnd) {
        this.nextBillingDate = new Date(this.currentEnd)
    }

    next()
})

// Instance Methods
subscriptionSchema.methods.calculateNextBillingDate = function () {
    if (!this.currentEnd) return null

    const nextDate = new Date(this.currentEnd)
    if (this.plan === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1)
    } else if (this.plan === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1)
    }

    return nextDate
}

subscriptionSchema.methods.addPayment = async function (paymentData) {
    this.payments.push({
        razorpayPaymentId: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        status: paymentData.status || 'captured',
        method: paymentData.method,
        bank: paymentData.bank,
        wallet: paymentData.wallet,
        cardId: paymentData.card_id,
        invoiceId: paymentData.invoice_id,
        description: `Payment for ${this.planName}`,
        metadata: paymentData,
    })

    this.lastPaymentDate = new Date()
    this.lastPaymentStatus = paymentData.status
    this.totalPayments += 1
    this.totalAmountPaid += paymentData.amount

    await this.save()
    return this
}

subscriptionSchema.methods.cancelSubscription = async function (reason = 'User request', cancelledBy = null) {
    this.status = 'cancelled'
    this.cancelledAt = new Date()
    this.cancellationReason = reason

    if (cancelledBy) {
        this.cancelledBy = cancelledBy
    }

    // Set end date to now for immediate cancellation
    this.currentEnd = new Date()
    this.nextBillingDate = null

    await this.save()
    return this
}

subscriptionSchema.methods.pauseSubscription = async function () {
    this.status = 'paused'
    await this.save()
    return this
}

subscriptionSchema.methods.resumeSubscription = async function () {
    if (this.status === 'paused') {
        this.status = 'active'
        await this.save()
    }
    return this
}

subscriptionSchema.methods.extendTrial = async function (days) {
    if (!this.trialEnd) {
        this.trialEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    } else {
        this.trialEnd.setDate(this.trialEnd.getDate() + days)
    }

    this.trialDays += days
    await this.save()
    return this
}

subscriptionSchema.methods.upgradePlan = async function (newPlan, newAmount, options = {}) {
    const oldPlan = this.plan
    const oldAmount = this.amount

    this.plan = newPlan
    this.amount = newAmount
    this.originalAmount = newAmount

    if (options.couponCode) {
        this.couponCode = options.couponCode
    }

    if (options.discount) {
        this.discount = options.discount
        this.discountedAmount = newAmount - options.discount
    }

    // Prorate if needed
    if (options.prorate) {
        // Calculate prorated amount logic here
    }

    await this.save()

    // Log the upgrade
    await this.logChange({
        action: 'UPGRADE',
        fromPlan: oldPlan,
        toPlan: newPlan,
        fromAmount: oldAmount,
        toAmount: newAmount,
        prorated: options.prorate,
        notes: options.notes,
    })

    return this
}

subscriptionSchema.methods.downgradePlan = async function (newPlan, newAmount, options = {}) {
    const oldPlan = this.plan
    const oldAmount = this.amount

    this.plan = newPlan
    this.amount = newAmount
    this.originalAmount = newAmount

    // Remove discounts on downgrade
    this.couponCode = null
    this.discount = 0
    this.discountedAmount = null

    await this.save()

    // Log the downgrade
    await this.logChange({
        action: 'DOWNGRADE',
        fromPlan: oldPlan,
        toPlan: newPlan,
        fromAmount: oldAmount,
        toAmount: newAmount,
        notes: options.notes,
    })

    return this
}

subscriptionSchema.methods.applyCoupon = async function (couponCode, discountAmount) {
    this.couponCode = couponCode
    this.discount = discountAmount
    this.discountedAmount = this.amount - discountAmount

    await this.save()

    await this.logChange({
        action: 'APPLY_COUPON',
        couponCode,
        discountAmount,
        newAmount: this.discountedAmount,
    })

    return this
}

subscriptionSchema.methods.removeCoupon = async function () {
    this.couponCode = null
    this.discount = 0
    this.discountedAmount = null

    await this.save()

    await this.logChange({
        action: 'REMOVE_COUPON',
    })

    return this
}

subscriptionSchema.methods.logChange = async function (changeData) {
    // Create a subscription change log
    const SubscriptionChange = mongoose.model('SubscriptionChange')

    await SubscriptionChange.create({
        subscription: this._id,
        user: this.user,
        action: changeData.action,
        changes: changeData,
        changedBy: changeData.changedBy || 'system',
        createdAt: new Date(),
    })

    return this
}

subscriptionSchema.methods.getUsageStats = async function () {
    const Trade = mongoose.model('Trade')

    const stats = await Trade.aggregate([
        { $match: { user: this.user } },
        {
            $facet: {
                totalTrades: [
                    { $count: 'count' }
                ],
                tradesThisMonth: [
                    {
                        $match: {
                            entryDate: {
                                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                            }
                        }
                    },
                    { $count: 'count' }
                ],
                aiAnalysisUsed: [
                    {
                        $match: {
                            aiSummary: { $exists: true, $ne: null }
                        }
                    },
                    { $count: 'count' }
                ]
            }
        }
    ])

    return {
        totalTrades: stats[0]?.totalTrades[0]?.count || 0,
        tradesThisMonth: stats[0]?.tradesThisMonth[0]?.count || 0,
        aiAnalysisUsed: stats[0]?.aiAnalysisUsed[0]?.count || 0,
        tradeLimit: this.features.maxTrades,
        remainingTrades: this.features.maxTrades - (stats[0]?.tradesThisMonth[0]?.count || 0),
        limitExceeded: (stats[0]?.tradesThisMonth[0]?.count || 0) >= this.features.maxTrades,
    }
}

subscriptionSchema.methods.canUseFeature = function (featureName) {
    const featureMap = {
        'ai-analysis': 'aiAnalysis',
        'advanced-analytics': 'advancedAnalytics',
        'psychology-tracking': 'psychologyTracking',
        'csv-import': 'csvImport',
        'api-access': 'apiAccess',
        'priority-support': 'prioritySupport',
        'custom-reports': 'customReports',
        'team-collaboration': 'teamCollaboration',
        'beta-features': 'betaFeatures',
    }

    const featureKey = featureMap[featureName] || featureName

    if (featureKey === 'maxTrades') {
        return this.getUsageStats().then(stats => !stats.limitExceeded)
    }

    return this.features[featureKey] || false
}

// Static Methods
subscriptionSchema.statics.findActiveSubscriptions = function () {
    return this.find({
        status: { $in: ['active', 'authenticated'] },
        currentEnd: { $gte: new Date() }
    }).populate('user', 'name email')
}

subscriptionSchema.statics.findExpiringSoon = function (days = 7) {
    const date = new Date()
    date.setDate(date.getDate() + days)

    return this.find({
        status: { $in: ['active', 'authenticated'] },
        currentEnd: { $lte: date, $gte: new Date() }
    }).populate('user', 'name email')
}

subscriptionSchema.statics.findTrialEndingSoon = function (days = 3) {
    const date = new Date()
    date.setDate(date.getDate() + days)

    return this.find({
        isTrial: true,
        trialEnd: { $lte: date, $gte: new Date() },
        status: { $ne: 'cancelled' }
    }).populate('user', 'name email')
}

subscriptionSchema.statics.findFailedPayments = function () {
    return this.find({
        status: 'failed',
        nextRetryAt: { $lte: new Date() }
    }).populate('user', 'name email')
}

subscriptionSchema.statics.getRevenueStats = async function (startDate, endDate) {
    const matchStage = {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['active', 'authenticated', 'completed'] }
    }

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$plan',
                count: { $sum: 1 },
                totalRevenue: { $sum: { $ifNull: ['$discountedAmount', '$amount'] } },
                avgRevenue: { $avg: { $ifNull: ['$discountedAmount', '$amount'] } }
            }
        },
        {
            $project: {
                plan: '$_id',
                count: 1,
                totalRevenueRupees: { $divide: ['$totalRevenue', 100] },
                avgRevenueRupees: { $divide: ['$avgRevenue', 100] },
                _id: 0
            }
        }
    ])

    return stats
}

subscriptionSchema.statics.getChurnRate = async function (startDate, endDate) {
    const [cancelled, active] = await Promise.all([
        this.countDocuments({
            status: 'cancelled',
            cancelledAt: { $gte: startDate, $lte: endDate }
        }),
        this.countDocuments({
            status: { $in: ['active', 'authenticated'] },
            currentEnd: { $gte: new Date() }
        })
    ])

    return active > 0 ? (cancelled / active) * 100 : 0
}

subscriptionSchema.statics.getMRR = async function () {
    const activeSubscriptions = await this.find({
        status: { $in: ['active', 'authenticated'] },
        currentEnd: { $gte: new Date() }
    })

    let mrr = 0
    activeSubscriptions.forEach(sub => {
        if (sub.plan === 'monthly') {
            mrr += (sub.discountedAmount || sub.amount) / 100
        } else if (sub.plan === 'yearly') {
            mrr += (sub.discountedAmount || sub.amount) / 1200 // Divide by 12 months
        }
    })

    return mrr
}

// Helper functions
const getFreeFeatures = () => ({
    maxTrades: 20,
    aiAnalysis: false,
    advancedAnalytics: false,
    psychologyTracking: false,
    csvImport: false,
    apiAccess: false,
    prioritySupport: false,
    customReports: false,
    teamCollaboration: false,
    betaFeatures: false,
})

const getMonthlyFeatures = () => ({
    maxTrades: 100,
    aiAnalysis: true,
    advancedAnalytics: true,
    psychologyTracking: true,
    csvImport: true,
    apiAccess: false,
    prioritySupport: false,
    customReports: false,
    teamCollaboration: false,
    betaFeatures: false,
})

const getYearlyFeatures = () => ({
    maxTrades: 1000,
    aiAnalysis: true,
    advancedAnalytics: true,
    psychologyTracking: true,
    csvImport: true,
    apiAccess: true,
    prioritySupport: true,
    customReports: true,
    teamCollaboration: true,
    betaFeatures: true,
})

const Subscription = mongoose.model('Subscription', subscriptionSchema)

export default Subscription