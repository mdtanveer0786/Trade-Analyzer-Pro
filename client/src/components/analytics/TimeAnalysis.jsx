import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Clock,
    Calendar,
    TrendingUp,
    TrendingDown,
    Filter,
    Download,
    BarChart3,
    Zap
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, LineChart, Line,
    ComposedChart
} from 'recharts'

const TimeAnalysis = ({ data }) => {
    const [viewType, setViewType] = useState('hourly')
    const [metric, setMetric] = useState('pnl')

    // Map backend data
    const hourlyData = data?.hourlyStats?.length > 0 
        ? data.hourlyStats.map(h => ({
            hour: `${h.hour}:00`,
            trades: h.trades,
            pnl: h.totalPnL,
            winRate: parseFloat(h.winRate.toFixed(1)),
            volume: 0 // Backend doesn't provide volume yet
        }))
        : []

    const dayData = data?.dayStats?.length > 0
        ? data.dayStats.map(d => ({
            day: d.day,
            trades: d.trades,
            pnl: d.totalPnL,
            winRate: parseFloat(d.winRate.toFixed(1)),
            volume: 0
        }))
        : []

    const monthlyData = data?.monthStats?.length > 0
        ? data.monthStats.map(m => ({
            month: m.month,
            trades: m.trades,
            pnl: m.totalPnL,
            winRate: parseFloat(m.winRate.toFixed(1))
        }))
        : []

    if (hourlyData.length === 0 && dayData.length === 0 && monthlyData.length === 0) {
        return (
            <div className="bg-gray-900/30 rounded-xl border border-dashed border-gray-800 p-12 text-center">
                <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-400">No time analysis data</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                    Time-based performance patterns will be automatically analyzed once you log your first few trades.
                </p>
            </div>
        )
    }

    const getData = () => {
        switch (viewType) {
            case 'hourly': return hourlyData
            case 'daily': return dayData
            case 'monthly': return monthlyData
            default: return hourlyData
        }
    }

    const getXAxisKey = () => {
        switch (viewType) {
            case 'hourly': return 'hour'
            case 'daily': return 'day'
            case 'monthly': return 'month'
            default: return 'hour'
        }
    }

    const metrics = [
        { id: 'pnl', label: 'P&L', color: '#10B981', negativeColor: '#EF4444' },
        { id: 'trades', label: 'Number of Trades', color: '#3B82F6' },
        { id: 'winRate', label: 'Win Rate', color: '#8B5CF6' },
        { id: 'volume', label: 'Volume', color: '#F59E0B' }
    ]

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[220px]">
                    <p className="font-semibold mb-2">{label}</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">P&L:</span>
                            <span className={`font-medium ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{Math.abs(data.pnl).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Trades:</span>
                            <span className="font-medium">{data.trades}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Win Rate:</span>
                            <span className="font-medium text-green-400">{data.winRate}%</span>
                        </div>
                        {data.volume > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Volume:</span>
                                <span className="font-medium">₹{(data.volume / 1000).toFixed(1)}K</span>
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        return null
    }

    const formatCurrency = (value) => {
        if (Math.abs(value) >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`
        if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}K`
        return `₹${value}`
    }

    const findBestTime = () => {
        const data = getData()
        if (!data || data.length === 0) return { time: '---', pnl: 0, winRate: 0 }
        const best = data.reduce((best, current) =>
            current.pnl > best.pnl ? current : best
        , data[0])
        return {
            time: best[getXAxisKey()],
            pnl: best.pnl,
            winRate: best.winRate
        }
    }

    const findWorstTime = () => {
        const data = getData()
        if (!data || data.length === 0) return { time: '---', pnl: 0, winRate: 0 }
        const worst = data.reduce((worst, current) =>
            current.pnl < worst.pnl ? current : worst
        , data[0])
        return {
            time: worst[getXAxisKey()],
            pnl: worst.pnl,
            winRate: worst.winRate
        }
    }

    const bestTime = findBestTime()
    const worstTime = findWorstTime()

    // Calculate detailed metrics
    const avgDailyTrades = dayData.length > 0 
        ? (dayData.reduce((sum, d) => sum + d.trades, 0) / dayData.length).toFixed(1)
        : '0.0'
    
    const peakHour = hourlyData.length > 0
        ? hourlyData.reduce((prev, current) => (current.trades > prev.trades) ? current : prev, hourlyData[0])
        : { hour: '---', winRate: 0 }
    
    const bestDay = dayData.length > 0
        ? dayData.reduce((prev, current) => (current.pnl > prev.pnl) ? current : prev, dayData[0])
        : { day: '---', pnl: 0 }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-bold uppercase tracking-tight">Time Patterns</h3>
                        <p className="text-[10px] md:text-sm text-gray-500 font-medium">Analyze patterns across different timeframes</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full md:w-auto">
                    <div className="flex items-center space-x-1 bg-gray-800/50 rounded-lg p-1 overflow-x-auto no-scrollbar">
                        {['hourly', 'daily', 'monthly'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setViewType(type)}
                                className={`px-2.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${viewType === type
                                        ? 'bg-gray-700 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center space-x-1 bg-gray-800/50 rounded-lg p-1 overflow-x-auto no-scrollbar">
                        {metrics.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMetric(m.id)}
                                className={`px-2.5 py-1.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${metric === m.id
                                        ? 'bg-gray-700 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-gray-900/40 rounded-xl border border-gray-800 p-4 md:p-6 h-full min-h-[300px] md:min-h-[400px]">
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={getData()}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} strokeOpacity={0.4} />
                                    <XAxis
                                        dataKey={getXAxisKey()}
                                        stroke="#6B7280"
                                        fontSize={9}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        stroke="#6B7280"
                                        fontSize={9}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={metric === 'winRate' ? (value) => `${value}%` : formatCurrency}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconSize={10} formatter={(value) => <span className="text-[10px] text-gray-500 font-bold uppercase">{value}</span>} />
                                    <Bar
                                        yAxisId="left"
                                        dataKey={metric === 'pnl' ? 'pnl' : metric === 'trades' ? 'trades' : metric === 'winRate' ? 'winRate' : 'volume'}
                                        fill={metrics.find(m => m.id === metric)?.color}
                                        radius={[4, 4, 0, 0]}
                                        name={metrics.find(m => m.id === metric)?.label}
                                        barSize={30}
                                    />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="winRate"
                                        stroke="#8B5CF6"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Win Rate"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Time Insights Card */}
                <div className="bg-gray-900/40 rounded-xl border border-gray-800 p-4 md:p-6">
                    <h4 className="text-sm md:text-base font-black uppercase tracking-tight mb-4 md:mb-6 flex items-center">
                        <Zap className="w-3.5 h-3.5 mr-2 text-amber-400" />
                        Time Insights
                    </h4>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Best {viewType === 'hourly' ? 'Hour' : 'Day'}</span>
                                <div className="text-sm md:text-lg font-black text-green-400 uppercase">{bestTime.time}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs md:text-sm font-black text-white">{formatCurrency(bestTime.pnl)}</div>
                                <div className="text-[9px] text-gray-500 font-bold">{bestTime.winRate}% Win</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Worst {viewType === 'hourly' ? 'Hour' : 'Day'}</span>
                                <div className="text-sm md:text-lg font-black text-red-400 uppercase">{worstTime.time}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs md:text-sm font-black text-white">{formatCurrency(worstTime.pnl)}</div>
                                <div className="text-[9px] text-gray-500 font-bold">{worstTime.winRate}% Win</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800/50">
                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">AI Recommendations</div>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-2.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                    <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed">Prioritize executions during <strong className="text-gray-300 uppercase">{bestTime.time}</strong> for peak efficiency.</p>
                                </div>
                                <div className="flex items-start space-x-2.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                    <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed">Consider reducing size or avoiding <strong className="text-gray-300 uppercase">{worstTime.time}</strong> sessions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Avg Daily Trades', value: avgDailyTrades, sub: 'Trades per active day', color: 'text-blue-400', icon: BarChart3, bg: 'bg-blue-500/10' },
                    { label: 'Peak Hour', value: peakHour.hour, sub: `${peakHour.winRate}% Win Rate`, color: 'text-green-400', icon: Clock, bg: 'bg-green-500/10' },
                    { label: 'Best Day', value: bestDay.day, sub: `Avg ₹${Math.round(bestDay.pnl).toLocaleString()}`, color: 'text-purple-400', icon: Calendar, bg: 'bg-purple-500/10' },
                    { label: 'Active Range', value: viewType.toUpperCase(), sub: 'Analysis Period', color: 'text-amber-400', icon: TrendingUp, bg: 'bg-amber-500/10' }
                ].map((stat, i) => (
                    <div key={i} className="bg-gray-900/40 rounded-xl p-3 md:p-4 border border-gray-800 flex flex-col justify-between group hover:bg-gray-800/40 transition-all">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">{stat.label}</span>
                            <div className={`p-1 rounded-md ${stat.bg}`}>
                                <stat.icon className={`w-3 h-3 md:w-4 md:h-4 ${stat.color}`} />
                            </div>
                        </div>
                        <div>
                            <div className={`text-sm md:text-lg font-black ${stat.color} uppercase truncate`}>{stat.value}</div>
                            <div className="text-[9px] md:text-xs text-gray-500 font-medium truncate">{stat.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Insights placeholder */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30 p-6 text-center">
                <p className="text-gray-300 text-sm">Advanced pattern analysis and optimal schedules are being generated by AI.</p>
                <p className="text-[10px] md:text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Populates automatically as more trade data is collected.</p>
            </div>
        </div>
    )
}

export default TimeAnalysis
