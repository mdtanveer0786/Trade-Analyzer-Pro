import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    BarChart3,
    BookOpen,
    Brain,
    Settings,
    TrendingUp,
    TrendingDown,
    LogOut,
    X,
    LayoutDashboard,
    Target,
    DollarSign,
    Shield
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'

const Sidebar = ({ onClose, stats }) => {
    const { user, logout, api } = useAuth()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(Math.abs(value))
    }

    const navItems = [
        { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', queryKey: ['dashboard', '1M'], apiEndpoint: '/analytics/dashboard?range=1M' },
        { path: '/app/journal', icon: BookOpen, label: 'Trade Journal', queryKey: ['trades'], apiEndpoint: '/trades' },
        { path: '/app/analytics', icon: BarChart3, label: 'Analytics', queryKey: ['analytics', {}], apiEndpoint: '/analytics/performance' },
        { path: '/app/strategies', icon: Target, label: 'Strategies', queryKey: ['strategies', {}], apiEndpoint: '/analytics/strategy' },
        { path: '/app/psychology', icon: Brain, label: 'Psychology', queryKey: ['psychology', {}], apiEndpoint: '/analytics/psychology' },
        { path: '/app/settings', icon: Settings, label: 'Settings' },
    ]

    if (user?.role === 'admin') {
        navItems.push({ path: '/app/admin', icon: Shield, label: 'Admin Panel' })
    }

    const prefetchData = (item) => {
        if (!item.queryKey || !item.apiEndpoint) return

        queryClient.prefetchQuery({
            queryKey: item.queryKey,
            queryFn: async () => {
                const response = await api.get(item.apiEndpoint)
                return response.data.data || response.data
            },
            staleTime: 5 * 60 * 1000,
        })
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleNavClick = () => {
        if (window.innerWidth < 1024 && onClose) {
            onClose()
        }
    }

    return (
        <div className="flex flex-col w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-white/5 h-full transition-colors duration-300 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Logo */}
            <div className="p-8 border-b border-gray-200 dark:border-white/5 relative z-10">
                <div className="flex items-center space-x-3">
                    <NavLink to="/app/dashboard" onClick={handleNavClick} className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">
                                TRADE<span className="text-blue-500">PRO</span>
                            </h1>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mt-1">Institutional Grade</p>
                        </div>
                    </NavLink>
                    {onClose && (
                        <button
                            onClick={handleNavClick}
                            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* User Profile */}
            <div className="p-6 border-b border-gray-200 dark:border-white/5 relative z-10">
                <NavLink 
                    to="/app/settings" 
                    onClick={handleNavClick}
                    className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                >
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[1px]">
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-950 flex items-center justify-center text-sm font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase tracking-tight truncate text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">{user?.name || 'Trader'}</p>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'monthly' || user?.subscription?.plan === 'yearly'
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                }`}>
                                {user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'monthly' || user?.subscription?.plan === 'yearly' ? 'Elite' : 'Standard'}
                            </span>
                        </div>
                    </div>
                </NavLink>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto relative z-10 no-scrollbar">
                <p className="px-4 text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-3 mt-2">Terminal Access</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-blue-600/10 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-600/5'
                                : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                            }`
                        }
                    >
                        <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                    </NavLink>
                ))}
            </nav>


            {/* Performance Snapshot */}
            <div className="p-4 border-t border-gray-200 dark:border-white/5 relative z-10">
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Weekly Alpha</span>
                        <div className={`p-1 rounded-md ${stats?.winRate >= 50 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {stats?.winRate >= 50 ? (
                                <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                                <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <span className={`text-lg font-black tracking-tight ${stats?.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats?.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats?.totalPnL || 0)}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[9px] font-black text-gray-500 dark:text-gray-600 uppercase tracking-widest">Efficiency</span>
                            <span className={`text-[10px] font-black ${stats?.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                                {stats?.winRate || 0}%
                            </span>
                        </div>
                        <div className="h-1 w-full bg-gray-200 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stats?.winRate || 0}%` }}
                                className={`h-full ${stats?.winRate >= 50 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}
                            ></motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200 dark:border-white/5 relative z-10">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 group"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                </button>
            </div>
        </div>
    )
}

export default Sidebar
