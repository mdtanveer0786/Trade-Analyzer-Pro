import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Filter,
    Download,
    ChevronRight
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'

const StrategyBreakdown = ({ strategies }) => {
    const [selectedMetric, setSelectedMetric] = useState('pnl')
    const [sortBy, setSortBy] = useState('desc')

    const metrics = [
        { id: 'pnl', label: 'Total P&L', color: '#10B981' },
        { id: 'trades', label: 'Number of Trades', color: '#3B82F6' },
        { id: 'winRate', label: 'Win Rate', color: '#8B5CF6' },
        { id: 'profitFactor', label: 'Profit Factor', color: '#F59E0B' }
    ]

    // Map backend data
    const mappedData = strategies?.length > 0 
        ? strategies.map(s => ({
            name: s.name || (s._id && typeof s._id === 'object' ? s._id.name : 'No Strategy'),
            pnl: s.totalPnL,
            trades: s.totalTrades,
            winRate: parseFloat((s.winRate || 0).toFixed(1)),
            profitFactor: s.profitFactor || 0,
            avgWin: s.avgWin || (s.totalPnL / s.totalTrades),
            avgLoss: s.avgLoss || 0,
            bestTrade: s.maxWin || 0,
            worstTrade: s.maxLoss || 0
        }))
        : []

    const data = mappedData

    // Sort data based on selected metric
    const sortedData = [...data].sort((a, b) => {
        const aValue = a[selectedMetric] || 0
        const bValue = b[selectedMetric] || 0
        return sortBy === 'desc' ? bValue - aValue : aValue - bValue
    })

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const strategy = payload[0].payload
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[250px]">
                    <p className="font-semibold mb-2">{label}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total P&L:</span>
                            <span className={`font-medium ${strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{Math.abs(strategy.pnl).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Trades:</span>
                            <span className="font-medium">{strategy.trades}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Win Rate:</span>
                            <span className="font-medium text-green-400">{strategy.winRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Avg Win:</span>
                            <span className="font-medium">₹{strategy.avgWin?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Avg Loss:</span>
                            <span className="font-medium">₹{strategy.avgLoss?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    const formatCurrency = (value) => {
        if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
        return `₹${value}`
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header with Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-bold uppercase tracking-tight">Strategy Analysis</h3>
                        <p className="text-[10px] md:text-sm text-gray-500 font-medium">Performance breakdown by trading strategy</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center space-x-1 bg-gray-800/50 rounded-lg p-1 overflow-x-auto no-scrollbar">
                        {metrics.map((metric) => (
                            <button
                                key={metric.id}
                                onClick={() => setSelectedMetric(metric.id)}
                                className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedMetric === metric.id
                                        ? 'bg-gray-700 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-end">
                        <button
                            onClick={() => setSortBy(sortBy === 'desc' ? 'asc' : 'desc')}
                            className="p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-700 text-gray-400"
                        >
                            {sortBy === 'desc' ? (
                                <TrendingDown className="w-4 h-4" />
                            ) : (
                                <TrendingUp className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[250px] md:h-[400px] bg-gray-900/40 rounded-xl border border-gray-800 p-4 relative">
                {data.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-[1px] z-10 rounded-xl">
                        <p className="text-gray-400 text-xs font-medium">No strategy data available</p>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            vertical={false}
                            strokeOpacity={0.4}
                        />
                        <XAxis
                            dataKey="name"
                            stroke="#6B7280"
                            fontSize={9}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => value.length > 6 ? `${value.substring(0, 6)}...` : value}
                        />
                        <YAxis
                            stroke="#6B7280"
                            fontSize={9}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatCurrency}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                        <Bar
                            dataKey={selectedMetric}
                            radius={[4, 4, 0, 0]}
                            name={metrics.find(m => m.id === selectedMetric)?.label}
                            barSize={selectedMetric === 'pnl' ? 40 : 30}
                        >
                            {sortedData.map((entry, index) => {
                                const isPositive = (entry[selectedMetric] || 0) >= 0
                                const color = isPositive ? '#10B981' : '#EF4444'
                                return <Cell key={`cell-${index}`} fill={color} />
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Detailed Table (Responsive) */}
            <div className="bg-gray-900/40 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-xs md:text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 bg-gray-800/30">
                                <th className="text-left py-4 px-4 font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Strategy</th>
                                <th className="text-center py-4 px-4 font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Trades</th>
                                <th className="text-left py-4 px-4 font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Win Rate</th>
                                <th className="text-right py-4 px-4 font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">P&L</th>
                                <th className="text-center py-4 px-4 font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Profit Factor</th>
                                <th className="py-4 px-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {sortedData.map((strategy, index) => (
                                <motion.tr
                                    key={strategy.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="hover:bg-blue-500/5 transition-colors group"
                                >
                                    <td className="py-4 px-4">
                                        <div className="font-black text-gray-200 uppercase tracking-tight">{strategy.name}</div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="font-bold text-gray-400">{strategy.trades}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden hidden sm:block">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${strategy.winRate}%` }}
                                                />
                                            </div>
                                            <span className="text-blue-400 font-black">{strategy.winRate}%</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className={`font-black ${strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ₹{Math.abs(strategy.pnl).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                            strategy.profitFactor >= 2 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                            strategy.profitFactor >= 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                            'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                            {strategy.profitFactor?.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insights Section Grid */}
            {data.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    {[
                        { title: 'Best Performing', strat: sortedData[0], color: 'text-green-400', bg: 'bg-green-500/10', icon: TrendingUp },
                        { title: 'Most Consistent', strat: [...data].sort((a, b) => (b.winRate || 0) - (a.winRate || 0))[0], color: 'text-blue-400', bg: 'bg-blue-500/10', icon: BarChart3 },
                        { title: 'Needs Focus', strat: [...data].sort((a, b) => (a.winRate || 0) - (b.winRate || 0))[0], color: 'text-red-400', bg: 'bg-red-500/10', icon: TrendingDown }
                    ].map((insight, i) => (
                        <div key={i} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30 flex flex-col justify-between group hover:bg-gray-800/50 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${insight.color}`}>{insight.title}</h4>
                                <div className={`p-1.5 rounded-lg ${insight.bg}`}>
                                    <insight.icon className={`w-3.5 h-3.5 ${insight.color}`} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-sm md:text-base font-black text-gray-200 uppercase truncate">{insight.strat?.name}</div>
                                <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 font-bold">
                                    <span>{insight.strat?.trades} Trades</span>
                                    <span className={insight.color}>{i === 0 ? `₹${insight.strat?.pnl?.toLocaleString()}` : `${insight.strat?.winRate}% Win`}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

}

export default StrategyBreakdown