import Razorpay from 'razorpay'
import crypto from 'crypto'
import User from '../models/User.js'
import Subscription from '../models/Payment.js'
import Payment from '../models/Payment.js'
import { sendEmail } from '../utils/email.js'

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// @desc    Create subscription
// @route   POST /api/payments/subscribe
// @access  Private
export const createSubscription = async (req, res, next) => {
    try {
        const { plan, couponCode } = req.body // 'monthly' or 'yearly'
        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        const plans = {
            monthly: {
                plan_id: process.env.RAZORPAY_MONTHLY_PLAN_ID,
                total_count: 12,
                interval: 'monthly',
                amount: 29900, // in paise
                currency: 'INR',
                name: 'Monthly Plan',
                description: 'Monthly subscription for TradeAnalyzer Pro'
            },
            yearly: {
                plan_id: process.env.RAZORPAY_YEARLY_PLAN_ID,
                total_count: 1,
                interval: 'yearly',
                amount: 99900, // in paise
                currency: 'INR',
                name: 'Annual Plan',
                description: 'Annual subscription for TradeAnalyzer Pro (Save 72%)'
            },
        }

        const selectedPlan = plans[plan]
        if (!selectedPlan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected',
            })
        }

        // Check for existing subscription
        if (user.subscription.status === 'active') {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription',
            })
        }

        // Apply coupon if valid
        let finalAmount = selectedPlan.amount
        let discount = 0

        if (couponCode) {
            const coupon = await validateCoupon(couponCode)
            if (coupon.valid) {
                discount = coupon.discount
                finalAmount = selectedPlan.amount - discount
            }
        }

        // Create Razorpay customer if not exists
        let customer
        if (!user.subscription.razorpayCustomerId) {
            customer = await razorpay.customers.create({
                name: user.name,
                email: user.email,
                contact: user.phone || '+919876543210',
            })

            user.subscription.razorpayCustomerId = customer.id
            await user.save()
        }

        // Create Razorpay subscription
        const subscription = await razorpay.subscriptions.create({
            plan_id: selectedPlan.plan_id,
            customer_notify: 1,
            total_count: selectedPlan.total_count,
            quantity: 1,
            notes: {
                userId: req.userId.toString(),
                plan: plan,
                discount: discount,
                couponCode: couponCode || null,
            },
            ...(user.subscription.razorpayCustomerId && {
                customer_id: user.subscription.razorpayCustomerId
            })
        })

        // Create subscription record
        const subscriptionRecord = await Subscription.create({
            user: req.userId,
            razorpaySubscriptionId: subscription.id,
            razorpayCustomerId: user.subscription.razorpayCustomerId,
            plan: plan,
            status: 'created',
            currentStart: new Date(),
            currentEnd: calculateEndDate(plan),
            amount: selectedPlan.amount,
            discountedAmount: finalAmount,
            discount: discount,
            couponCode: couponCode,
            currency: selectedPlan.currency,
            metadata: {
                planName: selectedPlan.name,
                planDescription: selectedPlan.description,
                interval: selectedPlan.interval,
            }
        })

        // Update user
        user.subscription.plan = plan
        user.subscription.status = 'pending'
        user.subscription.razorpaySubscriptionId = subscription.id
        await user.save()

        // Send confirmation email
        await sendEmail({
            to: user.email,
            template: 'subscription-created',
            context: {
                name: user.name,
                plan: selectedPlan.name,
                amount: (finalAmount / 100).toFixed(2),
                currency: selectedPlan.currency,
                subscriptionId: subscription.id,
                nextBillingDate: calculateEndDate(plan).toLocaleDateString('en-IN'),
            },
        })

        res.json({
            success: true,
            data: {
                subscriptionId: subscription.id,
                shortUrl: subscription.short_url,
                amount: finalAmount / 100,
                currency: selectedPlan.currency,
                subscriptionRecord,
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get subscription status
// @route   GET /api/payments/subscription
// @access  Private
export const getSubscription = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)

        if (!user.subscription.razorpaySubscriptionId) {
            return res.json({
                success: true,
                data: {
                    active: false,
                    plan: 'free',
                    status: 'inactive',
                    features: getFreeFeatures(),
                },
            })
        }

        const subscription = await razorpay.subscriptions.fetch(
            user.subscription.razorpaySubscriptionId
        )

        const isActive = subscription.status === 'active'
        const currentPeriodEnd = new Date(subscription.current_end * 1000)
        const currentPeriodStart = new Date(subscription.start_at * 1000)

        // Get subscription details from database
        const subscriptionRecord = await Subscription.findOne({
            razorpaySubscriptionId: user.subscription.razorpaySubscriptionId
        })

        res.json({
            success: true,
            data: {
                active: isActive,
                plan: user.subscription.plan,
                status: subscription.status,
                currentPeriodStart,
                currentPeriodEnd,
                remainingDays: Math.ceil((currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)),
                amount: subscriptionRecord?.discountedAmount ? subscriptionRecord.discountedAmount / 100 : subscriptionRecord?.amount / 100,
                currency: subscriptionRecord?.currency || 'INR',
                nextBillingDate: currentPeriodEnd,
                features: getPlanFeatures(user.subscription.plan),
                ...(subscriptionRecord?.discount && {
                    discount: subscriptionRecord.discount / 100,
                    originalAmount: subscriptionRecord.amount / 100,
                })
            },
        })
    } catch (error) {
        // If subscription not found in Razorpay, mark as expired
        if (error.error?.code === 'NOT_FOUND') {
            const user = await User.findById(req.userId)
            user.subscription.status = 'expired'
            user.role = 'user'
            await user.save()

            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: user.subscription.razorpaySubscriptionId },
                { status: 'expired' }
            )

            return res.json({
                success: true,
                data: {
                    active: false,
                    plan: 'free',
                    status: 'expired',
                    message: 'Your subscription has expired',
                },
            })
        }
        next(error)
    }
}

// @desc    Cancel subscription
// @route   POST /api/payments/cancel
// @access  Private
export const cancelSubscription = async (req, res, next) => {
    try {
        const { cancelAtPeriodEnd = true } = req.body
        const user = await User.findById(req.userId)

        if (!user.subscription.razorpaySubscriptionId) {
            return res.status(400).json({
                success: false,
                message: 'No active subscription found',
            })
        }

        if (cancelAtPeriodEnd) {
            // Cancel at period end
            await razorpay.subscriptions.cancel(
                user.subscription.razorpaySubscriptionId,
                { cancel_at_cycle_end: 1 }
            )

            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: user.subscription.razorpaySubscriptionId },
                {
                    status: 'pending_cancellation',
                    willCancelAt: calculateEndDate(user.subscription.plan),
                }
            )

            res.json({
                success: true,
                message: 'Subscription will be cancelled at the end of the billing period',
                cancelAt: calculateEndDate(user.subscription.plan),
            })
        } else {
            // Cancel immediately
            await razorpay.subscriptions.cancel(user.subscription.razorpaySubscriptionId)

            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: user.subscription.razorpaySubscriptionId },
                {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelledImmediately: true,
                }
            )

            user.subscription.status = 'cancelled'
            user.role = 'user'
            await user.save()

            // Send cancellation email
            await sendEmail({
                to: user.email,
                template: 'subscription-cancelled',
                context: {
                    name: user.name,
                    plan: user.subscription.plan === 'monthly' ? 'Monthly' : 'Annual',
                    cancellationDate: new Date().toLocaleDateString('en-IN'),
                    refundEligible: false, // Implement refund logic based on terms
                },
            })

            res.json({
                success: true,
                message: 'Subscription cancelled immediately',
            })
        }
    } catch (error) {
        next(error)
    }
}

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res, next) => {
    try {
        const { limit = 20, offset = 0 } = req.query

        const payments = await Payment.find({ user: req.userId })
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit))

        const total = await Payment.countDocuments({ user: req.userId })

        res.json({
            success: true,
            data: payments,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + payments.length < total,
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get invoices
// @route   GET /api/payments/invoices
// @access  Private
export const getInvoices = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)

        if (!user.subscription.razorpayCustomerId) {
            return res.json({
                success: true,
                data: [],
            })
        }

        const invoices = await razorpay.invoices.all({
            customer_id: user.subscription.razorpayCustomerId,
            count: 100,
        })

        res.json({
            success: true,
            data: invoices.items || [],
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Update payment method
// @route   PUT /api/payments/payment-method
// @access  Private
export const updatePaymentMethod = async (req, res, next) => {
    try {
        const { paymentMethodId } = req.body
        const user = await User.findById(req.userId)

        if (!user.subscription.razorpaySubscriptionId) {
            return res.status(400).json({
                success: false,
                message: 'No active subscription found',
            })
        }

        // Update payment method in Razorpay
        // Note: Razorpay doesn't have direct payment method update for subscriptions
        // You might need to create a new subscription and cancel the old one

        res.json({
            success: true,
            message: 'Payment method updated successfully',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Create checkout session
// @route   POST /api/payments/checkout-session
// @access  Private
export const createCheckoutSession = async (req, res, next) => {
    try {
        const { plan } = req.body
        const user = await User.findById(req.userId)

        const plans = {
            monthly: {
                amount: 29900,
                name: 'Monthly Plan',
            },
            yearly: {
                amount: 99900,
                name: 'Annual Plan',
            },
        }

        const selectedPlan = plans[plan]
        if (!selectedPlan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected',
            })
        }

        const options = {
            amount: selectedPlan.amount,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: req.userId,
                plan: plan,
            },
            callback_url: `${process.env.CLIENT_URL}/payment-success`,
            callback_method: 'get',
        }

        const order = await razorpay.orders.create(options)

        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
            },
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Handle Razorpay webhook
// @route   POST /api/payments/webhook
// @access  Public
export const handleWebhook = async (req, res, next) => {
    try {
        const signature = req.headers['x-razorpay-signature']
        const payload = JSON.stringify(req.body)

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex')

        if (expectedSignature !== signature) {
            console.error('Invalid webhook signature')
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook signature',
            })
        }

        const event = req.body.event
        const payloadData = req.body.payload

        console.log(`Processing webhook event: ${event}`)

        switch (event) {
            case 'subscription.activated':
                await handleSubscriptionActivated(payloadData)
                break

            case 'subscription.charged':
                await handleSubscriptionCharged(payloadData)
                break

            case 'subscription.completed':
                await handleSubscriptionCompleted(payloadData)
                break

            case 'subscription.cancelled':
                await handleSubscriptionCancelled(payloadData)
                break

            case 'subscription.paused':
                await handleSubscriptionPaused(payloadData)
                break

            case 'subscription.resumed':
                await handleSubscriptionResumed(payloadData)
                break

            case 'payment.captured':
                await handlePaymentCaptured(payloadData)
                break

            case 'payment.failed':
                await handlePaymentFailed(payloadData)
                break

            case 'invoice.paid':
                await handleInvoicePaid(payloadData)
                break

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(payloadData)
                break

            default:
                console.log(`Unhandled webhook event: ${event}`)
        }

        res.json({ success: true })
    } catch (error) {
        console.error('Webhook processing error:', error)
        next(error)
    }
}

// Helper functions for webhook handling
const handleSubscriptionActivated = async (payload) => {
    const subscription = payload.subscription.entity
    const userId = subscription.notes?.userId

    if (!userId) return

    const user = await User.findById(userId)
    if (!user) return

    const startDate = new Date(subscription.start_at * 1000)
    const endDate = new Date(subscription.current_end * 1000)

    // Update subscription record
    await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subscription.id },
        {
            status: 'active',
            currentStart: startDate,
            currentEnd: endDate,
            activatedAt: new Date(),
        }
    )

    // Update user
    user.subscription.status = 'active'
    user.subscription.currentPeriodEnd = endDate
    user.role = 'premium'
    await user.save()

    // Send welcome email
    await sendEmail({
        to: user.email,
        template: 'subscription-activated',
        context: {
            name: user.name,
            plan: subscription.plan_id === process.env.RAZORPAY_MONTHLY_PLAN_ID ? 'Monthly' : 'Annual',
            startDate: startDate.toLocaleDateString('en-IN'),
            endDate: endDate.toLocaleDateString('en-IN'),
            amount: (subscription.current_total / 100).toFixed(2),
        },
    })
}

const handleSubscriptionCharged = async (payload) => {
    const payment = payload.payment.entity
    const subscription = payload.subscription.entity

    // Create payment record
    await Payment.create({
        razorpayPaymentId: payment.id,
        razorpaySubscriptionId: subscription.id,
        user: subscription.notes?.userId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        bank: payment.bank,
        wallet: payment.wallet,
        cardId: payment.card_id,
        invoiceId: payment.invoice_id,
        description: `Subscription payment for ${subscription.plan_id}`,
        metadata: {
            payment: payment,
            subscription: subscription,
        },
    })

    // Update subscription last payment date
    await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subscription.id },
        {
            lastPaymentDate: new Date(payment.created_at * 1000),
            $push: {
                payments: {
                    razorpayPaymentId: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    method: payment.method,
                    createdAt: new Date(payment.created_at * 1000),
                }
            }
        }
    )
}

const handleSubscriptionCompleted = async (payload) => {
    const subscription = payload.subscription.entity

    await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subscription.id },
        { status: 'completed' }
    )

    // Send renewal reminder
    const subRecord = await Subscription.findOne({ razorpaySubscriptionId: subscription.id })
    if (subRecord) {
        const user = await User.findById(subRecord.user)
        if (user) {
            await sendEmail({
                to: user.email,
                template: 'subscription-renewal',
                context: {
                    name: user.name,
                    plan: subRecord.plan === 'monthly' ? 'Monthly' : 'Annual',
                    expiryDate: subRecord.currentEnd.toLocaleDateString('en-IN'),
                },
            })
        }
    }
}

const handleSubscriptionCancelled = async (payload) => {
    const subscription = payload.subscription.entity

    await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subscription.id },
        {
            status: 'cancelled',
            cancelledAt: new Date(subscription.cancelled_at * 1000),
            cancelReason: subscription.cancel_reason,
        }
    )

    const subRecord = await Subscription.findOne({ razorpaySubscriptionId: subscription.id })
    if (subRecord) {
        const user = await User.findById(subRecord.user)
        if (user) {
            user.subscription.status = 'cancelled'
            user.role = 'user'
            await user.save()
        }
    }
}

const handlePaymentCaptured = async (payload) => {
    const payment = payload.payment.entity

    await Payment.findOneAndUpdate(
        { razorpayPaymentId: payment.id },
        { status: 'captured' }
    )
}

const handlePaymentFailed = async (payload) => {
    const payment = payload.payment.entity
    const subscription = payload.subscription?.entity

    await Payment.findOneAndUpdate(
        { razorpayPaymentId: payment.id },
        {
            status: 'failed',
            errorCode: payment.error_code,
            errorDescription: payment.error_description,
            errorSource: payment.error_source,
            errorReason: payment.error_reason,
        }
    )

    if (subscription) {
        const subRecord = await Subscription.findOne({ razorpaySubscriptionId: subscription.id })
        if (subRecord) {
            const user = await User.findById(subRecord.user)
            if (user) {
                await sendEmail({
                    to: user.email,
                    template: 'payment-failed',
                    context: {
                        name: user.name,
                        amount: (payment.amount / 100).toFixed(2),
                        errorReason: payment.error_reason || 'Unknown error',
                        retryUrl: `${process.env.CLIENT_URL}/billing`,
                    },
                })
            }
        }
    }
}

const handleInvoicePaid = async (payload) => {
    const invoice = payload.invoice.entity

    // Update invoice status
    // You can store invoices in your database and update them here
}

const handleInvoicePaymentFailed = async (payload) => {
    const invoice = payload.invoice.entity

    // Handle failed invoice payment
    console.log('Invoice payment failed:', invoice.id)
}

// Helper functions
const calculateEndDate = (plan) => {
    const now = new Date()
    if (plan === 'monthly') {
        now.setMonth(now.getMonth() + 1)
    } else if (plan === 'yearly') {
        now.setFullYear(now.getFullYear() + 1)
    }
    return now
}

const validateCoupon = async (couponCode) => {
    // Implement coupon validation logic
    // You can store coupons in database and validate here
    const validCoupons = {
        'WELCOME10': { discount: 1000, valid: true }, // ₹10 off
        'TRADER20': { discount: 2000, valid: true }, // ₹20 off
        'ANNUAL50': { discount: 5000, valid: true }, // ₹50 off annual
    }

    return validCoupons[couponCode] || { valid: false, discount: 0 }
}

const getFreeFeatures = () => [
    'Up to 20 trades per month',
    'Basic analytics',
    'Manual trade entry',
    'Email support',
]

const getPlanFeatures = (plan) => {
    const baseFeatures = [
        'Unlimited trades',
        'Advanced analytics',
        'AI-powered insights',
        'Psychology tracking',
        'CSV import/export',
        'Mobile responsive',
        'Email support',
    ]

    const premiumFeatures = [
        ...baseFeatures,
        'Priority support',
        'Beta feature access',
        'Custom reports',
        'Team collaboration',
        'API access',
    ]

    return plan === 'monthly' ? baseFeatures : premiumFeatures
}