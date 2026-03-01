import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BarChart3,
    LineChart,
    PieChart,
    TrendingUp,
    Download,
    Calendar,
    Filter,
    Zap,
    Target
} from 'lucide-react'
import PerformanceChart from '../components/charts/PerformanceChart'
import WinRateChart from '../components/charts/WinRateChart'
import StrategyBreakdown from '../components/analytics/StrategyBreakdown'
import MarketPerformance from '../components/analytics/MarketPerformance'
import TimeAnalysis from '../components/analytics/TimeAnalysis'
import PsychologyMetrics from '../components/psychology/PsychologyMetrics'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Cell, PieChart as RechartsPieChart, Pie, Legend
} from 'recharts'

const Analytics = () => {
    const { api } = useAuth()
    const [timeRange, setTimeRange] = useState('3M')
    const [activeTab, setActiveTab] = useState('performance')

    const { data: analyticsData, isLoading } = useQuery({
        queryKey: ['analytics', activeTab, timeRange],
        queryFn: async () => {
            const response = await api.get(`/analytics/${activeTab}?range=${timeRange}`)
            return response.data.data
        },
        placeholderData: keepPreviousData,
    })

    const summary = analyticsData?.summary || {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        expectancy: 0
    }

    const tabs = [
        { id: 'performance', label: 'Performance', icon: TrendingUp },
        { id: 'strategy', label: 'Strategy', icon: BarChart3 },
        { id: 'market', label: 'Market', icon: LineChart },
        { id: 'time', label: 'Time Analysis', icon: Calendar },
        { id: 'psychology', label: 'Psychology', icon: PieChart },
    ]

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-blue-400 fill-blue-400/20" />
                        Advanced Analytics
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">Deep insights into your trading performance</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center space-x-1 bg-gray-900/40 rounded-xl p-1 border border-white/5 overflow-x-auto no-scrollbar">
                        {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${timeRange === range
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <button className="px-4 py-2 bg-gray-900/40 border border-white/5 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-800/40 transition-colors text-[10px] font-black uppercase tracking-widest">
                        <Download className="w-4 h-4 text-blue-400" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-800/50 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex space-x-1 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 md:px-6 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-400 bg-blue-400/5'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500'}`} />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total Volume', value: summary.totalTrades, change: summary.tradesChange, prefix: '', suffix: '', icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Win Rate', value: summary.winRate, change: summary.winRateChange, prefix: '', suffix: '%', icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Profit Factor', value: summary.profitFactor, change: summary.profitFactorChange, prefix: '', suffix: '', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Avg R Multiple', value: summary.expectancy, change: summary.expectancyChange, prefix: '', suffix: 'R', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' }
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-1.5 md:p-2 rounded-lg ${stat.bg} border border-white/5`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <div className="flex items-center">
                                <span className={`text-[10px] font-black ${Number(stat.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {isLoading ? '...' : `${Number(stat.change || 0) >= 0 ? '+' : ''}${Number(stat.change || 0).toFixed(1)}%`}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                            <p className={`text-xl md:text-2xl font-black text-white truncate`}>
                                {isLoading ? '...' : `${stat.prefix}${Number(stat.value || 0).toLocaleString(undefined, { minimumFractionDigits: stat.label === 'Total Volume' ? 0 : 2, maximumFractionDigits: stat.label === 'Total Volume' ? 0 : 2 })}${stat.suffix}`}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>


            {/* Tab Content */}
            <div className="relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-gray-950/20 backdrop-blur-[1px] flex items-center justify-center rounded-xl min-h-[400px]">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <AnimatePresence mode="wait">
                    {activeTab === 'performance' && (
                        <motion.div
                            key="performance"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 md:p-6 overflow-hidden">
                                    <h3 className="text-sm md:text-lg font-bold uppercase tracking-widest text-gray-400 mb-6">Equity Curve</h3>
                                    <PerformanceChart data={analyticsData?.equityCurve || []} />
                                </div>

                                <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 md:p-6 overflow-hidden">
                                    <h3 className="text-sm md:text-lg font-bold uppercase tracking-widest text-gray-400 mb-6">Win/Loss Distribution</h3>
                                    <WinRateChart data={analyticsData?.winLossDistribution || []} />
                                </div>
                            </div>

                            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 md:p-6 overflow-hidden">
                                <h3 className="text-sm md:text-lg font-bold uppercase tracking-widest text-gray-400 mb-6">Monthly Performance</h3>
                                <div className="h-[300px] md:h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={(analyticsData?.monthlyPerformance || []).filter(m => m.trades > 0 || m.pnl !== 0)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} strokeOpacity={0.3} />
                                            <XAxis 
                                                dataKey="month" 
                                                stroke="#6B7280" 
                                                fontSize={10} 
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                stroke="#6B7280" 
                                                fontSize={10} 
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                formatter={(value) => [`₹${value.toLocaleString()}`, 'P&L']}
                                            />
                                            <Bar dataKey="pnl" radius={[4, 4, 0, 0]} barSize={40}>
                                                {(analyticsData?.monthlyPerformance || []).filter(m => m.trades > 0 || m.pnl !== 0).map((entry, index) => (
                                                    <Cell key={index} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'strategy' && (
                        <motion.div
                            key="strategy"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 md:p-6">
                                <StrategyBreakdown strategies={analyticsData?.strategies || []} />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'market' && (
                        <motion.div
                            key="market"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MarketPerformance data={analyticsData} />
                        </motion.div>
                    )}

                    {activeTab === 'time' && (
                        <motion.div
                            key="time"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TimeAnalysis data={analyticsData} />
                        </motion.div>
                    )}

                    {activeTab === 'psychology' && (
                        <motion.div
                            key="psychology"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 md:p-6">
                                <h3 className="text-sm md:text-lg font-bold uppercase tracking-widest text-gray-400 mb-6">Psychology & Emotional Patterns</h3>
                                <PsychologyMetrics data={analyticsData} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AI Insights Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl border border-blue-500/20 p-4 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                        <div>
                            <h3 className="text-base md:text-xl font-black uppercase tracking-tight flex items-center">
                                <Zap className="w-5 h-5 mr-2 text-blue-400 fill-blue-400/20" />
                                AI Performance Insights
                            </h3>
                            <p className="text-gray-400 text-xs md:text-sm mt-1">Personalized recommendations powered by advanced pattern recognition</p>
                        </div>
                        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 self-start md:self-center">
                            Generate New Report
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {(analyticsData?.aiInsights?.length > 0) ? (
                            analyticsData.aiInsights.slice(0, 3).map((insight, idx) => (
                                <div key={insight.id || idx} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/30">
                                    <h4 className={`font-medium mb-2 ${idx === 0 ? 'text-green-400' : idx === 1 ? 'text-amber-400' : 'text-blue-400'}`}>
                                        {idx === 0 ? 'Top Strength' : idx === 1 ? 'Area to Improve' : 'AI Recommendation'}
                                    </h4>
                                    <p className="text-sm text-gray-300">
                                        {insight.summary || (idx === 0 ? insight.strengths?.[0] : idx === 1 ? insight.weaknesses?.[0] : insight.recommendations?.[0])}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="bg-gray-900/50 rounded-lg p-4 opacity-50 border border-gray-800/50">
                                    <h4 className="font-medium text-green-400 mb-2">Top Strength</h4>
                                    <p className="text-sm text-gray-300 italic">
                                        Personalized strengths will appear here after your first AI trade analysis.
                                    </p>
                                </div>

                                <div className="bg-gray-900/50 rounded-lg p-4 opacity-50 border border-gray-800/50">
                                    <h4 className="font-medium text-amber-400 mb-2">Area to Improve</h4>
                                    <p className="text-sm text-gray-300 italic">
                                        AI will identify your weak spots once you track at least 5 closed trades.
                                    </p>
                                </div>

                                <div className="bg-gray-900/50 rounded-lg p-4 opacity-50 border border-gray-800/50">
                                    <h4 className="font-medium text-blue-400 mb-2">Recommendation</h4>
                                    <p className="text-sm text-gray-300 italic">
                                        Strategic recommendations are generated by analyzing your emotional patterns and risk management.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default Analytics