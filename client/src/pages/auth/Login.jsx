import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'

const Login = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [isLoading, setIsLoading] = useState(false)

    const { login, googleLogin } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        const result = await login(formData.email, formData.password)

        if (result.success) {
            navigate('/app/dashboard')
        }

        setIsLoading(false)
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        const result = await googleLogin(credentialResponse)
        if (result.success) {
            navigate('/app/dashboard')
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const isGoogleConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here'

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                {/* Card */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Welcome Back</h1>
                        <p className="text-gray-400 text-sm mt-2">
                            Sign in to your trading journal
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Password</label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>

                        {/* Divider */}
                        {isGoogleConfigured && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
                                </div>
                            </div>
                        )}

                        {/* Social Login */}
                        {isGoogleConfigured && (
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => toast.error('Google Login Failed')}
                                    theme="filled_black"
                                    shape="pill"
                                    width="350"
                                />
                            </div>
                        )}

                        {/* Sign Up Link */}
                        <p className="text-center text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                Sign up for free
                            </Link>
                        </p>
                    </form>
                </div>

                {/* Security Note */}
                <p className="text-center text-xs text-gray-500 mt-8">
                    Your data is protected with bank-grade encryption. We never share your trading data.
                </p>
            </motion.div>
        </div>
    )
}

export default Login