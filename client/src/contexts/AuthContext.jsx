import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // Initialize axios using useMemo to prevent recreation on every render
    const api = React.useMemo(() => {
        let baseURL = import.meta.env.VITE_API_URL || '/api'
        // Ensure baseURL ends with / for consistent path joining
        if (!baseURL.endsWith('/')) {
            baseURL += '/'
        }
        
        const instance = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // Add request interceptor to add token
        instance.interceptors.request.use((config) => {
            const token = localStorage.getItem('accessToken')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        })

        // Add response interceptor to handle token refresh
        instance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true

                    try {
                        const refreshToken = localStorage.getItem('refreshToken')
                        if (!refreshToken) throw new Error('No refresh token')

                        // Use instance to ensure correct baseURL and interceptors
                        const response = await instance.post('auth/refresh-token', {
                            refreshToken,
                        })

                        const { accessToken } = response.data.data
                        localStorage.setItem('accessToken', accessToken)

                        originalRequest.headers.Authorization = `Bearer ${accessToken}`
                        return instance(originalRequest)
                    } catch (refreshError) {
                        localStorage.removeItem('accessToken')
                        localStorage.removeItem('refreshToken')
                        setUser(null)
                        setIsAuthenticated(false)
                        return Promise.reject(refreshError)
                    }
                }

                return Promise.reject(error)
            }
        )

        return instance
    }, [])

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            setIsLoading(false)
            return
        }

        try {
            const response = await api.get('auth/me')
            setUser(response.data.data)
            setIsAuthenticated(true)
        } catch (error) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            const response = await api.post('auth/login', { email, password })
            const { user, token, refreshToken } = response.data

            // Requirement: Store token only after login
            localStorage.setItem('accessToken', token)
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken)
            }

            setUser(user)
            setIsAuthenticated(true)

            toast.success('Login successful!')
            return { success: true, data: user }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const googleLogin = async (credentialResponse) => {
        setIsLoading(true)
        try {
            const response = await api.post('auth/google-login', {
                credential: credentialResponse.credential
            })

            const { token, refreshToken, user: userData } = response.data
            
            localStorage.setItem('accessToken', token)
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken)
            }
            setUser(userData)
            setIsAuthenticated(true)
            
            toast.success('Successfully signed in with Google!')
            return { success: true, data: userData }
        } catch (error) {
            console.error('Google Sign-In Error:', error)
            toast.error(error.response?.data?.message || 'Google Sign-In failed')
            return { success: false, error: error.message }
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (userData) => {
        try {
            const response = await api.post('auth/register', userData)
            
            // Requirement: Do NOT store token after registration
            // Requirement: Return only success message
            toast.success(response.data.message || 'User registered successfully. Please login.')
            
            return { success: true }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const logout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setUser(null)
        setIsAuthenticated(false)
        toast.success('Logged out successfully')
    }

    const forgotPassword = async (email) => {
        try {
            await api.post('auth/forgot-password', { email })
            toast.success('Password reset email sent!')
            return { success: true }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset email')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const resetPassword = async (token, password) => {
        try {
            await api.post(`auth/reset-password/${token}`, { password })
            toast.success('Password reset successful!')
            return { success: true }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const updateProfile = async (userData) => {
        try {
            const response = await api.put('auth/profile', userData)
            setUser(response.data.data)
            toast.success('Profile updated successfully!')
            return { success: true, data: response.data.data }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const changePassword = async (passwords) => {
        try {
            await api.put('auth/change-password', passwords)
            toast.success('Password updated successfully!')
            return { success: true }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const deleteAccount = async () => {
        try {
            await api.delete('auth/account')
            logout()
            toast.success('Account deleted successfully')
            return { success: true }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete account')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const clearAllTrades = async () => {
        try {
            await api.delete('trades/clear-all')
            toast.success('All trades cleared successfully')
            return { success: true }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to clear trades')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const exportUserData = async () => {
        try {
            const response = await api.get('auth/export-data')
            const dataStr = JSON.stringify(response.data.data, null, 2)
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
            
            const exportFileDefaultName = `trade_analyzer_data_${new Date().toISOString().split('T')[0]}.json`
            
            const linkElement = document.createElement('a')
            linkElement.setAttribute('href', dataUri)
            linkElement.setAttribute('download', exportFileDefaultName)
            linkElement.click()
            
            toast.success('Data exported successfully!')
            return { success: true }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to export data')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        googleLogin,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        deleteAccount,
        clearAllTrades,
        exportUserData,
        api,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}