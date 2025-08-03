import type { Trade, PartialExit } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

// Interfaces for execution metrics
export interface SlippageData {
  entrySlippage: number | null
  exitSlippage: number | null
  entrySlippageCost: number | null
  exitSlippageCost: number | null
  totalSlippageCost: number | null
}

export interface SlippageMetrics {
  averageEntrySlippage: number
  averageExitSlippage: number
  totalSlippageCost: number
  worstSlippage: {
    trade: Trade | null
    amount: number
    cost: number
  }
  bestExecution: {
    trade: Trade | null
    amount: number
    cost: number
  }
  slippageByMarket: Record<string, {
    avgEntry: number
    avgExit: number
    totalCost: number
  }>
}

export interface HitRateData {
  rate: number
  totalTrades: number
  tradesHit: number
  averageMove: number
  timeToHit: number | null // average hours
  missedByPercent: number // average % missed when not hit
}

export interface HitRateMetrics {
  stopLoss: HitRateData & {
    averageLoss: number
    winRateWithoutSL: number
  }
  takeProfit: HitRateData & {
    averageGain: number
    missedProfit: number
  }
}

export interface PartialExitAnalysis {
  efficiency: number // % better/worse than holding full position
  averageExitPoints: number[] // % of move captured at each exit
  optimalExitPrice: number
  actualWeightedExit: number
  performanceVsOptimal: number
}

export interface PartialExitMetrics {
  averageEfficiency: number
  tradesWithPartials: number
  scaleOutSuccess: number // % of successful scale-outs
  positionManagementScore: number // 0-100
}

export interface CommissionMetrics {
  totalCommission: number
  averagePerTrade: number
  commissionAsPercentOfPnL: number
  commissionAsPercentOfVolume: number
  breakEvenMove: Record<string, number> // by market type
  commissionByMarket: Record<string, {
    total: number
    average: number
    percentOfPnL: number
  }>
}

export interface ExecutionMetrics {
  slippage: SlippageMetrics
  hitRates: HitRateMetrics
  partialExits: PartialExitMetrics
  commission: CommissionMetrics
  executionScore: number // 0-100 overall score
  insights: string[]
}

export class ExecutionAnalysisService {
  
  // Main analysis function
  static analyzeExecution(trades: Trade[]): ExecutionMetrics {
    if (trades.length === 0) {
      return this.getEmptyMetrics()
    }

    // Calculate all metrics
    const slippage = this.calculateSlippageMetrics(trades)
    const hitRates = this.calculateHitRates(trades)
    const partialExits = this.analyzePartialExits(trades)
    const commission = this.calculateCommissionImpact(trades)
    
    // Calculate overall execution score
    const executionScore = this.calculateExecutionScore(
      slippage,
      hitRates,
      partialExits,
      commission
    )
    
    // Generate insights
    const insights = this.generateInsights(
      slippage,
      hitRates,
      partialExits,
      commission
    )

    return {
      slippage,
      hitRates,
      partialExits,
      commission,
      executionScore,
      insights
    }
  }

  // Calculate slippage for a single trade
  static calculateSlippage(trade: Trade): SlippageData {
    let entrySlippage: number | null = null
    let exitSlippage: number | null = null
    let entrySlippageCost: number | null = null
    let exitSlippageCost: number | null = null

    // Entry slippage
    if (trade.intendedEntry && trade.entry) {
      // For BUY: positive slippage = worse (paid more)
      // For SELL: negative slippage = worse (sold for less)
      if (trade.type === 'BUY') {
        entrySlippage = ((trade.entry - trade.intendedEntry) / trade.intendedEntry) * 100
        entrySlippageCost = (trade.entry - trade.intendedEntry) * trade.quantity
      } else {
        entrySlippage = ((trade.intendedEntry - trade.entry) / trade.intendedEntry) * 100
        entrySlippageCost = (trade.intendedEntry - trade.entry) * trade.quantity
      }
    }

    // Exit slippage
    if (trade.intendedExit && trade.exit) {
      // For BUY: negative slippage = worse (sold for less)
      // For SELL: positive slippage = worse (bought back for more)
      if (trade.type === 'BUY') {
        exitSlippage = ((trade.intendedExit - trade.exit) / trade.intendedExit) * 100
        exitSlippageCost = (trade.intendedExit - trade.exit) * trade.quantity
      } else {
        exitSlippage = ((trade.exit - trade.intendedExit) / trade.intendedExit) * 100
        exitSlippageCost = (trade.exit - trade.intendedExit) * trade.quantity
      }
    }

    const totalSlippageCost = (entrySlippageCost || 0) + (exitSlippageCost || 0)

    return {
      entrySlippage,
      exitSlippage,
      entrySlippageCost,
      exitSlippageCost,
      totalSlippageCost: totalSlippageCost !== 0 ? totalSlippageCost : null
    }
  }

  // Calculate slippage metrics for all trades
  private static calculateSlippageMetrics(trades: Trade[]): SlippageMetrics {
    const slippageData = trades.map(trade => ({
      trade,
      slippage: this.calculateSlippage(trade)
    }))

    // Filter trades with slippage data
    const tradesWithEntrySlippage = slippageData.filter(d => d.slippage.entrySlippage !== null)
    const tradesWithExitSlippage = slippageData.filter(d => d.slippage.exitSlippage !== null)

    // Calculate averages
    const avgEntrySlippage = tradesWithEntrySlippage.length > 0
      ? tradesWithEntrySlippage.reduce((sum, d) => sum + d.slippage.entrySlippage!, 0) / tradesWithEntrySlippage.length
      : 0

    const avgExitSlippage = tradesWithExitSlippage.length > 0
      ? tradesWithExitSlippage.reduce((sum, d) => sum + d.slippage.exitSlippage!, 0) / tradesWithExitSlippage.length
      : 0

    // Total cost
    const totalSlippageCost = slippageData.reduce((sum, d) => sum + (d.slippage.totalSlippageCost || 0), 0)

    // Find worst and best
    const sortedByTotal = slippageData
      .filter(d => d.slippage.totalSlippageCost !== null)
      .sort((a, b) => b.slippage.totalSlippageCost! - a.slippage.totalSlippageCost!)

    const worstSlippage = sortedByTotal[0] || null
    const bestExecution = sortedByTotal[sortedByTotal.length - 1] || null

    // Slippage by market type
    const slippageByMarket: Record<string, any> = {}
    const marketGroups = this.groupByMarket(trades)
    
    Object.entries(marketGroups).forEach(([market, marketTrades]) => {
      const marketSlippage = marketTrades.map(t => this.calculateSlippage(t))
      const entrySlippages = marketSlippage.filter(s => s.entrySlippage !== null)
      const exitSlippages = marketSlippage.filter(s => s.exitSlippage !== null)
      
      slippageByMarket[market] = {
        avgEntry: entrySlippages.length > 0
          ? entrySlippages.reduce((sum, s) => sum + s.entrySlippage!, 0) / entrySlippages.length
          : 0,
        avgExit: exitSlippages.length > 0
          ? exitSlippages.reduce((sum, s) => sum + s.exitSlippage!, 0) / exitSlippages.length
          : 0,
        totalCost: marketSlippage.reduce((sum, s) => sum + (s.totalSlippageCost || 0), 0)
      }
    })

    return {
      averageEntrySlippage: avgEntrySlippage,
      averageExitSlippage: avgExitSlippage,
      totalSlippageCost,
      worstSlippage: worstSlippage ? {
        trade: worstSlippage.trade,
        amount: (worstSlippage.slippage.entrySlippage || 0) + (worstSlippage.slippage.exitSlippage || 0),
        cost: worstSlippage.slippage.totalSlippageCost!
      } : {
        trade: null,
        amount: 0,
        cost: 0
      },
      bestExecution: bestExecution ? {
        trade: bestExecution.trade,
        amount: (bestExecution.slippage.entrySlippage || 0) + (bestExecution.slippage.exitSlippage || 0),
        cost: bestExecution.slippage.totalSlippageCost!
      } : {
        trade: null,
        amount: 0,
        cost: 0
      },
      slippageByMarket
    }
  }

  // Calculate hit rates for stop loss and take profit
  private static calculateHitRates(trades: Trade[]): HitRateMetrics {
    // Stop Loss Analysis
    const tradesWithSL = trades.filter(t => t.stopLossPrice !== null && t.stopLossPrice !== undefined)
    const slHitTrades = tradesWithSL.filter(t => t.wasStopLossHit === true)
    
    // Calculate average loss when SL hit
    const slLosses = slHitTrades.map(t => calculateMarketPnL(t, t.marketType || null) || 0)
    const avgSLLoss = slLosses.length > 0 
      ? slLosses.reduce((sum, loss) => sum + loss, 0) / slLosses.length
      : 0

    // Win rate without SL hits
    const tradesWithoutSLHit = trades.filter(t => !t.wasStopLossHit)
    const winsWithoutSL = tradesWithoutSLHit.filter(t => {
      const pnl = calculateMarketPnL(t, t.marketType || null) || 0
      return pnl > 0
    })
    const winRateWithoutSL = tradesWithoutSLHit.length > 0
      ? (winsWithoutSL.length / tradesWithoutSLHit.length) * 100
      : 0

    // Take Profit Analysis
    const tradesWithTP = trades.filter(t => t.takeProfitPrice !== null && t.takeProfitPrice !== undefined)
    const tpHitTrades = tradesWithTP.filter(t => t.wasTakeProfitHit === true)
    
    // Calculate average gain when TP hit
    const tpGains = tpHitTrades.map(t => calculateMarketPnL(t, t.marketType || null) || 0)
    const avgTPGain = tpGains.length > 0 
      ? tpGains.reduce((sum, gain) => sum + gain, 0) / tpGains.length
      : 0

    // Calculate missed profit (trades that didn't hit TP but were profitable)
    const missedTPTrades = tradesWithTP.filter(t => 
      !t.wasTakeProfitHit && 
      t.exit && 
      t.mfe && 
      t.mfe > 0
    )
    
    const missedProfit = missedTPTrades.reduce((sum, trade) => {
      if (!trade.takeProfitPrice || !trade.exit) return sum
      
      const actualPnL = calculateMarketPnL(trade, trade.marketType || null) || 0
      const potentialPnL = trade.type === 'BUY'
        ? (trade.takeProfitPrice - trade.entry) * trade.quantity
        : (trade.entry - trade.takeProfitPrice) * trade.quantity
      
      return sum + Math.max(0, potentialPnL - actualPnL)
    }, 0)

    return {
      stopLoss: {
        rate: tradesWithSL.length > 0 ? (slHitTrades.length / tradesWithSL.length) * 100 : 0,
        totalTrades: tradesWithSL.length,
        tradesHit: slHitTrades.length,
        averageMove: this.calculateAverageMove(tradesWithSL, 'stopLoss'),
        timeToHit: this.calculateAverageTimeToHit(slHitTrades),
        missedByPercent: this.calculateAverageMissedBy(tradesWithSL.filter(t => !t.wasStopLossHit), 'stopLoss'),
        averageLoss: avgSLLoss,
        winRateWithoutSL
      },
      takeProfit: {
        rate: tradesWithTP.length > 0 ? (tpHitTrades.length / tradesWithTP.length) * 100 : 0,
        totalTrades: tradesWithTP.length,
        tradesHit: tpHitTrades.length,
        averageMove: this.calculateAverageMove(tradesWithTP, 'takeProfit'),
        timeToHit: this.calculateAverageTimeToHit(tpHitTrades),
        missedByPercent: this.calculateAverageMissedBy(tradesWithTP.filter(t => !t.wasTakeProfitHit), 'takeProfit'),
        averageGain: avgTPGain,
        missedProfit
      }
    }
  }

  // Analyze partial exits performance
  private static analyzePartialExits(trades: Trade[]): PartialExitMetrics {
    const tradesWithPartials = trades.filter(t => t.partialExits && t.partialExits.length > 0)
    
    if (tradesWithPartials.length === 0) {
      return {
        averageEfficiency: 0,
        tradesWithPartials: 0,
        scaleOutSuccess: 0,
        positionManagementScore: 0
      }
    }

    const efficiencies = tradesWithPartials.map(trade => {
      const analysis = this.analyzeTradePartialExits(trade)
      return analysis.efficiency
    })

    const avgEfficiency = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length

    // Calculate scale-out success (partial exits that captured profit)
    const successfulScaleOuts = tradesWithPartials.filter(trade => {
      const analysis = this.analyzeTradePartialExits(trade)
      return analysis.efficiency > 0
    })

    const scaleOutSuccess = (successfulScaleOuts.length / tradesWithPartials.length) * 100

    // Position management score (0-100)
    // Based on: efficiency, number of partials, timing
    const positionManagementScore = Math.min(100, Math.max(0,
      (avgEfficiency * 0.5) + 
      (scaleOutSuccess * 0.3) + 
      (Math.min(tradesWithPartials.length / trades.length * 100, 20) * 0.2)
    ))

    return {
      averageEfficiency: avgEfficiency,
      tradesWithPartials: tradesWithPartials.length,
      scaleOutSuccess,
      positionManagementScore
    }
  }

  // Analyze partial exits for a single trade
  private static analyzeTradePartialExits(trade: Trade): PartialExitAnalysis {
    if (!trade.partialExits || trade.partialExits.length === 0) {
      return {
        efficiency: 0,
        averageExitPoints: [],
        optimalExitPrice: trade.exit || trade.entry,
        actualWeightedExit: trade.exit || trade.entry,
        performanceVsOptimal: 0
      }
    }

    // Calculate weighted average exit price
    let totalQuantity = 0
    let weightedPrice = 0
    
    trade.partialExits.forEach(exit => {
      totalQuantity += exit.quantity
      weightedPrice += exit.price * exit.quantity
    })

    // Add final exit if exists
    if (trade.exit) {
      const remainingQty = trade.quantity - totalQuantity
      if (remainingQty > 0) {
        totalQuantity += remainingQty
        weightedPrice += trade.exit * remainingQty
      }
    }

    const actualWeightedExit = totalQuantity > 0 ? weightedPrice / totalQuantity : trade.entry

    // Optimal exit would be at MFE
    const optimalExitPrice = trade.type === 'BUY'
      ? trade.entry * (1 + (trade.mfe || 0) / 100)
      : trade.entry * (1 - (trade.mfe || 0) / 100)

    // Calculate efficiency
    const actualReturn = trade.type === 'BUY'
      ? (actualWeightedExit - trade.entry) / trade.entry
      : (trade.entry - actualWeightedExit) / trade.entry

    const optimalReturn = trade.type === 'BUY'
      ? (optimalExitPrice - trade.entry) / trade.entry
      : (trade.entry - optimalExitPrice) / trade.entry

    const efficiency = optimalReturn !== 0 ? (actualReturn / optimalReturn) * 100 : 0

    // Calculate exit points as percentage of move
    const exitPoints = trade.partialExits.map(exit => {
      const movePercent = trade.type === 'BUY'
        ? ((exit.price - trade.entry) / trade.entry) * 100
        : ((trade.entry - exit.price) / trade.entry) * 100
      return movePercent
    })

    return {
      efficiency,
      averageExitPoints: exitPoints,
      optimalExitPrice,
      actualWeightedExit,
      performanceVsOptimal: efficiency - 100
    }
  }

  // Calculate commission impact
  private static calculateCommissionImpact(trades: Trade[]): CommissionMetrics {
    const tradesWithCommission = trades.filter(t => t.commission !== null && t.commission !== undefined)
    
    const totalCommission = tradesWithCommission.reduce((sum, t) => sum + (t.commission || 0), 0)
    const avgPerTrade = tradesWithCommission.length > 0 
      ? totalCommission / tradesWithCommission.length 
      : 0

    // Calculate commission as % of P&L
    const totalPnL = trades.reduce((sum, t) => sum + (calculateMarketPnL(t, t.marketType || null) || 0), 0)
    const totalVolume = trades.reduce((sum, t) => sum + (t.entry * t.quantity), 0)
    
    const commissionAsPercentOfPnL = totalPnL !== 0 
      ? Math.abs(totalCommission / totalPnL) * 100 
      : 0
      
    const commissionAsPercentOfVolume = totalVolume !== 0
      ? (totalCommission / totalVolume) * 100
      : 0

    // Break-even move by market type
    const breakEvenMove: Record<string, number> = {}
    const commissionByMarket: Record<string, any> = {}
    
    const marketGroups = this.groupByMarket(trades)
    
    Object.entries(marketGroups).forEach(([market, marketTrades]) => {
      const marketCommission = marketTrades.reduce((sum, t) => sum + (t.commission || 0), 0)
      const marketPnL = marketTrades.reduce((sum, t) => sum + (calculateMarketPnL(t, t.marketType || null) || 0), 0)
      const avgCommissionPerTrade = marketTrades.length > 0 ? marketCommission / marketTrades.length : 0
      
      // Calculate average trade size
      const avgTradeSize = marketTrades.reduce((sum, t) => sum + (t.entry * t.quantity), 0) / marketTrades.length
      
      // Break-even move = commission / trade size * 100
      breakEvenMove[market] = avgTradeSize > 0 ? (avgCommissionPerTrade * 2 / avgTradeSize) * 100 : 0
      
      commissionByMarket[market] = {
        total: marketCommission,
        average: avgCommissionPerTrade,
        percentOfPnL: marketPnL !== 0 ? Math.abs(marketCommission / marketPnL) * 100 : 0
      }
    })

    return {
      totalCommission,
      averagePerTrade: avgPerTrade,
      commissionAsPercentOfPnL,
      commissionAsPercentOfVolume,
      breakEvenMove,
      commissionByMarket
    }
  }

  // Calculate overall execution score
  private static calculateExecutionScore(
    slippage: SlippageMetrics,
    hitRates: HitRateMetrics,
    partialExits: PartialExitMetrics,
    commission: CommissionMetrics
  ): number {
    // Weights for each component
    const weights = {
      slippage: 0.25,
      stopLoss: 0.20,
      takeProfit: 0.20,
      partialExits: 0.15,
      commission: 0.20
    }

    // Slippage score (lower is better)
    const avgSlippage = (Math.abs(slippage.averageEntrySlippage) + Math.abs(slippage.averageExitSlippage)) / 2
    const slippageScore = Math.max(0, 100 - (avgSlippage * 20)) // 0.5% slippage = 90 score

    // Stop loss score (balanced hit rate is better)
    const slScore = hitRates.stopLoss.rate > 0
      ? Math.min(100, 100 - Math.abs(hitRates.stopLoss.rate - 35) * 2) // 35% is ideal
      : 50

    // Take profit score (higher hit rate is better)
    const tpScore = Math.min(100, hitRates.takeProfit.rate * 1.5)

    // Partial exits score
    const partialScore = partialExits.positionManagementScore

    // Commission score (lower is better)
    const commissionScore = Math.max(0, 100 - commission.commissionAsPercentOfPnL)

    // Calculate weighted score
    const executionScore = 
      slippageScore * weights.slippage +
      slScore * weights.stopLoss +
      tpScore * weights.takeProfit +
      partialScore * weights.partialExits +
      commissionScore * weights.commission

    return Math.round(executionScore)
  }

  // Generate insights based on metrics
  private static generateInsights(
    slippage: SlippageMetrics,
    hitRates: HitRateMetrics,
    partialExits: PartialExitMetrics,
    commission: CommissionMetrics
  ): string[] {
    const insights: string[] = []

    // Slippage insights
    if (Math.abs(slippage.averageEntrySlippage) > 0.1) {
      insights.push(`High entry slippage (${slippage.averageEntrySlippage.toFixed(2)}%). Consider using limit orders.`)
    }
    
    if (slippage.totalSlippageCost > 100) {
      insights.push(`Slippage cost you $${slippage.totalSlippageCost.toFixed(2)}. Improve order timing.`)
    }

    // Stop loss insights
    if (hitRates.stopLoss.rate > 50) {
      insights.push(`Stop losses hit too often (${hitRates.stopLoss.rate.toFixed(0)}%). Consider wider stops or better entries.`)
    } else if (hitRates.stopLoss.rate < 20 && hitRates.stopLoss.totalTrades > 10) {
      insights.push(`Stop losses rarely hit (${hitRates.stopLoss.rate.toFixed(0)}%). You might be cutting winners too early.`)
    }

    // Take profit insights
    if (hitRates.takeProfit.rate < 40 && hitRates.takeProfit.totalTrades > 10) {
      insights.push(`Low target hit rate (${hitRates.takeProfit.rate.toFixed(0)}%). Consider more realistic targets.`)
    }
    
    if (hitRates.takeProfit.missedProfit > 1000) {
      insights.push(`You left $${hitRates.takeProfit.missedProfit.toFixed(2)} on the table by missing targets.`)
    }

    // Partial exits insights
    if (partialExits.averageEfficiency < 80 && partialExits.tradesWithPartials > 5) {
      insights.push(`Partial exits underperforming. Review your scaling strategy.`)
    }

    // Commission insights
    if (commission.commissionAsPercentOfPnL > 20) {
      insights.push(`Commissions eating ${commission.commissionAsPercentOfPnL.toFixed(0)}% of profits. Consider broker options.`)
    }

    return insights
  }

  // Helper functions
  private static groupByMarket(trades: Trade[]): Record<string, Trade[]> {
    const groups: Record<string, Trade[]> = {}
    
    trades.forEach(trade => {
      const market = trade.marketType || 'UNKNOWN'
      if (!groups[market]) {
        groups[market] = []
      }
      groups[market].push(trade)
    })
    
    return groups
  }

  private static calculateAverageMove(trades: Trade[], type: 'stopLoss' | 'takeProfit'): number {
    const moves = trades.map(trade => {
      const targetPrice = type === 'stopLoss' ? trade.stopLossPrice : trade.takeProfitPrice
      if (!targetPrice) return 0
      
      return Math.abs((targetPrice - trade.entry) / trade.entry) * 100
    }).filter(move => move > 0)
    
    return moves.length > 0 ? moves.reduce((sum, move) => sum + move, 0) / moves.length : 0
  }

  private static calculateAverageTimeToHit(trades: Trade[]): number | null {
    const times = trades.map(trade => {
      if (!trade.entryTime || !trade.exitTime) return null
      const entryTime = new Date(trade.entryTime).getTime()
      const exitTime = new Date(trade.exitTime).getTime()
      return (exitTime - entryTime) / (1000 * 60 * 60) // hours
    }).filter(time => time !== null) as number[]
    
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : null
  }

  private static calculateAverageMissedBy(trades: Trade[], type: 'stopLoss' | 'takeProfit'): number {
    const misses = trades.map(trade => {
      if (!trade.exit) return 0
      const targetPrice = type === 'stopLoss' ? trade.stopLossPrice : trade.takeProfitPrice
      if (!targetPrice) return 0
      
      const targetMove = Math.abs((targetPrice - trade.entry) / trade.entry) * 100
      const actualMove = Math.abs((trade.exit - trade.entry) / trade.entry) * 100
      
      return Math.abs(targetMove - actualMove)
    }).filter(miss => miss > 0)
    
    return misses.length > 0 ? misses.reduce((sum, miss) => sum + miss, 0) / misses.length : 0
  }

  // Get empty metrics for no trades
  private static getEmptyMetrics(): ExecutionMetrics {
    return {
      slippage: {
        averageEntrySlippage: 0,
        averageExitSlippage: 0,
        totalSlippageCost: 0,
        worstSlippage: { trade: null, amount: 0, cost: 0 },
        bestExecution: { trade: null, amount: 0, cost: 0 },
        slippageByMarket: {}
      },
      hitRates: {
        stopLoss: {
          rate: 0,
          totalTrades: 0,
          tradesHit: 0,
          averageMove: 0,
          timeToHit: null,
          missedByPercent: 0,
          averageLoss: 0,
          winRateWithoutSL: 0
        },
        takeProfit: {
          rate: 0,
          totalTrades: 0,
          tradesHit: 0,
          averageMove: 0,
          timeToHit: null,
          missedByPercent: 0,
          averageGain: 0,
          missedProfit: 0
        }
      },
      partialExits: {
        averageEfficiency: 0,
        tradesWithPartials: 0,
        scaleOutSuccess: 0,
        positionManagementScore: 0
      },
      commission: {
        totalCommission: 0,
        averagePerTrade: 0,
        commissionAsPercentOfPnL: 0,
        commissionAsPercentOfVolume: 0,
        breakEvenMove: {},
        commissionByMarket: {}
      },
      executionScore: 0,
      insights: []
    }
  }
}