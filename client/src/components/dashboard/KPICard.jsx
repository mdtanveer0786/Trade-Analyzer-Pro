import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const KPICard = ({ title, value, change, trend, icon, color }) => {
    const colorClasses = {
        green: 'text-green-400 bg-green-500/5 border-green-500/20 hover:border-green-500/40',
        red: 'text-red-400 bg-red-500/5 border-red-500/20 hover:border-red-500/40',
        blue: 'text-blue-400 bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
        purple: 'text-purple-400 bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40',
        amber: 'text-amber-400 bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
    }

    const iconBgClasses = {
        green: 'bg-green-500/20 text-green-400',
        red: 'bg-red-500/20 text-red-400',
        blue: 'bg-blue-500/20 text-blue-400',
        purple: 'bg-purple-500/20 text-purple-400',
        amber: 'bg-amber-500/20 text-amber-400',
    }

    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`${colorClasses[color]} border rounded-xl p-4 md:p-6 transition-all duration-300 backdrop-blur-sm`}
        >
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={`p-2 md:p-2.5 rounded-lg ${iconBgClasses[color]}`}>
                    {icon}
                </div>
                <div className={`flex items-center px-2 py-1 rounded-full text-[10px] md:text-xs font-bold ${
                    trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {change}
                </div>
            </div>

            <div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-0.5 md:mb-1">{value}</h3>
                <p className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
            </div>
        </motion.div>
    )
}

export default KPICard