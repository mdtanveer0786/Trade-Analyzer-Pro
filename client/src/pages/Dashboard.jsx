import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Users,
  Brain,
  Zap,
  List
} from 'lucide-react'
import KPICard from '../components/dashboard/KPICard'
import RecentTradesTable from '../components/trades/RecentTradesTable'
import StrategyPerformance from '../components/analytics/StrategyPerformance'
import PsychologyMetrics from '../components/psychology/PsychologyMetrics'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import useUIStore from '../store/uiStore'
import { useAuth } from '../contexts/AuthContext'

// Lazy load charts
const EquityCurveChart = lazy(() => import('../components/charts/EquityCurveChart'))
const PerformanceChart = lazy(() => import('../components/charts/PerformanceChart'))
const WinRateChart = lazy(() => import('../components/charts/WinRateChart'))
const PsychologyChart = lazy(() => import('../components/psychology/PsychologyChart'))

const ChartLoader = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-900/20 animate-pulse rounded-xl">
    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const { api } = useAuth()
  const { openTradeForm } = useUIStore()
  const [timeRange, setTimeRange] = useState('1M')
  const [activeView, setActiveView] = useState('equity')

  const { data: dashboardData, isLoading, isFetching, error } = useQuery({
    queryKey: ['dashboard', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics/dashboard?range=${timeRange}`)
      return response.data.data
    },
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const { data: tradesResponse } = useQuery({
    queryKey: ['recent-trades'],
    queryFn: async () => {
      const response = await api.get('/trades?limit=10')
      return response.data
    },
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const trades = tradesResponse?.data || []

  const data = dashboardData || {
    summary: {
      totalPnL: 0,
      winRate: 0,
      profitFactor: 0,
      expectancy: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      pnlChange: 0,
      winRateChange: 0,
      profitFactorChange: 0,
      expectancyChange: 0
    },
    todaySummary: {
      totalTrades: 0,
      totalPnL: 0,
      winRate: 0
    },
    winLossDistribution: [],
    equityCurve: [],
    recentTrades: [],
    strategies: [],
    psychology: {
      emotionDistribution: {},
      avgExecutionRating: 0,
      commonMistakes: []
    }
  }

  const kpis = [
    {
      title: 'Total P&L',
      value: isLoading ? '...' : `${(data.summary?.totalPnL || 0) >= 0 ? '+' : '-'}₹${Math.abs(data.summary?.totalPnL || 0).toLocaleString()}`,
      change: `${(data.summary?.pnlChange || 0) >= 0 ? '+' : ''}${(data.summary?.pnlChange || 0).toFixed(2)}%`,
      trend: (data.summary?.pnlChange || 0) >= 0 ? 'up' : 'down',
      icon: <TrendingUp className="w-5 h-5" />,
      color: (data.summary?.totalPnL || 0) >= 0 ? 'green' : 'red'
    },
    {
      title: 'Win Rate',
      value: isLoading ? '...' : `${(data.summary?.winRate || 0)}%`,
      change: `${(data.summary?.winRateChange || 0) >= 0 ? '+' : ''}${(data.summary?.winRateChange || 0).toFixed(2)}%`,
      trend: (data.summary?.winRateChange || 0) >= 0 ? 'up' : 'down',
      icon: <Target className="w-5 h-5" />,
      color: 'blue'
    },
    {
      title: 'Profit Factor',
      value: isLoading ? '...' : (data.summary?.profitFactor || 0).toFixed(2),
      change: `${(data.summary?.profitFactorChange || 0) >= 0 ? '+' : ''}${(data.summary?.profitFactorChange || 0).toFixed(2)}`,
      trend: (data.summary?.profitFactorChange || 0) >= 0 ? 'up' : 'down',
      icon: <BarChart3 className="w-5 h-5" />,
      color: (data.summary?.profitFactor || 0) >= 1.5 ? 'green' : (data.summary?.profitFactor || 0) >= 1 ? 'amber' : 'red'
    },
    {
      title: 'Avg R Multiple',
      value: isLoading ? '...' : `${(data.summary?.expectancy || 0).toFixed(1)}R`,
      change: `${(data.summary?.expectancyChange || 0) >= 0 ? '+' : ''}${(data.summary?.expectancyChange || 0).toFixed(2)}R`,
      trend: (data.summary?.expectancyChange || 0) >= 0 ? 'up' : 'down',
      icon: <Activity className="w-5 h-5" />,
      color: (data.summary?.expectancy || 0) >= 0 ? 'purple' : 'red'
    }
  ]

  const statsCards = [
    {
      title: 'Total Volume',
      value: isLoading ? '...' : data.summary?.totalTrades || 0,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Winning Trades',
      value: isLoading ? '...' : data.summary?.winningTrades || 0,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Losing Trades',
      value: isLoading ? '...' : data.summary?.losingTrades || 0,
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10'
    },
    {
      title: 'Risk Profile',
      value: isLoading ? '...' : (data.summary?.losingTrades ? (data.summary.winningTrades / data.summary.losingTrades).toFixed(2) : (data.summary?.winningTrades ? 'INF' : '0.00')),
      icon: <Target className="w-5 h-5" />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    }
  ]

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <TrendingDown className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">Failed to load dashboard</h3>
        <p className="text-gray-400 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-400 fill-blue-400/20" />
            Performance Hub
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-medium">Real-time overview of your trading capital</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1 bg-gray-900/40 rounded-xl p-1 border border-white/5 overflow-x-auto no-scrollbar">
            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-gray-900/40 rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setActiveView('equity')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === 'equity'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Equity
            </button>
            <button
              onClick={() => setActiveView('performance')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === 'performance'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Metrics
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-white/5 group hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className={`p-1.5 md:p-2 rounded-lg ${stat.bg} border border-white/5`}>
                <div className={`${stat.color} w-4 h-4 md:w-5 md:h-5`}>{stat.icon}</div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Period</span>
            </div>
            <div className="text-xl md:text-2xl font-black mb-0.5 md:mb-1">{stat.value}</div>
            <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 truncate">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Equity/Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-2"
        >
          <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 md:p-6 h-full shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <div>
                <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-gray-100">
                  {activeView === 'equity' ? 'Equity Growth' : 'Execution Score'}
                </h3>
                <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                  {activeView === 'equity' 
                    ? 'Cumulative capital performance' 
                    : 'Systematic execution metrics'}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Realized</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Projection</span>
                </div>
              </div>
            </div>

            <div className="h-[250px] md:h-[350px] w-full">
              <Suspense fallback={<ChartLoader />}>
                {activeView === 'equity' ? (
                  <PerformanceChart data={data.equityCurve} />
                ) : (
                  <PsychologyChart data={data.psychology?.timeSeries || []} />
                )}
              </Suspense>
            </div>
          </div>
        </motion.div>

        {/* Win Rate & Strategy */}
        <div className="space-y-4 md:space-y-6">
          {/* Win Rate Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 md:p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-gray-100">Win Ratio</h3>
              <span className={`text-xs md:text-sm font-black ${(data.summary?.winRateChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {isLoading ? '...' : `${(data.summary?.winRateChange || 0) >= 0 ? '+' : ''}${(data.summary?.winRateChange || 0).toFixed(1)}%`}
              </span>
            </div>
            <div className="h-[200px] md:h-[250px] w-full">
              <Suspense fallback={<ChartLoader />}>
                <WinRateChart data={data.winLossDistribution} />
              </Suspense>
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-green-400 tracking-tighter">
                {data.summary.winRate}%
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Overall Success</div>
            </div>
          </motion.div>

          {/* Strategy Performance */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 md:p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-gray-100">Elite Alpha</h3>
              <button 
                onClick={() => navigate('/app/strategies')}
                className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
              >
                Explore
              </button>
            </div>
            <StrategyPerformance strategies={data.strategies} />
          </motion.div>
        </div>
      </div>

      {/* Psychology & Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Psychology Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 md:p-6 h-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-gray-100">Mindset Pulse</h3>
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <PsychologyMetrics data={data.psychology} />
          </div>
        </motion.div>

        {/* Recent Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden h-full shadow-2xl">
            <div className="p-4 md:p-6 border-b border-gray-800 bg-gray-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-gray-100">Terminal activity</h3>
                  <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Real-time setup verification</p>
                </div>
                <button 
                  onClick={() => navigate('/app/journal')}
                  className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Full Journal
                </button>
              </div>
            </div>
            <RecentTradesTable trades={data.recentTrades} />
          </div>
        </motion.div>
      </div>

      {/* AI Insights & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-4 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-50"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10">
                  <Brain className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-base md:text-xl font-black uppercase tracking-tight text-white">AI Setup Audit</h3>
                  <p className="text-[10px] md:text-xs text-blue-300 font-black uppercase tracking-widest">Powered by Advanced pattern detection</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/app/analytics')}
                className="px-6 py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5 active:scale-95"
              >
                Generate Audit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 relative z-10">
              {(data.aiInsights?.length > 0) ? (
                data.aiInsights.slice(0, 4).map((insight, idx) => (
                  <div key={insight.id || idx} className="bg-gray-950/40 rounded-2xl p-4 md:p-5 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${idx % 2 === 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`} />
                      <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-300">{insight.symbol} Setup</h4>
                    </div>
                    <p className="text-[11px] md:text-xs text-gray-400 line-clamp-2 md:line-clamp-3 leading-relaxed">
                      {insight.summary}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-gray-950/40 rounded-2xl p-4 md:p-5 border border-white/5 backdrop-blur-sm opacity-60">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-green-400">Core Strength</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">
                      Generate your first AI setup audit to unlock personalized Alpha strengths.
                    </p>
                  </div>

                  <div className="bg-gray-950/40 rounded-2xl p-4 md:p-5 border border-white/5 backdrop-blur-sm opacity-60">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-amber-400">System optimization</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 italic">
                      AI audits your emotional variance once you track at least 5 setups.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 md:p-6 h-full shadow-2xl">
            <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-gray-100 mb-6">Terminal access</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Journal', icon: List, color: 'blue', action: () => navigate('/app/journal') },
                { label: 'Analytics', icon: BarChart3, color: 'purple', action: () => navigate('/app/analytics') },
                { label: 'Psychology', icon: Brain, color: 'green', action: () => navigate('/app/psychology') },
                { label: 'Elite', icon: Target, color: 'amber', action: () => navigate('/app/strategies') }
              ].map((item) => (
                <button 
                  key={item.label}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center p-3 md:p-4 bg-gray-800/20 rounded-2xl hover:bg-gray-800/40 transition-all border border-transparent hover:border-white/10 group"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-${item.color}-500/20`}>
                    <item.icon className={`w-6 h-6 md:w-7 md:h-7 text-${item.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.3)]`} />
                  </div>
                  <span className="font-black text-[10px] md:text-xs uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                Live Session Pulse
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-950/40 rounded-xl p-3 text-center border border-white/5">
                  <div className="text-[8px] text-gray-600 uppercase font-black tracking-widest mb-1">Trades</div>
                  <div className="text-base md:text-xl font-black text-white">{isLoading ? '...' : data.todaySummary?.totalTrades || 0}</div>
                </div>
                <div className="bg-gray-950/40 rounded-xl p-3 text-center border border-white/5">
                  <div className="text-[8px] text-gray-600 uppercase font-black tracking-widest mb-1">P&L</div>
                  <div className={`text-base md:text-xl font-black ${(data.todaySummary?.totalPnL || 0) >= 0 ? 'text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'text-red-400'}`}>
                    {isLoading ? '...' : `${(data.todaySummary?.totalPnL || 0) >= 0 ? '+' : ''}₹${(data.todaySummary?.totalPnL || 0).toLocaleString()}`}
                  </div>
                </div>
                <div className="bg-gray-950/40 rounded-xl p-3 text-center border border-white/5">
                  <div className="text-[8px] text-gray-600 uppercase font-black tracking-widest mb-1">Win Rate</div>
                  <div className="text-base md:text-xl font-black text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">{isLoading ? '...' : `${(data.todaySummary?.winRate || 0)}%`}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard