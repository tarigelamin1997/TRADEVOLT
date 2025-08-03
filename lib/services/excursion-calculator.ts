import type { Trade } from '@/lib/db-memory'
import type { PriceData, RunningPnL, ExcursionMetrics } from '@/lib/types/excursion'
import { calculateMarketPnL } from '@/lib/market-knowledge'

export class ExcursionCalculator {
  /**
   * Calculate Maximum Adverse Excursion (MAE)
   * The worst drawdown experienced during the trade
   */
  static calculateMAE(
    trade: Trade,
    priceData: PriceData[]
  ): number {
    if (priceData.length === 0) return 0
    
    const prices = priceData.map(d => d.price)
    const entryPrice = trade.entry
    
    if (trade.type === 'BUY') {
      const lowestPrice = Math.min(...prices)
      return ((entryPrice - lowestPrice) / entryPrice) * 100
    } else {
      const highestPrice = Math.max(...prices)
      return ((highestPrice - entryPrice) / entryPrice) * 100
    }
  }
  
  /**
   * Calculate Maximum Favorable Excursion (MFE)
   * The best unrealized profit achieved during the trade
   */
  static calculateMFE(
    trade: Trade,
    priceData: PriceData[]
  ): number {
    if (priceData.length === 0) return 0
    
    const prices = priceData.map(d => d.price)
    const entryPrice = trade.entry
    
    if (trade.type === 'BUY') {
      const highestPrice = Math.max(...prices)
      return ((highestPrice - entryPrice) / entryPrice) * 100
    } else {
      const lowestPrice = Math.min(...prices)
      return ((entryPrice - lowestPrice) / entryPrice) * 100
    }
  }
  
  /**
   * Calculate MAE at a specific point in time
   */
  static calculateMAEAtPoint(
    trade: Trade,
    priceData: PriceData[],
    targetTime: Date
  ): number {
    const relevantData = priceData.filter(d => d.timestamp <= targetTime)
    return this.calculateMAE(trade, relevantData)
  }
  
  /**
   * Calculate MFE at a specific point in time
   */
  static calculateMFEAtPoint(
    trade: Trade,
    priceData: PriceData[],
    targetTime: Date
  ): number {
    const relevantData = priceData.filter(d => d.timestamp <= targetTime)
    return this.calculateMFE(trade, relevantData)
  }
  
  /**
   * Calculate P&L at a specific price
   */
  static calculatePnLAtPrice(
    trade: Trade,
    currentPrice: number
  ): { amount: number; percent: number } {
    const mockTrade = {
      ...trade,
      exit: currentPrice,
      exitTime: new Date()
    }
    
    const amount = calculateMarketPnL(mockTrade, trade.marketType || null) || 0
    const percent = trade.type === 'BUY'
      ? ((currentPrice - trade.entry) / trade.entry) * 100
      : ((trade.entry - currentPrice) / trade.entry) * 100
    
    return { amount, percent }
  }
  
  /**
   * Calculate running P&L throughout the trade
   */
  static calculateRunningPnL(
    trade: Trade,
    priceData: PriceData[]
  ): RunningPnL[] {
    return priceData.map(data => {
      const pnl = this.calculatePnLAtPrice(trade, data.price)
      const mae = this.calculateMAEAtPoint(trade, priceData, data.timestamp)
      const mfe = this.calculateMFEAtPoint(trade, priceData, data.timestamp)
      
      return {
        timestamp: data.timestamp,
        price: data.price,
        pnl: pnl.amount,
        pnlPercent: pnl.percent,
        maeAtTime: mae,
        mfeAtTime: mfe
      }
    })
  }
  
  /**
   * Calculate Edge Ratio (MFE/MAE)
   * Higher ratio indicates better trade quality
   */
  static calculateEdgeRatio(mae: number, mfe: number): number {
    if (mae === 0) return mfe > 0 ? 100 : 0 // Cap at 100 for display
    return Math.min(mfe / mae, 100) // Cap at 100 to avoid infinity
  }
  
  /**
   * Calculate Updraw percentage
   * How close the price came to the take profit target
   */
  static calculateUpdraw(
    mfe: number,
    takeProfitPrice: number | null,
    entryPrice: number,
    tradeType: 'BUY' | 'SELL'
  ): number | null {
    if (!takeProfitPrice) return null
    
    const targetProfit = tradeType === 'BUY' 
      ? ((takeProfitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - takeProfitPrice) / entryPrice) * 100
    
    if (targetProfit <= 0) return null
    
    return Math.min((mfe / targetProfit) * 100, 100) // Cap at 100%
  }
  
  /**
   * Calculate exit efficiency
   * How well the trader captured the available profit
   */
  static calculateExitEfficiency(
    trade: Trade,
    mfe: number
  ): number | null {
    if (!trade.exit || mfe === 0) return null
    
    const actualProfit = trade.type === 'BUY'
      ? ((trade.exit - trade.entry) / trade.entry) * 100
      : ((trade.entry - trade.exit) / trade.entry) * 100
    
    if (actualProfit <= 0) return 0
    
    return Math.min((actualProfit / mfe) * 100, 100)
  }
  
  /**
   * Calculate all excursion metrics for a trade
   */
  static calculateMetrics(
    trade: Trade,
    priceData: PriceData[]
  ): ExcursionMetrics {
    const mae = this.calculateMAE(trade, priceData)
    const mfe = this.calculateMFE(trade, priceData)
    const edgeRatio = this.calculateEdgeRatio(mae, mfe)
    const updrawPercent = this.calculateUpdraw(
      mfe,
      trade.takeProfitPrice,
      trade.entry,
      trade.type as 'BUY' | 'SELL'
    )
    
    return {
      mae,
      mfe,
      edgeRatio,
      updrawPercent
    }
  }
  
  /**
   * Get trade duration in minutes
   */
  static getTradeDuration(trade: Trade): number {
    if (!trade.entryTime) return 0
    const entryTime = new Date(trade.entryTime)
    const exitTime = trade.exitTime ? new Date(trade.exitTime) : new Date()
    return Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60))
  }
  
  /**
   * Determine appropriate interval based on trade duration
   */
  static determineInterval(trade: Trade): '1m' | '5m' | '15m' | '1h' {
    const duration = this.getTradeDuration(trade)
    
    if (duration < 60) return '1m'        // < 1 hour: 1-minute bars
    if (duration < 240) return '5m'       // < 4 hours: 5-minute bars
    if (duration < 1440) return '15m'     // < 1 day: 15-minute bars
    return '1h'                           // > 1 day: hourly bars
  }
}