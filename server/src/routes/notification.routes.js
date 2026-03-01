import express from 'express'
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', getNotifications)
router.put('/:id/read', markAsRead)
router.put('/read-all', markAllAsRead)

export default router
