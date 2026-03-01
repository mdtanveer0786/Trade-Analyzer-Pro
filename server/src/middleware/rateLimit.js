import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import redisClient from '../config/redis.js'

export const authLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'ratelimit:auth:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})

export const apiLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'ratelimit:api:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased to 500 requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})

export const paymentLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'ratelimit:payment:',
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: 'Too many payment attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
})