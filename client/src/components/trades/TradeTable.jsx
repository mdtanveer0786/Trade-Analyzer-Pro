import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  MoreVertical,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import useUIStore from '../../store/uiStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const TradeTable = ({ trades, isLoading, pagination, onPageChange }) => {
  const { openTradeForm } = useUIStore()
  const { api } = useAuth()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState(null)

  const {
    page = 1,
    pages = 1,
    total = 0
  } = pagination || {}

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/trades/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Trade deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete trade')
    }
  })

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
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

  const formatDate = (date) => {
    if (!date) return 'Open'
    return format(new Date(date), 'MMM dd, HH:mm')
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
        <p className="text-gray-400 mb-6">Start by adding your first trade</p>
        <button
          onClick={() => openTradeForm()}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          Add First Trade
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              <th className="py-4 px-6 text-sm font-medium text-gray-400">Symbol</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-400">Market</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-400">Entry</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-400">Exit</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-400">P&L</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-400">Status</th>
              <th className="py-4 px-6 text-sm font-medium text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {trades.map((trade, index) => (
                <motion.tr
                  key={trade._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        trade.direction === 'long' 
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
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <Tag className="w-3 h-3 mr-1" />
                          {typeof trade.strategy === 'object' ? trade.strategy.name : (trade.strategy || 'No Strategy')}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 text-sm text-gray-300 capitalize">
                    {trade.market}
                  </td>
                  
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-200">
                        {formatCurrency(trade.entryPrice)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(trade.entryDate)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-200">
                        {trade.exitPrice ? formatCurrency(trade.exitPrice) : '---'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Calendar className="w-3 h-3 mr-1" />
                        {trade.exitDate ? formatDate(trade.exitDate) : 'Running'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className={`flex flex-col ${
                      trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <div className="font-bold flex items-center">
                        {trade.pnl >= 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(trade.pnl))}
                      </div>
                      <div className="text-xs flex items-center mt-0.5 font-medium opacity-80">
                        {trade.pnlPercentage >= 0 ? '+' : ''}
                        {trade.pnlPercentage?.toFixed(2) || '0.00'}%
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      trade.status === 'open' 
                        ? 'bg-blue-500/10 text-blue-400'
                        : trade.status === 'closed'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {trade.status.toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button 
                        title="View Details"
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openTradeForm(trade)}
                        title="Edit Trade"
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(trade._id)}
                        disabled={deleteMutation.isLoading && deletingId === trade._id}
                        title="Delete Trade"
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-800">
        <AnimatePresence>
          {trades.map((trade, index) => (
            <motion.div
              key={trade._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-4 space-y-4 hover:bg-gray-800/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    trade.direction === 'long' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {trade.direction === 'long' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-black text-gray-100 uppercase tracking-tight">{trade.symbol}</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center mt-0.5">
                      <span className="truncate max-w-[80px]">{trade.market}</span>
                      <span className="mx-1.5 opacity-30">•</span>
                      <span className={`px-1.5 py-0.5 rounded-md ${
                        trade.status === 'open' ? 'text-blue-400 bg-blue-400/10' : 'text-green-400 bg-green-400/10'
                      }`}>
                        {trade.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`text-right ${
                  trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  <div className="font-black text-base">
                    {trade.pnl >= 0 ? '+' : ''}
                    {formatCurrency(trade.pnl)}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-tighter opacity-80">
                    {trade.pnlPercentage >= 0 ? '+' : ''}
                    {trade.pnlPercentage?.toFixed(2) || '0.00'}%
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 bg-gray-900/40 p-3 rounded-xl border border-white/5">
                <div className="space-y-0.5">
                  <div className="text-[8px] uppercase font-black text-gray-600 tracking-widest">Entry Price</div>
                  <div className="text-sm font-black text-gray-300">₹{trade.entryPrice?.toLocaleString()}</div>
                </div>
                <div className="space-y-0.5 text-right">
                  <div className="text-[8px] uppercase font-black text-gray-600 tracking-widest">Exit Price</div>
                  <div className="text-sm font-black text-gray-300">{trade.exitPrice ? `₹${trade.exitPrice.toLocaleString()}` : '---'}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                  {formatDate(trade.entryDate)}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => openTradeForm(trade)}
                    className="p-2 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(trade._id)}
                    className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-800 gap-4">
        <div className="text-sm text-gray-400 order-2 sm:order-1">
          Showing <span className="text-gray-200 font-medium">{trades.length}</span> of <span className="text-gray-200 font-medium">{total}</span> trades
        </div>
        <div className="flex items-center space-x-2 order-1 sm:order-2">
          <button 
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <div className="flex items-center space-x-1">
            {[...Array(pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => onPageChange(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                  page === i + 1
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, page - 3), Math.min(pages, page + 2))}
          </div>
          <button 
            onClick={() => onPageChange(page + 1)}
            disabled={page === pages}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default TradeTable
