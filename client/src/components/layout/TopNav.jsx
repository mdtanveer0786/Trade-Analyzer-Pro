import { Menu, Search, User, X, Plus, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import useUIStore from '../../store/uiStore'
import { useAuth } from '../../contexts/AuthContext'

const TopNav = ({ onMenuClick }) => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { openTradeForm, theme, toggleTheme } = useUIStore()
    const [profileOpen, setProfileOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors duration-300">
            <div className="px-4 md:px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onMenuClick}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden text-gray-600 dark:text-gray-400"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Search: show inline on md+, toggle on small screens */}
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search trades, strategies..."
                                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Mobile search button */}
                        <MobileSearch />
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setProfileOpen(!profileOpen)
                                }}
                                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent transition-all duration-200"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-blue-600 dark:text-white">{user?.name?.charAt(0) || <User className="w-4 h-4" />}</span>
                                </div>
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                                            <p className="font-semibold truncate text-gray-900 dark:text-white">{user?.name || 'Trader'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <Link 
                                                to="/app/settings" 
                                                onClick={() => setProfileOpen(false)}
                                                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors text-gray-700 dark:text-gray-300"
                                            >
                                                Account Settings
                                            </Link>
                                            <Link 
                                                to="/app/settings"
                                                onClick={() => setProfileOpen(false)} 
                                                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors text-gray-700 dark:text-gray-300"
                                            >
                                                Billing & Subscription
                                            </Link>
                                            <div className="h-px bg-gray-200 dark:bg-gray-800 my-2"></div>
                                            <button 
                                                onClick={handleLogout}
                                                className="block w-full text-left px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-sm transition-colors text-gray-700 dark:text-gray-300"
                                            >
                                                Log Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Quick Actions */}
                        <button 
                            onClick={() => openTradeForm()}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Trade</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

const MobileSearch = () => {
    const [open, setOpen] = useState(false)

    return (
        <div className="md:hidden">
            <button
                onClick={() => setOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                aria-label="Open search"
            >
                <Search className="w-5 h-5" />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-start px-4 pt-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
                    <div className="w-full">
                        <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input autoFocus type="search" placeholder="Search trades, strategies..." className="pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                            </div>
                            <button onClick={() => setOpen(false)} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TopNav
