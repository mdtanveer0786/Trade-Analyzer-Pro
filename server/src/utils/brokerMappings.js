export const BROKER_MAPPINGS = {
    standard: {
        symbol: 'symbol',
        market: 'market',
        direction: 'direction',
        entryDate: 'entryDate',
        exitDate: 'exitDate',
        entryPrice: 'entryPrice',
        exitPrice: 'exitPrice',
        positionSize: 'positionSize',
        pnl: 'pnl',
        stopLoss: 'stopLoss',
        takeProfit: 'takeProfit',
        commission: 'commission',
        fees: 'fees'
    },
    zerodha: {
        symbol: 'symbol',
        market: (row) => row.segment?.toLowerCase() || 'stocks',
        direction: (row) => row.trade_type?.toLowerCase() || 'long',
        entryDate: 'order_execution_time',
        exitDate: 'order_execution_time', // Zerodha files often combine entry/exit on different rows or use different formats
        entryPrice: 'price',
        exitPrice: 'price',
        positionSize: 'quantity',
        pnl: 'realized_pnl',
    },
    upstox: {
        symbol: 'ScripName',
        market: (row) => row.Segment?.toLowerCase() || 'stocks',
        direction: (row) => row.BuySell?.toLowerCase() === 'buy' ? 'long' : 'short',
        entryDate: 'TradeDate',
        entryPrice: 'AveragePrice',
        positionSize: 'Quantity',
    }
}

export const mapRowToTrade = (row, broker = 'standard') => {
    const mapping = BROKER_MAPPINGS[broker] || BROKER_MAPPINGS.standard
    const trade = {}

    Object.keys(BROKER_MAPPINGS.standard).forEach(key => {
        const mapValue = mapping[key]

        if (typeof mapValue === 'function') {
            trade[key] = mapValue(row)
        } else if (row[mapValue] !== undefined) {
            let val = row[mapValue]
            
            // Basic type conversions
            if (['entryPrice', 'exitPrice', 'positionSize', 'pnl', 'stopLoss', 'takeProfit', 'commission', 'fees'].includes(key)) {
                val = parseFloat(val.replace(/[^\d.-]/g, ''))
            } else if (['entryDate', 'exitDate'].includes(key)) {
                val = new Date(val)
            }

            if (val !== undefined && !isNaN(val)) {
                trade[key] = val
            }
        }
    })

    return trade
}
