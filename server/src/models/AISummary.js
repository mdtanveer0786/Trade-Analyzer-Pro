import mongoose from 'mongoose'

const aiSummarySchema = new mongoose.Schema({
    trade: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trade',
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // AI Analysis Sections
    summary: {
        type: String,
        required: true,
    },
    strengths: [{
        aspect: String,
        description: String,
        confidence: {
            type: Number,
            min: 0,
            max: 1,
        },
    }],
    weaknesses: [{
        aspect: String,
        description: String,
        suggestion: String,
        impact: {
            type: String,
            enum: ['low', 'medium', 'high'],
        },
    }],
    mistakes: [{
        type: {
            type: String,
            enum: ['psychological', 'execution', 'risk_management', 'strategy'],
        },
        description: String,
        frequency: {
            type: String,
            enum: ['first_time', 'occasional', 'frequent'],
        },
        recommendation: String,
    }],
    patterns: [{
        name: String,
        description: String,
        occurrence: Number,
        impactOnPnl: Number,
    }],

    // Behavioral Insights
    psychologyScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    disciplineRating: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent'],
    },
    emotionalTriggers: [String],

    // Performance Metrics
    suggestedImprovements: [String],
    predictedWinRate: {
        type: Number,
        min: 0,
        max: 1,
    },
    riskAdjustedScore: {
        type: Number,
        min: 0,
        max: 1,
    },

    // Metadata
    aiModel: {
        type: String,
        default: 'gpt-4-turbo',
    },
    tokensUsed: Number,
    processingTime: Number,

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

// Indexes
aiSummarySchema.index({ user: 1, createdAt: -1 })
aiSummarySchema.index({ trade: 1 }, { unique: true })

const AISummary = mongoose.model('AISummary', aiSummarySchema)

export default AISummary