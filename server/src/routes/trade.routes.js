import express from 'express'
import multer from 'multer'
import {
    getTrades,
    getTrade,
    createTrade,
    updateTrade,
    deleteTrade,
    clearAllTrades,
    uploadScreenshot,
    analyzeTrade,
    importTrades,
} from '../controllers/trade.controller.js'
import { authMiddleware, premiumMiddleware } from '../middleware/auth.js'
import { validate, tradeSchema } from '../utils/validation.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Get all trades with filters
router.get('/', getTrades)

// Clear all trades
router.delete('/clear-all', clearAllTrades)

// Get single trade
router.get('/:id', getTrade)

// Create new trade
router.post('/', validate(tradeSchema), createTrade)

// Update trade
router.put('/:id', validate(tradeSchema), updateTrade)

// Delete trade
router.delete('/:id', deleteTrade)

// Upload screenshot
router.post('/upload-screenshot', upload.single('screenshot'), uploadScreenshot)

// AI analysis (premium feature - removed middleware for testing)
router.post('/:id/analyze', analyzeTrade)

// Import trades from CSV
router.post('/import', upload.single('csv'), importTrades)

export default router