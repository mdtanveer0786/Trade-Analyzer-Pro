import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    TrendingUp,
    TrendingDown,
    Eye,
    ExternalLink,
    MoreVertical,
    Calendar,
    DollarSign,
    Tag,
    Clock,
    ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import useUIStore from '../../store/uiStore'

const RecentTradesTable = ({ trades = [] }) => {
    const { openTradeForm } = useUIStore()
    const [sortBy, setSortBy] = useState('date')
    const [sortOrder, setSortOrder] = useState('desc')

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const formatDate = (date) => {
        if (!date) return '---'
        return format(new Date(date), 'MMM dd, HH:mm')
    }

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('desc')
        }
    }

    // Sort trades
    const sortedTrades = [...trades].sort((a, b) => {
        let aValue, bValue

        switch (sortBy) {
            case 'date':
                aValue = new Date(a.entryDate).getTime()
                bValue = new Date(b.entryDate).getTime()
                break
            case 'pnl':
                aValue = a.pnl || 0
                bValue = b.pnl || 0
                break
            case 'symbol':
                aValue = a.symbol?.toLowerCase() || ''
                bValue = b.symbol?.toLowerCase() || ''
                break
            default:
                aValue = a[sortBy]
                bValue = b[sortBy]
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1
        } else {
            return aValue < bValue ? 1 : -1
        }
    })

    const SortIndicator = ({ column }) => (
        <span className="ml-1 opacity-50">
            {sortBy === column ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
        </span>
    )

    if (!trades || trades.length === 0) {
        return (
            <div className="p-12 text-center bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
                <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-300">No recent trades</h3>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">Start tracking your trading performance by adding your first trade entry.</p>
                <button
                    onClick={() => openTradeForm()}
                    className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
                >
                    Add First Trade
                </button>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th
                                className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('symbol')}
                            >
                                <div className="flex items-center">
                                    Symbol
                                    <SortIndicator column="symbol" />
                                </div>
                            </th>
                            <th
                                className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center">
                                    Date
                                    <SortIndicator column="date" />
                                </div>
                            </th>
                            <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Market
                            </th>
                            <th
                                className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('pnl')}
                            >
                                <div className="flex items-center">
                                    P&L
                                    <SortIndicator column="pnl" />
                                </div>
                            </th>
                            <th className="text-right py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTrades.slice(0, 5).map((trade, index) => (
                            <motion.tr
                                key={trade._id || trade.id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group"
                            >
                                <td className="py-4 px-6">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${trade.direction === 'long'
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {trade.direction === 'long' ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-100">{trade.symbol}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{trade.direction}</div>
                                        </div>
                                    </div>
                                </td>

                                <td className="py-4 px-6">
                                    <div className="text-sm font-medium text-gray-300">
                                        {formatDate(trade.entryDate)}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-medium">
                                        {trade.status.toUpperCase()}
                                    </div>
                                </td>

                                <td className="py-4 px-6">
                                    <span className="px-2 py-1 rounded bg-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-widest border border-gray-700">
                                        {trade.market}
                                    </span>
                                </td>

                                <td className="py-4 px-6">
                                    <div className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {trade.pnl >= 0 ? '+' : '-'}
                                        {formatCurrency(Math.abs(trade.pnl))}
                                        <span className="text-xs ml-1 font-medium opacity-80">
                                            ({trade.pnlPercentage >= 0 ? '+' : ''}{trade.pnlPercentage?.toFixed(2)}%)
                                        </span>
                                    </div>
                                </td>

                                <td className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => openTradeForm(trade)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile/Tablet View (Cards) */}
            <div className="lg:hidden divide-y divide-gray-800">
                {sortedTrades.slice(0, 5).map((trade, index) => (
                    <motion.div
                        key={trade._id || trade.id || index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 hover:bg-gray-800/20 transition-colors flex items-center justify-between"
                        onClick={() => openTradeForm(trade)}
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${trade.direction === 'long'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                                }`}>
                                {trade.direction === 'long' ? (
                                    <TrendingUp className="w-5 h-5" />
                                ) : (
                                    <TrendingDown className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-gray-100">{trade.symbol}</div>
                                <div className="text-xs text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatDate(trade.entryDate)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <div className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {trade.pnl >= 0 ? '+' : '-'}
                                    {formatCurrency(Math.abs(trade.pnl))}
                                </div>
                                <div className={`text-[10px] font-bold uppercase tracking-widest ${trade.pnl >= 0 ? 'text-green-500/60' : 'text-red-500/60'}`}>
                                    {trade.pnlPercentage?.toFixed(2)}%
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* View All Link */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                <Link
                    to="/app/journal"
                    className="flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors group"
                >
                    <span>View All Activity</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
            </div>
        </div>
    )
}

export default RecentTradesTable
