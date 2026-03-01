import express from 'express'
import {
    getDashboardStats,
    getPerformanceAnalytics,
    getStrategyAnalytics,
    getMarketAnalytics,
    getTimeAnalytics,
    getPsychologyAnalytics,
    generateAIReport,
} from '../controllers/analytics.controller.js'
import { authMiddleware, premiumMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Dashboard overview
router.get('/dashboard', authMiddleware, getDashboardStats)

// Performance analytics
router.get('/performance', authMiddleware, getPerformanceAnalytics)

// Strategy analytics
router.get('/strategy', authMiddleware, getStrategyAnalytics)

// Market analytics
router.get('/market', authMiddleware, getMarketAnalytics)

// Time-based analytics
router.get('/time', authMiddleware, getTimeAnalytics)

// Psychology analytics
router.get('/psychology', authMiddleware, getPsychologyAnalytics)

// AI-generated reports (premium removed for testing)
router.post('/ai-report', authMiddleware, generateAIReport)

export default router