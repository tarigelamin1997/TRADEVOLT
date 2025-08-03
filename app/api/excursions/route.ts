import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { ExcursionBatchService } from '@/lib/services/excursion-batch-service'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, tradeId } = body

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'processTrade': {
        if (!tradeId) {
          return NextResponse.json(
            { error: 'Trade ID is required' },
            { status: 400 }
          )
        }

        // Verify trade belongs to user
        const trade = await prisma.trade.findFirst({
          where: { id: tradeId, userId: user.id }
        })

        if (!trade) {
          return NextResponse.json(
            { error: 'Trade not found' },
            { status: 404 }
          )
        }

        // Process excursion metrics
        const excursionData = await ExcursionBatchService.processTradeExcursions(tradeId)

        return NextResponse.json({
          success: true,
          data: excursionData
        })
      }

      case 'processHistorical': {
        // Start processing in the background
        ExcursionBatchService.processHistoricalTrades(user.id, {
          batchSize: 5,
          onProgress: (processed, total) => {
            console.log(`Processing excursions: ${processed}/${total}`)
          }
        }).then(result => {
          console.log('Historical processing complete:', result)
        }).catch(error => {
          console.error('Historical processing failed:', error)
        })

        return NextResponse.json({
          success: true,
          message: 'Historical processing started in background'
        })
      }

      case 'getStats': {
        const stats = await ExcursionBatchService.getUserExcursionStats(user.id)
        
        // Get distribution data
        const trades = await prisma.trade.findMany({
          where: {
            userId: user.id,
            mae: { not: null },
            mfe: { not: null }
          },
          select: {
            id: true,
            symbol: true,
            mae: true,
            mfe: true,
            edgeRatio: true,
            exit: true,
            entry: true,
            type: true,
            quantity: true,
            marketType: true
          }
        })

        // Calculate distributions
        const maeRanges = [
          { min: 0, max: 1, label: '0-1%' },
          { min: 1, max: 2, label: '1-2%' },
          { min: 2, max: 5, label: '2-5%' },
          { min: 5, max: 10, label: '5-10%' },
          { min: 10, max: Infinity, label: '>10%' }
        ]

        const mfeRanges = [
          { min: 0, max: 1, label: '0-1%' },
          { min: 1, max: 2, label: '1-2%' },
          { min: 2, max: 5, label: '2-5%' },
          { min: 5, max: 10, label: '5-10%' },
          { min: 10, max: Infinity, label: '>10%' }
        ]

        const maeDistribution = maeRanges.map(range => ({
          range: range.label,
          count: trades.filter(t => t.mae! >= range.min && t.mae! < range.max).length
        }))

        const mfeDistribution = mfeRanges.map(range => ({
          range: range.label,
          count: trades.filter(t => t.mfe! >= range.min && t.mfe! < range.max).length
        }))

        // Calculate average efficiency
        const efficiencies = trades
          .filter(t => t.exit && t.mfe && t.mfe > 0)
          .map(t => {
            const actualProfit = t.type === 'BUY'
              ? ((t.exit! - t.entry) / t.entry) * 100
              : ((t.entry - t.exit!) / t.entry) * 100
            return actualProfit > 0 ? (actualProfit / t.mfe!) * 100 : 0
          })

        const avgEfficiency = efficiencies.length > 0
          ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length
          : 0

        return NextResponse.json({
          success: true,
          data: {
            ...stats,
            avgEfficiency,
            maeDistribution,
            mfeDistribution,
            trades: trades.map(t => {
              // Calculate P&L for each trade
              let pnl = 0
              if (t.exit) {
                const priceDiff = t.type === 'BUY' ? t.exit - t.entry : t.entry - t.exit
                pnl = priceDiff * t.quantity
                
                // Apply market-specific multipliers if needed
                if (t.marketType === 'FUTURES') {
                  // Add futures multiplier logic here
                } else if (t.marketType === 'OPTIONS') {
                  pnl *= 100 // Options are per 100 shares
                }
              }
              
              return {
                id: t.id,
                symbol: t.symbol,
                mae: t.mae || 0,
                mfe: t.mfe || 0,
                edgeRatio: t.edgeRatio || 0,
                pnl
              }
            })
          }
        })
      }

      case 'getTradeExcursion': {
        if (!tradeId) {
          return NextResponse.json(
            { error: 'Trade ID is required' },
            { status: 400 }
          )
        }

        // Verify trade belongs to user
        const trade = await prisma.trade.findFirst({
          where: { id: tradeId, userId: user.id }
        })

        if (!trade) {
          return NextResponse.json(
            { error: 'Trade not found' },
            { status: 404 }
          )
        }

        const excursionData = await ExcursionBatchService.getTradeExcursionData(tradeId)

        if (!excursionData) {
          return NextResponse.json(
            { error: 'Excursion data not found. Please process the trade first.' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          data: excursionData
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Excursion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}