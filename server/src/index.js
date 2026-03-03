import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import compression from 'compression'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Load env vars
dotenv.config()

// Import DB config
import connectDB from './config/db.js'

// Import routes
import authRoutes from './routes/auth.routes.js'
import tradeRoutes from './routes/trade.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import strategyRoutes from './routes/strategy.routes.js'
// import paymentRoutes from './routes/payment.routes.js'
import adminRoutes from './routes/admin.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import publicRoutes from './routes/public.routes.js'

// Import middleware
import { errorHandler } from './middleware/error.js'
import { authMiddleware } from './middleware/auth.js'

// Connect to Database
connectDB()

const app = express()

// Trust proxy for Vercel/Cloudflare
app.set('trust proxy', 1)

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
})

// Security middleware
app.use(helmet())
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(mongoSanitize())
app.use(compression())

// Request Logging for debugging
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`${req.method} ${req.url}`)
    }
    next()
})

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
})
app.use('/api', limiter)

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id)

    socket.on('join-dashboard', (userId) => {
        socket.join(`dashboard-${userId}`)
    })

    socket.on('new-trade', (trade) => {
        io.to(`dashboard-${trade.user}`).emit('trade-added', trade)
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
    })
})

// Routes
app.use('/api/public', publicRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/trades', authMiddleware, tradeRoutes)
app.use('/api/analytics', authMiddleware, analyticsRoutes)
app.use('/api/strategies', authMiddleware, strategyRoutes)
// app.use('/api/payments', authMiddleware, paymentRoutes)
app.use('/api/admin', authMiddleware, adminRoutes)
app.use('/api/notifications', authMiddleware, notificationRoutes)

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    })
})

// server running  route
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running perfectly fine!',
    })
})

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API Route not found: ${req.method} ${req.originalUrl}`
    })
})

// Error handling
app.use(errorHandler)

const PORT = process.env.PORT || 5000

if (process.env.NODE_ENV !== 'production') {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
        console.log(`Environment: ${process.env.NODE_ENV}`)
    })
}

export default app