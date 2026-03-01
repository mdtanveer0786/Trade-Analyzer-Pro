import mongoose from 'mongoose'

const strategySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    market: {
        type: String,
        enum: ['stocks', 'forex', 'crypto', 'futures', 'options', 'all'],
        default: 'all',
    },
    tags: [String],
    rules: {
        entry: [String],
        exit: [String],
        riskManagement: [String],
    },
    performance: {
        totalTrades: { type: Number, default: 0 },
        winningTrades: { type: Number, default: 0 },
        losingTrades: { type: Number, default: 0 },
        totalPnL: { type: Number, default: 0 },
        avgWin: { type: Number, default: 0 },
        avgLoss: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 },
        profitFactor: { type: Number, default: 0 },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isFavorite: {
        type: Boolean,
        default: false,
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
})

// Update performance stats
strategySchema.methods.updatePerformance = async function () {
    const Trade = mongoose.model('Trade')

    const trades = await Trade.find({
        user: this.user,
        strategy: this._id,
        status: 'closed',
    })

    const totalTrades = trades.length
    const winningTrades = trades.filter(t => t.pnl > 0).length
    const losingTrades = trades.filter(t => t.pnl < 0).length
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0)
    const avgWin = winningTrades > 0
        ? trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / winningTrades
        : 0
    const avgLoss = losingTrades > 0
        ? Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / losingTrades)
        : 0
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

    this.performance = {
        totalTrades,
        winningTrades,
        losingTrades,
        totalPnL,
        avgWin,
        avgLoss,
        winRate,
        profitFactor,
    }

    await this.save()
}

// Indexes
strategySchema.index({ user: 1, name: 1 }, { unique: true })
strategySchema.index({ user: 1, isActive: 1 })
strategySchema.index({ user: 1, isFavorite: 1 })

const Strategy = mongoose.model('Strategy', strategySchema)

export default Strategy