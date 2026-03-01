import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'

const Register = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    })
    const [isLoading, setIsLoading] = useState(false)

    const { register, googleLogin } = useAuth()
    const navigate = useNavigate()

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return false
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return false
        }

        if (!formData.agreeToTerms) {
            toast.error('Please agree to terms and conditions')
            return false
        }

        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)

        const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
        })

        if (result.success) {
            navigate('/login')
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
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        })
    }

    const passwordStrength = () => {
        const password = formData.password
        if (!password) return 0

        let strength = 0
        if (password.length >= 8) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/[0-9]/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++

        return strength
    }

    const strength = passwordStrength()
    const strengthColor = strength === 0 ? 'bg-gray-700' :
        strength === 1 ? 'bg-red-500' :
            strength === 2 ? 'bg-amber-500' :
                strength === 3 ? 'bg-blue-500' : 'bg-green-500'

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
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Create Account</h1>
                        <p className="text-gray-400 text-sm mt-2">
                            Start your trading journey with advanced analytics
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Email */}
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

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Minimum 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password Strength */}
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400">Password strength</span>
                                    <span className="text-xs">
                                        {strength === 0 ? 'Very Weak' :
                                            strength === 1 ? 'Weak' :
                                                strength === 2 ? 'Fair' :
                                                    strength === 3 ? 'Good' : 'Strong'}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${strengthColor} transition-all duration-300`}
                                        style={{ width: `${(strength / 4) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Confirm your password"
                                />
                            </div>
                            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-sm text-red-400">Passwords do not match</p>
                            )}
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start space-x-3">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    name="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={handleChange}
                                    className="w-4 h-4 bg-gray-800 border border-gray-700 rounded focus:ring-blue-500 focus:ring-2"
                                />
                            </div>
                            <label className="text-sm text-gray-400">
                                I agree to the{' '}
                                <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-400 hover:text-blue-300">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-400 hover:text-blue-300">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        {/* Features List */}
                        <div className="bg-gray-800/30 rounded-lg p-4">
                            <h4 className="font-medium mb-3">What you get:</h4>
                            <ul className="space-y-2">
                                <li className="flex items-center space-x-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400" />
                                    <span>7-day free trial</span>
                                </li>
                                <li className="flex items-center space-x-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400" />
                                    <span>Advanced trading analytics</span>
                                </li>
                                <li className="flex items-center space-x-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400" />
                                    <span>AI-powered insights</span>
                                </li>
                                <li className="flex items-center space-x-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 text-green-400" />
                                    <span>Psychology tracking</span>
                                </li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
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

                        {/* Already have account */}
                        <p className="text-center text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                Sign in
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

export default Register