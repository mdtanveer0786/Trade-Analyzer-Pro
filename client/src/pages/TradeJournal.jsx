import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, Download, Upload, Search, LayoutGrid, List, X, RotateCcw, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react'
import TradeTable from '../components/trades/TradeTable'
import ImportTradesModal from '../components/trades/ImportTradesModal'
import ScreenshotGallery from '../components/trades/ScreenshotGallery'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import useUIStore from '../store/uiStore'
import { toast } from 'react-hot-toast'

// Simple debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

const TradeJournal = () => {
    const { api } = useAuth()
    const queryClient = useQueryClient()
    const { openTradeForm } = useUIStore()
    const [page, setPage] = useState(1)
    const [viewMode, setViewMode] = useState('table')
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState({
        status: 'all',
        market: 'all',
        dateRange: 'all'
    })

    const debouncedSearch = useDebounce(searchTerm, 500)

    const { data: tradesResponse, isLoading, isFetching } = useQuery({
        queryKey: ['trades', filters, debouncedSearch, page],
        queryFn: async () => {
            const response = await api.get('/trades', { 
                params: { ...filters, search: debouncedSearch, page, limit: 15 } 
            })
            return response.data
        },
        placeholderData: keepPreviousData,
    })

    const handleResetFilters = () => {
        setFilters({
            status: 'all',
            market: 'all',
            dateRange: 'all'
        })
        setSearchTerm('')
        setPage(1)
        toast.success('Filters cleared')
    }

    const summary = tradesResponse?.summary || {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        profitFactor: 0,
        winningTrades: 0,
        losingTrades: 0
    }

    const hasActiveFilters = filters.status !== 'all' || filters.market !== 'all' || filters.dateRange !== 'all' || searchTerm !== ''

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-blue-400 fill-blue-400/20" />
                        Trade Terminal
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">Comprehensive audit of your market executions</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    {/* Import/Export */}
                    <div className="flex items-center space-x-1 bg-gray-900/40 rounded-xl p-1 border border-white/5">
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="p-2 md:px-4 md:py-1.5 rounded-lg flex items-center space-x-2 hover:bg-gray-800/40 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white"
                            title="Import CSV"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Import</span>
                        </button>
                        <button 
                            className="p-2 md:px-4 md:py-1.5 rounded-lg flex items-center space-x-2 hover:bg-gray-800/40 transition-colors text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white"
                            title="Export Data"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </div>

                    <div className="h-8 w-px bg-gray-800 hidden sm:block mx-1" />

                    {/* View Toggle */}
                    <div className="flex items-center space-x-1 bg-gray-900/40 rounded-xl p-1 border border-white/5">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 md:p-2 rounded-lg transition-all ${
                                viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'
                            }`}
                            title="Table View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('gallery')}
                            className={`p-1.5 md:p-2 rounded-lg transition-all ${
                                viewMode === 'gallery' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white'
                            }`}
                            title="Gallery View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>

                    {/* New Trade Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openTradeForm()}
                        className="flex-1 md:flex-none px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Setup</span>
                    </motion.button>
                </div>
            </div>

            {/* Main Stats Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total Volume', value: summary.totalTrades, icon: List, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Win Rate', value: `${summary.winRate}%`, icon: Target, color: summary.winRate >= 50 ? 'text-green-400' : 'text-red-400', bg: summary.winRate >= 50 ? 'bg-green-500/10' : 'bg-red-500/10' },
                    { label: 'Total Profit', value: `₹${Math.abs(summary.totalPnL).toLocaleString()}`, icon: summary.totalPnL >= 0 ? TrendingUp : TrendingDown, color: summary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400', bg: summary.totalPnL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10' },
                    { label: 'Profit Factor', value: summary.profitFactor || '0.00', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center space-x-4 shadow-xl hover:border-blue-500/30 transition-all`}
                    >
                        <div className={`p-2.5 rounded-xl ${stat.bg} border border-white/5`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">{stat.label}</p>
                            <p className={`text-lg font-black ${stat.color} leading-none`}>
                                {isLoading ? '...' : stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800 p-4 md:p-6 shadow-2xl">
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 w-full lg:max-w-md">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by symbol, notes or strategy..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm transition-all"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filter Controls */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <div className="flex-1 sm:flex-none relative">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full sm:w-auto pl-3 pr-8 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                            </div>

                            <div className="flex-1 sm:flex-none relative">
                                <select
                                    value={filters.market}
                                    onChange={(e) => setFilters({ ...filters, market: e.target.value })}
                                    className="w-full sm:w-auto pl-3 pr-8 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer"
                                >
                                    <option value="all">All Markets</option>
                                    <option value="stocks">Stocks</option>
                                    <option value="forex">Forex</option>
                                    <option value="crypto">Crypto</option>
                                    <option value="futures">Futures</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                            </div>

                            <div className="flex-1 sm:flex-none relative">
                                <select
                                    value={filters.dateRange}
                                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                                    className="w-full sm:w-auto pl-3 pr-8 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-bold uppercase tracking-widest appearance-none cursor-pointer"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="quarter">This Quarter</option>
                                    <option value="year">This Year</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                            </div>

                            {hasActiveFilters && (
                                <button 
                                    onClick={handleResetFilters}
                                    className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all flex items-center space-x-2 text-xs font-bold uppercase tracking-widest"
                                    title="Reset Filters"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Clear</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trade Content */}
            <div className="relative">
                {isFetching && !isLoading && (
                    <div className="absolute top-0 right-0 p-4 z-10">
                        <div className="flex items-center space-x-2 bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Refreshing...</span>
                        </div>
                    </div>
                )}
                
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
                        {viewMode === 'table' ? (
                            <TradeTable 
                                trades={tradesResponse?.data || []} 
                                isLoading={isLoading}
                                pagination={tradesResponse?.pagination}
                                onPageChange={(p) => setPage(p)}
                            />
                        ) : (
                            <ScreenshotGallery 
                                trades={tradesResponse?.data || []} 
                                isLoading={isLoading} 
                            />
                        )}
                    </div>
                </motion.div>
            </div>

            <ImportTradesModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['trades'] })}
                api={api}
            />
        </div>
    )
}

export default TradeJournal