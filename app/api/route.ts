import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

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
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { trades: true }
      })
      
      return NextResponse.json({
        trades: user?.trades || [],
        isPaid: user?.isPaid || false
      })
    }
    
    case 'addTrade': {
      const trade = await prisma.trade.create({
        data: {
          ...body.trade,
          user: {
            connectOrCreate: {
              where: { clerkId: userId },
              create: { 
                clerkId: userId, 
                email: body.email || `${userId}@placeholder.com`
              }
            }
          }
        }
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
    
    default:
      return new NextResponse('Unknown action', { status: 400 })
  }
}