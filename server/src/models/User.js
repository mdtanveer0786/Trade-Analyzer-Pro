import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        minlength: 8,
        select: false,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
    },
    avatar: String,
    role: {
        type: String,
        enum: ['user', 'admin', 'premium'],
        default: 'user',
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'monthly', 'yearly'],
            default: 'free',
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired', 'pending'],
            default: 'active',
        },
        currentPeriodEnd: Date,
        razorpaySubscriptionId: String,
        razorpayCustomerId: String,
    },
    preferences: {
        defaultCurrency: {
            type: String,
            default: 'INR',
        },
        timezone: {
            type: String,
            default: 'Asia/Kolkata',
        },
        theme: {
            type: String,
            enum: ['dark', 'light', 'auto'],
            default: 'dark',
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        loginAlerts: {
            type: Boolean,
            default: true,
        },
        notifications: {
            tradeReminders: { type: Boolean, default: true },
            weeklyReports: { type: Boolean, default: true },
            aiInsights: { type: Boolean, default: true },
        },
    },
    tradingProfile: {
        experienceLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'professional'],
        },
        primaryMarket: [String],
        averageMonthlyTrades: Number,
        accountSize: Number,
        riskPerTrade: Number,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },

    lastLogin: Date,
    refreshTokens: [String],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
})

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()

    this.password = await bcrypt.hash(this.password, 12)
    next()
})

// Update updatedAt timestamp
// userSchema.pre('save', function (next) {
//     this.updatedAt = Date.now()
//     next()
// })

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

// Limit refresh tokens before saving
userSchema.pre('save', function (next) {
    if (this.isModified('refreshTokens') && this.refreshTokens.length > 10) {
        this.refreshTokens = this.refreshTokens.slice(-10)
    }
    next()
})

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000 // 10 minutes

    return resetToken
}

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex')

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')

    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    return token
}


// Remove sensitive data from JSON response
userSchema.methods.toJSON = function () {
    const obj = this.toObject()
    delete obj.password
    delete obj.refreshTokens
    delete obj.resetPasswordToken
    delete obj.resetPasswordExpire
    delete obj.emailVerificationToken
    delete obj.emailVerificationExpire
    return obj
}

const User = mongoose.model('User', userSchema)

export default User