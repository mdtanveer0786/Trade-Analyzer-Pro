import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'

const PsychologyChart = ({ data = [] }) => {
    const formatDate = (date) => {
        if (!date) return '---'
        return format(new Date(date), 'MMM dd')
    }

    if (data.length === 0) {
        return (
            <div className="h-80 flex flex-col items-center justify-center bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
                <p className="text-gray-500">Not enough data to generate chart</p>
                <p className="text-xs text-gray-600 mt-2">Log more trades with emotions to see insights</p>
            </div>
        )
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
                    <p className="text-sm text-gray-400 mb-2">{formatDate(label)}</p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Overall Score</span>
                            <span className="font-bold">{payload[0].payload.overall}/100</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-400">Confidence</span>
                            <span className="font-medium">{payload[0].payload.confidence}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-green-400">Discipline</span>
                            <span className="font-medium">{payload[0].payload.discipline}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-400">Emotion Control</span>
                            <span className="font-medium">{payload[0].payload.emotionControl}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-amber-400">Focus</span>
                            <span className="font-medium">{payload[0].payload.focus}</span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#374151"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatDate}
                        stroke="#6B7280"
                        fontSize={12}
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        stroke="#6B7280"
                        fontSize={12}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}`}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Area
                        type="monotone"
                        dataKey="overall"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fill="url(#colorOverall)"
                        dot={{ stroke: '#8B5CF6', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, fill: '#8B5CF6' }}
                    />

                    <Area
                        type="monotone"
                        dataKey="confidence"
                        stroke="#3B82F6"
                        strokeWidth={1}
                        fill="url(#colorConfidence)"
                        strokeDasharray="3 3"
                        opacity={0.5}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm text-gray-400">Overall Psychology Score</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-400">Confidence Level</span>
                </div>
            </div>
        </div>
    )
}

export default PsychologyChart