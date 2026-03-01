import OpenAI from 'openai'
import Trade from '../models/Trade.js'
import AISummary from '../models/AISummary.js'
import User from '../models/User.js'

/* ===============================
   OpenAI Lazy Initialization
================================ */
let openai = null

const getOpenAI = () => {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is missing in environment variables')
        }

        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
    }
    return openai
}

/* ===============================
   MAIN FUNCTIONS
================================ */

export const analyzeTradeWithAI = async (tradeId, userId) => {
    try {
        const trade = await Trade.findById(tradeId)
            .populate('strategy')
            .populate('tags')
            .populate('user', 'name email')

        if (!trade) throw new Error('Trade not found')

        const tradeData = prepareTradeData(trade)
        const analysis = await generateAIAnalysis(tradeData)

        const aiSummary = await AISummary.create({
            trade: tradeId,
            user: userId,
            ...analysis,
            aiModel: 'gpt-4o',
            tokensUsed: analysis.tokens,
            processingTime: analysis.processingTime,
        })

        return aiSummary
    } catch (error) {
        console.error('AI Analysis Error:', error.message)
        throw error
    }
}

export const analyzeMultipleTrades = async (tradeIds, userId) => {
    try {
        const trades = await Trade.find({
            _id: { $in: tradeIds },
            user: userId,
        }).populate('strategy')

        if (!trades.length) throw new Error('No trades found')

        const tradesData = trades.map(prepareTradeData)
        return await generateBatchAnalysis(tradesData)
    } catch (error) {
        console.error('Batch AI Analysis Error:', error.message)
        throw error
    }
}

export const generateWeeklyInsights = async (userId, startDate, endDate) => {
    try {
        const trades = await Trade.find({
            user: userId,
            entryDate: { $gte: startDate, $lte: endDate },
            status: 'closed',
        }).populate('strategy')

        if (!trades.length) {
            return { message: 'No trades for selected period' }
        }

        const tradesData = trades.map(prepareTradeData)
        const openai = getOpenAI()

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional trading coach. Respond in JSON format.',
                },
                {
                    role: 'user',
                    content: JSON.stringify(tradesData),
                },
            ],
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
        })

        return JSON.parse(response.choices[0].message.content)
    } catch (error) {
        console.error('Weekly Insights Error:', error.message)
        throw error
    }
}

/* ===============================
   HELPERS
================================ */

const prepareTradeData = (trade) => ({
    symbol: trade.symbol,
    market: trade.market,
    direction: trade.direction,
    entryDate: trade.entryDate,
    exitDate: trade.exitDate,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    positionSize: trade.positionSize,
    pnl: trade.pnl,
    pnlPercentage: trade.pnlPercentage,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    rMultiple: trade.rMultiple,
    strategy: trade.strategy?.name || null,
    tags: trade.tags || [],
    emotions: trade.emotions || {},
    executionRating: trade.executionRating,
    mistakes: trade.mistakes,
    lessons: trade.lessons,
})

const generateAIAnalysis = async (tradeData) => {
    const startTime = Date.now()
    const openai = getOpenAI()

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'You are an expert trading performance analyst. Respond in JSON format.',
            },
            {
                role: 'user',
                content: JSON.stringify(tradeData),
            },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
    })

    return {
        ...JSON.parse(response.choices[0].message.content),
        tokens: response.usage.total_tokens,
        processingTime: Date.now() - startTime,
    }
}

const generateBatchAnalysis = async (tradesData) => {
    const openai = getOpenAI()

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'You analyze multiple trades for patterns. Respond in JSON format.',
            },
            {
                role: 'user',
                content: JSON.stringify(tradesData),
            },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
    })

    return JSON.parse(response.choices[0].message.content)
}
