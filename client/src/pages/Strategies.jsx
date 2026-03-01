import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Filter,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Target,
    Edit,
    Trash2,
    Star,
    Download,
    X,
    Save,
    AlertTriangle,
    Zap
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const Strategies = () => {
    const { api } = useAuth()
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editingStrategy, setEditingStrategy] = useState(null)

    const { data: strategiesResponse, isLoading } = useQuery({
        queryKey: ['strategies'],
        queryFn: async () => {
            const response = await api.get('/strategies')
            return response.data
        },
        placeholderData: keepPreviousData,
    })

    const { data: analyticsResponse } = useQuery({
        queryKey: ['strategy-analytics'],
        queryFn: async () => {
            const response = await api.get('/analytics/strategy')
            return response.data.data
        },
        placeholderData: keepPreviousData,
    })

    const generateAIReportMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/analytics/ai-report', { type: 'performance' })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategy-analytics'] })
            toast.success('AI Strategy Report generated!')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to generate report')
        }
    })

    const strategies = strategiesResponse?.data || []
    const aiInsights = analyticsResponse?.aiInsights || []

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/strategies/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategies'] })
            toast.success('Strategy deleted')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete strategy')
        }
    })

    const toggleFavoriteMutation = useMutation({
        mutationFn: async (id) => {
            await api.patch(`/strategies/${id}/favorite`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategies'] })
        }
    })

    const handleEdit = (strategy) => {
        setEditingStrategy(strategy)
        setShowForm(true)
    }

    const handleDelete = (id) => {
        if (window.confirm('Are you sure? This strategy can only be deleted if no trades are linked to it.')) {
            deleteMutation.mutate(id)
        }
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const totalPnL = strategies.reduce((sum, s) => sum + (s.performance?.totalPnL || 0), 0)
    const avgWinRate = strategies.length > 0 
        ? strategies.reduce((sum, s) => sum + (s.performance?.winRate || 0), 0) / strategies.length
        : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-blue-400 fill-blue-400/20" />
                        Strategy Lab
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">Manage and optimize your trading systems</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button className="px-4 py-2 bg-gray-900/40 border border-white/5 rounded-xl flex items-center space-x-2 hover:bg-gray-800/40 transition-colors text-[10px] font-black uppercase tracking-widest">
                        <Download className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400 hover:text-white transition-colors">Export</span>
                    </button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setEditingStrategy(null)
                            setShowForm(true)
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New System</span>
                    </motion.button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 group hover:border-blue-500/30 transition-all shadow-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-white/5">
                            <Target className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Systems</span>
                    </div>
                    <p className="text-3xl font-black text-gray-100">{strategies.length}</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Total Deployed</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 group hover:border-purple-500/30 transition-all shadow-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-white/5">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Performance</span>
                    </div>
                    <p className="text-3xl font-black text-gray-100">{avgWinRate.toFixed(1)}%</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Avg Win Ratio</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 group hover:border-green-500/30 transition-all shadow-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-green-500/10 border border-white/5">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Cumulative</span>
                    </div>
                    <p className={`text-3xl font-black ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(totalPnL)}
                    </p>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Realized Alpha</p>
                </motion.div>
            </div>

            {/* Strategy List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 bg-gray-800/30 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : strategies.length === 0 ? (
                <div className="p-12 text-center bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                    <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-300">No strategies found</h3>
                    <p className="text-gray-500 mb-6">Start by defining your first trading strategy</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 font-medium"
                    >
                        Create Strategy
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {strategies.map((strategy, index) => (
                        <motion.div
                            key={strategy._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 hover:border-gray-700 transition-all group relative overflow-hidden"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                                {/* Left Section */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <h3 className="text-xl font-bold text-gray-100">{strategy.name}</h3>
                                                <button
                                                    onClick={() => toggleFavoriteMutation.mutate(strategy._id)}
                                                    className="text-gray-500 hover:text-amber-400 transition-colors"
                                                >
                                                    <Star className={`w-4 h-4 ${strategy.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                                                </button>
                                                {!strategy.isActive && (
                                                    <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 text-[10px] font-bold uppercase tracking-wider">Inactive</span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm mb-4 line-clamp-2 max-w-2xl">
                                                {strategy.description || 'No description provided.'}
                                            </p>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                    {strategy.market}
                                                </span>
                                                {strategy.tags?.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-gray-800 text-gray-400 border border-gray-700 rounded-md text-[10px] font-bold uppercase tracking-wider"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Performance Stats */}
                                        <div className="hidden sm:flex flex-col items-end space-y-2">
                                            <div className={`text-2xl font-black ${strategy.performance?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {formatCurrency(strategy.performance?.totalPnL || 0)}
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-gray-200">{strategy.performance?.winRate?.toFixed(1) || 0}%</div>
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Win Rate</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-gray-200">{strategy.performance?.totalTrades || 0}</div>
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trades</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Stats */}
                                    <div className="sm:hidden grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-800">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">P&L</div>
                                            <div className={`font-bold ${strategy.performance?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {formatCurrency(strategy.performance?.totalPnL || 0)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Win Rate</div>
                                            <div className="font-bold text-gray-200">{strategy.performance?.winRate?.toFixed(1) || 0}%</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Trades</div>
                                            <div className="font-bold text-gray-200">{strategy.performance?.totalTrades || 0}</div>
                                        </div>
                                    </div>

                                    {/* Progress Bars */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                            <span>Avg Win: <span className="text-green-400">{formatCurrency(strategy.performance?.avgWin || 0)}</span></span>
                                            <span>Avg Loss: <span className="text-red-400">{formatCurrency(strategy.performance?.avgLoss || 0)}</span></span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700/50">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${strategy.performance?.winRate || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end space-x-2 pt-4 lg:pt-0 lg:border-l lg:border-gray-800 lg:pl-6">
                                    <button 
                                        onClick={() => handleEdit(strategy)}
                                        className="p-3 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 rounded-xl transition-all border border-blue-500/10"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(strategy._id)}
                                        className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-xl transition-all border border-red-500/10"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Strategy Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <StrategyForm 
                        strategy={editingStrategy} 
                        onClose={() => setShowForm(false)} 
                    />
                )}
            </AnimatePresence>

            {/* AI Insights Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-pink-900/20 backdrop-blur-md rounded-3xl border border-blue-500/20 p-8 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Target className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-100">AI Strategy Assistant</h3>
                                <p className="text-gray-400">Personalized strategy suggestions based on your performance data</p>
                            </div>
                        </div>
                        <button
                            onClick={() => generateAIReportMutation.mutate()}
                            disabled={generateAIReportMutation.isLoading}
                            className={`px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl shadow-white/5 active:scale-95 ${generateAIReportMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {generateAIReportMutation.isLoading ? 'Analyzing...' : 'Generate Insights'}
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mt-10">
                        {(aiInsights.length > 0) ? (
                            aiInsights.slice(0, 2).map((insight, idx) => (
                                <div key={insight.id || idx} className="bg-gray-900/40 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                                    <h4 className={`font-bold mb-3 flex items-center ${idx === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                                        {idx === 0 ? <TrendingUp className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                        {idx === 0 ? 'Strategy Insight' : 'Risk Warning'}
                                    </h4>
                                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                                        {insight.recommendation}
                                    </p>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        {idx === 0 ? 'Strength: ' : 'Weakness: '}
                                        <span className={idx === 0 ? 'text-green-400' : 'text-amber-400'}>
                                            {idx === 0 ? (insight.strengths || 'Consistent execution') : (insight.weaknesses || 'Emotional exits')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="bg-gray-900/40 rounded-2xl p-6 border border-white/5 backdrop-blur-sm opacity-50">
                                    <h4 className="font-bold text-green-400 mb-3 flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        Recommended Strategy
                                    </h4>
                                    <p className="text-sm text-gray-300 mb-4 leading-relaxed italic">
                                        AI will suggest strategy improvements after you've logged and analyzed at least 5 trades.
                                    </p>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Expected improvement: <span className="text-green-400">---</span>
                                    </div>
                                </div>

                                <div className="bg-gray-900/40 rounded-2xl p-6 border border-white/5 backdrop-blur-sm opacity-50">
                                    <h4 className="font-bold text-amber-400 mb-3 flex items-center">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Risk Warning
                                    </h4>
                                    <p className="text-sm text-gray-300 mb-4 leading-relaxed italic">
                                        Strategic risk analysis will appear here once the AI identifies patterns in your trading behavior.
                                    </p>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Current drawdown: <span className="text-red-400">---</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// Strategy Form Component
const StrategyForm = ({ strategy, onClose }) => {
    const { api } = useAuth()
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState(strategy || {
        name: '',
        description: '',
        market: 'stocks',
        isActive: true,
        tags: [],
        rules: {
            entry: [],
            exit: [],
            riskManagement: []
        }
    })

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (strategy) {
                await api.put(`/strategies/${strategy._id}`, data)
            } else {
                await api.post('/strategies', data)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategies'] })
            toast.success(strategy ? 'Strategy updated' : 'Strategy created')
            onClose()
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Something went wrong')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.name) return toast.error('Name is required')
        mutation.mutate(formData)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-3xl border border-gray-800 w-full max-w-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-100">
                        {strategy ? 'Edit Strategy' : 'New Strategy'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Strategy Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-100"
                                placeholder="e.g., VWAP Reversal, Breakout 2.0"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-100"
                                placeholder="Describe your strategy logic..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Market</label>
                                <select
                                    value={formData.market}
                                    onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-100"
                                >
                                    <option value="stocks">Stocks</option>
                                    <option value="forex">Forex</option>
                                    <option value="crypto">Crypto</option>
                                    <option value="futures">Futures</option>
                                    <option value="options">Options</option>
                                    <option value="all">All Markets</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Status</label>
                                <div className="flex items-center space-x-2 h-[50px]">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        className={`w-full py-3 rounded-xl font-bold transition-all ${
                                            formData.isActive 
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                            : 'bg-gray-800 text-gray-500 border border-gray-700'
                                        }`}
                                    >
                                        {formData.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-3 text-gray-400 font-bold hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isLoading}
                            className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center space-x-2"
                        >
                            <Save className="w-5 h-5" />
                            <span>{mutation.isLoading ? 'Saving...' : 'Save Strategy'}</span>
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

export default Strategies
