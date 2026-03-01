import {
    calculateDashboardStats,
    calculatePerformanceAnalytics,
    calculateStrategyAnalytics,
    calculateMarketAnalytics,
    calculateTimeAnalytics,
    calculatePsychologyAnalytics
} from '../services/analytics.service.js'
import { generateWeeklyInsights } from '../services/ai.service.js'
import { sendEmail } from '../utils/email.js'

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardStats = async (req, res, next) => {
    try {
        const { range = '1M' } = req.query
        const stats = await calculateDashboardStats(req.userId, range)

        res.json({
            success: true,
            data: stats,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get performance analytics
// @route   GET /api/analytics/performance
// @access  Private
export const getPerformanceAnalytics = async (req, res, next) => {
    try {
        const filters = req.query
        const analytics = await calculatePerformanceAnalytics(req.userId, filters)

        res.json({
            success: true,
            data: analytics,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get strategy analytics
// @route   GET /api/analytics/strategy
// @access  Private
export const getStrategyAnalytics = async (req, res, next) => {
    try {
        const filters = req.query
        const analytics = await calculateStrategyAnalytics(req.userId, filters)

        res.json({
            success: true,
            data: analytics,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get market analytics
// @route   GET /api/analytics/market
// @access  Private
export const getMarketAnalytics = async (req, res, next) => {
    try {
        const filters = req.query
        const analytics = await calculateMarketAnalytics(req.userId, filters)

        res.json({
            success: true,
            data: analytics,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get time analytics
// @route   GET /api/analytics/time
// @access  Private
export const getTimeAnalytics = async (req, res, next) => {
    try {
        const filters = req.query
        const analytics = await calculateTimeAnalytics(req.userId, filters)

        res.json({
            success: true,
            data: analytics,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get psychology analytics
// @route   GET /api/analytics/psychology
// @access  Private
export const getPsychologyAnalytics = async (req, res, next) => {
    try {
        const filters = req.query
        const analytics = await calculatePsychologyAnalytics(req.userId, filters)

        res.json({
            success: true,
            data: analytics,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Generate AI report
// @route   POST /api/analytics/ai-report
// @access  Private
export const generateAIReport = async (req, res, next) => {
    try {
        const { type = 'weekly', startDate, endDate } = req.body

        let report
        let user = req.user

        switch (type) {
            case 'weekly':
                const weekStart = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                const weekEnd = endDate || new Date()

                report = await generateWeeklyInsights(req.userId, weekStart, weekEnd)

                // Send email if user has notifications enabled
                if (user.preferences.notifications?.weeklyReports) {
                    await sendEmail({
                        to: user.email,
                        template: 'weekly-report',
                        context: {
                            name: user.name,
                            week: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
                            totalTrades: report.summary?.totalTrades || 0,
                            winRate: report.summary?.winRate?.toFixed(1) || 0,
                            totalPnL: report.summary?.totalPnL?.toFixed(2) || 0,
                            profitFactor: report.summary?.profitFactor?.toFixed(2) || 0,
                            aiInsights: report.recommendations?.map(r => `<li>${r}</li>`).join('') || '',
                        },
                    })
                }
                break

            case 'monthly':
                // Similar logic for monthly reports
                break

            case 'performance':
                const performanceTrades = await Trade.find({ user: req.userId, status: 'closed' }).limit(50).populate('strategy')
                if (performanceTrades.length < 5) {
                    return res.status(400).json({
                        success: false,
                        message: 'Need at least 5 closed trades for AI performance analysis'
                    })
                }
                const tradesData = performanceTrades.map(trade => ({
                    symbol: trade.symbol,
                    direction: trade.direction,
                    pnl: trade.pnl,
                    pnlPercentage: trade.pnlPercentage,
                    strategy: trade.strategy?.name || 'Unknown',
                    executionRating: trade.executionRating,
                    mistakes: trade.mistakes,
                    lessons: trade.lessons
                }))
                report = await analyzeMultipleTrades(performanceTrades.map(t => t._id), req.userId)
                break;

            default:
                throw new Error('Invalid report type')
        }

        res.json({
            success: true,
            data: report,
            message: `${type} report generated successfully`,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Export analytics data
// @route   GET /api/analytics/export
// @access  Private
export const exportAnalytics = async (req, res, next) => {
    try {
        const { format = 'csv', type = 'all' } = req.query

        const analytics = await calculatePerformanceAnalytics(req.userId, {})

        let exportData
        let filename

        switch (format) {
            case 'csv':
                exportData = convertToCSV(analytics)
                filename = `trade-analytics-${Date.now()}.csv`
                res.setHeader('Content-Type', 'text/csv')
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
                break

            case 'json':
                exportData = JSON.stringify(analytics, null, 2)
                filename = `trade-analytics-${Date.now()}.json`
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
                break

            case 'pdf':
                // Generate PDF report
                break

            default:
                throw new Error('Invalid export format')
        }

        res.send(exportData)
    } catch (error) {
        next(error)
    }
}

// Helper function to convert analytics to CSV
const convertToCSV = (analytics) => {
    const headers = [
        'Metric',
        'Value',
        'Description'
    ]

    const rows = []

    // Add summary metrics
    if (analytics.summary) {
        Object.entries(analytics.summary).forEach(([key, value]) => {
            rows.push([
                key,
                value,
                getMetricDescription(key)
            ])
        })
    }

    // Convert to CSV string
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csvContent
}

const getMetricDescription = (metric) => {
    const descriptions = {
        totalTrades: 'Total number of trades',
        winningTrades: 'Number of winning trades',
        losingTrades: 'Number of losing trades',
        totalPnL: 'Total profit and loss',
        winRate: 'Percentage of winning trades',
        averageWin: 'Average profit per winning trade',
        averageLoss: 'Average loss per losing trade',
        profitFactor: 'Total wins divided by total losses',
        expectancy: 'Expected return per trade',
    }

    return descriptions[metric] || metric
}