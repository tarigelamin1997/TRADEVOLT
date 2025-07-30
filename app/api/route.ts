import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
// GET endpoint for testing
export async function GET(request: NextRequest) {
  try {
    const dbUrlSet = !!process.env.DATABASE_URL
    const dbUrlStart = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'not set'
    
    // Try to connect to database
    let dbStatus = 'unknown'
    try {
      await prisma.$connect()
      dbStatus = 'connected'
    } catch (e) {
      dbStatus = 'failed'
    }
    
    return NextResponse.json({
      status: 'API is running',
      database: {
        url_set: dbUrlSet,
        url_preview: dbUrlStart,
        connection: dbStatus
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Check database URL
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    return new NextResponse(
      JSON.stringify({ error: 'Database configuration error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let clerkId = 'demo-user' // Default for when auth is not configured
  
  // If Clerk is configured, use real authentication
  if (isClerkConfigured && auth) {
    const authResult = auth()
    clerkId = authResult.userId
    if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })
  }
  
  const body = await request.json()
  
  try {
    // Giant switch statement - fight me
    switch (body.action) {
      case 'getTrades': {
        // Get or create user
        let user = await prisma.user.findUnique({
          where: { clerkId },
          include: { trades: true }
        })
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              clerkId,
              email: body.email || `${clerkId}@placeholder.com`,
              isPaid: false
            },
            include: { trades: true }
          })
        }
        
        // Sort trades by creation date
        const sortedTrades = user.trades.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        return NextResponse.json({
          trades: sortedTrades || [],
          isPaid: user.isPaid || false
        })
      }
      
      case 'addTrade': {
        console.log('Adding trade for clerkId:', clerkId)
        console.log('Trade data:', body.trade)
        
        // Get or create user
        let user = await prisma.user.findUnique({
          where: { clerkId }
        })
        
        if (!user) {
          console.log('Creating new user')
          user = await prisma.user.create({
            data: {
              clerkId,
              email: body.email || `${clerkId}@placeholder.com`,
              isPaid: false
            }
          })
        }
        
        console.log('User found/created:', user.id)
        
        const trade = await prisma.trade.create({
          data: {
            userId: user.id,
            symbol: body.trade.symbol,
            type: body.trade.type,
            entry: body.trade.entry,
            exit: body.trade.exit || null,
            quantity: body.trade.quantity,
            notes: body.trade.notes || null,
            marketType: body.trade.marketType || null,
            entryTime: body.trade.entryTime ? new Date(body.trade.entryTime) : null,
            exitTime: body.trade.exitTime ? new Date(body.trade.exitTime) : null
          }
        })
        
        console.log('Trade created:', trade.id)
        
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
        const trades = body.trades
        if (!trades || !Array.isArray(trades)) {
          return new NextResponse('Invalid trades data', { status: 400 })
        }

        console.log(`Importing ${trades.length} trades for user ${clerkId}`)

        // Get or create user
        let user = await prisma.user.findUnique({
          where: { clerkId }
        })
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              clerkId,
              email: body.email || `${clerkId}@placeholder.com`,
              isPaid: false
            }
          })
        }

        // Import all trades
        const createResult = await prisma.trade.createMany({
          data: trades.map(trade => ({
            userId: user.id,
            symbol: trade.symbol,
            type: trade.type,
            entry: parseFloat(trade.entry),
            exit: trade.exit ? parseFloat(trade.exit) : null,
            quantity: parseFloat(trade.quantity),
            notes: trade.notes || null,
            marketType: trade.marketType || null,
            entryTime: trade.entryTime ? new Date(trade.entryTime) : null,
            exitTime: trade.exitTime ? new Date(trade.exitTime) : null
          }))
        })

        // Fetch and return all trades
        const allTrades = await prisma.trade.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ 
          trades: allTrades,
          imported: createResult.count 
        })
      }
      
      case 'getSubscription': {
        // During beta, everyone is pro
        const subscription = {
          plan: 'pro' as const
        }
        
        return NextResponse.json({ subscription })
      }
      
      case 'testConnection': {
        // Test database connection
        try {
          const userCount = await prisma.user.count()
          const tradeCount = await prisma.trade.count()
          return NextResponse.json({ 
            status: 'connected',
            database_url_set: !!process.env.DATABASE_URL,
            userCount,
            tradeCount
          })
        } catch (error) {
          return NextResponse.json({ 
            status: 'error',
            database_url_set: !!process.env.DATABASE_URL,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      default:
        return new NextResponse('Unknown action', { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    
    // Check if it's a Prisma error
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Check for common Prisma errors
      if (error.message.includes('P2002')) {
        return new NextResponse(
          JSON.stringify({ error: 'Duplicate entry' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      if (error.message.includes('P2025')) {
        return new NextResponse(
          JSON.stringify({ error: 'Record not found' }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      // Database connection errors
      if (error.message.includes('P1001') || error.message.includes('ECONNREFUSED')) {
        return new NextResponse(
          JSON.stringify({ error: 'Database connection failed' }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        type: error instanceof Error ? error.name : 'Unknown',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}