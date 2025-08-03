import { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

export interface SymbolMetrics {
  symbol: string
  totalTrades: number
  winRate: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  totalPnL: number
  sharpeRatio: number
  maxDrawdown: number
  bestTrade: Trade | null
  worstTrade: Trade | null
  longPerformance: DirectionalStats
  shortPerformance: DirectionalStats
  timeInMarket: number // hours
  avgHoldTime: number // hours
}

export interface DirectionalStats {
  trades: number
  winRate: number
  avgPnL: number
  totalPnL: number
  profitFactor: number
}

export interface MarketTypeMetrics {
  marketType: string
  metrics: {
    trades: number
    winRate: number
    avgPnL: number
    totalPnL: number
    profitFactor: number
    commission: number
    slippage: number
    bestSymbol: string
    worstSymbol: string
  }
  comparison: {
    vsOverall: number // % better/worse than overall
    rank: number
  }
}

export interface DirectionalMetrics {
  long: DirectionalStats & {
    avgHoldTime: number
  }
  short: DirectionalStats & {
    avgHoldTime: number
  }
  bias: 'LONG' | 'SHORT' | 'NEUTRAL'
  biasStrength: number // 0-100
}

export interface BiasAnalysis {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL'
  strength: number
  confidence: number
  recommendation: string
}

export interface SetupMetrics {
  setup: string
  trades: number
  winRate: number
  avgPnL: number
  totalPnL: number
  expectancy: number
  profitFactor: number
  bestMarket: string
  worstMarket: string
  timeOfDayPerformance: HourlyStats[]
  confidenceCorrelation: number
}

export interface HourlyStats {
  hour: number
  trades: number
  winRate: number
  avgPnL: number
}

export interface ComparisonData {
  symbols: string[]
  metrics: {
    winRate: number[]
    profitFactor: number[]
    avgPnL: number[]
    totalPnL: number[]
    trades: number[]
  }
}

export interface MarketComparison {
  markets: string[]
  performance: Record<string, MarketTypeMetrics>
  bestMarket: string
  worstMarket: string
  insights: string[]
}

export interface SetupComparison {
  setups: string[]
  performance: Record<string, SetupMetrics>
  bestSetup: string
  worstSetup: string
  recommendations: string[]
}

export class MarketAnalysisService {
  // Symbol Performance Analysis
  static analyzeSymbolPerformance(trades: Trade[]): SymbolMetrics[] {
    const symbolGroups = this.groupTradesBySymbol(trades)
    const metrics: SymbolMetrics[] = []

    for (const [symbol, symbolTrades] of Object.entries(symbolGroups)) {
      const completedTrades = symbolTrades.filter(t => t.exit !== null && t.exit !== undefined)
      if (completedTrades.length === 0) continue

      // Calculate P&L for each trade
      const tradePnLs = completedTrades.map(t => ({
        trade: t,
        pnl: calculateMarketPnL(t, t.marketType || null) || 0
      }))

      // Basic metrics
      const winningTrades = tradePnLs.filter(t => t.pnl > 0)
      const losingTrades = tradePnLs.filter(t => t.pnl < 0)
      const totalPnL = tradePnLs.reduce((sum, t) => sum + t.pnl, 0)
      
      // Directional analysis
      const longTrades = tradePnLs.filter(t => t.trade.type === 'BUY')
      const shortTrades = tradePnLs.filter(t => t.trade.type === 'SELL')

      // Hold time analysis
      const holdTimes = completedTrades.map(t => {
        const entry = new Date(t.entryTime || t.createdAt)
        const exit = new Date(t.exitTime || t.createdAt)
        return (exit.getTime() - entry.getTime()) / (1000 * 60 * 60) // hours
      })

      // Drawdown calculation
      let runningPnL = 0
      let peak = 0
      let maxDrawdown = 0
      
      tradePnLs.forEach(({ pnl }) => {
        runningPnL += pnl
        if (runningPnL > peak) peak = runningPnL
        const drawdown = peak - runningPnL
        if (drawdown > maxDrawdown) maxDrawdown = drawdown
      })

      // Sharpe ratio calculation (simplified)
      const avgPnL = totalPnL / completedTrades.length
      const pnlStdDev = Math.sqrt(
        tradePnLs.reduce((sum, t) => sum + Math.pow(t.pnl - avgPnL, 2), 0) / completedTrades.length
      )
      const sharpeRatio = pnlStdDev > 0 ? (avgPnL / pnlStdDev) * Math.sqrt(252) : 0 // Annualized

      // Best and worst trades
      const sortedByPnL = tradePnLs.sort((a, b) => b.pnl - a.pnl)
      const bestTrade = sortedByPnL[0]?.trade || null
      const worstTrade = sortedByPnL[sortedByPnL.length - 1]?.trade || null

      metrics.push({
        symbol,
        totalTrades: completedTrades.length,
        winRate: (winningTrades.length / completedTrades.length) * 100,
        profitFactor: this.calculateProfitFactor(winningTrades, losingTrades),
        avgWin: winningTrades.length > 0 
          ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
          : 0,
        avgLoss: losingTrades.length > 0 
          ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length 
          : 0,
        totalPnL,
        sharpeRatio,
        maxDrawdown,
        bestTrade,
        worstTrade,
        longPerformance: this.calculateDirectionalStats(longTrades),
        shortPerformance: this.calculateDirectionalStats(shortTrades),
        timeInMarket: holdTimes.reduce((sum, t) => sum + t, 0),
        avgHoldTime: holdTimes.length > 0 
          ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length 
          : 0
      })
    }

    return metrics.sort((a, b) => b.totalPnL - a.totalPnL)
  }

  static compareSymbols(trades: Trade[], symbols: string[]): ComparisonData {
    const metrics = this.analyzeSymbolPerformance(
      trades.filter(t => symbols.includes(t.symbol))
    )

    const comparison: ComparisonData = {
      symbols,
      metrics: {
        winRate: [],
        profitFactor: [],
        avgPnL: [],
        totalPnL: [],
        trades: []
      }
    }

    symbols.forEach(symbol => {
      const symbolMetric = metrics.find(m => m.symbol === symbol)
      if (symbolMetric) {
        comparison.metrics.winRate.push(symbolMetric.winRate)
        comparison.metrics.profitFactor.push(symbolMetric.profitFactor)
        comparison.metrics.avgPnL.push(symbolMetric.totalPnL / symbolMetric.totalTrades)
        comparison.metrics.totalPnL.push(symbolMetric.totalPnL)
        comparison.metrics.trades.push(symbolMetric.totalTrades)
      } else {
        // Fill with zeros if no data
        comparison.metrics.winRate.push(0)
        comparison.metrics.profitFactor.push(0)
        comparison.metrics.avgPnL.push(0)
        comparison.metrics.totalPnL.push(0)
        comparison.metrics.trades.push(0)
      }
    })

    return comparison
  }

  // Market Type Analysis
  static analyzeByMarketType(trades: Trade[]): MarketTypeMetrics[] {
    const marketGroups = this.groupTradesByMarketType(trades)
    const metrics: MarketTypeMetrics[] = []
    
    // Calculate overall metrics for comparison
    const overallWinRate = this.calculateOverallWinRate(trades)
    const overallAvgPnL = this.calculateOverallAvgPnL(trades)

    let rank = 1
    for (const [marketType, marketTrades] of Object.entries(marketGroups)) {
      const completedTrades = marketTrades.filter(t => t.exit !== null && t.exit !== undefined)
      if (completedTrades.length === 0) continue

      const tradePnLs = completedTrades.map(t => ({
        trade: t,
        pnl: calculateMarketPnL(t, t.marketType || null) || 0
      }))

      const winningTrades = tradePnLs.filter(t => t.pnl > 0)
      const losingTrades = tradePnLs.filter(t => t.pnl < 0)
      const totalPnL = tradePnLs.reduce((sum, t) => sum + t.pnl, 0)
      const avgPnL = totalPnL / completedTrades.length
      const winRate = (winningTrades.length / completedTrades.length) * 100

      // Calculate commission and slippage
      const totalCommission = completedTrades.reduce((sum, t) => sum + (t.commission || 0), 0)
      const totalSlippage = completedTrades.reduce((sum, t) => {
        const entrySlippage = t.intendedEntry ? Math.abs(t.entry - t.intendedEntry) : 0
        const exitSlippage = t.intendedExit && t.exit ? Math.abs(t.exit - t.intendedExit) : 0
        return sum + entrySlippage + exitSlippage
      }, 0)

      // Find best and worst symbols
      const symbolPnLs = this.calculateSymbolPnLsByMarket(marketTrades)
      const sortedSymbols = Object.entries(symbolPnLs).sort((a, b) => b[1] - a[1])
      const bestSymbol = sortedSymbols[0]?.[0] || 'N/A'
      const worstSymbol = sortedSymbols[sortedSymbols.length - 1]?.[0] || 'N/A'

      metrics.push({
        marketType,
        metrics: {
          trades: completedTrades.length,
          winRate,
          avgPnL,
          totalPnL,
          profitFactor: this.calculateProfitFactor(winningTrades, losingTrades),
          commission: totalCommission,
          slippage: totalSlippage,
          bestSymbol,
          worstSymbol
        },
        comparison: {
          vsOverall: ((avgPnL - overallAvgPnL) / Math.abs(overallAvgPnL)) * 100,
          rank: rank++
        }
      })
    }

    return metrics.sort((a, b) => b.metrics.totalPnL - a.metrics.totalPnL)
  }

  static compareMarkets(trades: Trade[]): MarketComparison {
    const marketMetrics = this.analyzeByMarketType(trades)
    const markets = marketMetrics.map(m => m.marketType)
    
    const performance: Record<string, MarketTypeMetrics> = {}
    marketMetrics.forEach(metric => {
      performance[metric.marketType] = metric
    })

    const sortedByPnL = marketMetrics.sort((a, b) => b.metrics.totalPnL - a.metrics.totalPnL)
    const bestMarket = sortedByPnL[0]?.marketType || 'N/A'
    const worstMarket = sortedByPnL[sortedByPnL.length - 1]?.marketType || 'N/A'

    const insights: string[] = []
    
    // Generate insights
    if (bestMarket !== 'N/A') {
      insights.push(`${bestMarket} is your most profitable market with $${sortedByPnL[0].metrics.totalPnL.toFixed(2)} total P&L`)
    }
    
    if (worstMarket !== 'N/A' && worstMarket !== bestMarket) {
      const worstMetrics = sortedByPnL[sortedByPnL.length - 1]
      if (worstMetrics.metrics.totalPnL < 0) {
        insights.push(`Consider reducing exposure to ${worstMarket} (${worstMetrics.metrics.totalPnL.toFixed(2)} loss)`)
      }
    }

    // Commission insights
    const highCommissionMarkets = marketMetrics.filter(m => 
      m.metrics.commission > m.metrics.totalPnL * 0.1
    )
    if (highCommissionMarkets.length > 0) {
      insights.push(`High commission impact in ${highCommissionMarkets.map(m => m.marketType).join(', ')}`)
    }

    return {
      markets,
      performance,
      bestMarket,
      worstMarket,
      insights
    }
  }

  // Directional Analysis
  static analyzeLongVsShort(trades: Trade[]): DirectionalMetrics {
    const completedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
    
    const longTrades = completedTrades.filter(t => t.type === 'BUY')
    const shortTrades = completedTrades.filter(t => t.type === 'SELL')

    const longStats = this.calculateDirectionalStatsWithHoldTime(longTrades)
    const shortStats = this.calculateDirectionalStatsWithHoldTime(shortTrades)

    // Calculate bias
    const totalTrades = longTrades.length + shortTrades.length
    const longRatio = totalTrades > 0 ? longTrades.length / totalTrades : 0.5
    const profitabilityDiff = Math.abs(longStats.winRate - shortStats.winRate)
    
    let bias: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL'
    let biasStrength = 0

    if (longRatio > 0.65 || (longStats.winRate > shortStats.winRate + 10)) {
      bias = 'LONG'
      biasStrength = Math.min(100, (longRatio - 0.5) * 200 + profitabilityDiff)
    } else if (longRatio < 0.35 || (shortStats.winRate > longStats.winRate + 10)) {
      bias = 'SHORT'
      biasStrength = Math.min(100, (0.5 - longRatio) * 200 + profitabilityDiff)
    } else {
      biasStrength = Math.max(0, 50 - profitabilityDiff * 2)
    }

    return {
      long: longStats,
      short: shortStats,
      bias,
      biasStrength
    }
  }

  static getDirectionalBias(trades: Trade[]): BiasAnalysis {
    const directional = this.analyzeLongVsShort(trades)
    
    let confidence = 0
    let recommendation = ''

    // Calculate confidence based on sample size and consistency
    const totalTrades = directional.long.trades + directional.short.trades
    if (totalTrades < 10) {
      confidence = 20
      recommendation = 'Need more trades for reliable bias analysis'
    } else if (totalTrades < 50) {
      confidence = 50
      recommendation = 'Directional bias emerging, continue monitoring'
    } else {
      confidence = Math.min(90, 50 + directional.biasStrength * 0.4)
      
      if (directional.bias === 'LONG') {
        recommendation = `Strong long bias detected. Your long trades (${directional.long.winRate.toFixed(1)}% win rate) outperform shorts. Consider focusing on long setups.`
      } else if (directional.bias === 'SHORT') {
        recommendation = `Strong short bias detected. Your short trades (${directional.short.winRate.toFixed(1)}% win rate) outperform longs. Consider focusing on short setups.`
      } else {
        recommendation = 'Balanced directional performance. You trade both directions effectively.'
      }
    }

    return {
      direction: directional.bias,
      strength: directional.biasStrength,
      confidence,
      recommendation
    }
  }

  // Setup Performance Analysis
  static analyzeBySetup(trades: Trade[]): SetupMetrics[] {
    const setupGroups = this.groupTradesBySetup(trades)
    const metrics: SetupMetrics[] = []

    for (const [setup, setupTrades] of Object.entries(setupGroups)) {
      const completedTrades = setupTrades.filter(t => t.exit !== null && t.exit !== undefined)
      if (completedTrades.length === 0) continue

      const tradePnLs = completedTrades.map(t => ({
        trade: t,
        pnl: calculateMarketPnL(t, t.marketType || null) || 0
      }))

      const winningTrades = tradePnLs.filter(t => t.pnl > 0)
      const totalPnL = tradePnLs.reduce((sum, t) => sum + t.pnl, 0)
      const avgPnL = totalPnL / completedTrades.length
      const winRate = (winningTrades.length / completedTrades.length) * 100

      // Calculate expectancy
      const avgWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
        : 0
      const avgLoss = tradePnLs.filter(t => t.pnl < 0).length > 0
        ? tradePnLs.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / tradePnLs.filter(t => t.pnl < 0).length
        : 0
      const expectancy = (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss

      // Market performance
      const marketPnLs = this.calculateMarketPnLsBySetup(setupTrades)
      const sortedMarkets = Object.entries(marketPnLs).sort((a, b) => b[1] - a[1])
      const bestMarket = sortedMarkets[0]?.[0] || 'N/A'
      const worstMarket = sortedMarkets[sortedMarkets.length - 1]?.[0] || 'N/A'

      // Time of day performance
      const hourlyStats = this.calculateHourlyStats(completedTrades)

      // Confidence correlation
      const confidenceCorrelation = this.calculateConfidenceCorrelation(completedTrades)

      metrics.push({
        setup,
        trades: completedTrades.length,
        winRate,
        avgPnL,
        totalPnL,
        expectancy,
        profitFactor: this.calculateProfitFactor(
          winningTrades,
          tradePnLs.filter(t => t.pnl < 0)
        ),
        bestMarket,
        worstMarket,
        timeOfDayPerformance: hourlyStats,
        confidenceCorrelation
      })
    }

    return metrics.sort((a, b) => b.totalPnL - a.totalPnL)
  }

  static compareSetups(trades: Trade[], setups: string[]): SetupComparison {
    const setupMetrics = this.analyzeBySetup(
      trades.filter(t => t.setup && setups.includes(t.setup))
    )

    const performance: Record<string, SetupMetrics> = {}
    setupMetrics.forEach(metric => {
      performance[metric.setup] = metric
    })

    const sortedByExpectancy = setupMetrics.sort((a, b) => b.expectancy - a.expectancy)
    const bestSetup = sortedByExpectancy[0]?.setup || 'N/A'
    const worstSetup = sortedByExpectancy[sortedByExpectancy.length - 1]?.setup || 'N/A'

    const recommendations: string[] = []

    // Generate recommendations
    if (bestSetup !== 'N/A') {
      const best = sortedByExpectancy[0]
      recommendations.push(`Focus on ${bestSetup} - highest expectancy ($${best.expectancy.toFixed(2)} per trade)`)
    }

    // Confidence correlation insights
    const highConfidenceSetups = setupMetrics.filter(s => s.confidenceCorrelation > 0.5)
    if (highConfidenceSetups.length > 0) {
      recommendations.push(`Your confidence accurately predicts results in: ${highConfidenceSetups.map(s => s.setup).join(', ')}`)
    }

    // Time-based recommendations
    setupMetrics.forEach(setup => {
      const bestHours = setup.timeOfDayPerformance
        .filter(h => h.avgPnL > 0)
        .sort((a, b) => b.avgPnL - a.avgPnL)
        .slice(0, 3)
      
      if (bestHours.length > 0) {
        recommendations.push(`${setup.setup} works best during ${bestHours.map(h => `${h.hour}:00`).join(', ')}`)
      }
    })

    return {
      setups,
      performance,
      bestSetup,
      worstSetup,
      recommendations
    }
  }

  // Helper Methods
  private static groupTradesBySymbol(trades: Trade[]): Record<string, Trade[]> {
    return trades.reduce((groups, trade) => {
      const symbol = trade.symbol
      if (!groups[symbol]) groups[symbol] = []
      groups[symbol].push(trade)
      return groups
    }, {} as Record<string, Trade[]>)
  }

  private static groupTradesByMarketType(trades: Trade[]): Record<string, Trade[]> {
    return trades.reduce((groups, trade) => {
      const marketType = trade.marketType || 'UNKNOWN'
      if (!groups[marketType]) groups[marketType] = []
      groups[marketType].push(trade)
      return groups
    }, {} as Record<string, Trade[]>)
  }

  private static groupTradesBySetup(trades: Trade[]): Record<string, Trade[]> {
    return trades.reduce((groups, trade) => {
      const setup = trade.setup || 'No Setup'
      if (!groups[setup]) groups[setup] = []
      groups[setup].push(trade)
      return groups
    }, {} as Record<string, Trade[]>)
  }

  private static calculateProfitFactor(
    winningTrades: { pnl: number }[],
    losingTrades: { pnl: number }[]
  ): number {
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))
    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
  }

  private static calculateDirectionalStats(trades: { trade: Trade; pnl: number }[]): DirectionalStats {
    if (trades.length === 0) {
      return {
        trades: 0,
        winRate: 0,
        avgPnL: 0,
        totalPnL: 0,
        profitFactor: 0
      }
    }

    const winningTrades = trades.filter(t => t.pnl > 0)
    const losingTrades = trades.filter(t => t.pnl < 0)
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0)

    return {
      trades: trades.length,
      winRate: (winningTrades.length / trades.length) * 100,
      avgPnL: totalPnL / trades.length,
      totalPnL,
      profitFactor: this.calculateProfitFactor(winningTrades, losingTrades)
    }
  }

  private static calculateDirectionalStatsWithHoldTime(trades: Trade[]): DirectionalStats & { avgHoldTime: number } {
    const tradePnLs = trades.map(t => ({
      trade: t,
      pnl: calculateMarketPnL(t, t.marketType || null) || 0
    }))

    const stats = this.calculateDirectionalStats(tradePnLs)
    
    const holdTimes = trades
      .filter(t => t.exit !== null && t.exit !== undefined)
      .map(t => {
        const entry = new Date(t.entryTime || t.createdAt)
        const exit = new Date(t.exitTime || t.createdAt)
        return (exit.getTime() - entry.getTime()) / (1000 * 60 * 60) // hours
      })

    return {
      ...stats,
      avgHoldTime: holdTimes.length > 0 
        ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length 
        : 0
    }
  }

  private static calculateSymbolPnLsByMarket(trades: Trade[]): Record<string, number> {
    const symbolPnLs: Record<string, number> = {}
    
    trades
      .filter(t => t.exit !== null && t.exit !== undefined)
      .forEach(trade => {
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        if (!symbolPnLs[trade.symbol]) symbolPnLs[trade.symbol] = 0
        symbolPnLs[trade.symbol] += pnl
      })

    return symbolPnLs
  }

  private static calculateMarketPnLsBySetup(trades: Trade[]): Record<string, number> {
    const marketPnLs: Record<string, number> = {}
    
    trades
      .filter(t => t.exit !== null && t.exit !== undefined)
      .forEach(trade => {
        const market = trade.marketType || 'UNKNOWN'
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        if (!marketPnLs[market]) marketPnLs[market] = 0
        marketPnLs[market] += pnl
      })

    return marketPnLs
  }

  private static calculateHourlyStats(trades: Trade[]): HourlyStats[] {
    const hourlyData: Record<number, { trades: number; wins: number; totalPnL: number }> = {}

    trades.forEach(trade => {
      const hour = new Date(trade.entryTime || trade.createdAt).getHours()
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = { trades: 0, wins: 0, totalPnL: 0 }
      }
      
      hourlyData[hour].trades++
      hourlyData[hour].totalPnL += pnl
      if (pnl > 0) hourlyData[hour].wins++
    })

    return Object.entries(hourlyData)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100,
        avgPnL: data.totalPnL / data.trades
      }))
      .sort((a, b) => a.hour - b.hour)
  }

  private static calculateConfidenceCorrelation(trades: Trade[]): number {
    const tradesWithConfidence = trades.filter(t => t.confidence !== null && t.confidence !== undefined)
    if (tradesWithConfidence.length < 5) return 0

    // Calculate correlation between confidence and P&L
    const data = tradesWithConfidence.map(t => ({
      confidence: t.confidence!,
      pnl: calculateMarketPnL(t, t.marketType || null) || 0
    }))

    const avgConfidence = data.reduce((sum, d) => sum + d.confidence, 0) / data.length
    const avgPnL = data.reduce((sum, d) => sum + d.pnl, 0) / data.length

    const numerator = data.reduce((sum, d) => 
      sum + (d.confidence - avgConfidence) * (d.pnl - avgPnL), 0
    )
    
    const denominator = Math.sqrt(
      data.reduce((sum, d) => sum + Math.pow(d.confidence - avgConfidence, 2), 0) *
      data.reduce((sum, d) => sum + Math.pow(d.pnl - avgPnL, 2), 0)
    )

    return denominator > 0 ? numerator / denominator : 0
  }

  private static calculateOverallWinRate(trades: Trade[]): number {
    const completed = trades.filter(t => t.exit !== null && t.exit !== undefined)
    if (completed.length === 0) return 0

    const wins = completed.filter(t => {
      const pnl = calculateMarketPnL(t, t.marketType || null) || 0
      return pnl > 0
    }).length

    return (wins / completed.length) * 100
  }

  private static calculateOverallAvgPnL(trades: Trade[]): number {
    const completed = trades.filter(t => t.exit !== null && t.exit !== undefined)
    if (completed.length === 0) return 0

    const totalPnL = completed.reduce((sum, t) => {
      const pnl = calculateMarketPnL(t, t.marketType || null) || 0
      return sum + pnl
    }, 0)

    return totalPnL / completed.length
  }
}