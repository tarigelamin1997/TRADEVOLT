import { NextRequest, NextResponse } from 'next/server'
// Use in-memory database for Vercel deployment
import * as db from '@/lib/db-memory'

// Check if Clerk is configured
const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.CLERK_SECRET_KEY
)

// Conditionally import auth
let auth: any = null
if (isClerkConfigured) {
  auth = require('@clerk/nextjs/server').auth
}

// ONE endpoint for EVERYTHING
export async function POST(request: NextRequest) {
  let userId = 'demo-user' // Default for when auth is not configured
  
  // If Clerk is configured, use real authentication
  if (isClerkConfigured && auth) {
    const authResult = auth()
    userId = authResult.userId
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })
  }
  
  const body = await request.json()
  
  // Giant switch statement - fight me
  switch (body.action) {
    case 'getTrades': {
      const { user, trades } = await db.getUserWithTrades(userId)
      
      return NextResponse.json({
        trades: trades || [],
        isPaid: user?.isPaid || false
      })
    }
    
    case 'addTrade': {
      const user = await db.upsertUser(userId, body.email || `${userId}@placeholder.com`)
      
      const trade = await db.createTrade({
        userId: user.id,
        symbol: body.trade.symbol,
        type: body.trade.type,
        entry: body.trade.entry,
        exit: body.trade.exit || null,
        quantity: body.trade.quantity,
        notes: body.trade.notes || null,
        marketType: body.trade.marketType || null,
        createdAt: body.trade.createdAt || new Date().toISOString(),
        entryTime: body.trade.entryTime || null,
        exitTime: body.trade.exitTime || null
      })
      
      return NextResponse.json({ trade })
    }
    
    case 'getAI': {
      // Super simple Claude call
      const trades = body.trades
      const winCount = trades.filter((t: any) => {
        const pnl = (t.exit - t.entry) * (t.type === 'BUY' ? 1 : -1)
        return pnl > 0
      }).length
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Analyze these trading stats: ${trades.length} trades, ${winCount} wins. Give one actionable tip in 2 sentences.`
          }]
        })
      })
      
      const data = await response.json()
      return NextResponse.json({
        insight: data.content?.[0]?.text || 'Keep trading and tracking!'
      })
    }
    
    case 'checkPayment': {
      // Webhook from Stripe - disabled for now
      return NextResponse.json({ success: true })
    }
    
    case 'importTrades': {
      try {
        const trades = body.trades
        if (!trades || !Array.isArray(trades)) {
          return new NextResponse('Invalid trades data', { status: 400 })
        }

        console.log(`Importing ${trades.length} trades for user ${userId}`)

        // Get or create user
        const user = await db.upsertUser(userId, body.email || `${userId}@placeholder.com`)

        // Import all trades
        const importedTrades = await db.createManyTrades(
          trades.map(trade => ({
            userId: user.id,
            symbol: trade.symbol,
            type: trade.type,
            entry: trade.entry,
            exit: trade.exit || null,
            quantity: trade.quantity,
            notes: trade.notes || null,
            marketType: trade.marketType || null,
            createdAt: trade.createdAt || new Date().toISOString(),
            entryTime: trade.entryTime || null,
            exitTime: trade.exitTime || null
          }))
        )

        // Fetch and return all trades
        const allTrades = await db.findTradesByUserId(user.id)

        return NextResponse.json({ 
          trades: allTrades,
          imported: importedTrades.count 
        })
      } catch (error) {
        console.error('Import trades error:', error)
        return new NextResponse(
          JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to import trades' }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    
    default:
      return new NextResponse('Unknown action', { status: 400 })
  }
}