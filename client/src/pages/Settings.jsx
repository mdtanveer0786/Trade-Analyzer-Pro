import { useState } from 'react'
import * as XLSX from 'xlsx'
import { motion } from 'framer-motion'
import {
    User,
    Bell,
    Shield,
    CreditCard,
    Globe,
    Moon,
    Sun,
    LogOut,
    Save,
    Download,
    Upload,
    Trash2,
    Lock,
    Key,
    Smartphone,
    Zap
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const Settings = () => {
    const { user, updateProfile, changePassword, deleteAccount, clearAllTrades, exportUserData, api } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [isSaving, setIsSaving] = useState(false)
    
    const [settings, setSettings] = useState({
        profile: {
            name: user?.name || '',
            email: user?.email || '',
            timezone: user?.preferences?.timezone || 'Asia/Kolkata',
            currency: user?.preferences?.defaultCurrency || 'INR'
        },
        preferences: {
            theme: user?.preferences?.theme || 'dark',
            notifications: user?.preferences?.notifications || {
                tradeReminders: true,
                weeklyReports: true,
                aiInsights: true
            }
        },
        security: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            twoFactorAuth: user?.preferences?.twoFactorEnabled || false,
            sessionTimeout: 30,
            loginAlerts: user?.preferences?.loginAlerts || true
        }
    })

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'data', label: 'Data', icon: Download }
    ]

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updateProfile({
                name: settings.profile.name,
                preferences: {
                    timezone: settings.profile.timezone,
                    defaultCurrency: settings.profile.currency,
                    notifications: settings.preferences.notifications,
                    twoFactorEnabled: settings.security.twoFactorAuth,
                    loginAlerts: settings.security.loginAlerts
                }
            })
            if (result.success) {
                toast.success('Settings saved successfully!')
            }
        } catch (error) {
            toast.error('Failed to save settings')
        } finally {
            setIsSaving(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (settings.security.newPassword !== settings.security.confirmPassword) {
            return toast.error('Passwords do not match')
        }
        if (settings.security.newPassword.length < 8) {
            return toast.error('New password must be at least 8 characters')
        }

        try {
            const result = await changePassword({
                currentPassword: settings.security.currentPassword,
                newPassword: settings.security.newPassword
            })
            if (result.success) {
                setSettings({
                    ...settings,
                    security: {
                        ...settings.security,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    }
                })
            }
        } catch (error) {
            // Error handled in context
        }
    }

    const handleExportData = async () => {
        await exportUserData()
    }

    const handleExportExcel = async () => {
        try {
            const response = await api.get('/auth/export-data')
            const { trades } = response.data.data
            
            // Format data for Excel
            const excelData = trades.map(trade => ({
                Symbol: trade.symbol,
                Direction: trade.direction,
                'Entry Price': trade.entryPrice,
                'Exit Price': trade.exitPrice,
                'Entry Date': new Date(trade.entryDate).toLocaleDateString(),
                'Exit Date': trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : 'Open',
                'Status': trade.status,
                'PnL': trade.pnl,
                'ROI %': trade.roi,
                'Market': trade.market,
                'Notes': trade.entryNotes
            }))

            const worksheet = XLSX.utils.json_to_sheet(excelData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Trades")
            
            XLSX.writeFile(workbook, `trade_analyzer_trades_${new Date().toISOString().split('T')[0]}.xlsx`)
            toast.success('Excel file exported successfully!')
        } catch (error) {
            toast.error('Failed to export Excel file')
        }
    }

    const handleClearAllTrades = async () => {
        if (window.confirm('Are you sure you want to clear all your trading history? This action cannot be undone.')) {
            await clearAllTrades()
        }
    }

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This will permanently delete all your trades, strategies, and settings. This action cannot be undone.')) {
            await deleteAccount()
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-blue-400 fill-blue-400/20" />
                    System Preferences
                </h1>
                <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5">Manage your account configuration and security protocols</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-64">
                    <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-3 w-full px-4 py-3 text-left transition-all rounded-xl mb-1 last:mb-0 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                                        : 'text-gray-500 hover:text-white hover:bg-gray-800/40'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-100 mb-6 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                    Identity Profile
                                </h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Legal Name</label>
                                        <input
                                            type="text"
                                            value={settings.profile.name}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                profile: { ...settings.profile, name: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 bg-gray-950/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                                        <input
                                            type="email"
                                            value={settings.profile.email}
                                            disabled
                                            className="w-full px-4 py-3 bg-gray-950/20 border border-white/5 rounded-xl text-gray-500 cursor-not-allowed text-sm font-medium"
                                        />
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">Identity verification required for change</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">System Timezone</label>
                                        <select
                                            value={settings.profile.timezone}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                profile: { ...settings.profile, timezone: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 bg-gray-950/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium appearance-none"
                                        >
                                            <option value="Asia/Kolkata">India (IST)</option>
                                            <option value="America/New_York">New York (EST)</option>
                                            <option value="Europe/London">London (GMT)</option>
                                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Base Currency</label>
                                        <select
                                            value={settings.profile.currency}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                profile: { ...settings.profile, currency: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 bg-gray-950/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium appearance-none"
                                        >
                                            <option value="INR">Indian Rupee (₹)</option>
                                            <option value="USD">US Dollar ($)</option>
                                            <option value="EUR">Euro (€)</option>
                                            <option value="GBP">British Pound (£)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'preferences' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-100 mb-6 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
                                    Interface Customization
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-950/40 rounded-2xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">Visual Theme</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Toggle between light and deep space mode</p>
                                        </div>
                                        <div className="flex items-center space-x-2 bg-gray-900 rounded-xl p-1 border border-white/5">
                                            <button
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    preferences: { ...settings.preferences, theme: 'light' }
                                                })}
                                                className={`p-2 rounded-lg transition-all ${settings.preferences.theme === 'light'
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                        : 'text-gray-500 hover:text-white hover:bg-gray-800'
                                                    }`}
                                            >
                                                <Sun className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    preferences: { ...settings.preferences, theme: 'dark' }
                                                })}
                                                className={`p-2 rounded-lg transition-all ${settings.preferences.theme === 'dark'
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                        : 'text-gray-500 hover:text-white hover:bg-gray-800'
                                                    }`}
                                            >
                                                <Moon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-100 mb-6 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    Alert Configuration
                                </h3>

                                <div className="space-y-3">
                                    {Object.entries(settings.preferences.notifications).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-gray-950/40 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                    {key === 'tradeReminders' && 'Terminal execution confirmations'}
                                                    {key === 'weeklyReports' && 'Automated performance synthesis'}
                                                    {key === 'aiInsights' && 'Proactive Alpha recommendations'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    preferences: {
                                                        ...settings.preferences,
                                                        notifications: {
                                                            ...settings.preferences.notifications,
                                                            [key]: !value
                                                        }
                                                    }
                                                })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-gray-800'
                                                    }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'security' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-100 mb-6 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                    Authentication Credentials
                                </h3>

                                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Current Key</label>
                                        <div className="relative">
                                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="password"
                                                value={settings.security.currentPassword}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    security: { ...settings.security, currentPassword: e.target.value }
                                                })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-950/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">New Protocol Key</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="password"
                                                value={settings.security.newPassword}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    security: { ...settings.security, newPassword: e.target.value }
                                                })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-950/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                                placeholder="Secure entropy required"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Confirm Protocol Key</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="password"
                                                value={settings.security.confirmPassword}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    security: { ...settings.security, confirmPassword: e.target.value }
                                                })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-950/40 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                                placeholder="Verify redundancy"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5"
                                    >
                                        Update Credentials
                                    </button>
                                </form>
                            </div>

                            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-100 mb-6">Security Hardening</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-950/40 rounded-2xl border border-white/5">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-blue-500/10 rounded-xl border border-white/5">
                                                <Smartphone className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">Two-Factor Shield</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Multi-layer identity verification</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSettings({
                                                ...settings,
                                                security: { ...settings.security, twoFactorAuth: !settings.security.twoFactorAuth }
                                            })}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.security.twoFactorAuth ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                        >
                                            {settings.security.twoFactorAuth ? 'Active' : 'Deploy'}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-950/40 rounded-2xl border border-white/5">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-purple-500/10 rounded-xl border border-white/5">
                                                <Shield className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">Intrusion Alerts</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Real-time terminal access notifications</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSettings({
                                                ...settings,
                                                security: { ...settings.security, loginAlerts: !settings.security.loginAlerts }
                                            })}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.security.loginAlerts ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-gray-800'
                                                }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.security.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6 shadow-xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-red-400 mb-6 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></div>
                                    Critical Actions
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-2xl border border-red-500/10">
                                        <div>
                                            <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">Terminate Account</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Irreversible removal of all system data</p>
                                        </div>
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="px-6 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Execute
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'billing' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-100 mb-6 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                                    Subscription Status
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-pink-900/20 rounded-2xl border border-blue-500/30 relative overflow-hidden shadow-2xl">
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className="px-3 py-1 bg-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg text-white shadow-lg shadow-blue-500/40">
                                                    {user?.role === 'premium' ? 'Elite Access' : 'Basic Tier'}
                                                </span>
                                                <p className="font-black text-lg uppercase tracking-tight text-white">
                                                    {user?.subscription?.plan === 'yearly' ? 'Annual Alpha' : 
                                                     user?.subscription?.plan === 'monthly' ? 'Monthly Pro' : 'Standard Terminal'}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {user?.role === 'premium' ? `Status: Nominal • Cycle renewal ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}` : 
                                                 'Unlock advanced AI analytics & unlimited terminal capacity'}
                                            </p>
                                        </div>
                                        <div className="relative z-10">
                                            {user?.role === 'premium' ? (
                                                <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                                                    Manage Access
                                                </button>
                                            ) : (
                                                <button className="px-6 py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-white/5 active:scale-95">
                                                    Upgrade
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center mb-4">
                                            <CreditCard className="w-3.5 h-3.5 mr-2" />
                                            Active Payment Channels
                                        </h4>
                                        {user?.subscription?.razorpayCustomerId ? (
                                             <div className="p-4 bg-gray-950/40 rounded-2xl border border-white/5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-8 bg-gray-900 rounded-lg flex items-center justify-center font-black text-[10px] border border-white/10 text-gray-400 uppercase tracking-widest">
                                                            VISA
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-200 uppercase tracking-widest">Razorpay Gateway</p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {user.subscription.razorpayCustomerId}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-10 text-center bg-gray-950/20 rounded-2xl border border-dashed border-gray-800">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">No active payment channels</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'data' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-100 mb-6 flex items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                    Digital Asset Management
                                </h3>

                                <div className="space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-4 bg-gray-950/40 rounded-2xl border border-white/5">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Universal Export</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-md">
                                                Generate a complete snapshot of your market activity, strategy definitions, and system profile.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={handleExportData}
                                                className="flex items-center space-x-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>JSON Dump</span>
                                            </button>
                                            <button
                                                onClick={handleExportExcel}
                                                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Excel Ledger</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-start justify-between p-4 bg-gray-950/40 rounded-2xl border border-white/5">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-gray-200 uppercase tracking-widest text-red-400">Flush Terminal Data</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed max-w-md">
                                                Delete execution history and reset analytics engines. Strategy assets and profile remain intact.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleClearAllTrades}
                                            className="px-6 py-2.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Flush Data
                                        </button>
                                    </div>

                                    <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                                        <div className="flex space-x-4">
                                            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                            <div>
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1.5">Encryption Protocol Guarantee</h5>
                                                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                                    Trading intelligence is secured via end-to-end encryption. AI processing is performed 
                                                    on anonymized heuristic data to maintain proprietary strategy integrity and 
                                                    absolute user privacy.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Global Save Button */}
                    {['profile', 'preferences', 'notifications'].includes(activeTab) && (
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 active:scale-95"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isSaving ? 'Processing...' : 'Commit System Changes'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Settings