// import express from 'express'
// import {
//     createSubscription,
//     getSubscription,
//     cancelSubscription,
//     handleWebhook,
//     getPaymentHistory,
//     updatePaymentMethod,
//     getInvoices,
//     createCheckoutSession
// } from '../controllers/payment.controller.js'
// import { authMiddleware, premiumMiddleware } from '../middleware/auth.js'

// const router = express.Router()

// // @route   POST /api/payments/subscribe
// // @desc    Create a subscription
// // @access  Private
// router.post('/subscribe', authMiddleware, createSubscription)

// // @route   GET /api/payments/subscription
// // @desc    Get current subscription status
// // @access  Private
// router.get('/subscription', authMiddleware, getSubscription)

// // @route   POST /api/payments/cancel
// // @desc    Cancel subscription
// // @access  Private
// router.post('/cancel', authMiddleware, cancelSubscription)

// // @route   GET /api/payments/history
// // @desc    Get payment history
// // @access  Private
// router.get('/history', authMiddleware, getPaymentHistory)

// // @route   GET /api/payments/invoices
// // @desc    Get all invoices
// // @access  Private
// router.get('/invoices', authMiddleware, getInvoices)

// // @route   GET /api/payments/invoices/:id
// // @desc    Get specific invoice
// // @access  Private
// router.get('/invoices/:id', authMiddleware, getInvoices)

// // @route   PUT /api/payments/payment-method
// // @desc    Update payment method
// // @access  Private
// router.put('/payment-method', authMiddleware, updatePaymentMethod)

// // @route   POST /api/payments/checkout-session
// // @desc    Create checkout session
// // @access  Private
// router.post('/checkout-session', authMiddleware, createCheckoutSession)

// // @route   POST /api/payments/webhook
// // @desc    Handle Razorpay webhook
// // @access  Public
// router.post('/webhook', handleWebhook)

// export default router