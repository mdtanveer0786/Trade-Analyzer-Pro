import { useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    Brush,
    ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendingUp, TrendingDown, Filter, Download, Activity, ArrowDownRight, Target } from 'lucide-react'

const PerformanceChart = ({ data = [] }) => {
    const [timeRange, setTimeRange] = useState('all')
    const [chartType, setChartType] = useState('area')

    const hasData = data && data.length > 0;
    const chartData = hasData ? data : [];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const formatDate = (date) => {
        try {
            return format(parseISO(date), 'MMM dd')
        } catch {
            return format(new Date(date), 'MMM dd')
        }
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
                    <p className="text-sm text-gray-400 mb-2">
                        {format(new Date(point.date), 'MMM dd, yyyy')}
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Balance</span>
                            <span className="font-bold text-white">
                                {formatCurrency(point.balance)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-green-400">Daily Change</span>
                            <span className={`font-medium ${point.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {point.dailyChange >= 0 ? '+' : ''}{formatCurrency(point.dailyChange)}
                            </span>
                        </div>
                        {point.trades && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-blue-400">Trades</span>
                                <span className="font-medium">{point.trades}</span>
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        return null
    }

    const formatYAxis = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
        return value
    }

    const CustomYAxisTick = ({ x, y, payload }) => {
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill="#6B7280"
                    className="text-[9px] sm:text-[10px]"
                >
                    {formatYAxis(payload.value)}
                </text>
            </g>
        )
    }

    const CustomXAxisTick = ({ x, y, payload }) => {
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={12}
                    textAnchor="middle"
                    fill="#6B7280"
                    className="text-[9px] sm:text-[10px]"
                >
                    {formatDate(payload.value)}
                </text>
            </g>
        )
    }

    // Calculate statistics
    const calculateStats = () => {
        if (chartData.length === 0) return {
            totalChange: 0,
            avgDailyChange: 0,
            maxDrawdown: 0,
            winRate: 0,
            startingBalance: 0,
            endingBalance: 0
        }

        const balances = chartData.map(d => d.balance)
        const changes = chartData
            .filter((_, i) => i > 0)
            .map((d, i) => d.balance - chartData[i].balance)

        const totalChange = balances[balances.length - 1] - balances[0]
        const avgDailyChange = changes.length > 0
            ? changes.reduce((a, b) => a + b, 0) / changes.length
            : 0

        let peak = balances[0]
        let maxDrawdown = 0
        balances.forEach(balance => {
            if (balance > peak) peak = balance
            const drawdown = ((peak - balance) / peak) * 100
            if (drawdown > maxDrawdown) maxDrawdown = drawdown
        })

        const winningDays = changes.filter(c => c > 0).length
        const winRate = changes.length > 0 ? (winningDays / changes.length) * 100 : 0

        return {
            totalChange,
            avgDailyChange,
            maxDrawdown,
            winRate,
            startingBalance: balances[0],
            endingBalance: balances[balances.length - 1]
        }
    }

    const stats = calculateStats()

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Chart Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    {/* Time Range Selector */}
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        {['1W', '1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range.toLowerCase())}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${timeRange === range.toLowerCase()
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {/* Chart Type Selector */}
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 border-l border-gray-800 pl-3 sm:pl-4">
                        <button
                            onClick={() => setChartType('area')}
                            className={`p-1.5 rounded ${chartType === 'area'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            title="Area Chart"
                        >
                            <TrendingUp className="w-3.5 h-3.5 sm:w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setChartType('line')}
                            className={`p-1.5 rounded ${chartType === 'line'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            title="Line Chart"
                        >
                            <TrendingDown className="w-3.5 h-3.5 sm:w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 sm:self-end">
                    <button className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors border border-gray-800 sm:border-transparent">
                        <Filter className="w-3.5 h-3.5 sm:w-4 h-4" />
                    </button>
                    <button className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors border border-gray-800 sm:border-transparent">
                        <Download className="w-3.5 h-3.5 sm:w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div className="h-[250px] sm:h-[350px] md:h-[400px] relative w-full overflow-hidden">
                {!hasData && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-[1px] z-10 rounded-xl">
                        <p className="text-gray-400 text-xs sm:text-sm font-medium">No performance data available</p>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            vertical={false}
                            strokeOpacity={0.3}
                        />

                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={<CustomXAxisTick />}
                            stroke="#6B7280"
                            minTickGap={30}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={<CustomYAxisTick />}
                            stroke="#6B7280"
                            width={40}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fill="url(#colorBalance)"
                            activeDot={{ r: 4, fill: '#3B82F6', stroke: '#1E40AF', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Statistics Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-gray-800/30 rounded-xl p-3 md:p-4 border border-white/5 group hover:bg-gray-800/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Total Change</span>
                        <div className={`p-1 rounded-md ${stats.totalChange >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {stats.totalChange >= 0 ? (
                                <TrendingUp className="w-3 h-3 text-green-400" />
                            ) : (
                                <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                        </div>
                    </div>
                    <div className={`text-sm md:text-lg font-black ${stats.totalChange >= 0 ? 'text-green-400' : 'text-red-400'} truncate`}>
                        {formatCurrency(stats.totalChange)}
                    </div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 font-bold mt-1">
                        {stats.totalChange !== 0 && stats.startingBalance > 0 && (
                            <span>
                                {((stats.totalChange / stats.startingBalance) * 100).toFixed(2)}% ROI
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-3 md:p-4 border border-white/5 group hover:bg-gray-800/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Avg Daily</span>
                        <div className="p-1 rounded-md bg-blue-500/10">
                            <Activity className="w-3 h-3 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-sm md:text-lg font-black text-gray-200 truncate">
                        {formatCurrency(stats.avgDailyChange)}
                    </div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 font-bold mt-1 uppercase">Per Trading Day</div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-3 md:p-4 border border-white/5 group hover:bg-gray-800/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Max Drawdown</span>
                        <div className="p-1 rounded-md bg-red-500/10">
                            <ArrowDownRight className="w-3 h-3 text-red-400" />
                        </div>
                    </div>
                    <div className="text-sm md:text-lg font-black text-red-400 truncate">
                        {stats.maxDrawdown.toFixed(2)}%
                    </div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 font-bold mt-1 uppercase">Peak to Trough</div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-3 md:p-4 border border-white/5 group hover:bg-gray-800/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Win Rate</span>
                        <div className="p-1 rounded-md bg-green-500/10">
                            <Target className="w-3 h-3 text-green-400" />
                        </div>
                    </div>
                    <div className="text-sm md:text-lg font-black text-green-400 truncate">
                        {stats.winRate.toFixed(1)}%
                    </div>
                    <div className="text-[8px] md:text-[10px] text-gray-500 font-bold mt-1 uppercase">Day Accuracy</div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-xs">
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-gray-400">Account Balance</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-gray-400">Daily Change</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-gray-400">Drawdown Periods</span>
                </div>
            </div>
        </div>
    )
}

export default PerformanceChart