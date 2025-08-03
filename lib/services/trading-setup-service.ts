import { TradingSetup, SetupRule, Trade, RuleChecklist } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

export interface SetupPerformanceMetrics {
  setupId: string
  setupName: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  expectancy: number
  avgRiskReward: number
  totalPnL: number
  
  // Rule Compliance
  avgComplianceScore: number
  perfectComplianceTrades: number
  commonViolations: { rule: string; count: number }[]
  
  // Market Conditions Performance
  bestConditions: {
    volatility?: string
    trend?: string
    timeOfDay?: string
  }
  worstConditions: {
    volatility?: string
    trend?: string
    timeOfDay?: string
  }
  
  // Time Analysis
  lastUsed?: Date
  createdAt: Date
  performanceByMonth: { month: string; pnl: number; trades: number }[]
}

export interface DisciplineMetrics {
  overallScore: number // 0-100
  recentScore: number // Last 20 trades
  trend: 'Improving' | 'Stable' | 'Declining'
  streakInfo: {
    currentStreak: number
    isCompliant: boolean
    bestStreak: number
  }
  tiltWarning: boolean
  tiltLevel: number // 0-100
}

export class TradingSetupService {
  // In-memory storage for setups
  private static setups = new Map<string, TradingSetup[]>()
  private static ruleChecklists = new Map<string, RuleChecklist[]>()

  // CRUD Operations
  static async createSetup(userId: string, setup: Omit<TradingSetup, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradingSetup> {
    const newSetup: TradingSetup = {
      ...setup,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalTrades: 0,
        winRate: 0,
        avgRiskReward: 0,
        profitFactor: 0,
        expectancy: 0
      }
    }

    const userSetups = this.setups.get(userId) || []
    userSetups.push(newSetup)
    this.setups.set(userId, userSetups)

    return newSetup
  }

  static async getSetupsByUserId(userId: string): Promise<TradingSetup[]> {
    return this.setups.get(userId) || []
  }

  static async getSetupById(userId: string, setupId: string): Promise<TradingSetup | null> {
    const userSetups = this.setups.get(userId) || []
    return userSetups.find(s => s.id === setupId) || null
  }

  static async updateSetup(userId: string, setupId: string, updates: Partial<TradingSetup>): Promise<TradingSetup | null> {
    const userSetups = this.setups.get(userId) || []
    const index = userSetups.findIndex(s => s.id === setupId)
    
    if (index === -1) return null

    userSetups[index] = {
      ...userSetups[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.setups.set(userId, userSetups)
    return userSetups[index]
  }

  static async deleteSetup(userId: string, setupId: string): Promise<boolean> {
    const userSetups = this.setups.get(userId) || []
    const filtered = userSetups.filter(s => s.id !== setupId)
    
    if (filtered.length === userSetups.length) return false
    
    this.setups.set(userId, filtered)
    return true
  }

  // Rule Compliance
  static async saveRuleChecklist(tradeId: string, setupId: string, checklist: Omit<RuleChecklist, 'id'>[]): Promise<void> {
    const checklists = checklist.map(item => ({
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      tradeId,
      setupId
    }))

    const existing = this.ruleChecklists.get(tradeId) || []
    this.ruleChecklists.set(tradeId, [...existing, ...checklists])
  }

  static async getRuleChecklist(tradeId: string): Promise<RuleChecklist[]> {
    return this.ruleChecklists.get(tradeId) || []
  }

  // Performance Analysis
  static analyzeSetupPerformance(setup: TradingSetup, trades: Trade[]): SetupPerformanceMetrics {
    const setupTrades = trades.filter(t => t.setupId === setup.id && t.exit !== null && t.exit !== undefined)
    
    if (setupTrades.length === 0) {
      return {
        setupId: setup.id,
        setupName: setup.name,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        expectancy: 0,
        avgRiskReward: 0,
        totalPnL: 0,
        avgComplianceScore: 0,
        perfectComplianceTrades: 0,
        commonViolations: [],
        bestConditions: {},
        worstConditions: {},
        createdAt: new Date(setup.createdAt),
        performanceByMonth: []
      }
    }

    // Calculate P&L for each trade
    const tradesWithPnL = setupTrades.map(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return { trade, pnl }
    })

    // Basic metrics
    const winningTrades = tradesWithPnL.filter(t => t.pnl > 0)
    const losingTrades = tradesWithPnL.filter(t => t.pnl < 0)
    const totalPnL = tradesWithPnL.reduce((sum, t) => sum + t.pnl, 0)

    // Calculate average win/loss
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
      : 0
    const avgLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length 
      : 0

    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

    // Calculate win rate
    const winRate = (winningTrades.length / setupTrades.length) * 100

    // Calculate expectancy
    const expectancy = (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss

    // Calculate average risk/reward
    const avgRiskReward = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0

    // Rule compliance analysis
    const complianceScores = setupTrades
      .map(t => t.ruleCompliance?.score || 0)
      .filter(score => score > 0)
    
    const avgComplianceScore = complianceScores.length > 0
      ? complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length
      : 0

    const perfectComplianceTrades = setupTrades.filter(t => t.ruleCompliance?.score === 100).length

    // Find common violations
    const violationCounts: Record<string, number> = {}
    setupTrades.forEach(trade => {
      trade.ruleCompliance?.violatedRules?.forEach(rule => {
        violationCounts[rule] = (violationCounts[rule] || 0) + 1
      })
    })
    const commonViolations = Object.entries(violationCounts)
      .map(([rule, count]) => ({ rule, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Market conditions analysis
    const conditionPerformance = this.analyzeConditionPerformance(tradesWithPnL)

    // Monthly performance
    const performanceByMonth = this.calculateMonthlyPerformance(tradesWithPnL)

    // Last used
    const lastUsed = setupTrades.length > 0 
      ? new Date(Math.max(...setupTrades.map(t => new Date(t.createdAt).getTime())))
      : undefined

    return {
      setupId: setup.id,
      setupName: setup.name,
      totalTrades: setupTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      expectancy,
      avgRiskReward,
      totalPnL,
      avgComplianceScore,
      perfectComplianceTrades,
      commonViolations,
      bestConditions: conditionPerformance.best,
      worstConditions: conditionPerformance.worst,
      lastUsed,
      createdAt: new Date(setup.createdAt),
      performanceByMonth
    }
  }

  // Discipline Score Calculation
  static calculateDisciplineScore(userId: string, trades: Trade[]): DisciplineMetrics {
    const recentTrades = trades
      .filter(t => t.ruleCompliance)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)

    if (recentTrades.length === 0) {
      return {
        overallScore: 100,
        recentScore: 100,
        trend: 'Stable',
        streakInfo: {
          currentStreak: 0,
          isCompliant: true,
          bestStreak: 0
        },
        tiltWarning: false,
        tiltLevel: 0
      }
    }

    // Calculate scores
    const overallScores = trades
      .filter(t => t.ruleCompliance)
      .map(t => t.ruleCompliance!.score)
    
    const overallScore = overallScores.length > 0
      ? overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length
      : 100

    const recentScore = recentTrades.length > 0
      ? recentTrades.reduce((sum, t) => sum + (t.ruleCompliance?.score || 0), 0) / recentTrades.length
      : 100

    // Determine trend
    let trend: 'Improving' | 'Stable' | 'Declining' = 'Stable'
    if (recentTrades.length >= 10) {
      const firstHalf = recentTrades.slice(10).reduce((sum, t) => sum + (t.ruleCompliance?.score || 0), 0) / 10
      const secondHalf = recentTrades.slice(0, 10).reduce((sum, t) => sum + (t.ruleCompliance?.score || 0), 0) / 10
      
      if (secondHalf > firstHalf + 5) trend = 'Improving'
      else if (secondHalf < firstHalf - 5) trend = 'Declining'
    }

    // Calculate streaks
    let currentStreak = 0
    let isCompliant = true
    let bestStreak = 0
    let tempStreak = 0

    for (const trade of trades.filter(t => t.ruleCompliance)) {
      if ((trade.ruleCompliance?.score || 0) >= 90) {
        tempStreak++
        if (tempStreak > bestStreak) bestStreak = tempStreak
      } else {
        tempStreak = 0
      }
    }

    // Current streak (from most recent trades)
    for (const trade of recentTrades) {
      if ((trade.ruleCompliance?.score || 0) >= 90) {
        currentStreak++
      } else {
        isCompliant = false
        break
      }
    }

    // Tilt detection
    const last5Trades = recentTrades.slice(0, 5)
    const last5Score = last5Trades.length > 0
      ? last5Trades.reduce((sum, t) => sum + (t.ruleCompliance?.score || 0), 0) / last5Trades.length
      : 100

    const tiltWarning = last5Score < 70
    const tiltLevel = Math.max(0, Math.min(100, 100 - last5Score))

    return {
      overallScore,
      recentScore,
      trend,
      streakInfo: {
        currentStreak,
        isCompliant,
        bestStreak
      },
      tiltWarning,
      tiltLevel
    }
  }

  // Helper methods
  private static analyzeConditionPerformance(tradesWithPnL: { trade: Trade; pnl: number }[]) {
    const conditionGroups: Record<string, { pnl: number; count: number }> = {}

    tradesWithPnL.forEach(({ trade, pnl }) => {
      if (trade.marketConditions) {
        const key = JSON.stringify(trade.marketConditions)
        if (!conditionGroups[key]) {
          conditionGroups[key] = { pnl: 0, count: 0 }
        }
        conditionGroups[key].pnl += pnl
        conditionGroups[key].count++
      }
    })

    const sorted = Object.entries(conditionGroups)
      .map(([conditions, data]) => ({
        conditions: JSON.parse(conditions),
        avgPnL: data.pnl / data.count
      }))
      .sort((a, b) => b.avgPnL - a.avgPnL)

    return {
      best: sorted[0]?.conditions || {},
      worst: sorted[sorted.length - 1]?.conditions || {}
    }
  }

  private static calculateMonthlyPerformance(tradesWithPnL: { trade: Trade; pnl: number }[]) {
    const monthlyData: Record<string, { pnl: number; trades: number }> = {}

    tradesWithPnL.forEach(({ trade, pnl }) => {
      const date = new Date(trade.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { pnl: 0, trades: 0 }
      }
      monthlyData[monthKey].pnl += pnl
      monthlyData[monthKey].trades++
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        pnl: data.pnl,
        trades: data.trades
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  // Get setup templates
  static getSetupTemplates(): Partial<TradingSetup>[] {
    return [
      {
        name: 'Momentum Breakout',
        description: 'Trade breakouts from consolidation with strong volume',
        category: 'Breakout',
        entryRules: [
          { id: '1', text: 'Price breaks above resistance with volume', category: 'Entry', importance: 'Critical', order: 1 },
          { id: '2', text: 'RSI > 60 confirming momentum', category: 'Entry', importance: 'Important', order: 2 },
          { id: '3', text: 'No major resistance within 2R', category: 'Entry', importance: 'Important', order: 3 }
        ],
        exitRules: [
          { id: '4', text: 'Exit at 2R target or when momentum slows', category: 'Exit', importance: 'Critical', order: 1 },
          { id: '5', text: 'Trail stop after 1R profit', category: 'Exit', importance: 'Important', order: 2 }
        ],
        riskRules: [
          { id: '6', text: 'Max 1% risk per trade', category: 'Risk', importance: 'Critical', order: 1 },
          { id: '7', text: 'Stop loss below breakout candle low', category: 'Risk', importance: 'Critical', order: 2 }
        ],
        targetRiskReward: 2,
        maxLossPerTrade: 1
      },
      {
        name: 'Mean Reversion',
        description: 'Fade extreme moves in ranging markets',
        category: 'Reversal',
        entryRules: [
          { id: '1', text: 'Price at 2+ standard deviations from mean', category: 'Entry', importance: 'Critical', order: 1 },
          { id: '2', text: 'RSI showing divergence', category: 'Entry', importance: 'Important', order: 2 },
          { id: '3', text: 'Range-bound market confirmed', category: 'Entry', importance: 'Critical', order: 3 }
        ],
        exitRules: [
          { id: '4', text: 'Exit at mean (20 SMA) or opposite band', category: 'Exit', importance: 'Critical', order: 1 },
          { id: '5', text: 'Exit if trend develops against position', category: 'Exit', importance: 'Important', order: 2 }
        ],
        riskRules: [
          { id: '6', text: 'Max 0.5% risk in ranging market', category: 'Risk', importance: 'Critical', order: 1 },
          { id: '7', text: 'Stop beyond 3 standard deviations', category: 'Risk', importance: 'Critical', order: 2 }
        ],
        targetRiskReward: 1.5,
        maxLossPerTrade: 0.5
      }
    ]
  }
}