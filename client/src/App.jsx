import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense, useEffect } from 'react'
import useUIStore from './store/uiStore'

// Layout Components
import Layout from './components/layout/Layout'

// Lazy loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const TradeJournal = lazy(() => import('./pages/TradeJournal'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Strategies = lazy(() => import('./pages/Strategies'))
const Psychology = lazy(() => import('./pages/Psychology'))
const Settings = lazy(() => import('./pages/Settings'))
const Admin = lazy(() => import('./pages/Admin'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))

// Auth Context
import { AuthProvider, useAuth } from './contexts/AuthContext'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        },
    },
})

// Loading Fallback
const PageLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Workspace...</p>
    </div>
)

// Theme Manager Component
const ThemeManager = ({ children }) => {
    const { theme, setTheme } = useUIStore()
    const { user } = useAuth()
    
    useEffect(() => {
        // Preference priority: localStorage > user preference > default dark
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
            setTheme(savedTheme)
        } else if (user?.preferences?.theme) {
            setTheme(user.preferences.theme)
        } else {
            setTheme('dark')
        }
    }, [user?.preferences?.theme])

    return children
}

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, isLoading, user } = useAuth()

    if (isLoading) {
        return <PageLoader />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (adminOnly && user?.role !== 'admin') {
        return <Navigate to="/app/dashboard" replace />
    }

    return children
}

function App() {
    const theme = useUIStore((state) => state.theme)

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThemeManager>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'} transition-colors duration-300`}>
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/" element={<LandingPage />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />

                                    {/* Protected Routes with Layout */}
                                    <Route path="/app" element={
                                        <ProtectedRoute>
                                            <Layout />
                                        </ProtectedRoute>
                                    }>
                                        <Route index element={<Navigate to="dashboard" replace />} />
                                        <Route path="dashboard" element={<Dashboard />} />
                                        <Route path="journal" element={<TradeJournal />} />
                                        <Route path="analytics" element={<Analytics />} />
                                        <Route path="strategies" element={<Strategies />} />
                                        <Route path="psychology" element={<Psychology />} />
                                        <Route path="settings" element={<Settings />} />
                                        <Route path="admin" element={
                                            <ProtectedRoute adminOnly>
                                                <Admin />
                                            </ProtectedRoute>
                                        } />
                                    </Route>
                                </Routes>
                            </Suspense>
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    style: {
                                        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                                        color: theme === 'dark' ? '#fff' : '#111827',
                                        border: theme === 'dark' ? '1px solid #374151' : '1px solid #E5E7EB',
                                    },
                                }}
                            />
                        </div>
                    </Router>
                </ThemeManager>
            </AuthProvider>
        </QueryClientProvider>
    )
}

export default App
