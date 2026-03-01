import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    TrendingUp as IconTrendingUp,
    TrendingDown as IconTrendingDown,
    BarChart3 as IconBarChart,
    PieChart as IconPieChart,
    DollarSign,
    Filter,
    Download,
    Zap,
    Activity,
    Target,
    Clock
} from 'lucide-react'
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'

const MarketPerformance = ({ data }) => {
    const [viewType, setViewType] = useState('bar')
    const [timeRange, setTimeRange] = useState('3M')

    const marketsList = data?.markets || []
    const marketPerformanceOverTime = data?.marketPerformanceOverTime || []

    // Map backend data to chart-friendly format
    const marketData = marketsList.length > 0 
        ? marketsList.map(m => ({
            name: m._id ? (m._id.charAt(0).toUpperCase() + m._id.slice(1)) : 'Unknown',
            trades: m.tradeCount || 0,
            pnl: m.totalPnL || 0,
            winRate: parseFloat(m.winRate?.toFixed(1) || 0),
            avgTrade: m.tradeCount > 0 ? Math.round(m.totalPnL / m.tradeCount) : 0
        }))
        : []

    if (marketData.length === 0) {
        return (
            <div className="bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-800 p-16 text-center">
                <div className="w-20 h-20 bg-gray-800/50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <IconBarChart className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-400 uppercase tracking-widest mb-4">No Market Data</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-lg font-medium">
                    Detailed analysis will appear here once you log trades across different markets.
                </p>
            </div>
        )
    }

    const bestMarket = [...marketData].sort((a, b) => b.pnl - a.pnl)[0] || marketData[0]
    const highestWinRate = [...marketData].sort((a, b) => b.winRate - a.winRate)[0] || marketData[0]
    const mostActive = [...marketData].sort((a, b) => b.trades - a.trades)[0] || marketData[0]
    const needsReview = [...marketData].sort((a, b) => a.pnl - b.pnl)[0] || marketData[0]
    
    const activeMarkets = [...new Set(
        marketPerformanceOverTime.flatMap(monthData => 
            Object.keys(monthData).filter(k => k !== 'month')
        )
    )]

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4']

    const formatCurrency = (value) => {
        const sign = value < 0 ? '-' : ''
        const absValue = Math.abs(value)
        if (absValue >= 1000000) return `${sign}₹${(absValue / 1000000).toFixed(1)}M`
        if (absValue >= 1000) return `${sign}₹${(absValue / 1000).toFixed(0)}K`
        return `${sign}₹${absValue.toLocaleString()}`
    }

    return (
        <div className="space-y-8">
            {/* Header Controls */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center justify-between">
                <div className="flex items-center space-x-5">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-2xl">
                        <Activity className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white">Market Intelligence</h3>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mt-1">Cross-Asset Performance</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center bg-gray-900/80 rounded-2xl p-1.5 border border-white/5 shadow-2xl">
                        {['1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeRange === range
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center space-x-2 bg-gray-900/80 rounded-2xl p-1.5 border border-white/5 shadow-2xl">
                        {[
                            { id: 'bar', icon: IconBarChart, label: 'Performance' },
                            { id: 'pie', icon: IconPieChart, label: 'Distribution' },
                            { id: 'line', icon: IconTrendingUp, label: 'Trend' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setViewType(tab.id)}
                                className={`p-2.5 rounded-xl transition-all ${viewType === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Container */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900/40 rounded-[2.5rem] border border-gray-800 p-6 md:p-10 h-[450px] md:h-[550px] relative overflow-hidden group shadow-3xl">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0"></div>
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                {viewType === 'pie' ? (
                                    <PieChart>
                                        <Pie
                                            data={marketData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius="55%"
                                            outerRadius="80%"
                                            paddingAngle={10}
                                            dataKey="trades"
                                            nameKey="name"
                                            stroke="none"
                                        >
                                            {marketData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={COLORS[index % COLORS.length]} 
                                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={40} 
                                            iconType="circle"
                                            formatter={(value) => <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">{value}</span>}
                                        />
                                    </PieChart>
                                ) : viewType === 'bar' ? (
                                    <BarChart data={marketData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} strokeOpacity={0.1} />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#4B5563" 
                                            fontSize={10} 
                                            fontWeight="900" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ dy: 10 }} 
                                        />
                                        <YAxis 
                                            stroke="#4B5563" 
                                            fontSize={10} 
                                            fontWeight="900" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tickFormatter={formatCurrency} 
                                            width={80} 
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                                            contentStyle={{ backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '1rem' }}
                                        />
                                        <Bar dataKey="pnl" radius={[10, 10, 0, 0]} barSize={60}>
                                            {marketData.map((entry, index) => (
                                                <Cell key={index} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                ) : (
                                    <LineChart data={marketPerformanceOverTime} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="month" stroke="#4B5563" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tick={{ dy: 10 }} />
                                        <YAxis stroke="#4B5563" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tickFormatter={formatCurrency} width={80} />
                                        <Tooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '1rem' }} />
                                        <Legend iconType="circle" formatter={(value) => <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">{value}</span>} />
                                        {activeMarkets.map((m, i) => (
                                            <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i % COLORS.length]} strokeWidth={4} dot={{ r: 6, strokeWidth: 3, fill: '#030712' }} activeDot={{ r: 8, strokeWidth: 0 }} name={m.toUpperCase()} />
                                        ))}
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Market Summary Cards */}
                <div className="flex flex-col gap-5 max-h-[450px] md:max-h-[550px] overflow-y-auto no-scrollbar pr-2">
                    {marketData.map((market, index) => (
                        <motion.div
                            key={market.name}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-gray-900/30 rounded-[2rem] border border-gray-800 p-6 hover:bg-gray-800/40 transition-all group border-l-[8px] shadow-2xl"
                            style={{ borderLeftColor: COLORS[index % COLORS.length] }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-lg font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{market.name}</span>
                                <div className={`text-lg font-black ${market.pnl >= 0 ? 'text-green-400' : 'text-red-400'} tabular-nums`}>
                                    {market.pnl >= 0 ? '+' : ''}{formatCurrency(market.pnl)}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-950/50 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Trades</div>
                                    <div className="text-base font-black text-gray-200">{market.trades}</div>
                                </div>
                                <div className="bg-gray-950/50 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Win Rate</div>
                                    <div className="text-base font-black text-blue-400">{market.winRate}%</div>
                                </div>
                                <div className="bg-gray-950/50 rounded-2xl p-3 text-center border border-white/5">
                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Efficiency</div>
                                    <div className="text-base font-black text-gray-200 truncate">{Math.abs(market.avgTrade) > 1000 ? `${(market.avgTrade/1000).toFixed(1)}k` : market.avgTrade}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Performance KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Alpha Market', value: bestMarket.name, sub: `${formatCurrency(bestMarket.pnl)} Profit`, color: 'text-green-400', icon: IconTrendingUp, bg: 'bg-green-500/10' },
                    { label: 'Top Accuracy', value: highestWinRate.name, sub: `${highestWinRate.winRate}% Precision`, color: 'text-blue-400', icon: Target, bg: 'bg-blue-500/10' },
                    { label: 'Core Volume', value: mostActive.name, sub: `${mostActive.trades} Executions`, color: 'text-amber-400', icon: Activity, bg: 'bg-amber-500/10' },
                    { label: 'Review Logic', value: needsReview.name, sub: `${formatCurrency(needsReview.pnl)} Delta`, color: 'text-red-400', icon: IconTrendingDown, bg: 'bg-red-500/10' }
                ].map((stat, i) => (
                    <div key={i} className="bg-gray-900/40 rounded-[2rem] p-6 border border-gray-800 flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-3xl group">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.25em]">{stat.label}</span>
                            <div className={`p-2.5 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform shadow-inner`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div>
                            <div className={`text-xl md:text-2xl font-black ${stat.color} uppercase truncate tracking-tighter mb-1`}>{stat.value}</div>
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest truncate">{stat.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Intelligence Footer */}
            <div className="bg-gradient-to-br from-blue-900/30 via-gray-900/50 to-indigo-900/30 rounded-[3rem] border border-blue-500/20 p-8 md:p-12 relative overflow-hidden group shadow-3xl">
                <div className="absolute -right-24 -bottom-24 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 scale-150">
                    <IconTrendingUp className="w-96 h-96 text-blue-400" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-3xl ring-8 ring-blue-500/10">
                        <Zap className="w-12 h-12 text-white fill-white/20" />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center mb-8 gap-4 justify-center md:justify-start">
                            <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">Market Edge Report</h4>
                            <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-black rounded-full border border-blue-500/20 uppercase tracking-[0.4em] w-fit mx-auto md:mx-0">Active Analysis</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-5">
                                <h5 className="text-xs font-black text-green-400 uppercase tracking-[0.3em] flex items-center justify-center md:justify-start">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-4 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                                    Dominant Strengths
                                </h5>
                                <div className="space-y-4">
                                    {marketData.slice(0, 2).map((m, i) => (
                                        <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-green-500/30 transition-all text-left">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white font-black uppercase tracking-tight">{m.name}</span>
                                                <span className="text-green-400 font-black">{m.winRate}%</span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                                Maintaining superior execution quality over <span className="text-white font-bold">{m.trades}</span> trades. This is your primary alpha generator.
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <h5 className="text-xs font-black text-amber-400 uppercase tracking-[0.3em] flex items-center justify-center md:justify-start">
                                    <IconTrendingDown className="w-4 h-4 mr-4" />
                                    Optimization Paths
                                </h5>
                                <div className="bg-gray-950/60 p-6 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all text-left">
                                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                        Your <span className="text-white font-black uppercase">{needsReview.name}</span> performance currently represents a drag on overall equity. 
                                        AI suggests tightening stop-loss parameters and avoiding midday volatility spikes to stabilize returns in this market.
                                    </p>
                                    <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Avg Loss Delta</span>
                                        <span className="text-red-400 font-black">{formatCurrency(needsReview.avgTrade)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketPerformance
