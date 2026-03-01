import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useUIStore from '../../store/uiStore'
import TradeForm from '../trades/TradeForm'

import { useQuery, useIsFetching } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'

const Layout = () => {
    const { api } = useAuth()
    const location = useLocation()
    const { theme } = useUIStore()
    const { showTradeForm, closeTradeForm, editingTrade } = useUIStore()
    const isFetching = useIsFetching()
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window === 'undefined') return true
        return window.innerWidth >= 1024 // open by default on large screens
    })

    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard', '1W'],
        queryFn: async () => {
            const response = await api.get('/analytics/dashboard?range=1W')
            return response.data.data
        },
        staleTime: 5 * 60 * 1000,
    })

    // Keep sidebar responsive when resizing
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setSidebarOpen(true)
            else setSidebarOpen(false)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
            {/* Global Loading Bar */}
            <AnimatePresence>
                {isFetching > 0 && (
                    <motion.div
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 z-[100] origin-left"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar (Responsive) */}
            <motion.aside
                initial={false}
                animate={{ 
                    x: sidebarOpen ? 0 : -256,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`fixed lg:relative inset-y-0 left-0 z-50 overflow-hidden bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 lg:flex-shrink-0 flex flex-col w-64`}
            >
                <div className="w-64 h-full">
                    <Sidebar 
                        onClose={() => setSidebarOpen(false)} 
                        stats={dashboardData?.summary}
                    />
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Trade Form Modal */}
            <AnimatePresence>
                {showTradeForm && (
                    <TradeForm onClose={closeTradeForm} trade={editingTrade} />
                )}
            </AnimatePresence>
        </div>
    )
}

export default Layout
