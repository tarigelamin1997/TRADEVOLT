import type { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

export interface ZellaScoreComponents {
  winRate: number
  profitFactor: number
  riskReward: number
  consistency: number
  recovery: number
  discipline: number
}

export interface DailyConsistency {
  score: number
  stdDev: number
  cv: number
  profitableDaysPercent: number
  dailySharpe: number
  dailyPnL: { date: string; pnl: number }[]
}

export interface OutlierAnalysis {
  largestWin: Trade | null
  largestLoss: Trade | null
  largestWinPnL: number
  largestLossPnL: number
  outlierRatio: number
  performanceWithoutOutliers: number
  totalPnLWithOutliers: number
}

export interface StreakData {
  current: {
    type: 'win' | 'loss' | 'none'
    count: number
    startDate: Date | null
  }
  longestWinStreak: number
  longestLossStreak: number
  averageWinStreak: number
  averageLossStreak: number
  currentStreakPnL: number
}

export interface RevengeIndicators {
  positionSizeIncrease: boolean
  reducedTimeBetweenTrades: boolean
  winRateDegradation: boolean
  volumeSpike: boolean
  aggressiveRecovery: boolean
}

export interface RevengeIncident {
  triggerTrade: Trade
  revengeTrades: Trade[]
  indicators: RevengeIndicators
  severity: 'low' | 'medium' | 'high'
  totalLossRecoveryAttempt: number
}

export interface RevengeAnalysis {
  detected: boolean
  score: number // 0-100, higher is worse
  incidents: RevengeIncident[]
  totalIncidents: number
  averageRecoveryAttempt: number
}

export interface BehavioralMetrics {
  zellaScore: number
  components: ZellaScoreComponents
  dailyConsistency: DailyConsistency
  outliers: OutlierAnalysis
  streaks: StreakData
  revengeTrading: RevengeAnalysis
}

export class BehavioralAnalysisService {
  
  // Main analysis function
  static analyzeBehavior(trades: Trade[]): BehavioralMetrics {
    if (trades.length === 0) {
      return this.getEmptyMetrics()
    }

    // Sort trades by entry time
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.entryTime || a.createdAt).getTime() - 
      new Date(b.entryTime || b.createdAt).getTime()
    )

    // Calculate all components
    const consistency = this.calculateDailyConsistency(sortedTrades)
    const outliers = this.analyzeOutliers(sortedTrades)
    const streaks = this.analyzeStreaks(sortedTrades)
    const revenge = this.detectRevengeTrading(sortedTrades)
    
    // Calculate Zella Score components
    const components = this.calculateZellaComponents(sortedTrades, consistency, revenge)
    const zellaScore = this.calculateZellaScore(components)

    return {
      zellaScore,
      components,
      dailyConsistency: consistency,
      outliers,
      streaks,
      revengeTrading: revenge
    }
  }

  // Calculate Zella Score (0-100)
  private static calculateZellaScore(components: ZellaScoreComponents): number {
    const weights = {
      winRate: 0.20,
      profitFactor: 0.20,
      riskReward: 0.15,
      consistency: 0.20,
      recovery: 0.15,
      discipline: 0.10
    }

    const score = 
      components.winRate * weights.winRate +
      components.profitFactor * weights.profitFactor +
      components.riskReward * weights.riskReward +
      components.consistency * weights.consistency +
      components.recovery * weights.recovery +
      components.discipline * weights.discipline

    return Math.min(100, Math.max(0, Math.round(score)))
  }

  // Calculate Zella Score components
  private static calculateZellaComponents(
    trades: Trade[], 
    consistency: DailyConsistency,
    revenge: RevengeAnalysis
  ): ZellaScoreComponents {
    const pnlData = trades.map(t => calculateMarketPnL(t, t.marketType) || 0)
    const wins = pnlData.filter(pnl => pnl > 0)
    const losses = pnlData.filter(pnl => pnl < 0)

    // Win Rate (0-100)
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0

    // Profit Factor (normalized to 0-100)
    const grossProfit = wins.reduce((sum, pnl) => sum + pnl, 0)
    const grossLoss = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 100 : 0
    const normalizedPF = Math.min(100, profitFactor * 20) // PF of 5 = 100 score

    // Risk/Reward Ratio (normalized to 0-100)
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 1
    const rrRatio = avgLoss > 0 ? avgWin / avgLoss : 0
    const normalizedRR = Math.min(100, rrRatio * 33.33) // RR of 3 = 100 score

    // Recovery Factor (normalized to 0-100)
    const totalPnL = pnlData.reduce((sum, pnl) => sum + pnl, 0)
    const maxDrawdown = this.calculateMaxDrawdown(trades)
    const recoveryFactor = maxDrawdown > 0 ? totalPnL / maxDrawdown : totalPnL > 0 ? 100 : 0
    const normalizedRecovery = Math.min(100, Math.max(0, recoveryFactor * 10))

    // Discipline Score (100 - revenge score)
    const disciplineScore = 100 - revenge.score

    return {
      winRate,
      profitFactor: normalizedPF,
      riskReward: normalizedRR,
      consistency: consistency.score,
      recovery: normalizedRecovery,
      discipline: disciplineScore
    }
  }

  // Calculate daily consistency metrics
  private static calculateDailyConsistency(trades: Trade[]): DailyConsistency {
    // Group trades by day
    const dailyGroups = new Map<string, Trade[]>()
    
    trades.forEach(trade => {
      const date = new Date(trade.entryTime || trade.createdAt)
      const dateKey = date.toISOString().split('T')[0]
      
      if (!dailyGroups.has(dateKey)) {
        dailyGroups.set(dateKey, [])
      }
      dailyGroups.get(dateKey)!.push(trade)
    })

    // Calculate daily P&L
    const dailyPnL: { date: string; pnl: number }[] = []
    
    dailyGroups.forEach((dayTrades, date) => {
      const dayPnL = dayTrades.reduce((sum, trade) => {
        return sum + (calculateMarketPnL(trade, trade.marketType) || 0)
      }, 0)
      dailyPnL.push({ date, pnl: dayPnL })
    })

    // Sort by date
    dailyPnL.sort((a, b) => a.date.localeCompare(b.date))

    // Calculate statistics
    const pnlValues = dailyPnL.map(d => d.pnl)
    const mean = pnlValues.reduce((sum, pnl) => sum + pnl, 0) / pnlValues.length
    const variance = pnlValues.reduce((sum, pnl) => sum + Math.pow(pnl - mean, 2), 0) / pnlValues.length
    const stdDev = Math.sqrt(variance)
    const cv = mean !== 0 ? Math.abs(stdDev / mean) : 1
    
    const profitableDays = pnlValues.filter(pnl => pnl > 0).length
    const profitableDaysPercent = (profitableDays / pnlValues.length) * 100

    // Daily Sharpe Ratio (simplified)
    const dailySharpe = stdDev !== 0 ? mean / stdDev : 0

    // Consistency Score (0-100)
    const cvScore = Math.max(0, 100 - (cv * 50)) // Lower CV is better
    const profitScore = profitableDaysPercent
    const sharpeScore = Math.min(100, Math.max(0, (dailySharpe + 2) * 25)) // Sharpe of 2 = 100
    
    const score = (cvScore * 0.4 + profitScore * 0.4 + sharpeScore * 0.2)

    return {
      score: Math.round(score),
      stdDev,
      cv,
      profitableDaysPercent,
      dailySharpe,
      dailyPnL
    }
  }

  // Analyze outliers
  private static analyzeOutliers(trades: Trade[]): OutlierAnalysis {
    const tradePnLs = trades.map(trade => ({
      trade,
      pnl: calculateMarketPnL(trade, trade.marketType) || 0
    })).filter(t => t.pnl !== 0)

    if (tradePnLs.length === 0) {
      return {
        largestWin: null,
        largestLoss: null,
        largestWinPnL: 0,
        largestLossPnL: 0,
        outlierRatio: 0,
        performanceWithoutOutliers: 0,
        totalPnLWithOutliers: 0
      }
    }

    // Sort by P&L
    tradePnLs.sort((a, b) => b.pnl - a.pnl)

    const largestWin = tradePnLs[0].pnl > 0 ? tradePnLs[0] : null
    const largestLoss = tradePnLs[tradePnLs.length - 1].pnl < 0 ? tradePnLs[tradePnLs.length - 1] : null

    // Calculate total P&L
    const totalPnL = tradePnLs.reduce((sum, t) => sum + t.pnl, 0)

    // Remove top and bottom 10% for outlier calculation
    const outlierCount = Math.floor(tradePnLs.length * 0.1)
    const withoutOutliers = tradePnLs.slice(outlierCount, tradePnLs.length - outlierCount)
    const pnlWithoutOutliers = withoutOutliers.reduce((sum, t) => sum + t.pnl, 0)

    // Calculate outlier impact
    const outlierPnL = totalPnL - pnlWithoutOutliers
    const outlierRatio = totalPnL !== 0 ? Math.abs(outlierPnL / totalPnL) : 0

    return {
      largestWin: largestWin?.trade || null,
      largestLoss: largestLoss?.trade || null,
      largestWinPnL: largestWin?.pnl || 0,
      largestLossPnL: largestLoss?.pnl || 0,
      outlierRatio,
      performanceWithoutOutliers: pnlWithoutOutliers,
      totalPnLWithOutliers: totalPnL
    }
  }

  // Analyze win/loss streaks
  private static analyzeStreaks(trades: Trade[]): StreakData {
    const streaks: { type: 'win' | 'loss'; count: number; trades: Trade[] }[] = []
    let currentStreak: { type: 'win' | 'loss'; count: number; trades: Trade[] } | null = null

    trades.forEach(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType) || 0
      const isWin = pnl > 0

      if (!currentStreak) {
        currentStreak = {
          type: isWin ? 'win' : 'loss',
          count: 1,
          trades: [trade]
        }
      } else if ((isWin && currentStreak.type === 'win') || (!isWin && currentStreak.type === 'loss')) {
        currentStreak.count++
        currentStreak.trades.push(trade)
      } else {
        streaks.push({ ...currentStreak })
        currentStreak = {
          type: isWin ? 'win' : 'loss',
          count: 1,
          trades: [trade]
        }
      }
    })

    if (currentStreak) {
      streaks.push(currentStreak)
    }

    // Calculate statistics
    const winStreaks = streaks.filter(s => s.type === 'win')
    const lossStreaks = streaks.filter(s => s.type === 'loss')

    const longestWinStreak = winStreaks.length > 0 
      ? Math.max(...winStreaks.map(s => s.count)) 
      : 0

    const longestLossStreak = lossStreaks.length > 0
      ? Math.max(...lossStreaks.map(s => s.count))
      : 0

    const averageWinStreak = winStreaks.length > 0
      ? winStreaks.reduce((sum, s) => sum + s.count, 0) / winStreaks.length
      : 0

    const averageLossStreak = lossStreaks.length > 0
      ? lossStreaks.reduce((sum, s) => sum + s.count, 0) / lossStreaks.length
      : 0

    // Current streak P&L
    const currentStreakPnL = currentStreak
      ? currentStreak.trades.reduce((sum, trade) => 
          sum + (calculateMarketPnL(trade, trade.marketType) || 0), 0)
      : 0

    // Determine current streak info
    const lastTrade = trades[trades.length - 1]
    const lastPnL = lastTrade ? calculateMarketPnL(lastTrade, lastTrade.marketType) || 0 : 0

    return {
      current: currentStreak ? {
        type: currentStreak.type,
        count: currentStreak.count,
        startDate: new Date(currentStreak.trades[0].entryTime || currentStreak.trades[0].createdAt)
      } : {
        type: 'none',
        count: 0,
        startDate: null
      },
      longestWinStreak,
      longestLossStreak,
      averageWinStreak,
      averageLossStreak,
      currentStreakPnL
    }
  }

  // Detect revenge trading patterns
  private static detectRevengeTrading(trades: Trade[]): RevengeAnalysis {
    const incidents: RevengeIncident[] = []
    
    for (let i = 1; i < trades.length; i++) {
      const prevTrade = trades[i - 1]
      const prevPnL = calculateMarketPnL(prevTrade, prevTrade.marketType) || 0

      // Only check if previous trade was a loss
      if (prevPnL >= 0) continue

      // Look for revenge trading patterns in next few trades
      const revengeTrades: Trade[] = []
      const indicators: RevengeIndicators = {
        positionSizeIncrease: false,
        reducedTimeBetweenTrades: false,
        winRateDegradation: false,
        volumeSpike: false,
        aggressiveRecovery: false
      }

      // Check next 3 trades for revenge patterns
      for (let j = i; j < Math.min(i + 3, trades.length); j++) {
        const currTrade = trades[j]
        const timeDiff = new Date(currTrade.entryTime || currTrade.createdAt).getTime() - 
                        new Date(prevTrade.exitTime || prevTrade.createdAt).getTime()

        // Check for quick re-entry (less than 5 minutes)
        if (timeDiff < 5 * 60 * 1000) {
          indicators.reducedTimeBetweenTrades = true
        }

        // Check for position size increase (50% or more)
        if (currTrade.quantity >= prevTrade.quantity * 1.5) {
          indicators.positionSizeIncrease = true
        }

        // Check if trying to recover the loss
        const currPnL = calculateMarketPnL(currTrade, currTrade.marketType) || 0
        if (currTrade.quantity > prevTrade.quantity || timeDiff < 10 * 60 * 1000) {
          revengeTrades.push(currTrade)
          
          if (currPnL < 0) {
            indicators.winRateDegradation = true
          }
        }
      }

      // Determine if this is revenge trading
      if (revengeTrades.length > 0 && Object.values(indicators).some(v => v)) {
        const totalRecoveryAttempt = revengeTrades.reduce((sum, t) => 
          sum + t.quantity * t.entry, 0)

        // Determine severity
        const indicatorCount = Object.values(indicators).filter(v => v).length
        const severity = indicatorCount >= 3 ? 'high' : indicatorCount >= 2 ? 'medium' : 'low'

        incidents.push({
          triggerTrade: prevTrade,
          revengeTrades,
          indicators,
          severity,
          totalLossRecoveryAttempt: totalRecoveryAttempt
        })
      }
    }

    // Calculate revenge trading score
    const score = Math.min(100, incidents.length * 10 + 
      incidents.filter(i => i.severity === 'high').length * 20)

    const averageRecoveryAttempt = incidents.length > 0
      ? incidents.reduce((sum, i) => sum + i.totalLossRecoveryAttempt, 0) / incidents.length
      : 0

    return {
      detected: incidents.length > 0,
      score,
      incidents,
      totalIncidents: incidents.length,
      averageRecoveryAttempt
    }
  }

  // Calculate maximum drawdown
  private static calculateMaxDrawdown(trades: Trade[]): number {
    let peak = 0
    let maxDrawdown = 0
    let runningPnL = 0

    trades.forEach(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType) || 0
      runningPnL += pnl
      
      if (runningPnL > peak) {
        peak = runningPnL
      }
      
      const drawdown = peak - runningPnL
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    })

    return maxDrawdown
  }

  // Get empty metrics for no trades
  private static getEmptyMetrics(): BehavioralMetrics {
    return {
      zellaScore: 0,
      components: {
        winRate: 0,
        profitFactor: 0,
        riskReward: 0,
        consistency: 0,
        recovery: 0,
        discipline: 100
      },
      dailyConsistency: {
        score: 0,
        stdDev: 0,
        cv: 0,
        profitableDaysPercent: 0,
        dailySharpe: 0,
        dailyPnL: []
      },
      outliers: {
        largestWin: null,
        largestLoss: null,
        largestWinPnL: 0,
        largestLossPnL: 0,
        outlierRatio: 0,
        performanceWithoutOutliers: 0,
        totalPnLWithOutliers: 0
      },
      streaks: {
        current: {
          type: 'none',
          count: 0,
          startDate: null
        },
        longestWinStreak: 0,
        longestLossStreak: 0,
        averageWinStreak: 0,
        averageLossStreak: 0,
        currentStreakPnL: 0
      },
      revengeTrading: {
        detected: false,
        score: 0,
        incidents: [],
        totalIncidents: 0,
        averageRecoveryAttempt: 0
      }
    }
  }
}