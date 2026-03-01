import Joi from 'joi'

export const tradeSchema = Joi.object({
    symbol: Joi.string().required().uppercase().trim(),
    market: Joi.string().valid('stocks', 'forex', 'crypto', 'futures', 'options').required(),
    direction: Joi.string().valid('long', 'short').required(),
    entryDate: Joi.date().required(),
    exitDate: Joi.date().min(Joi.ref('entryDate')).allow(null, ''),
    entryPrice: Joi.number().min(0).required(),
    exitPrice: Joi.number().min(0).allow(null, ''),
    positionSize: Joi.number().min(0).required(),
    pnl: Joi.number().required(),
    pnlPercentage: Joi.number().allow(null, ''),
    stopLoss: Joi.number().min(0).allow(null, ''),
    takeProfit: Joi.number().min(0).allow(null, ''),
    commission: Joi.number().min(0).default(0),
    fees: Joi.number().min(0).default(0),
    notes: Joi.string().allow('', null),
    entryNotes: Joi.string().allow('', null),
    exitNotes: Joi.string().allow('', null),
    entryScreenshot: Joi.string().allow('', null),
    exitScreenshot: Joi.string().allow('', null),
    strategy: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()).allow(null),
    emotions: Joi.array().items(
        Joi.object({
            emotion: Joi.string().required(),
            intensity: Joi.number().min(1).max(5).required(),
        })
    ),
    executionRating: Joi.number().min(1).max(5),
    mistakes: Joi.array().items(Joi.string()),
    lessons: Joi.array().items(Joi.string()),
    status: Joi.string().valid('open', 'closed', 'cancelled').default('closed'),
})

export const userSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    preferences: Joi.object({
        defaultCurrency: Joi.string().default('INR'),
        timezone: Joi.string().default('Asia/Kolkata'),
        theme: Joi.string().valid('dark', 'light', 'auto').default('dark'),
    }),
})

export const strategySchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().allow(''),
    market: Joi.string().valid('stocks', 'forex', 'crypto', 'futures', 'options', 'all'),
    tags: Joi.array().items(Joi.string()),
    rules: Joi.object({
        entry: Joi.array().items(Joi.string()),
        exit: Joi.array().items(Joi.string()),
        riskManagement: Joi.array().items(Joi.string()),
    }),
})

export const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    })

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: error.details.map((err) => err.message),
        })
    }

    next()
}