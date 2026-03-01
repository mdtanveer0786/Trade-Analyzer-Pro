import mongoose from 'mongoose'

const tradeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    tradeId: {
        type: String,
        unique: true,
        default: () => `TRADE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },

    // Trade Basics
    symbol: {
        type: String,
        required: [true, 'Please provide a symbol'],
        trim: true,
        uppercase: true,
    },
    market: {
        type: String,
        enum: ['stocks', 'forex', 'crypto', 'futures', 'options'],
        required: [true, 'Please select a market'],
    },
    direction: {
        type: String,
        enum: ['long', 'short'],
        required: [true, 'Please select a direction'],
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'cancelled'],
        default: 'closed',
    },

    // Entry Details
    entryDate: {
        type: Date,
        required: [true, 'Please provide entry date'],
    },
    entryPrice: {
        type: Number,
        required: [true, 'Please provide entry price'],
        min: 0,
    },
    positionSize: {
        type: Number,
        required: [true, 'Please provide position size'],
        min: 0,
    },
    entryNotes: String,
    entryScreenshot: String,

    // Exit Details
    exitDate: Date,
    exitPrice: Number,
    exitNotes: String,
    exitScreenshot: String,

    // Risk Management
    stopLoss: {
        type: Number,
        min: 0,
    },
    takeProfit: {
        type: Number,
        min: 0,
    },
    riskAmount: Number,
    riskRewardRatio: Number,
    rMultiple: Number,

    // Results
    pnl: {
        type: Number,
        required: true,
    },
    pnlPercentage: Number,
    commission: {
        type: Number,
        default: 0,
        min: 0,
    },
    fees: {
        type: Number,
        default: 0,
        min: 0,
    },
    netPnl: Number,

    // Classification
    strategy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strategy',
    },
    tags: [{
        type: String,
        enum: [
            'breakout', 'pullback', 'reversal', 'trend_following',
            'scalping', 'swing', 'news', 'gap', 'retest', 'support',
            'resistance', 'ema', 'macd', 'rsi', 'volume'
        ],
    }],
    setup: String,
    timeframe: String,

    // Psychology & Execution
    emotions: [{
        emotion: {
            type: String,
            enum: [
                'confident', 'fearful', 'greedy', 'patient', 'impatient',
                'disciplined', 'anxious', 'excited', 'bored', 'stressed'
            ],
        },
        intensity: {
            type: Number,
            min: 1,
            max: 5,
        },
    }],
    executionRating: {
        type: Number,
        min: 1,
        max: 5,
    },
    mistakes: [String],
    lessons: [String],

    // AI Analysis
    aiSummary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AISummary',
    },

    // Metadata
    broker: String,
    imported: {
        type: Boolean,
        default: false,
    },
    source: {
        type: String,
        enum: ['manual', 'zerodha', 'groww', 'upstox', 'mt4', 'mt5', 'api'],
        default: 'manual',
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

// Virtual for trade duration in hours
tradeSchema.virtual('durationHours').get(function () {
    if (!this.exitDate || !this.entryDate) return null
    return (this.exitDate - this.entryDate) / (1000 * 60 * 60)
})

// Virtual for net P&L
tradeSchema.virtual('netPnlCalculated').get(function () {
    return (this.pnl || 0) - (this.commission || 0) - (this.fees || 0)
})

// Pre-save middleware to calculate derived fields
tradeSchema.pre('save', function (next) {
    // Calculate P&L percentage
    if (this.entryPrice && this.positionSize && this.pnl) {
        const investment = this.entryPrice * this.positionSize
        this.pnlPercentage = (this.pnl / investment) * 100
    }

    // Calculate R multiple if stop loss exists
    if (this.stopLoss && this.entryPrice && this.pnl) {
        const riskPerShare = Math.abs(this.entryPrice - this.stopLoss)
        if (riskPerShare > 0) {
            this.rMultiple = this.pnl / (riskPerShare * this.positionSize)
        }
    }

    // Calculate risk/reward ratio
    if (this.stopLoss && this.takeProfit && this.entryPrice) {
        const risk = Math.abs(this.entryPrice - this.stopLoss)
        const reward = Math.abs(this.takeProfit - this.entryPrice)
        if (risk > 0) {
            this.riskRewardRatio = reward / risk
        }
    }

    // Calculate net P&L
    this.netPnl = this.netPnlCalculated

    next()
})

// Indexes for performance
tradeSchema.index({ user: 1, entryDate: -1 })
tradeSchema.index({ user: 1, symbol: 1 })
tradeSchema.index({ user: 1, pnl: -1 })
tradeSchema.index({ user: 1, market: 1 })
tradeSchema.index({ user: 1, status: 1 })
tradeSchema.index({ user: 1, strategy: 1 })

const Trade = mongoose.model('Trade', tradeSchema)

export default Trade