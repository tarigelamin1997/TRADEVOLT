import { prisma } from '@/lib/db'
import type { Trade } from '@prisma/client'
import { ExcursionCalculator } from './excursion-calculator'
import { priceDataService } from './price-data-service'
import type { ExcursionData } from '@/lib/types/excursion'

export class ExcursionBatchService {
  /**
   * Process excursion metrics for a single trade
   */
  static async processTradeExcursions(tradeId: string): Promise<ExcursionData> {
    // Fetch the trade
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    })
    
    if (!trade) {
      throw new Error('Trade not found')
    }
    
    if (!trade.entryTime) {
      throw new Error('Trade must have entry time to calculate excursions')
    }
    
    try {
      // Check if we already have price data
      const existingPriceData = await prisma.tradePriceData.findMany({
        where: { tradeId },
        orderBy: { timestamp: 'asc' }
      })
      
      let priceData
      if (existingPriceData.length > 0) {
        // Use existing data
        priceData = existingPriceData.map(d => ({
          timestamp: d.timestamp,
          price: d.price,
          volume: d.volume || undefined
        }))
      } else {
        // Fetch new price data
        priceData = await priceDataService.fetchTradeData(trade as Trade)
        
        // Store price data for future use
        if (priceData.length > 0) {
          await prisma.tradePriceData.createMany({
            data: priceData.map(d => ({
              tradeId,
              timestamp: d.timestamp,
              price: d.price,
              volume: d.volume
            }))
          })
        }
      }
      
      // Calculate metrics
      const metrics = ExcursionCalculator.calculateMetrics(trade as Trade, priceData)
      const runningPnL = ExcursionCalculator.calculateRunningPnL(trade as Trade, priceData)
      
      // Update trade with excursion metrics
      await prisma.trade.update({
        where: { id: tradeId },
        data: {
          mae: metrics.mae,
          mfe: metrics.mfe,
          edgeRatio: metrics.edgeRatio,
          updrawPercent: metrics.updrawPercent
        }
      })
      
      // Store excursion snapshots (sample every 10th point to reduce storage)
      const sampledSnapshots = runningPnL.filter((_, index) => index % 10 === 0)
      if (sampledSnapshots.length > 0) {
        await prisma.tradeExcursion.createMany({
          data: sampledSnapshots.map(snapshot => ({
            tradeId,
            timestamp: snapshot.timestamp,
            price: snapshot.price,
            runningPnl: snapshot.pnl,
            runningPnlPercent: snapshot.pnlPercent,
            maeAtTime: snapshot.maeAtTime,
            mfeAtTime: snapshot.mfeAtTime
          })),
          skipDuplicates: true
        })
      }
      
      return {
        ...metrics,
        runningPnL,
        priceData
      }
    } catch (error) {
      console.error(`Failed to process excursions for trade ${tradeId}:`, error)
      throw error
    }
  }
  
  /**
   * Process excursion metrics for all historical trades of a user
   */
  static async processHistoricalTrades(
    userId: string,
    options?: {
      batchSize?: number
      onProgress?: (processed: number, total: number) => void
    }
  ): Promise<{ processed: number; failed: number; errors: string[] }> {
    const batchSize = options?.batchSize || 10
    const errors: string[] = []
    let processed = 0
    let failed = 0
    
    // Get all trades without excursion data
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        mae: null,
        entryTime: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const total = trades.length
    console.log(`Found ${total} trades to process for user ${userId}`)
    
    // Process in batches
    for (let i = 0; i < trades.length; i += batchSize) {
      const batch = trades.slice(i, i + batchSize)
      
      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map(trade => this.processTradeExcursions(trade.id))
      )
      
      // Count successes and failures
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processed++
        } else {
          failed++
          const trade = batch[index]
          errors.push(`Trade ${trade.symbol} (${trade.id}): ${result.reason}`)
        }
      })
      
      // Report progress
      if (options?.onProgress) {
        options.onProgress(processed + failed, total)
      }
      
      // Rate limiting - wait 1 second between batches
      if (i + batchSize < trades.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`Processed ${processed} trades successfully, ${failed} failed`)
    
    return { processed, failed, errors }
  }
  
  /**
   * Get excursion data for a trade
   */
  static async getTradeExcursionData(tradeId: string): Promise<ExcursionData | null> {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        priceData: {
          orderBy: { timestamp: 'asc' }
        },
        excursions: {
          orderBy: { timestamp: 'asc' }
        }
      }
    })
    
    if (!trade || trade.mae === null || trade.mfe === null) {
      return null
    }
    
    return {
      mae: trade.mae,
      mfe: trade.mfe,
      edgeRatio: trade.edgeRatio || 0,
      updrawPercent: trade.updrawPercent,
      priceData: trade.priceData.map(d => ({
        timestamp: d.timestamp,
        price: d.price,
        volume: d.volume || undefined
      })),
      runningPnL: trade.excursions.map(e => ({
        timestamp: e.timestamp,
        price: e.price,
        pnl: e.runningPnl,
        pnlPercent: e.runningPnlPercent,
        maeAtTime: e.maeAtTime,
        mfeAtTime: e.mfeAtTime
      }))
    }
  }
  
  /**
   * Calculate aggregate excursion statistics for a user
   */
  static async getUserExcursionStats(userId: string): Promise<{
    avgMAE: number
    avgMFE: number
    avgEdgeRatio: number
    totalTrades: number
  }> {
    const stats = await prisma.trade.aggregate({
      where: {
        userId,
        mae: { not: null },
        mfe: { not: null }
      },
      _avg: {
        mae: true,
        mfe: true,
        edgeRatio: true
      },
      _count: true
    })
    
    return {
      avgMAE: stats._avg.mae || 0,
      avgMFE: stats._avg.mfe || 0,
      avgEdgeRatio: stats._avg.edgeRatio || 0,
      totalTrades: stats._count
    }
  }
}