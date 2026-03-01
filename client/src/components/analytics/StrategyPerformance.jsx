import { Cell, PieChart, Pie, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const StrategyPerformance = ({ strategies }) => {
  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-300">
            Trades: <span className="text-white">{data.trades}</span>
          </p>
          <p className="text-sm text-gray-300">
            Win Rate: <span className="text-green-400">{(data.winRate || 0).toFixed(2)}%</span>
          </p>
          <p className="text-sm text-gray-300">
            P&L: <span className={data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
              ₹{data.pnl.toLocaleString()}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  if (!strategies || strategies.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No strategy data available
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="h-48 md:h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={strategies}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={4}
              dataKey="pnl"
              nameKey="name"
              stroke="none"
            >
              {strategies.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Label for Pie Chart */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-1">
            <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Top</span>
            <span className="text-xs md:text-sm font-black text-gray-200 uppercase">Wins</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 md:gap-3 mt-4">
        {strategies.slice(0, 4).map((strategy, index) => (
          <div key={strategy._id || index} className="bg-gray-800/30 rounded-xl p-2 md:p-3 border border-gray-700/30 hover:bg-gray-800/50 transition-all group">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <div className="flex items-center space-x-1.5 min-w-0">
                <div 
                  className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-[10px] md:text-xs font-bold truncate text-gray-300 group-hover:text-white transition-colors">
                  {strategy.name || 'Unnamed'}
                </span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Win Rate</span>
                <span className="text-xs md:text-sm font-black text-green-400">{strategy.winRate?.toFixed(0) || 0}%</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase tracking-tighter">P&L</span>
                <div className={`text-xs md:text-sm font-black ${strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{Math.abs(strategy.pnl).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

}

export default StrategyPerformance