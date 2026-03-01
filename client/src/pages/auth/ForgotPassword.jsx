import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const { forgotPassword } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email) {
            toast.error('Please enter your email address')
            return
        }

        setIsLoading(true)

        const result = await forgotPassword(email)

        if (result.success) {
            setIsSubmitted(true)
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Back Button */}
                <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                </Link>

                {/* Card */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-white" />
                        </div>

                        {isSubmitted ? (
                            <>
                                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                                <h1 className="text-2xl font-bold">Check your email</h1>
                                <p className="text-gray-400 text-sm mt-2 text-center">
                                    We've sent a password reset link to {email}
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold">Reset Password</h1>
                                <p className="text-gray-400 text-sm mt-2 text-center">
                                    Enter your email address and we'll send you a reset link
                                </p>
                            </>
                        )}
                    </div>

                    {isSubmitted ? (
                        <div className="text-center space-y-6">
                            <div className="bg-gray-800/30 rounded-lg p-6">
                                <h3 className="font-medium mb-2">What's next?</h3>
                                <ul className="space-y-3 text-sm text-gray-300">
                                    <li className="flex items-start space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                                        <span>Check your email for the reset link</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                                        <span>Click the link to set a new password</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                                        <span>The link expires in 10 minutes</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="text-sm text-gray-400">
                                Didn't receive the email? Check your spam folder or{' '}
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="text-blue-400 hover:text-blue-300 font-medium"
                                >
                                    try again
                                </button>
                            </div>

                            <Link
                                to="/login"
                                className="inline-block w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-gray-800/30 rounded-lg p-4">
                                <h4 className="font-medium mb-2">Instructions:</h4>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li>• Enter the email address associated with your account</li>
                                    <li>• You'll receive a password reset link</li>
                                    <li>• Click the link to set a new password</li>
                                    <li>• The link expires in 10 minutes</li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
                            </button>

                            {/* Back to Login */}
                            <p className="text-center text-sm text-gray-400">
                                Remember your password?{' '}
                                <Link
                                    to="/login"
                                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    )}
                </div>

                {/* Security Note */}
                <p className="text-center text-xs text-gray-500 mt-8">
                    For security reasons, we'll only send reset links to verified email addresses.
                </p>
            </motion.div>
        </div>
    )
}

export default ForgotPassword