import fs from 'fs'
import mongoose from 'mongoose'
import OpenAI from 'openai'

// 1. Load env manually
const envContent = fs.readFileSync('server/.env', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=')
    if (key && value) env[key.trim()] = value.join('=').trim()
})

process.env.OPENAI_API_KEY = env.OPENAI_API_KEY
process.env.MONGODB_URI = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tradeanalyzer'

import { analyzeTradeWithAI } from './server/src/services/ai.service.js'

const TRADE_ID = '69a1bb5de35ed0a8f1301484'
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
