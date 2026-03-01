import Strategy from '../models/Strategy.js'
import Trade from '../models/Trade.js'

// @desc    Get all strategies
// @route   GET /api/strategies
// @access  Private
export const getStrategies = async (req, res, next) => {
    try {
        const { isActive, isFavorite, market } = req.query
        const query = { user: req.userId }

        if (isActive !== undefined) query.isActive = isActive === 'true'
        if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true'
        if (market && market !== 'all') query.market = market

        const strategies = await Strategy.find(query).sort({ isFavorite: -1, name: 1 })

        // Update performance for each strategy before returning
        // In a real app, you might do this on a schedule or when a trade is closed
        for (let strategy of strategies) {
            await strategy.updatePerformance()
        }

        res.json({
            success: true,
            data: strategies,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Get single strategy
// @route   GET /api/strategies/:id
// @access  Private
export const getStrategy = async (req, res, next) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.userId,
        })

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found',
            })
        }

        await strategy.updatePerformance()

        res.json({
            success: true,
            data: strategy,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Create strategy
// @route   POST /api/strategies
// @access  Private
export const createStrategy = async (req, res, next) => {
    try {
        const strategy = await Strategy.create({
            ...req.body,
            user: req.userId,
        })

        res.status(201).json({
            success: true,
            data: strategy,
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Strategy with this name already exists',
            })
        }
        next(error)
    }
}

// @desc    Update strategy
// @route   PUT /api/strategies/:id
// @access  Private
export const updateStrategy = async (req, res, next) => {
    try {
        const strategy = await Strategy.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        )

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found',
            })
        }

        res.json({
            success: true,
            data: strategy,
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Delete strategy
// @route   DELETE /api/strategies/:id
// @access  Private
export const deleteStrategy = async (req, res, next) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.userId,
        })

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found',
            })
        }

        // Check if strategy is being used by any trades
        const tradeCount = await Trade.countDocuments({ strategy: strategy._id })
        if (tradeCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete strategy as it is used by ${tradeCount} trades. Please reassign the trades first.`,
            })
        }

        await strategy.deleteOne()

        res.json({
            success: true,
            message: 'Strategy deleted successfully',
        })
    } catch (error) {
        next(error)
    }
}

// @desc    Toggle favorite
// @route   PATCH /api/strategies/:id/favorite
// @access  Private
export const toggleFavorite = async (req, res, next) => {
    try {
        const strategy = await Strategy.findOne({
            _id: req.params.id,
            user: req.userId,
        })

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: 'Strategy not found',
            })
        }

        strategy.isFavorite = !strategy.isFavorite
        await strategy.save()

        res.json({
            success: true,
            data: strategy,
        })
    } catch (error) {
        next(error)
    }
}
