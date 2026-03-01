import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Calculator, Brain } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useQueryClient, useQuery } from '@tanstack/react-query'

const tradeSchema = z.object({
    symbol: z.string().min(1, 'Symbol is required'),
    market: z.enum(['stocks', 'forex', 'crypto', 'futures', 'options']),
    direction: z.enum(['long', 'short']),
    entryPrice: z.number().positive('Entry price must be positive'),
    exitPrice: z.number().positive('Exit price must be positive').optional().nullable(),
    positionSize: z.number().positive('Position size must be positive'),
    entryDate: z.string(),
    exitDate: z.string().optional().nullable(),
    stopLoss: z.number().optional().nullable(),
    takeProfit: z.number().optional().nullable(),
    commission: z.number().min(0).default(0),
    fees: z.number().min(0).default(0),
    notes: z.string().optional(),
    strategy: z.string().optional(),
    tags: z.array(z.string()).default([]),
    emotions: z.array(z.object({
        emotion: z.string(),
        intensity: z.number().min(1).max(5)
    })).default([]),
    executionRating: z.number().min(1).max(5).optional(),
})

const TradeForm = ({ onClose, trade = null }) => {
    const { api } = useAuth()
    const queryClient = useQueryClient()
    const [isCalculating, setIsCalculating] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [screenshot, setScreenshot] = useState(null)

    // Fetch strategies from backend
    const { data: strategiesResponse } = useQuery({
        queryKey: ['strategies'],
        queryFn: async () => {
            const response = await api.get('/strategies')
            return response.data
        },
    })
    const strategiesList = strategiesResponse?.data || []

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(tradeSchema),
        defaultValues: trade ? {
            ...trade,
            // Format dates for datetime-local input
            entryDate: trade.entryDate ? new Date(trade.entryDate).toISOString().slice(0, 16) : '',
            exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString().slice(0, 16) : '',
            // Map lowercase tags back to display names
            tags: (trade.tags || []).map(t => t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')),
            notes: trade.entryNotes || trade.notes || '',
            // Map emotions
            emotions: (trade.emotions || []).map(e => ({
                ...e,
                emotion: e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1)
            })),
            strategy: trade.strategy?._id || trade.strategy || '',
        } : {
            market: 'stocks',
            direction: 'long',
            commission: 0,
            fees: 0,
            tags: [],
            emotions: []
        },
    })

    const entryPrice = watch('entryPrice')
    const exitPrice = watch('exitPrice')
    const positionSize = watch('positionSize')
    const stopLoss = watch('stopLoss')
    const direction = watch('direction')

    // Risk Calculator State
    const [riskAmount, setRiskAmount] = useState(1000)
    const [riskType, setRiskType] = useState('amount') // 'amount' or 'percent'
    const [accountSize, setAccountSize] = useState(100000)

    const calculatePositionSize = () => {
        if (!entryPrice || !stopLoss) return
        const risk = riskType === 'amount' ? riskAmount : (accountSize * riskAmount) / 100
        const riskPerShare = Math.abs(entryPrice - stopLoss)
        if (riskPerShare > 0) {
            const size = Math.floor(risk / riskPerShare)
            setValue('positionSize', size)
            toast.success(`Position size updated: ${size} shares`)
        }
    }

    const commission = watch('commission') || 0
    const fees = watch('fees') || 0

    // Calculate P&L
    const calculatePnL = () => {
        if (!entryPrice || !exitPrice || !positionSize) return null

        const priceDiff = exitPrice - entryPrice
        let pnl = direction === 'long' ? priceDiff * positionSize : -priceDiff * positionSize
        
        // Subtract costs
        pnl = pnl - commission - fees
        
        const pnlPercentage = (pnl / (entryPrice * positionSize)) * 100

        return {
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPercentage: parseFloat(pnlPercentage.toFixed(2)),
        }
    }

    const pnlData = calculatePnL()

    const onSubmit = async (data) => {
        try {
            // Clean and normalize data
            const body = {
                ...data,
                symbol: data.symbol.toUpperCase().trim(),
                pnl: pnlData?.pnl || 0,
                pnlPercentage: pnlData?.pnlPercentage || 0,
                status: data.exitPrice ? 'closed' : 'open',
                entryNotes: data.notes,
                entryScreenshot: screenshot,
                // Normalize enums to lowercase for backend
                tags: (data.tags || []).map(t => t.toLowerCase().replace(' ', '_')),
                emotions: (data.emotions || []).map(e => ({
                    ...e,
                    emotion: e.emotion.toLowerCase()
                }))
            }

            // Remove empty/null/NaN values for optional fields
            if (!body.exitPrice || isNaN(body.exitPrice)) delete body.exitPrice
            if (!body.exitDate || body.exitDate === '') delete body.exitDate
            if (!body.stopLoss || isNaN(body.stopLoss)) delete body.stopLoss
            if (!body.takeProfit || isNaN(body.takeProfit)) delete body.takeProfit
            if (!body.strategy || body.strategy === '') delete body.strategy
            if (!body.notes || body.notes === '') delete body.notes

            if (trade) {
                await api.put(`/trades/${trade._id}`, body)
            } else {
                await api.post('/trades', body)
            }

            queryClient.invalidateQueries({ queryKey: ['trades'] })
            toast.success(trade ? 'Trade updated!' : 'Trade saved!')
            onClose()
        } catch (error) {
            console.error('Submission error:', error)
            const errorMsg = error.response?.data?.errors?.join(', ') || error.response?.data?.message || error.message
            toast.error(errorMsg)
        }
    }

    const handleScreenshotUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('screenshot', file)

        try {
            const response = await api.post('/trades/upload-screenshot', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            setScreenshot(response.data.data.url)
            toast.success('Screenshot uploaded!')
        } catch (error) {
            toast.error('Failed to upload screenshot')
        }
    }

    const emotionsList = [
        'Confident', 'Fearful', 'Greedy', 'Patient', 'Impatient', 'Disciplined', 'Anxious', 'Excited'
    ]

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {trade ? 'Edit Trade' : 'New Trade Entry'}
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    Fill in all trade details for better analysis
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                        {/* Basic Info Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {/* Symbol & Market */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Symbol *</label>
                                <input
                                    {...register('symbol')}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., RELIANCE, BTCUSD"
                                />
                                {errors.symbol && (
                                    <p className="text-sm text-red-400">{errors.symbol.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Market *</label>
                                <select
                                    {...register('market')}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="stocks">Stocks</option>
                                    <option value="forex">Forex</option>
                                    <option value="crypto">Crypto</option>
                                    <option value="futures">Futures</option>
                                    <option value="options">Options</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Direction *</label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setValue('direction', 'long')}
                                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${direction === 'long'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        Long
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue('direction', 'short')}
                                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${direction === 'short'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        Short
                                    </button>
                                </div>
                            </div>

                            {/* Entry Details */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Entry Price *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('entryPrice', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Exit Price *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('exitPrice', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center justify-between">
                                    <span>Position Size *</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCalculating(!isCalculating)}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                                    >
                                        <Calculator className="w-3 h-3 mr-1" />
                                        {isCalculating ? 'Hide Calculator' : 'Risk Calculator'}
                                    </button>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('positionSize', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Risk Calculator Block */}
                            {isCalculating && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="col-span-full bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
                                >
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Account Size</label>
                                        <input 
                                            type="number" 
                                            value={accountSize} 
                                            onChange={(e) => setAccountSize(Number(e.target.value))}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Risk {riskType === 'percent' ? '%' : 'Amount'}</label>
                                            <button 
                                                type="button" 
                                                onClick={() => setRiskType(riskType === 'amount' ? 'percent' : 'amount')}
                                                className="text-[10px] text-blue-400 font-bold hover:underline"
                                            >
                                                Switch to {riskType === 'amount' ? '%' : 'Amount'}
                                            </button>
                                        </div>
                                        <input 
                                            type="number" 
                                            value={riskAmount} 
                                            onChange={(e) => setRiskAmount(Number(e.target.value))}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button 
                                            type="button"
                                            onClick={calculatePositionSize}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                                        >
                                            Calc Position Size
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Dates */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Entry Date *</label>
                                <input
                                    type="datetime-local"
                                    {...register('entryDate')}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Exit Date *</label>
                                <input
                                    type="datetime-local"
                                    {...register('exitDate')}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* P&L Display */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">P&L</label>
                                <div className="bg-gray-800 rounded-lg p-4">
                                    {pnlData ? (
                                        <>
                                            <div className={`text-2xl font-bold ${pnlData.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                ₹{Math.abs(pnlData.pnl).toLocaleString()}
                                                <span className="text-lg ml-2">
                                                    ({pnlData.pnlPercentage >= 0 ? '+' : ''}{pnlData.pnlPercentage.toFixed(2)}%)
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                {direction === 'long' ? 'Long' : 'Short'} position
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-gray-400">Enter prices to calculate P&L</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Psychology & Execution - Moved out of advanced for better tracking */}
                        <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-6 mb-8 space-y-6">
                            <div className="flex items-center space-x-2 text-purple-400">
                                <Brain className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-wider text-sm">Psychology & Execution</h3>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium">Emotions During Trade</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {emotionsList.map(emotion => (
                                        <button
                                            key={emotion}
                                            type="button"
                                            onClick={() => {
                                                const currentEmotions = watch('emotions') || []
                                                const existing = currentEmotions.find(e => e.emotion === emotion)

                                                if (existing) {
                                                    setValue('emotions', currentEmotions.filter(e => e.emotion !== emotion))
                                                } else {
                                                    setValue('emotions', [...currentEmotions, { emotion, intensity: 3 }])
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${watch('emotions')?.some(e => e.emotion === emotion)
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {emotion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Execution Rating (1-5)</label>
                                <div className="flex space-x-2">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                        <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setValue('executionRating', rating)}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-all ${watch('executionRating') === rating
                                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {rating} ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Advanced Options Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full py-3 bg-gray-800/50 rounded-lg mb-6 hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <span className="font-medium">
                                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                                </span>
                            </div>
                        </button>

                        {/* Advanced Options */}
                        {showAdvanced && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-6 mb-8"
                            >
                                {/* Risk Management */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Stop Loss</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('stopLoss', { valueAsNumber: true })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Optional"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Take Profit</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('takeProfit', { valueAsNumber: true })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>

                                {/* Strategy & Tags */}
                                <div className="space-y-4">
                                    <label className="text-sm font-medium">Strategy</label>
                                    <select
                                        {...register('strategy')}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select a strategy</option>
                                        {strategiesList.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>

                                    <label className="text-sm font-medium">Tags</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            'Breakout', 'Pullback', 'Reversal', 'Trend Following',
                                            'Scalping', 'Swing', 'News', 'Gap', 'Retest',
                                            'Support', 'Resistance', 'EMA', 'MACD', 'RSI', 'Volume'
                                        ].map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    const currentTags = watch('tags') || []
                                                    if (currentTags.includes(tag)) {
                                                        setValue('tags', currentTags.filter(t => t !== tag))
                                                    } else {
                                                        setValue('tags', [...currentTags, tag])
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${watch('tags')?.includes(tag)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Screenshot Upload */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Trade Screenshot</label>
                                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-400 mb-2">
                                            Drag & drop or click to upload
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleScreenshotUpload}
                                            className="hidden"
                                            id="screenshot-upload"
                                        />
                                        <label
                                            htmlFor="screenshot-upload"
                                            className="inline-block px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                                        >
                                            Choose File
                                        </label>
                                        {screenshot && (
                                            <div className="mt-4">
                                                <img src={screenshot} alt="Screenshot" className="max-w-xs rounded-lg mx-auto" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notes</label>
                                    <textarea
                                        {...register('notes')}
                                        rows="3"
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Add any additional notes about this trade..."
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Form Actions */}
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>

                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Generate AI analysis
                                        toast.success('AI analysis requested!')
                                    }}
                                    className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <Brain className="w-4 h-4" />
                                    <span>AI Analyze</span>
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-center"
                                >
                                    {isSubmitting ? 'Saving...' : trade ? 'Update Trade' : 'Save Trade'}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default TradeForm