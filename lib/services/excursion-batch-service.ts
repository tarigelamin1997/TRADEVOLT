import { ExcursionCalculator } from './excursion-calculator'
import { priceDataService } from './price-data-service'
import type { ExcursionData } from '@/lib/types/excursion'
import * as dbMemory from '@/lib/db-memory'
import type { Trade } from '@/lib/db-memory'

export class ExcursionBatchService {
  /**
   * Process excursion metrics for a single trade
   */
  static async processTradeExcursions(tradeId: string): Promise<ExcursionData> {
    // Fetch the trade
    const trades = await dbMemory.findAllTrades()
    const trade = trades.find(t => t.id === tradeId)
    
    if (!trade) {
      throw new Error('Trade not found')
    }
    
    if (!trade.entryTime) {
      throw new Error('Trade must have entry time to calculate excursions')
    }
    
    try {
      // Check if we already have price data
      // For now, we'll always fetch fresh data since we're using in-memory DB
      const existingPriceData: any[] = []
      
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
        
        // In-memory DB doesn't store price data persistently
        // Skip storing for now
      }
      
      // Calculate metrics
      const metrics = ExcursionCalculator.calculateMetrics(trade as Trade, priceData)
      const runningPnL = ExcursionCalculator.calculateRunningPnL(trade as Trade, priceData)
      
      // Update trade with excursion metrics
      await dbMemory.updateTrade(tradeId, {
        mae: metrics.mae,
        mfe: metrics.mfe,
        edgeRatio: metrics.edgeRatio,
        updrawPercent: metrics.updrawPercent
      })
      
      // Skip storing excursion snapshots in in-memory DB
      
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
    const userTrades = await dbMemory.findTradesByUserId(userId)
    const trades = userTrades.filter(t => t.mae === null && t.entryTime !== null)
    
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
    const trades = await dbMemory.findAllTrades()
    const trade = trades.find(t => t.id === tradeId)
    
    if (!trade || trade.mae === null || trade.mfe === null) {
      return null
    }
    
    // For in-memory DB, we need to recalculate the data
    const priceData = await priceDataService.fetchTradeData(trade as Trade)
    const runningPnL = ExcursionCalculator.calculateRunningPnL(trade as Trade, priceData)
    
    return {
      mae: trade.mae!,
      mfe: trade.mfe!,
      edgeRatio: trade.edgeRatio || 0,
      updrawPercent: trade.updrawPercent ?? null,
      priceData,
      runningPnL
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
    const trades = await dbMemory.findTradesByUserId(userId)
    const tradesWithMetrics = trades.filter(t => t.mae !== null && t.mae !== undefined && t.mfe !== null && t.mfe !== undefined)
    
    if (tradesWithMetrics.length === 0) {
      return {
        avgMAE: 0,
        avgMFE: 0,
        avgEdgeRatio: 0,
        totalTrades: 0
      }
    }
    
    const avgMAE = tradesWithMetrics.reduce((sum, t) => sum + (t.mae || 0), 0) / tradesWithMetrics.length
    const avgMFE = tradesWithMetrics.reduce((sum, t) => sum + (t.mfe || 0), 0) / tradesWithMetrics.length
    const avgEdgeRatio = tradesWithMetrics.reduce((sum, t) => sum + (t.edgeRatio || 0), 0) / tradesWithMetrics.length
    
    return {
      avgMAE,
      avgMFE,
      avgEdgeRatio,
      totalTrades: tradesWithMetrics.length
    }
  }
}