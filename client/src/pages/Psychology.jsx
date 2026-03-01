import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Brain,
    TrendingUp,
    TrendingDown,
    Target,
    AlertTriangle,
    Smile,
    Frown,
    Clock,
    BarChart3,
    Zap
} from 'lucide-react'
import PsychologyChart from '../components/psychology/PsychologyChart'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'

const Psychology = () => {
    const { api } = useAuth()
    const [timeRange, setTimeRange] = useState('1M')

    const { data: psychologyResponse, isLoading } = useQuery({
        queryKey: ['psychology', timeRange],
        queryFn: async () => {
            const response = await api.get(`/analytics/psychology?range=${timeRange}`)
            return response.data.data
        },
        placeholderData: keepPreviousData,
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-800/50 rounded animate-pulse" />
                        <div className="h-4 w-64 bg-gray-800/30 rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-gray-800/50 rounded-xl animate-pulse" />
                    <div className="h-96 bg-gray-800/50 rounded-xl animate-pulse" />
                </div>
            </div>
        )
    }

    const data = {
        emotions: psychologyResponse?.emotionDistribution ? Object.entries(psychologyResponse.emotionDistribution).map(([emotion, value]) => ({
            emotion,
            value,
            trend: psychologyResponse?.emotionTrends?.[emotion]?.trend || 'up',
            change: `${psychologyResponse?.emotionTrends?.[emotion]?.change || 0}%`
        })) : [],
        patterns: (psychologyResponse?.commonMistakes || []).map(m => ({
            title: m.mistake,
            description: `AI detected that you have repeated the "${m.mistake}" pattern ${m.count} times in the selected period.`,
            frequency: m.count > 5 ? 'High' : 'Medium',
            impact: m.count > 5 ? -15 : -5,
            recommendation: m.count > 5 ? 'Critical: Strict rule adherence required.' : 'Maintain awareness of this pattern during next session.'
        })),
        metrics: [
            {
                title: 'Best Emotional State',
                value: psychologyResponse?.positiveEmotions > psychologyResponse?.negativeEmotions ? 'Positive' : (psychologyResponse?.positiveEmotions === 0 && psychologyResponse?.negativeEmotions === 0 ? '---' : 'Cautious'),
                color: 'text-green-400',
                bg: 'bg-green-500/10'
            },
            {
                title: 'Worst Emotional State',
                value: psychologyResponse?.negativeEmotions > 30 ? 'Negative Bias' : (psychologyResponse?.negativeEmotions === 0 ? '---' : 'Low Impact'),
                color: 'text-red-400',
                bg: 'bg-red-500/10'
            },
            {
                title: 'Optimal Trading Time',
                value: psychologyResponse?.optimalTime || '---',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10'
            },
            {
                title: 'Execution Quality',
                value: psychologyResponse?.avgExecutionRating > 0 ? `${psychologyResponse.avgExecutionRating}/5.0` : '---',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10'
            }
        ]
    }

    const emotionsData = data.emotions
    const currentPatterns = data.patterns
    const metricsData = data.metrics.map(m => {
        if (m.title === 'Best Emotional State') return { ...m, icon: Smile }
        if (m.title === 'Worst Emotional State') return { ...m, icon: Frown }
        if (m.title === 'Optimal Trading Time') return { ...m, icon: Clock }
        if (m.title === 'Execution Quality') return { ...m, icon: Target }
        return { ...m, icon: Brain }
    })

    const hasData = psychologyResponse && (psychologyResponse.timeSeries?.length > 0 || psychologyResponse.positiveEmotions > 0 || psychologyResponse.negativeEmotions > 0);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-blue-400 fill-blue-400/20" />
                        Mindset Pulse
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">Analyze and optimize your trading psychology</p>
                </div>

                <div className="flex items-center w-full md:w-auto">
                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        <div className="flex items-center space-x-1 bg-gray-900/40 rounded-xl p-1 border border-white/5 w-max">
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
                    </div>
                </div>
            </div>

            {hasData ? (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {metricsData.map((metric, index) => (
                            <motion.div
                                key={metric.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl`}
                            >
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className={`p-1.5 md:p-2 rounded-lg ${metric.bg} border border-white/5`}>
                                        <metric.icon className={`w-4 h-4 md:w-5 md:h-5 ${metric.color}`} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Metric</span>
                                </div>
                                <div className="relative z-10">
                                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 truncate">{metric.title}</div>
                                    <div className={`text-lg md:text-xl font-black ${metric.color} uppercase truncate`}>
                                        {metric.value}
                                    </div>
                                </div>
                                <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <metric.icon className={`w-16 h-16 md:w-20 md:h-20 ${metric.color}`} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2"
                        >
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 md:p-6 h-full">
                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                    <div>
                                        <h3 className="text-base md:text-lg font-semibold">Emotional State Analysis</h3>
                                        <p className="text-gray-400 text-xs md:text-sm">How emotions affect your performance</p>
                                    </div>
                                    <button className="text-xs md:text-sm font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors">
                                        Details
                                    </button>
                                </div>
                                <div className="h-[250px] md:h-[350px]">
                                    <PsychologyChart data={psychologyResponse?.timeSeries || []} />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 md:p-6 h-full">
                                <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 uppercase tracking-wider">Emotional Spectrum</h3>

                                <div className="space-y-4 md:space-y-5">
                                    {emotionsData.length > 0 ? emotionsData.map((emotion, index) => (
                                        <div key={emotion.emotion} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs md:text-sm font-bold text-gray-300">{emotion.emotion}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs md:text-sm font-black text-white">{emotion.value}%</span>
                                                    <div className={`flex items-center text-[10px] md:text-xs font-bold ${emotion.trend === 'up' ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                        {emotion.trend === 'up' ? (
                                                            <TrendingUp className="w-3 h-3" />
                                                        ) : (
                                                            <TrendingDown className="w-3 h-3" />
                                                        )}
                                                        <span>{emotion.change}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-1.5 md:h-2 bg-gray-800/50 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${emotion.value >= 70 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                                                            emotion.value >= 50 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' :
                                                                emotion.value >= 30 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                                        }`}
                                                    style={{ width: `${emotion.value}%` }}
                                                />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10">
                                            <Brain className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm italic">No emotions logged in this period.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>


                    {/* Behavioral Patterns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
                            <div className="p-6 border-b border-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Behavioral Patterns</h3>
                                        <p className="text-gray-400 text-sm">AI-detected patterns affecting your performance</p>
                                    </div>
                                    <button className="text-sm text-blue-400 hover:text-blue-300">
                                        View All Patterns
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-800">
                                {currentPatterns.length > 0 ? currentPatterns.map((pattern, index) => (
                                    <div key={pattern.title} className="p-4 sm:p-6 hover:bg-gray-800/20 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                                        <h4 className="font-bold text-gray-100">{pattern.title}</h4>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${pattern.frequency === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            pattern.frequency === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                        }`}>
                                                        {pattern.frequency} Frequency
                                                    </span>
                                                </div>

                                                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                                    {pattern.description}
                                                </p>

                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-3 border-t border-gray-800/50">
                                                    <div className="text-sm">
                                                        <span className="text-gray-500 font-medium">Est. Impact: </span>
                                                        <span className="font-bold text-red-400">{pattern.impact}% P&L</span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-gray-500 font-medium">AI Coach: </span>
                                                        <span className="font-bold text-green-400">{pattern.recommendation}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center">
                                        <Brain className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                        <p className="text-gray-400">No behavioral patterns detected yet. Keep logging your trades and emotions.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* AI Recommendations */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                        <Brain className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">AI Psychology Coach</h3>
                                        <p className="text-sm text-gray-400">Personalized recommendations to improve your trading mindset</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                                    Generate Plan
                                </button>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {(psychologyResponse?.recommendations || []).map((rec, i) => (
                                    <div key={i} className="bg-gray-900/50 rounded-lg p-4">
                                        <h4 className={`font-medium mb-2 ${i === 0 ? 'text-green-400' : i === 1 ? 'text-amber-400' : 'text-blue-400'}`}>
                                            {rec.title}
                                        </h4>
                                        <p className="text-sm text-gray-300 mb-3">
                                            {rec.text}
                                        </p>
                                        <div className="text-xs text-gray-400">
                                            Status: {rec.status}
                                        </div>
                                    </div>
                                ))}
                                {(!psychologyResponse?.recommendations || psychologyResponse.recommendations.length === 0) && (
                                    <div className="col-span-3 text-center py-8 text-gray-500">
                                        Log more trades to see AI-generated psychology recommendations.
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-20 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mb-6">
                        <Brain className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">No Psychology Data Yet</h2>
                    <p className="text-gray-400 max-w-md mb-8">
                        To unlock psychological analysis, you need to track your emotional state and execution quality when logging trades.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => window.location.href = '/app/journal'}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Go to Trade Terminal
                        </button>
                        <div className="px-8 py-3 bg-gray-800 rounded-xl font-bold text-gray-300">
                            Log 5+ trades with emotions
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Psychology