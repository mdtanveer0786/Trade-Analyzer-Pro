import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'

const EquityCurveChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : []

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMM dd')
    } catch {
      return date
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
          <p className="text-sm text-gray-400 mb-2">{formatDate(label)}</p>
          <p className="text-lg font-bold text-white">
            {formatCurrency(point.balance)}
          </p>
          {point.dailyChange && (
            <p className={`text-sm ${point.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
              {point.dailyChange >= 0 ? '+' : ''}{formatCurrency(point.dailyChange)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const formatYAxis = (value) => {
    if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
    return `₹${value}`
  }

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
        No equity data available
      </div>
    )
  }

  return (
    <div className="h-[300px] md:h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
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
            strokeOpacity={0.4}
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tickFormatter={formatDate}
            stroke="#6B7280"
            fontSize={10}
            minTickGap={30}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            stroke="#6B7280"
            fontSize={10}
            tickFormatter={formatYAxis}
            width={60}
          />

          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#4B5563', strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorBalance)"
            dot={false}
            activeDot={{ r: 4, fill: '#3B82F6', stroke: '#1E40AF', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )

}

export default EquityCurveChart