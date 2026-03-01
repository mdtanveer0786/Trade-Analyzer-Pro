import express from 'express'
import {
    getStrategies,
    getStrategy,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    toggleFavorite,
} from '../controllers/strategy.controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// All routes are private and require authMiddleware (handled in server index)
router.get('/', getStrategies)
router.get('/:id', getStrategy)
router.post('/', createStrategy)
router.put('/:id', updateStrategy)
router.delete('/:id', deleteStrategy)
router.patch('/:id/favorite', toggleFavorite)

export default router
