import Trade from '../models/Trade.js'
import AISummary from '../models/AISummary.js'
import { subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import mongoose from 'mongoose'

export const calculateDashboardStats = async (userId, timeRange = '1M') => {
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const dateRange = getDateRange(timeRange)
    
    // Calculate previous period range
    const durationInDays = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24))
    const prevStart = subDays(dateRange.start, durationInDays)
    const prevEnd = dateRange.start

    // Calculate today's range
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Run core queries in parallel
    const [
        currentSummaryResult, 
        prevSummaryResult, 
        todaySummaryResult,
        aiInsights, 
        strategyStats, 
        marketStats,
        recentTrades,
        psychologyData
    ] = await Promise.all([
        // Current Period Summary
        Trade.aggregate([
            { $match: { user: userObjectId, entryDate: { $gte: dateRange.start, $lte: dateRange.end }, status: 'closed' } },
            {
                $group: {
                    _id: null,
                    totalTrades: { $sum: 1 },
                    winningTrades: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
                    losingTrades: { $sum: { $cond: [{ $lt: ['$pnl', 0] }, 1, 0] } },
                    totalPnL: { $sum: '$pnl' },
                    totalWins: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, '$pnl', 0] } },
                    totalLosses: { $sum: { $cond: [{ $lt: ['$pnl', 0] }, { $abs: '$pnl' }, 0] } },
                }
            }
        ]),
        // Previous Period Summary
        Trade.aggregate([
            { $match: { user: userObjectId, entryDate: { $gte: prevStart, $lte: prevEnd }, status: 'closed' } },
            {
                $group: {
                    _id: null,
                    totalPnL: { $sum: '$pnl' },
                    totalTrades: { $sum: 1 },
                    winningTrades: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
                    totalWins: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, '$pnl', 0] } },
                    totalLosses: { $sum: { $cond: [{ $lt: ['$pnl', 0] }, { $abs: '$pnl' }, 0] } },
                }
            }
        ]),
        // Today Summary
        Trade.aggregate([
            { $match: { user: userObjectId, entryDate: { $gte: todayStart, $lte: todayEnd }, status: 'closed' } },
            {
                $group: {
                    _id: null,
                    totalTrades: { $sum: 1 },
                    totalPnL: { $sum: '$pnl' },
                    winningTrades: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
                }
            }
        ]),
        AISummary.find({ user: userObjectId })
            .sort({ createdAt: -1 })
            .limit(4)
            .populate('trade', 'symbol pnl'),
        calculateStrategyStats(userObjectId, dateRange),
        calculateMarketStats(userObjectId, dateRange),
        Trade.find({ user: userObjectId, status: 'closed' })
            .sort({ entryDate: -1 })
            .limit(10)
            .select('symbol market direction entryDate pnl pnlPercentage status'),
        calculatePsychologyAnalytics(userId, { range: timeRange })
    ])

    const currentStats = currentSummaryResult[0] || { totalTrades: 0, winningTrades: 0, losingTrades: 0, totalPnL: 0, totalWins: 0, totalLosses: 0 }
    const prevStats = prevSummaryResult[0] || { totalTrades: 0, winningTrades: 0, totalPnL: 0, totalWins: 0, totalLosses: 0 }
    const todayStats = todaySummaryResult[0] || { totalTrades: 0, totalPnL: 0, winningTrades: 0 }

    // Calculate summary with changes
    const winRate = currentStats.totalTrades > 0 ? (currentStats.winningTrades / currentStats.totalTrades) * 100 : 0
    const prevWinRate = prevStats.totalTrades > 0 ? (prevStats.winningTrades / prevStats.totalTrades) * 100 : 0
    
    const profitFactor = currentStats.totalLosses > 0 ? currentStats.totalWins / currentStats.totalLosses : (currentStats.totalWins > 0 ? 10 : 0)
    const prevProfitFactor = prevStats.totalLosses > 0 ? prevStats.totalWins / prevStats.totalLosses : (prevStats.totalWins > 0 ? 10 : 0)

    const averageWin = currentStats.winningTrades > 0 ? currentStats.totalWins / currentStats.winningTrades : 0
    const averageLoss = currentStats.losingTrades > 0 ? currentStats.totalLosses / currentStats.losingTrades : 0
    const expectancy = (winRate / 100 * averageWin) - ((100 - winRate) / 100 * averageLoss)

    const prevAverageWin = prevStats.winningTrades > 0 ? prevStats.totalWins / prevStats.winningTrades : 0
    const prevAverageLoss = (prevStats.totalTrades - prevStats.winningTrades) > 0 ? prevStats.totalLosses / (prevStats.totalTrades - prevStats.winningTrades) : 0
    const prevExpectancy = (prevWinRate / 100 * prevAverageWin) - ((100 - prevWinRate) / 100 * prevAverageLoss)

    const calculatePercentageChange = (current, previous) => {
        if (!previous || previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / Math.abs(previous)) * 100
    }

    // Equity Curve still needs trades but we can just fetch the last 100 or so for the dashboard
    const equityCurveTrades = await Trade.find({
        user: userObjectId,
        entryDate: { $gte: dateRange.start, $lte: dateRange.end },
        status: 'closed',
    }).sort({ entryDate: 1 }).select('entryDate pnl tradeId')

    const equityCurve = calculateEquityCurve(equityCurveTrades)

    return {
        summary: {
            ...currentStats,
            winRate: parseFloat(winRate.toFixed(2)),
            profitFactor: parseFloat(profitFactor.toFixed(2)),
            expectancy: parseFloat(expectancy.toFixed(2)),
            pnlChange: calculatePercentageChange(currentStats.totalPnL, prevStats.totalPnL),
            winRateChange: winRate - prevWinRate,
            profitFactorChange: profitFactor - prevProfitFactor,
            expectancyChange: expectancy - prevExpectancy,
        },
        todaySummary: {
            totalTrades: todayStats.totalTrades || 0,
            totalPnL: parseFloat((todayStats.totalPnL || 0).toFixed(2)),
            winRate: todayStats.totalTrades > 0 ? parseFloat(((todayStats.winningTrades / todayStats.totalTrades) * 100).toFixed(2)) : 0,
        },
        equityCurve,
        strategies: strategyStats,
        markets: marketStats,
        psychology: psychologyData,
        winLossDistribution: [
            { name: 'Winning Trades', value: currentStats.winningTrades, color: '#10B981' },
            { name: 'Losing Trades', value: currentStats.losingTrades, color: '#EF4444' },
            { name: 'Breakeven', value: currentStats.totalTrades - currentStats.winningTrades - currentStats.losingTrades, color: '#6B7280' }
        ],
        aiInsights: aiInsights.map(insight => ({
            id: insight._id,
            summary: insight.summary,
            symbol: insight.trade?.symbol || 'Trade',
            createdAt: insight.createdAt,
        })),
        recentTrades: recentTrades.map(trade => ({
            id: trade._id,
            symbol: trade.symbol,
            market: trade.market,
            direction: trade.direction,
            entryDate: trade.entryDate,
            pnl: trade.pnl,
            pnlPercentage: trade.pnlPercentage,
            status: trade.status,
        })),
    }
}

export const calculatePerformanceAnalytics = async (userId, filters = {}) => {
    const query = buildQuery(userId, filters)
    const trades = await Trade.find(query)
    
    // Previous period
    const prevQuery = buildPrevQuery(userId, filters)
    const prevTrades = await Trade.find(prevQuery)

    if (trades.length === 0) {
        return getEmptyAnalytics()
    }

    // Calculate various performance metrics
    const summary = calculateSummary(trades, prevTrades)
    const performance = calculatePerformanceMetrics(trades)
    const risk = calculateRiskMetrics(trades)
    const time = calculateTimeMetrics(trades)

    // Win/Loss distribution for the Pie chart
    const winLossDistribution = [
        { name: 'Winning Trades', value: summary.winningTrades, color: '#10B981' },
        { name: 'Losing Trades', value: summary.losingTrades, color: '#EF4444' },
        { name: 'Breakeven', value: summary.totalTrades - summary.winningTrades - summary.losingTrades, color: '#6B7280' }
    ]

    // Fetch latest AI insights
    const aiInsights = await AISummary.find({ user: query.user })
        .sort({ createdAt: -1 })
        .limit(3)

    const analytics = {
        summary,
        performance,
        risk,
        time,
        aiInsights: aiInsights.map(insight => ({
            id: insight._id,
            summary: insight.summary,
            strengths: (insight.strengths || []).map(s => s.description),
            weaknesses: (insight.weaknesses || []).map(w => w.description),
            recommendations: (insight.suggestedImprovements || []),
        })),
        // Frontend expects these at the top level in some places
        equityCurve: performance.equityCurve,
        monthlyPerformance: time.monthlyPerformance,
        winLossDistribution,
    }

    return analytics
}

export const calculateStrategyAnalytics = async (userId, filters = {}) => {
    const query = buildQuery(userId, filters)
    const trades = await Trade.find(query)

    // Previous period
    const prevQuery = buildPrevQuery(userId, filters)
    const prevTrades = await Trade.find(prevQuery)
    
    const summary = calculateSummary(trades, prevTrades)

    // Fetch latest AI insights for strategies
    const aiInsights = await AISummary.find({ user: query.user })
        .sort({ createdAt: -1 })
        .limit(2)

    const strategyStats = await Trade.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$strategy',
                totalTrades: { $sum: 1 },
                winningTrades: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
                totalPnL: { $sum: '$pnl' },
                avgPnL: { $avg: '$pnl' },
                maxWin: { $max: '$pnl' },
                maxLoss: { $min: '$pnl' },
                totalWins: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, '$pnl', 0] } },
                totalLosses: { $sum: { $cond: [{ $lt: ['$pnl', 0] }, { $abs: '$pnl' }, 0] } },
            },
        },
        {
            $lookup: {
                from: 'strategies',
                localField: '_id',
                foreignField: '_id',
                as: 'strategyInfo',
            },
        },
        {
            $addFields: {
                name: { $ifNull: [{ $arrayElemAt: ['$strategyInfo.name', 0] }, 'No Strategy'] },
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                totalTrades: 1,
                winningTrades: 1,
                totalPnL: 1,
                avgPnL: 1,
                maxWin: 1,
                maxLoss: 1,
                winRate: {
                    $cond: [
                        { $gt: ['$totalTrades', 0] },
                        { $multiply: [{ $divide: ['$winningTrades', '$totalTrades'] }, 100] },
                        0
                    ]
                },
                profitFactor: {
                    $cond: [
                        { $gt: ['$totalLosses', 0] },
                        { $divide: ['$totalWins', '$totalLosses'] },
                        { $cond: [{ $gt: ['$totalWins', 0] }, 10, 0] }
                    ]
                }
            }
        },
        { $sort: { totalPnL: -1 } },
    ])

    return {
        summary,
        strategies: strategyStats,
        aiInsights: aiInsights.map(i => ({
            id: i._id,
            strengths: i.strengths?.[0]?.description,
            weaknesses: i.weaknesses?.[0]?.description,
            recommendation: i.suggestedImprovements?.[0] || i.summary,
        }))
    }
}

export const calculateMarketAnalytics = async (userId, filters = {}) => {
    const query = buildQuery(userId, filters)
    const trades = await Trade.find(query)

    // Previous period
    const prevQuery = buildPrevQuery(userId, filters)
    const prevTrades = await Trade.find(prevQuery)
    
    const summary = calculateSummary(trades, prevTrades)

    const marketStats = await Trade.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$market',
                tradeCount: { $sum: 1 },
                winningTrades: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
                totalPnL: { $sum: '$pnl' },
                avgPnL: { $avg: '$pnl' },
            },
        },
        {
            $project: {
                _id: 1,
                tradeCount: 1,
                totalPnL: 1,
                avgPnL: 1,
                winRate: {
                    $cond: [
                        { $gt: ['$tradeCount', 0] },
                        { $multiply: [{ $divide: ['$winningTrades', '$tradeCount'] }, 100] },
                        0
                    ]
                },
            },
        },
        { $sort: { totalPnL: -1 } },
    ])

    // Calculate market performance over time
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const marketPerformanceOverTime = []
    
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthIndex = date.getMonth()
        const year = date.getFullYear()
        const monthName = months[monthIndex]
        
        const monthTrades = trades.filter(t => {
            const d = new Date(t.entryDate)
            return d.getMonth() === monthIndex && d.getFullYear() === year
        })
        
        const performance = { month: monthName }
        const uniqueMarkets = [...new Set(trades.map(t => t.market))]
        
        uniqueMarkets.forEach(m => {
            performance[m] = monthTrades
                .filter(t => t.market === m)
                .reduce((sum, t) => sum + t.pnl, 0)
        })
        
        marketPerformanceOverTime.push(performance)
    }

    return {
        summary,
        markets: marketStats,
        marketPerformanceOverTime
    }
}

export const calculateTimeAnalytics = async (userId, filters = {}) => {
    const query = buildQuery(userId, filters)
    const trades = await Trade.find(query)

    // Previous period
    const prevQuery = buildPrevQuery(userId, filters)
    const prevTrades = await Trade.find(prevQuery)
    
    const summary = calculateSummary(trades, prevTrades)

    // Calculate hourly performance
    const hourlyStats = Array(24).fill().map((_, hour) => {
        const hourTrades = trades.filter(t => new Date(t.entryDate).getHours() === hour)
        const winningTrades = hourTrades.filter(t => t.pnl > 0)

        return {
            hour,
            trades: hourTrades.length,
            winningTrades: winningTrades.length,
            totalPnL: hourTrades.reduce((sum, t) => sum + t.pnl, 0),
            winRate: hourTrades.length > 0 ? (winningTrades.length / hourTrades.length) * 100 : 0,
        }
    })

    // Calculate day of week performance
    const dayStats = Array(7).fill().map((_, day) => {
        const dayTrades = trades.filter(t => new Date(t.entryDate).getDay() === day)
        const winningTrades = dayTrades.filter(t => t.pnl > 0)

        return {
            day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
            trades: dayTrades.length,
            winningTrades: winningTrades.length,
            totalPnL: dayTrades.reduce((sum, t) => sum + t.pnl, 0),
            winRate: dayTrades.length > 0 ? (winningTrades.length / dayTrades.length) * 100 : 0,
        }
    })

    // Calculate monthly performance
    const monthStats = Array(12).fill().map((_, month) => {
        const monthTrades = trades.filter(t => new Date(t.entryDate).getMonth() === month)
        const winningTrades = monthTrades.filter(t => t.pnl > 0)

        return {
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month],
            trades: monthTrades.length,
            winningTrades: winningTrades.length,
            totalPnL: monthTrades.reduce((sum, t) => sum + t.pnl, 0),
            winRate: monthTrades.length > 0 ? (winningTrades.length / monthTrades.length) * 100 : 0,
        }
    })

    return {
        summary,
        hourlyStats,
        dayStats,
        monthStats,
    }
}

export const calculatePsychologyAnalytics = async (userId, filters = {}) => {
    const query = buildQuery(userId, filters)
    const trades = await Trade.find(query)

    // Previous period
    const prevQuery = buildPrevQuery(userId, filters)
    const prevTrades = await Trade.find(prevQuery)
    
    const summary = calculateSummary(trades, prevTrades)

    if (trades.length === 0) {
        return {
            summary,
            emotionDistribution: {},
            avgExecutionRating: 0,
            commonMistakes: [],
            positiveEmotions: 0,
            negativeEmotions: 0,
            avgIntensity: 0
        }
    }

    const emotions = trades.flatMap(t => t.emotions || [])
    const psychMetrics = calculatePsychologyMetrics(trades)

    // Emotion distribution
    const emotionDistribution = {}
    if (emotions.length > 0) {
        emotions.forEach(emotion => {
            if (emotion && emotion.emotion) {
                const key = emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1)
                emotionDistribution[key] = (emotionDistribution[key] || 0) + 1
            }
        })

        // Normalize
        const totalEmotions = Object.values(emotionDistribution).reduce((a, b) => a + b, 0)
        Object.keys(emotionDistribution).forEach(key => {
            emotionDistribution[key] = parseFloat(
                ((emotionDistribution[key] / totalEmotions) * 100).toFixed(1)
            )
        })
    }

    // Average execution rating
    const ratings = trades.map(t => t.executionRating || 0).filter(r => r > 0)
    const avgExecutionRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0

    // Common mistakes
    const allMistakes = trades.flatMap(t => t.mistakes || [])
    const mistakeFrequency = {}
    allMistakes.forEach(mistake => {
        if (mistake) {
            mistakeFrequency[mistake] = (mistakeFrequency[mistake] || 0) + 1
        }
    })

    const commonMistakes = Object.entries(mistakeFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([mistake, count]) => ({ mistake, count }))

    // Calculate optimal trading time
    const hourlyPerformance = Array(24).fill().map((_, hour) => {
        const hourTrades = trades.filter(t => new Date(t.entryDate).getHours() === hour)
        const wins = hourTrades.filter(t => t.pnl > 0).length
        return { hour, winRate: hourTrades.length > 0 ? wins / hourTrades.length : 0 }
    })
    const bestHour = hourlyPerformance.reduce((prev, curr) => (curr.winRate > prev.winRate) ? curr : prev, hourlyPerformance[0])
    const optimalTime = bestHour && bestHour.winRate > 0 ? `${bestHour.hour}:00` : 'Not enough data'

    // Calculate emotion trends
    const prevEmotions = prevTrades.flatMap(t => t.emotions || [])
    const prevEmotionDist = {}
    if (prevEmotions.length > 0) {
        prevEmotions.forEach(e => {
            if (e && e.emotion) {
                const key = e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1)
                prevEmotionDist[key] = (prevEmotionDist[key] || 0) + 1
            }
        })
        const totalPrevEmotions = Object.values(prevEmotionDist).reduce((a, b) => a + b, 0)
        Object.keys(prevEmotionDist).forEach(k => {
            prevEmotionDist[k] = (prevEmotionDist[k] / totalPrevEmotions) * 100
        })
    }

    const emotionTrends = {}
    Object.keys(emotionDistribution).forEach(k => {
        const current = emotionDistribution[k]
        const previous = prevEmotionDist[k] || 0
        emotionTrends[k] = {
            change: parseFloat((current - previous).toFixed(1)),
            trend: current >= previous ? 'up' : 'down'
        }
    })

    // Generate dynamic recommendations
    const recommendations = []
    if (emotionDistribution.Fearful > 20) {
        recommendations.push({
            title: 'Mindfulness Practice',
            text: 'Practice 5 minutes of meditation before each trading session to reduce anxiety and fear-based exits.',
            status: 'Critical: High fear detected'
        })
    } else if (emotions.length > 0) {
        recommendations.push({
            title: 'Mindfulness Practice',
            text: 'Continue your routine to maintain emotional balance.',
            status: 'Recommended for stability'
        })
    }

    if (emotionDistribution.Greedy > 20 || emotionDistribution.Impatient > 20) {
        recommendations.push({
            title: 'Risk Management',
            text: 'Set maximum daily loss limit and strict take-profit rules to prevent overtrading and greed.',
            status: 'Monitoring for overtrading'
        })
    } else if (emotions.length > 0) {
        recommendations.push({
            title: 'Risk Management',
            text: 'Your discipline in risk management is showing positive results.',
            status: 'Good momentum'
        })
    }

    if (avgExecutionRating > 0 && avgExecutionRating < 3.5) {
        recommendations.push({
            title: 'Journaling Habit',
            text: 'Detailed journaling of your "Why" before entry can improve your execution quality score.',
            status: 'Analyzing execution patterns'
        })
    } else if (avgExecutionRating >= 3.5) {
        recommendations.push({
            title: 'Strategy Review',
            text: 'Review your winning trades to identify if you can scale into successful positions.',
            status: 'Optimizing performance'
        })
    }

    // Calculate time series
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate))
    const timeSeries = []
    const tradesByDate = {}

    sortedTrades.forEach(trade => {
        const date = new Date(trade.entryDate).toISOString().split('T')[0]
        if (!tradesByDate[date]) tradesByDate[date] = []
        tradesByDate[date].push(trade)
    })

    Object.entries(tradesByDate).forEach(([date, dayTrades]) => {
        const dayEmotions = dayTrades.flatMap(t => t.emotions || [])
        const posEmotions = ['confident', 'patient', 'disciplined']
        const negEmotions = ['fearful', 'greedy', 'impatient', 'anxious', 'stressed']

        const confidenceCount = dayEmotions.filter(e => e.emotion === 'confident').length
        const disciplineCount = dayEmotions.filter(e => e.emotion === 'disciplined').length
        const posCount = dayEmotions.filter(e => posEmotions.includes(e.emotion)).length
        const negCount = dayEmotions.filter(e => negEmotions.includes(e.emotion)).length
        
        const ratingsWithValues = dayTrades.map(t => t.executionRating || 0).filter(r => r > 0)
        const dayAvgRating = ratingsWithValues.length > 0 
            ? ratingsWithValues.reduce((sum, r) => sum + r, 0) / ratingsWithValues.length 
            : 0

        const emotionTotal = dayEmotions.length || 1
        const posNegTotal = posCount + negCount || 1

        timeSeries.push({
            date,
            confidence: Math.round((confidenceCount / emotionTotal) * 100) || 50,
            discipline: Math.round((disciplineCount / emotionTotal) * 100) || 50,
            emotionControl: Math.round((posCount / posNegTotal) * 100) || 50,
            focus: dayAvgRating > 0 ? Math.round(dayAvgRating * 20) : 50,
            overall: Math.round(( (dayAvgRating > 0 ? dayAvgRating * 20 : 50) + (posCount / posNegTotal * 100 || 50) ) / 2)
        })
    })

    return {
        summary,
        emotionDistribution,
        emotionTrends,
        optimalTime,
        recommendations,
        avgExecutionRating: parseFloat(avgExecutionRating.toFixed(1)),
        commonMistakes,
        timeSeries,
        ...psychMetrics
    }
}

// Helper functions
const buildQuery = (userId, filters) => {
    const query = { user: new mongoose.Types.ObjectId(userId), status: 'closed' }

    if (filters.range) {
        const { start, end } = getDateRange(filters.range)
        query.entryDate = { $gte: start, $lte: end }
    } else {
        if (filters.startDate) query.entryDate = { $gte: new Date(filters.startDate) }
        if (filters.endDate) {
            query.entryDate = query.entryDate || {}
            query.entryDate.$lte = new Date(filters.endDate)
        }
    }

    if (filters.market && filters.market !== 'all') query.market = filters.market
    if (filters.strategy) query.strategy = filters.strategy
    if (filters.tags) query.tags = { $in: filters.tags }

    return query
}

const buildPrevQuery = (userId, filters) => {
    const query = { user: new mongoose.Types.ObjectId(userId), status: 'closed' }
    let start, end

    if (filters.range) {
        const currentRange = getDateRange(filters.range)
        const durationInDays = Math.ceil((currentRange.end - currentRange.start) / (1000 * 60 * 60 * 24))
        start = subDays(currentRange.start, durationInDays)
        end = currentRange.start
    } else if (filters.startDate && filters.endDate) {
        const currentStart = new Date(filters.startDate)
        const currentEnd = new Date(filters.endDate)
        const durationInMs = currentEnd.getTime() - currentStart.getTime()
        start = new Date(currentStart.getTime() - durationInMs)
        end = currentStart
    } else {
        const currentRange = getDateRange('1M')
        const durationInDays = 30
        start = subDays(currentRange.start, durationInDays)
        end = currentRange.start
    }

    query.entryDate = { $gte: start, $lte: end }

    if (filters.market && filters.market !== 'all') query.market = filters.market
    if (filters.strategy) query.strategy = filters.strategy
    if (filters.tags) query.tags = { $in: filters.tags }

    return query
}

const getDateRange = (timeRange) => {
    const now = new Date()
    let start = new Date()

    switch (timeRange) {
        case '1D':
            start = subDays(now, 1)
            break
        case '1W':
            start = subDays(now, 7)
            break
        case '1M':
            start = subDays(now, 30)
            break
        case '3M':
            start = subDays(now, 90)
            break
        case '6M':
            start = subDays(now, 180)
            break
        case '1Y':
            start = subDays(now, 365)
            break
        case 'ALL':
            start = new Date(0) // Beginning of time
            break
        default:
            start = subDays(now, 30)
    }

    return { start, end: now }
}

const calculateEquityCurve = (trades) => {
    const sortedTrades = [...trades].sort((a, b) => a.entryDate - b.entryDate)

    let runningBalance = 0
    const equityCurve = sortedTrades.map(trade => {
        runningBalance += trade.pnl
        return {
            date: trade.entryDate,
            balance: runningBalance,
            tradeId: trade.tradeId,
        }
    })

    return equityCurve
}

const calculateStrategyStats = async (userId, dateRange) => {
    return await Trade.aggregate([
        {
            $match: {
                user: userId,
                entryDate: { $gte: dateRange.start, $lte: dateRange.end },
                status: 'closed',
            },
        },
        {
            $group: {
                _id: '$strategy',
                tradeCount: { $sum: 1 },
                totalPnL: { $sum: '$pnl' },
                avgPnL: { $avg: '$pnl' },
                winCount: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
            },
        },
        {
            $lookup: {
                from: 'strategies',
                localField: '_id',
                foreignField: '_id',
                as: 'strategyInfo',
            },
        },
        {
            $addFields: {
                name: { $ifNull: [{ $arrayElemAt: ['$strategyInfo.name', 0] }, 'No Strategy'] },
            },
        },
        {
            $project: {
                name: 1,
                trades: '$tradeCount',
                pnl: '$totalPnL',
                avgPnL: 1,
                winRate: {
                    $cond: [
                        { $gt: ['$tradeCount', 0] },
                        { $multiply: [{ $divide: ['$winCount', '$tradeCount'] }, 100] },
                        0
                    ]
                },
            },
        },
        { $sort: { totalPnL: -1 } },
    ])
}

const calculateMarketStats = async (userId, dateRange) => {
    return await Trade.aggregate([
        {
            $match: {
                user: userId,
                entryDate: { $gte: dateRange.start, $lte: dateRange.end },
                status: 'closed',
            },
        },
        {
            $group: {
                _id: '$market',
                tradeCount: { $sum: 1 },
                totalPnL: { $sum: '$pnl' },
                winCount: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
            },
        },
        {
            $project: {
                market: '$_id',
                tradeCount: 1,
                totalPnL: 1,
                winRate: {
                    $cond: [
                        { $gt: ['$tradeCount', 0] },
                        { $multiply: [{ $divide: ['$winCount', '$tradeCount'] }, 100] },
                        0
                    ]
                },
            },
        },
        { $sort: { totalPnL: -1 } },
    ])
}

const calculatePsychologyMetrics = (trades) => {
    const emotions = trades.flatMap(t => t.emotions || [])

    if (emotions.length === 0) {
        return {
            positiveEmotions: 0,
            negativeEmotions: 0,
            avgIntensity: 0,
        }
    }

    const positiveEmotions = ['confident', 'patient', 'disciplined']
    const negativeEmotions = ['fearful', 'greedy', 'impatient', 'anxious', 'stressed']

    const positiveCount = emotions.filter(e => positiveEmotions.includes(e.emotion)).length
    const negativeCount = emotions.filter(e => negativeEmotions.includes(e.emotion)).length
    const avgIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length

    return {
        positiveEmotions: parseFloat(((positiveCount / emotions.length) * 100).toFixed(1)),
        negativeEmotions: parseFloat(((negativeCount / emotions.length) * 100).toFixed(1)),
        avgIntensity: parseFloat(avgIntensity.toFixed(1)),
    }
}

export const calculateSummary = (trades, prevTrades = []) => {
    const totalTrades = trades.length
    const winningTrades = trades.filter(t => t.pnl > 0).length
    const losingTrades = trades.filter(t => t.pnl < 0).length
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0)
    const totalWins = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0)
    const totalLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0))

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    const averageWin = winningTrades > 0 ? totalWins / winningTrades : 0
    const averageLoss = losingTrades > 0 ? totalLosses / losingTrades : 0
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0
    const expectancy = (winRate / 100 * averageWin) - ((100 - winRate) / 100 * averageLoss)

    // Previous period stats
    const prevTotalTrades = prevTrades.length
    const prevWinningTrades = prevTrades.filter(t => t.pnl > 0).length
    const prevTotalPnL = prevTrades.reduce((sum, t) => sum + t.pnl, 0)
    const prevTotalWins = prevTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0)
    const prevTotalLosses = Math.abs(prevTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0))

    const prevWinRate = prevTotalTrades > 0 ? (prevWinningTrades / prevTotalTrades) * 100 : 0
    const prevProfitFactor = prevTotalLosses > 0 ? prevTotalWins / prevTotalLosses : prevTotalWins > 0 ? Infinity : 0
    const prevAverageWin = prevWinningTrades > 0 ? prevTotalWins / prevWinningTrades : 0
    const prevAverageLoss = prevTotalTrades - prevWinningTrades > 0 ? prevTotalLosses / (prevTotalTrades - prevWinningTrades) : 0
    const prevExpectancy = (prevWinRate / 100 * prevAverageWin) - ((100 - prevWinRate) / 100 * prevAverageLoss)

    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / Math.abs(previous)) * 100
    }

    return {
        totalTrades,
        winningTrades,
        losingTrades,
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        totalWins: parseFloat(totalWins.toFixed(2)),
        totalLosses: parseFloat(totalLosses.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(2)),
        averageWin: parseFloat(averageWin.toFixed(2)),
        averageLoss: parseFloat(averageLoss.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        expectancy: parseFloat(expectancy.toFixed(2)),
        tradesChange: calculatePercentageChange(totalTrades, prevTotalTrades),
        pnlChange: calculatePercentageChange(totalPnL, prevTotalPnL),
        winRateChange: winRate - prevWinRate,
        profitFactorChange: profitFactor - prevProfitFactor,
        expectancyChange: expectancy - prevExpectancy,
    }
}

const calculatePerformanceMetrics = (trades) => {
    const sortedByDate = [...trades].sort((a, b) => a.entryDate - b.entryDate)

    // Calculate equity curve
    let runningBalance = 0
    const equityCurve = sortedByDate.map(trade => {
        runningBalance += trade.pnl
        return {
            date: trade.entryDate,
            balance: runningBalance,
            tradeId: trade.tradeId,
        }
    })

    // Calculate best/worst trades
    const sortedByPnl = [...trades].sort((a, b) => b.pnl - a.pnl)
    const bestTrades = sortedByPnl.slice(0, 5)
    const worstTrades = sortedByPnl.slice(-5).reverse()

    // Calculate drawdown
    let peak = 0
    let maxDrawdown = 0

    equityCurve.forEach(point => {
        if (point.balance > peak) {
            peak = point.balance
        }
        const currentDrawdown = ((peak - point.balance) / peak) * 100
        if (currentDrawdown > maxDrawdown) {
            maxDrawdown = currentDrawdown
        }
    })

    return {
        equityCurve,
        bestTrades: bestTrades.map(t => ({
            id: t._id,
            symbol: t.symbol,
            date: t.entryDate,
            pnl: t.pnl,
            pnlPercentage: t.pnlPercentage,
        })),
        worstTrades: worstTrades.map(t => ({
            id: t._id,
            symbol: t.symbol,
            date: t.entryDate,
            pnl: t.pnl,
            pnlPercentage: t.pnlPercentage,
        })),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    }
}

const calculateRiskMetrics = (trades) => {
    const rMultiples = trades.map(t => t.rMultiple || 0).filter(r => r !== 0)

    if (rMultiples.length === 0) {
        return {
            avgRMultiple: 0,
            stdDevRMultiple: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
        }
    }

    const avgRMultiple = rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length

    // Calculate standard deviation
    const squaredDiffs = rMultiples.map(r => Math.pow(r - avgRMultiple, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / rMultiples.length
    const stdDevRMultiple = Math.sqrt(variance)

    // Calculate Sharpe-like ratio
    const sharpeRatio = avgRMultiple / (stdDevRMultiple || 1)

    // Calculate Sortino ratio
    const downsideReturns = rMultiples.filter(r => r < 0)
    const downsideStdDev = downsideReturns.length > 0
        ? Math.sqrt(downsideReturns.map(r => Math.pow(r, 2)).reduce((a, b) => a + b, 0) / downsideReturns.length)
        : 0
    const sortinoRatio = downsideStdDev > 0 ? avgRMultiple / downsideStdDev : Infinity

    return {
        avgRMultiple: parseFloat(avgRMultiple.toFixed(2)),
        stdDevRMultiple: parseFloat(stdDevRMultiple.toFixed(2)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
    }
}

const calculateTimeMetrics = (trades) => {
    const hourlyPerformance = Array(24).fill().map((_, hour) => ({
        hour,
        trades: 0,
        pnl: 0,
        winRate: 0,
    }))

    const dayOfWeekPerformance = Array(7).fill().map((_, day) => ({
        day,
        trades: 0,
        pnl: 0,
        winRate: 0,
    }))

    const monthlyPerformance = Array(12).fill().map((_, month) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month],
        trades: 0,
        pnl: 0,
        winRate: 0,
    }))

    trades.forEach(trade => {
        const date = new Date(trade.entryDate)
        const hour = date.getHours()
        const day = date.getDay()
        const month = date.getMonth()

        hourlyPerformance[hour].trades++
        hourlyPerformance[hour].pnl += trade.pnl

        dayOfWeekPerformance[day].trades++
        dayOfWeekPerformance[day].pnl += trade.pnl

        monthlyPerformance[month].trades++
        monthlyPerformance[month].pnl += trade.pnl
    })

    // Calculate win rates
    hourlyPerformance.forEach(hour => {
        const hourTrades = trades.filter(t => new Date(t.entryDate).getHours() === hour.hour)
        const winningTrades = hourTrades.filter(t => t.pnl > 0)

        hour.winRate = hourTrades.length > 0
            ? (winningTrades.length / hourTrades.length) * 100
            : 0
        hour.avgPnL = hour.trades > 0
            ? hour.pnl / hour.trades
            : 0
    })

    dayOfWeekPerformance.forEach(day => {
        const dayTrades = trades.filter(t => new Date(t.entryDate).getDay() === day.day)
        const winningTrades = dayTrades.filter(t => t.pnl > 0)

        day.winRate = dayTrades.length > 0
            ? (winningTrades.length / dayTrades.length) * 100
            : 0
        day.avgPnL = day.trades > 0
            ? day.pnl / day.trades
            : 0
    })

    monthlyPerformance.forEach(month => {
        const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month.month)
        const monthTrades = trades.filter(t => new Date(t.entryDate).getMonth() === monthIndex)
        const winningTrades = monthTrades.filter(t => t.pnl > 0)

        month.winRate = monthTrades.length > 0
            ? (winningTrades.length / monthTrades.length) * 100
            : 0
        month.avgPnL = month.trades > 0
            ? month.pnl / month.trades
            : 0
    })

    return {
        hourlyPerformance,
        dayOfWeekPerformance,
        monthlyPerformance,
    }
}

const getEmptyAnalytics = () => {
    return {
        summary: {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: 0,
            winRate: 0,
            averageWin: 0,
            averageLoss: 0,
            profitFactor: 0,
            expectancy: 0,
        },
        performance: {
            equityCurve: [],
            bestTrades: [],
            worstTrades: [],
            maxDrawdown: 0,
        },
        risk: {
            avgRMultiple: 0,
            stdDevRMultiple: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
        },
        time: {
            hourlyPerformance: Array(24).fill().map((_, hour) => ({
                hour,
                trades: 0,
                pnl: 0,
                winRate: 0,
                avgPnL: 0,
            })),
            dayOfWeekPerformance: Array(7).fill().map((_, day) => ({
                day,
                trades: 0,
                pnl: 0,
                winRate: 0,
                avgPnL: 0,
            })),
            monthlyPerformance: Array(12).fill().map((_, month) => ({
                month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month],
                trades: 0,
                pnl: 0,
                winRate: 0,
            })),
        },
        equityCurve: [],
        monthlyPerformance: Array(12).fill().map((_, month) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month],
            trades: 0,
            pnl: 0,
            winRate: 0,
        })),
        winLossDistribution: [
            { name: 'Winning Trades', value: 0, color: '#10B981' },
            { name: 'Losing Trades', value: 0, color: '#EF4444' },
            { name: 'Breakeven', value: 0, color: '#6B7280' }
        ],
    }
}
