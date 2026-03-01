import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    CreditCard,
    Activity,
    Shield,
    Bell,
    Settings,
    Search,
    Filter,
    Download,
    ChevronRight,
    Zap,
    TrendingUp,
    DollarSign,
    UserPlus,
    Lock,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    BarChart3
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const Admin = () => {
    const { api } = useAuth()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('overview')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [showUserModal, setShowUserModal] = useState(false)
    const [showUserProfileModal, setShowUserProfileModal] = useState(false)
    const [showBroadcastModal, setShowBroadcastModal] = useState(false)

    // Fetch Admin Stats
    const { data: adminStats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/stats')
            return response.data.data
        }
    })

    // Fetch Users
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-users', searchTerm, activeTab],
        queryFn: async () => {
            const response = await api.get('/admin/users', {
                params: { search: searchTerm }
            })
            return response.data.data
        },
        enabled: activeTab === 'users' || activeTab === 'overview'
    })

    // Fetch Revenue
    const { data: revenueData } = useQuery({
        queryKey: ['admin-revenue'],
        queryFn: async () => {
            const response = await api.get('/admin/revenue')
            return response.data.data
        },
        enabled: activeTab === 'revenue'
    })

    // Fetch Subscriptions
    const { data: subscriptionsData } = useQuery({
        queryKey: ['admin-subscriptions'],
        queryFn: async () => {
            const response = await api.get('/admin/subscriptions')
            return response.data.data
        },
        enabled: activeTab === 'subscriptions'
    })

    // Fetch Feature Flags
    const { data: flagsData } = useQuery({
        queryKey: ['admin-flags'],
        queryFn: async () => {
            const response = await api.get('/admin/feature-flags')
            return response.data.data
        },
        enabled: activeTab === 'flags'
    })

    // Mutations
    const updateFlagMutation = useMutation({
        mutationFn: async ({ key, enabled }) => {
            await api.put(`/admin/feature-flags/${key}`, { enabled })
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-flags'])
            toast.success('Protocol updated')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Protocol update failed')
        }
    })

    const deleteUserMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/users/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users'])
            toast.success('Operator de-provisioned')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to de-provision operator')
        }
    })

    const sendBroadcastMutation = useMutation({
        mutationFn: async (data) => {
            await api.post('/admin/notifications', data)
        },
        onSuccess: () => {
            setShowBroadcastModal(false)
            toast.success('Broadcast transmitted to all terminals')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Broadcast transmission failed')
        }
    })

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            await api.put(`/admin/users/${id}`, data)
        },
        onSuccess: () => {
            setShowUserModal(false)
            queryClient.invalidateQueries(['admin-users'])
            toast.success('Operator profile updated')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update operator profile')
        }
    })

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'users', label: 'Directory', icon: Users },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
        { id: 'subscriptions', label: 'Billing', icon: CreditCard },
        { id: 'notifications', label: 'Broadcast', icon: Bell },
        { id: 'flags', label: 'Flags', icon: Zap }
    ]

    const statsCards = [
        { label: 'Total Operators', value: adminStats?.overview?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Active Alpha', value: adminStats?.overview?.activeUsers || 0, icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Gross Revenue', value: `₹${(adminStats?.overview?.totalRevenue / 100 || 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Conversion', value: `${adminStats?.overview?.conversionRate || 0}%`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' }
    ]

    const handleEditUser = (user) => {
        setSelectedUser(user)
        setShowUserModal(true)
    }

    const handleViewProfile = (user) => {
        setSelectedUser(user)
        setShowUserProfileModal(true)
    }

    const handleDeleteUser = (id) => {
        if (window.confirm('CRITICAL: Permanent de-provisioning requested. Proceed?')) {
            deleteUserMutation.mutate(id)
        }
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-red-400 fill-red-400/20" />
                        Command Center
                    </h1>
                    <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">Terminal Administration & Protocol Oversight</p>
                </div>
                {activeTab === 'notifications' && (
                    <button 
                        onClick={() => setShowBroadcastModal(true)}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 flex items-center space-x-2"
                    >
                        <Bell className="w-4 h-4" />
                        <span>New Broadcast</span>
                    </button>
                )}
            </div>

            {/* Admin Tabs */}
            <div className="border-b border-gray-800/50 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex space-x-1 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 md:px-6 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-400 bg-blue-400/5'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500'}`} />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeAdminTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {statsCards.map((stat, i) => (
                                <div key={i} className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${stat.bg} border border-white/5`}>
                                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-xl md:text-2xl font-black text-white">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Growth Chart */}
                            <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-xl">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center">
                                    <Activity className="w-3.5 h-3.5 mr-2" />
                                    Operator Expansion (Last 30 Days)
                                </h3>
                                <div className="h-64 flex items-end space-x-2">
                                    {adminStats?.userGrowth?.map((day, i) => (
                                        <div key={i} className="flex-1 group relative">
                                            <div 
                                                className="bg-blue-600/40 hover:bg-blue-600 rounded-t-sm transition-all cursor-pointer"
                                                style={{ height: `${(day.count / (Math.max(...adminStats.userGrowth.map(d => d.count)) || 1)) * 100}%` }}
                                            ></div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-[8px] font-black px-2 py-1 rounded whitespace-nowrap z-20">
                                                {day.count} Users on {day._id}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Protocol Activations */}
                            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-xl">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center">
                                    <UserPlus className="w-3.5 h-3.5 mr-2" />
                                    Recent Registrations
                                </h3>
                                <div className="space-y-4">
                                    {usersData?.slice(0, 5).map((user) => (
                                        <div key={user._id} className="flex items-center justify-between p-3 bg-gray-950/40 rounded-xl border border-white/5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-400 border border-blue-500/20">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-white truncate">{user.name}</p>
                                                    <p className="text-[8px] font-bold text-gray-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-gray-600" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Users Controls */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-900/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-xl">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-950/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[10px] font-black uppercase tracking-widest"
                                />
                            </div>
                            <div className="flex items-center space-x-2 w-full md:w-auto">
                                <button className="flex-1 md:flex-none px-4 py-2 bg-gray-950/40 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 text-gray-400 hover:text-white transition-colors">
                                    <Filter className="w-3.5 h-3.5" />
                                    <span>Filter</span>
                                </button>
                                <button className="flex-1 md:flex-none px-4 py-2 bg-gray-950/40 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 text-gray-400 hover:text-white transition-colors">
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Export</span>
                                </button>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-gray-950/20">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Operator</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Role</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Tier</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Trades</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Total P&L</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Protocol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {usersData?.map((user) => (
                                            <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-[1px]">
                                                            <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center text-[10px] font-black text-white">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{user.name}</p>
                                                            <p className="text-[9px] font-bold text-gray-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                        user.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                        user.subscription?.plan === 'premium' || user.subscription?.plan === 'monthly' || user.subscription?.plan === 'yearly' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-gray-800 text-gray-500'
                                                    }`}>
                                                        {user.subscription?.plan || 'Free'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] font-black text-gray-300">{user.tradeCount || 0}</td>
                                                <td className="px-6 py-4">
                                                    <p className={`text-[10px] font-black ${user.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        ₹{(user.totalPnl || 0).toLocaleString()}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${user.subscription?.status === 'active' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`}></div>
                                                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{user.subscription?.status || 'Inactive'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <button 
                                                            onClick={() => handleEditUser(user)}
                                                            className="p-2 hover:bg-purple-500/10 text-gray-500 hover:text-purple-400 rounded-lg transition-all" 
                                                            title="Update Access"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        {user.role !== 'admin' && (
                                                            <button 
                                                                onClick={() => handleDeleteUser(user._id)}
                                                                className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-all" 
                                                                title="Revoke Access"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'revenue' && (
                    <motion.div
                        key="revenue"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total MRR</p>
                                <p className="text-3xl font-black text-white">₹{(revenueData?.mrr?.total || 0).toLocaleString()}</p>
                                <div className="flex items-center mt-4 space-x-2">
                                    <span className="text-[8px] font-black text-green-400 uppercase bg-green-400/10 px-2 py-0.5 rounded">Nominal</span>
                                </div>
                            </div>
                            <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Avg Transaction</p>
                                <p className="text-3xl font-black text-white">₹{(revenueData?.metrics?.avgTransactionValue || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Churn Rate</p>
                                <p className="text-3xl font-black text-red-400">{(revenueData?.metrics?.churnRate || 0).toFixed(1)}%</p>
                            </div>
                        </div>

                        <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center">
                                <TrendingUp className="w-3.5 h-3.5 mr-2" />
                                Revenue Trajectory
                            </h3>
                            <div className="h-64 flex items-end space-x-2">
                                {revenueData?.revenueOverTime?.map((item, i) => (
                                    <div key={i} className="flex-1 group relative">
                                        <div 
                                            className="bg-green-500/40 hover:bg-green-500 rounded-t-sm transition-all cursor-pointer"
                                            style={{ height: `${(item.revenue / (Math.max(...revenueData.revenueOverTime.map(r => r.revenue)) || 1)) * 100}%` }}
                                        ></div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-[8px] font-black px-2 py-1 rounded whitespace-nowrap z-20">
                                            ₹{item.revenue.toLocaleString()} on {item.date}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'flags' && (
                    <motion.div
                        key="flags"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {flagsData?.map((flag) => (
                            <div key={flag.key} className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded-lg bg-blue-500/10 border border-white/5">
                                            <Zap className={`w-4 h-4 ${flag.enabled ? 'text-blue-400 fill-blue-400/20' : 'text-gray-600'}`} />
                                        </div>
                                        <button
                                            onClick={() => updateFlagMutation.mutate({ key: flag.key, enabled: !flag.enabled })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? 'bg-blue-600' : 'bg-gray-800'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-1">{flag.key.replace(/_/g, ' ')}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{flag.description}</p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Protocol Status</span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${flag.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                                        {flag.enabled ? 'Deployed' : 'Standby'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'subscriptions' && (
                    <motion.div
                        key="subscriptions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-gray-950/20">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Subscriber</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Plan</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Value</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Period End</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {subscriptionsData?.map((sub) => (
                                        <tr key={sub._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{sub.user?.name || 'Unknown'}</p>
                                                    <p className="text-[9px] font-bold text-gray-500">{sub.user?.email || sub.razorpaySubscriptionId}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{sub.plan}</span>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-black text-gray-300">₹{(sub.amount / 100).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-[10px] font-black text-gray-500">{new Date(sub.currentEnd).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                    sub.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'notifications' && (
                    <motion.div
                        key="notifications"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-12 border border-white/5 border-dashed flex flex-col items-center justify-center text-center shadow-xl">
                            <Bell className="w-12 h-12 text-gray-700 mb-4 animate-bounce" />
                            <h3 className="text-xl font-black uppercase tracking-widest text-gray-400">Broadcast Terminal</h3>
                            <p className="text-gray-500 text-[10px] mt-2 max-w-xs font-black uppercase tracking-widest">Transmit global protocol updates or maintenance alerts to all active operator terminals.</p>
                            <button 
                                onClick={() => setShowBroadcastModal(true)}
                                className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-red-500/20"
                            >
                                Initiate Transmission
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Broadcast Modal */}
            <AnimatePresence>
                {showBroadcastModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBroadcastModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setShowBroadcastModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center">
                                <Bell className="w-5 h-5 mr-2 text-red-500" />
                                Protocol Broadcast
                            </h3>

                            <form onSubmit={(e) => {
                                e.preventDefault()
                                const formData = new FormData(e.target)
                                sendBroadcastMutation.mutate({
                                    title: formData.get('title'),
                                    message: formData.get('message'),
                                    type: formData.get('type'),
                                    targetUsers: formData.get('target'),
                                    sendEmail: formData.get('email') === 'on'
                                })
                            }} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Transmission Title</label>
                                    <input name="title" required className="w-full bg-gray-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none" placeholder="System Maintenance..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Message Protocol</label>
                                    <textarea name="message" required rows={4} className="w-full bg-gray-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/50 outline-none resize-none" placeholder="All terminals will undergo maintenance at 0400 UTC..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Target Segment</label>
                                        <select name="target" className="w-full bg-gray-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-red-500/50 outline-none uppercase font-black tracking-widest">
                                            <option value="all">All Operators</option>
                                            <option value="premium">Elite Tier Only</option>
                                            <option value="free">Standard Tier Only</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Signal Type</label>
                                        <select name="type" className="w-full bg-gray-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-red-500/50 outline-none uppercase font-black tracking-widest">
                                            <option value="info">Information</option>
                                            <option value="warning">Alert</option>
                                            <option value="success">Success</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <input type="checkbox" name="email" id="email" className="rounded border-gray-800 bg-gray-950 text-red-600 focus:ring-red-500/50" />
                                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Execute Email Redundancy</label>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={sendBroadcastMutation.isLoading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-4 font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 transition-all mt-4 disabled:opacity-50"
                                >
                                    {sendBroadcastMutation.isLoading ? 'Transmitting...' : 'Transmit Signal'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence>
                {showUserModal && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowUserModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-6">Operator Protocol Override</h3>
                            
                            <div className="space-y-6">
                                <div className="flex items-center space-x-4 p-4 bg-gray-950/50 rounded-2xl border border-white/5">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-xl font-black text-blue-400 border border-blue-500/20">
                                        {selectedUser.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-white uppercase tracking-tight">{selectedUser.name}</p>
                                        <p className="text-[10px] font-bold text-gray-500">{selectedUser.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">System Role</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['user', 'admin'].map(role => (
                                                <button
                                                    key={role}
                                                    onClick={() => updateUserMutation.mutate({ id: selectedUser._id, data: { role } })}
                                                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                        selectedUser.role === role ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-950/50 border-white/5 text-gray-500 hover:text-white'
                                                    }`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Subscription Tier</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['free', 'monthly', 'yearly'].map(plan => (
                                                <button
                                                    key={plan}
                                                    onClick={() => updateUserMutation.mutate({ 
                                                        id: selectedUser._id, 
                                                        data: { subscription: { ...selectedUser.subscription, plan, status: 'active' } } 
                                                    })}
                                                    className={`px-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                        selectedUser.subscription?.plan === plan ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-950/50 border-white/5 text-gray-500 hover:text-white'
                                                    }`}
                                                >
                                                    {plan}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        onClick={() => setShowUserModal(false)}
                                        className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-xl py-3 font-black uppercase tracking-widest transition-all"
                                    >
                                        Close Terminal
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Profile Modal */}
            <AnimatePresence>
                {showUserProfileModal && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowUserProfileModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setShowUserProfileModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                                Operator Dossier
                            </h3>
                            
                            <div className="space-y-6">
                                {/* Header / Identity */}
                                <div className="flex items-center space-x-6 p-6 bg-gray-950/50 rounded-2xl border border-white/5">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
                                        <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center text-3xl font-black text-white">
                                            {selectedUser.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selectedUser.name}</h2>
                                        <p className="text-xs font-bold text-gray-500 mt-1">{selectedUser.email}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                selectedUser.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                                {selectedUser.role}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                selectedUser.subscription?.plan === 'premium' || selectedUser.subscription?.plan === 'monthly' || selectedUser.subscription?.plan === 'yearly' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-gray-800 text-gray-500'
                                            }`}>
                                                {selectedUser.subscription?.plan || 'Free'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Matrix */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-950/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Volume</p>
                                            <p className="text-xl font-black text-white">{selectedUser.tradeCount || 0}</p>
                                        </div>
                                        <BarChart3 className="w-6 h-6 text-blue-500/50" />
                                    </div>
                                    <div className="bg-gray-950/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Net Alpha</p>
                                            <p className={`text-xl font-black ${selectedUser.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ₹{(selectedUser.totalPnl || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <TrendingUp className={`w-6 h-6 ${selectedUser.totalPnl >= 0 ? 'text-green-500/50' : 'text-red-500/50'}`} />
                                    </div>
                                </div>

                                {/* System Telemetry */}
                                <div className="bg-gray-950/40 border border-white/5 p-6 rounded-xl space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5 pb-2">System Telemetry</h4>
                                    <div className="grid grid-cols-2 gap-y-4">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Database ID</p>
                                            <p className="text-[10px] font-bold text-gray-300 font-mono mt-1">{selectedUser._id}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Account Created</p>
                                            <p className="text-[10px] font-bold text-gray-300 mt-1">{new Date(selectedUser.createdAt || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Subscription Status</p>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${selectedUser.subscription?.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                                                {selectedUser.subscription?.status || 'Inactive'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">Last Known Activity</p>
                                            <p className="text-[10px] font-bold text-gray-300 mt-1">{new Date(selectedUser.updatedAt || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Admin