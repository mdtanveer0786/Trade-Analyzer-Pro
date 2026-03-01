import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

import { analyzeTradeWithAI } from './src/services/ai.service.js'

const TRADE_ID = '69a1ef4755d269f70adfbd7b'
const USER_ID = '69a0dcdf2f946235c125169e'

async function checkAI() {
    try {
        console.log('Connecting to MongoDB...')
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected.')

        console.log(`Analyzing trade ${TRADE_ID} for user ${USER_ID}...`)
        const result = await analyzeTradeWithAI(TRADE_ID, USER_ID)
        
        console.log('AI Analysis SUCCESS:')
        console.log(JSON.stringify(result, null, 2))
        
        process.exit(0)
    } catch (error) {
        console.error('Test Failed:', error.message)
        process.exit(1)
    }
}

checkAI()
