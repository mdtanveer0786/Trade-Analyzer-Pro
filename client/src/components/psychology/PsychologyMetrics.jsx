import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Brain, Target, TrendingUp, AlertTriangle, Zap } from 'lucide-react'

const PsychologyMetrics = ({ data }) => {
    // Determine source of data (Dashboard vs Psychology page)
    const hasEmotions = data?.emotionDistribution && Object.keys(data.emotionDistribution).length > 0;
    
    const emotions = hasEmotions
        ? Object.entries(data.emotionDistribution).map(([emotion, value], index) => ({
            emotion,
            value,
            color: ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'][index % 5]
        }))
        : data?.positiveEmotions > 0 || data?.negativeEmotions > 0
        ? [
            { emotion: 'Positive', value: data.positiveEmotions, color: '#10B981' },
            { emotion: 'Negative', value: data.negativeEmotions, color: '#EF4444' },
        ]
        : []

    if (emotions.length === 0) {
        return (
            <div className="bg-gray-900/30 rounded-xl border border-dashed border-gray-800 p-8 text-center h-full flex flex-col justify-center">
                <Brain className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-400">No psychology data</h3>
                <p className="text-xs text-gray-500 max-w-[200px] mx-auto">
                    Track your emotions in the trade journal to unlock psychological insights.
                </p>
            </div>
        )
    }

    const insights = [
        {
            icon: Brain,
            title: 'Best Emotional State',
            value: data?.positiveEmotions > data?.negativeEmotions ? 'Positive' : 'Fearful Exits',
            color: data?.positiveEmotions > data?.negativeEmotions ? 'text-green-400' : 'text-red-400',
            bg: data?.positiveEmotions > data?.negativeEmotions ? 'bg-green-500/10' : 'bg-red-500/10'
        },
        {
            icon: AlertTriangle,
            title: 'Worst Performance',
            value: data?.negativeEmotions > 30 ? 'Negative Bias' : 'Emotional Bias',
            color: 'text-amber-400',
            bg: 'bg-amber-500/10'
        },
        {
            icon: Target,
            title: 'Avg Execution',
            value: data?.avgExecutionRating ? `${data.avgExecutionRating}/5.0` : data?.avgIntensity ? `${data.avgIntensity}/5.0` : '---',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
        },
        {
            icon: TrendingUp,
            title: 'Intensity Level',
            value: data?.avgIntensity ? `${data.avgIntensity}/5.0` : '---',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10'
        }
    ]

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                    <p className="font-medium">{data.emotion}</p>
                    <p className="text-sm text-gray-300">
                        Frequency: <span className="text-white">{data.value}%</span>
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Emotion Distribution Chart */}
            <div className="h-40 md:h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emotions} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            vertical={false}
                            strokeOpacity={0.4}
                        />
                        <XAxis
                            dataKey="emotion"
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
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        >
                            {emotions.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                {insights.map((insight, index) => (
                    <div key={index} className={`${insight.bg} rounded-xl p-3 md:p-4 border border-white/5`}>
                        <div className="flex items-center space-x-2 md:space-x-3 mb-1.5 md:mb-2">
                            <div className={`p-1.5 rounded-lg ${insight.bg} border border-white/5`}>
                                <insight.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${insight.color}`} />
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider truncate">{insight.title}</div>
                        </div>
                        <div className={`text-sm md:text-lg font-black ${insight.color} truncate uppercase`}>
                            {insight.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recommendations Section Removed to avoid dummy data */}
            <div className="bg-gray-800/20 rounded-xl p-3 md:p-4 border border-gray-700/30">
                <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 md:mb-3 flex items-center">
                    <Zap className="w-3 h-3 mr-1.5 text-blue-400" />
                    Psychology Tip
                </h4>
                <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] md:text-sm text-gray-400 leading-relaxed italic">
                        {data?.negativeEmotions > data?.positiveEmotions 
                            ? "Try reducing position size during periods of higher emotional stress."
                            : "Maintain your discipline to keep your positive emotional momentum."}
                    </span>
                </div>
            </div>
        </div>
    )

}

export default PsychologyMetrics