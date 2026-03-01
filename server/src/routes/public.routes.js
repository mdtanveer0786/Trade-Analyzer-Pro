import express from 'express'
import User from '../models/User.js'
import Trade from '../models/Trade.js'

const router = express.Router()

// @desc    Get public platform statistics
// @route   GET /api/public/stats
// @access  Public
router.get('/stats', async (req, res, next) => {
    try {
        const [totalUsers, totalTrades] = await Promise.all([
            User.countDocuments(),
            Trade.countDocuments()
        ])

        res.json({
            success: true,
            data: {
                totalUsers,
                totalTrades
            }
        })
    } catch (error) {
        next(error)
    }
})

export default router
