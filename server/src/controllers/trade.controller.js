import Trade from '../models/Trade.js'
import AISummary from '../models/AISummary.js'
import { analyzeTradeWithAI } from '../services/ai.service.js'
import { uploadToCloudinary } from '../utils/cloudinary.js'
import csv from 'csv-parser'
import { Readable } from 'stream'
import { mapRowToTrade } from '../utils/brokerMappings.js'


import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'

// @desc    Get all trades
// @route   GET /api/trades
// @access  Private
export const getTrades = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            sortBy = 'entryDate',
            sortOrder = 'desc',
            status,
            market,
            strategy,
            startDate,
            endDate,
            dateRange,
            search,
        } = req.query

        const query = { user: req.userId }

        // Apply filters
        if (status && status !== 'all') query.status = status
        if (market && market !== 'all') query.market = market
        if (strategy) query.strategy = strategy

        // Handle named date ranges
        if (dateRange && dateRange !== 'all') {
            const now = new Date()
            let start, end = endOfDay(now)

            switch (dateRange) {
                case 'today':
                    start = startOfDay(now)
                    break
                case 'week':
                    start = startOfWeek(now)
                    break
                case 'month':
                    start = startOfMonth(now)
                    break
                case 'quarter':
                    start = startOfQuarter(now)
                    break
                case 'year':
                    start = startOfYear(now)
                    break
                default:
                    break
            }

            if (start) {
                query.entryDate = { $gte: start, $lte: end }
            }
        } else if (startDate || endDate) {
            query.entryDate = {}
            if (startDate) query.entryDate.$gte = new Date(startDate)
            if (endDate) query.entryDate.$lte = new Date(endDate)
        }

        if (search) {
            query.$or = [
                { symbol: { $regex: search, $options: 'i' } },
                { entryNotes: { $regex: search, $options: 'i' } },
                { exitNotes: { $regex: search, $options: 'i' } },
            ]
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const total = await Trade.countDocuments(query)

        // Get trades
        const trades = await Trade.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('strategy')
            .populate('aiSummary')

        // Calculate summary stats using the same query (but only closed trades for P&L)
        const summaryQuery = { ...query, status: 'closed' }
        const summary = await Trade.aggregate([
            { $match: summaryQuery },
            {
                $group: {
                    _id: null,
                    winningTrades: {
                        $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] },
                    },
                    losingTrades: {
                        $sum: { $cond: [{ $lt: ['$pnl', 0] }, 1, 0] },
                    },
                    totalPnL: { $sum: '$pnl' },
                    totalWins: {
                        $sum: { $cond: [{ $gt: ['$pnl', 0] }, '$pnl', 0] },
                    },
                    totalLosses: {
                        $sum: { $cond: [{ $lt: ['$pnl', 0] }, { $abs: '$pnl' }, 0] },
                    },
                },
            },
        ])

        const stats = summary[0] || {
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: 0,
            totalWins: 0,
            totalLosses: 0,
        }

        const totalClosed = stats.winningTrades + stats.losingTrades
        const winRate = totalClosed > 0
            ? (stats.winningTrades / totalClosed) * 100
            : 0
        const profitFactor = stats.totalLosses > 0
            ? stats.totalWins / stats.totalLosses
            : stats.totalWins > 0 ? Infinity : 0

        res.json({
            success: true,
            data: trades,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
            summary: {
                totalTrades: total, // Use total from all matching filters
                closedTrades: totalClosed,
                ...stats,
                winRate: parseFloat(winRate.toFixed(2)),
                profitFactor: parseFloat(profitFactor.toFixed(2)),
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get single trade
// @route   GET /api/trades/:id
// @access  Private
export const getTrade = async (req, res, next) => {
    try {
        const trade = await Trade.findOne({
            _id: req.params.id,
            user: req.userId,
        })
            .populate('strategy')
            .populate('aiSummary')
            .populate({
                path: 'aiSummary',
                populate: {
                    path: 'trade',
                },
            })

        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found',
            })
        }

        res.json({
            success: true,
            data: trade,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Create trade
// @route   POST /api/trades
// @access  Private
export const createTrade = async (req, res, next) => {
    try {
        const tradeData = {
            ...req.body,
            user: req.userId,
        }

        // Always calculate/recalculate P&L if entry/exit prices and size are provided
        if (tradeData.entryPrice && tradeData.exitPrice && tradeData.positionSize) {
            const priceDiff = tradeData.exitPrice - tradeData.entryPrice
            const direction = tradeData.direction?.toLowerCase()
            tradeData.pnl = direction === 'long'
                ? priceDiff * tradeData.positionSize
                : -priceDiff * tradeData.positionSize
            
            // Deduct commission and fees if provided
            if (tradeData.commission) tradeData.pnl -= tradeData.commission
            if (tradeData.fees) tradeData.pnl -= tradeData.fees
        }

        const trade = await Trade.create(tradeData)



        // Generate AI analysis if enabled
        if (req.body.generateAI) {
            try {
                const aiSummary = await analyzeTradeWithAI(trade._id, req.userId)
                trade.aiSummary = aiSummary._id
                await trade.save()
            } catch (aiError) {
                console.error('AI analysis failed:', aiError)
            }
        }

        // Populate strategy before sending
        await trade.populate('strategy')
        await trade.populate('aiSummary')

        res.status(201).json({
            success: true,
            data: trade,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Update trade
// @route   PUT /api/trades/:id
// @access  Private
export const updateTrade = async (req, res, next) => {
    try {
        const updateData = { ...req.body }
        
        // Find existing trade to get baseline values if not all are provided in update
        const existingTrade = await Trade.findOne({ _id: req.params.id, user: req.userId })
        if (!existingTrade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found',
            })
        }

        // Recalculate P&L if relevant fields are changed
        const entryPrice = updateData.entryPrice || existingTrade.entryPrice
        const exitPrice = updateData.exitPrice || existingTrade.exitPrice
        const positionSize = updateData.positionSize || existingTrade.positionSize
        const direction = (updateData.direction || existingTrade.direction)?.toLowerCase()

        if (entryPrice && exitPrice && positionSize) {
            const priceDiff = exitPrice - entryPrice
            updateData.pnl = direction === 'long'
                ? priceDiff * positionSize
                : -priceDiff * positionSize
            
            // Deduct commission and fees
            const commission = updateData.commission !== undefined ? updateData.commission : existingTrade.commission
            const fees = updateData.fees !== undefined ? updateData.fees : existingTrade.fees
            if (commission) updateData.pnl -= commission
            if (fees) updateData.pnl -= fees
            
            // Calculate P&L Percentage
            updateData.pnlPercentage = (updateData.pnl / (entryPrice * positionSize)) * 100
        }

        const trade = await Trade.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).populate('strategy')

        // Regenerate AI analysis if requested
        if (req.body.regenerateAI) {
            try {
                await AISummary.deleteOne({ trade: trade._id })
                const aiSummary = await analyzeTradeWithAI(trade._id, req.userId)
                trade.aiSummary = aiSummary._id
                await trade.save()
            } catch (aiError) {
                console.error('AI analysis failed:', aiError)
            }
        }



        res.json({
            success: true,
            data: trade,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Delete trade
// @route   DELETE /api/trades/:id
// @access  Private
export const deleteTrade = async (req, res, next) => {
    try {
        const trade = await Trade.findOneAndDelete({
            _id: req.params.id,
            user: req.userId,
        })

        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found',
            })
        }



        // Delete associated AI summary
        await AISummary.deleteOne({ trade: trade._id })

        res.json({
            success: true,
            message: 'Trade deleted successfully',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Upload trade screenshot
// @route   POST /api/trades/upload-screenshot
// @access  Private
export const uploadScreenshot = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file',
            })
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: `trades/${req.userId}/screenshots`,
            resource_type: 'image',
        })

        res.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Analyze trade with AI
// @route   POST /api/trades/:id/analyze
// @access  Private
export const analyzeTrade = async (req, res, next) => {
    try {
        const trade = await Trade.findOne({
            _id: req.params.id,
            user: req.userId,
        })

        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found',
            })
        }

        // Check if AI summary already exists
        const existingSummary = await AISummary.findOne({ trade: trade._id })
        if (existingSummary && !req.body.force) {
            return res.json({
                success: true,
                data: existingSummary,
                message: 'AI analysis already exists',
            })
        }

        // Generate AI analysis
        const aiSummary = await analyzeTradeWithAI(trade._id, req.userId)

        // Update trade with AI summary reference
        trade.aiSummary = aiSummary._id
        await trade.save()

        res.json({
            success: true,
            data: aiSummary,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Clear all trades
// @route   DELETE /api/trades/clear-all
// @access  Private
export const clearAllTrades = async (req, res, next) => {
    try {
        const trades = await Trade.find({ user: req.userId })
        const tradeIds = trades.map(trade => trade._id)

        // Delete all associated AI summaries
        await AISummary.deleteMany({ trade: { $in: tradeIds } })

        // Delete all trades
        const result = await Trade.deleteMany({ user: req.userId })



        res.json({
            success: true,
            message: `Successfully cleared ${result.deletedCount} trades`,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Import trades from CSV
// @route   POST /api/trades/import
// @access  Private
export const importTrades = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a CSV file',
            })
        }

        const { broker = 'standard' } = req.body
        const trades = []
        const stream = Readable.from(req.file.buffer.toString())

        stream
            .pipe(csv())
            .on('data', (row) => {
                const mappedTrade = mapRowToTrade(row, broker)
                if (mappedTrade.symbol) {
                    mappedTrade.user = req.userId
                    mappedTrade.imported = true
                    trades.push(mappedTrade)
                }
            })
            .on('end', async () => {
                try {
                    // Insert trades in bulk with validation
                    const createdTrades = await Trade.insertMany(trades, { ordered: false })
                    


                    res.status(201).json({
                        success: true,
                        data: createdTrades,
                        message: `Successfully imported ${createdTrades.length} trades`,
                    })
                } catch (bulkError) {

                    
                    // Some trades might have succeeded
                    const succeededCount = bulkError.insertedDocs?.length || 0
                    res.status(207).json({
                        success: false,
                        message: `Import partially successful. Imported ${succeededCount} trades.`,
                        errors: bulkError.writeErrors?.map(e => e.errmsg) || [bulkError.message],
                    })
                }
            })
            .on('error', (error) => next(error))
    } catch (error) {
        next(error)
    }
}