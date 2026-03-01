import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const WinRateChart = ({ data = [] }) => {
    const hasData = data.length > 0 && data.some(item => item.value > 0)
    
    const chartData = hasData ? data : [
        { name: 'No Data', value: 1, color: '#374151' }
    ]

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-gray-300">
                        {data.value} {data.value === 1 ? 'trade' : 'trades'}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="h-[250px] md:h-[300px] w-full relative">
            {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-[1px] z-10 rounded-xl">
                    <p className="text-gray-400 text-xs font-medium">No trade data available</p>
                </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={hasData ? ({ name, percent }) => `${(percent * 100).toFixed(0)}%` : false}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="value"
                        opacity={hasData ? 1 : 0.3}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    {hasData && <Tooltip content={<CustomTooltip />} />}
                    <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconSize={10}
                        formatter={(value) => <span className="text-[10px] sm:text-xs text-gray-400 font-medium">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )

}

export default WinRateChart