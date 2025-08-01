import { Trade, DrawdownPoint, RiskOfRuinResult, MetricInsight } from '@/lib/types/metrics'
import { MARKET_ASSUMPTIONS } from '@/lib/constants/metrics'
import { calculateMarketPnL } from '@/lib/market-knowledge'

// Helper function to calculate returns from trades
function calculateReturns(trades: Trade[]): number[] {
  const returns: number[] = []
  let balance = 10000 // Starting balance assumption
  
  trades.forEach(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    const returnPercent = (pnl / balance) * 100
    returns.push(returnPercent)
    balance += pnl
  })
  
  return returns
}

// Helper function to calculate daily returns
function calculateDailyReturns(trades: Trade[]): Map<string, number> {
  const dailyReturns = new Map<string, number>()
  
  trades.forEach(trade => {
    const date = new Date(trade.createdAt).toISOString().split('T')[0]
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    const current = dailyReturns.get(date) || 0
    dailyReturns.set(date, current + pnl)
  })
  
  return dailyReturns
}

// Essential Metrics Calculations

export function calculateNetPnL(trades: Trade[]): number {
  return trades.reduce((sum, trade) => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return sum + pnl
  }, 0)
}

export function calculateWinRate(trades: Trade[]): number {
  const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
  if (closedTrades.length === 0) return 0
  
  const winningTrades = closedTrades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl > 0
  })
  
  return (winningTrades.length / closedTrades.length) * 100
}

export function calculateProfitFactor(trades: Trade[]): number {
  let totalWins = 0
  let totalLosses = 0
  
  trades.forEach(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    if (pnl > 0) {
      totalWins += pnl
    } else if (pnl < 0) {
      totalLosses += Math.abs(pnl)
    }
  })
  
  return totalLosses === 0 ? (totalWins > 0 ? Infinity : 0) : totalWins / totalLosses
}

export function calculateExpectancy(trades: Trade[]): number {
  const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
  if (closedTrades.length === 0) return 0
  
  const totalPnL = calculateNetPnL(closedTrades)
  return totalPnL / closedTrades.length
}

export function calculateAverageWin(trades: Trade[]): number {
  const winningTrades = trades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl > 0
  })
  
  if (winningTrades.length === 0) return 0
  
  const totalWins = winningTrades.reduce((sum, trade) => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return sum + pnl
  }, 0)
  
  return totalWins / winningTrades.length
}

export function calculateAverageLoss(trades: Trade[]): number {
  const losingTrades = trades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl < 0
  })
  
  if (losingTrades.length === 0) return 0
  
  const totalLosses = losingTrades.reduce((sum, trade) => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return sum + Math.abs(pnl)
  }, 0)
  
  return totalLosses / losingTrades.length
}

// Risk Management Metrics

export function calculateMaxDrawdown(trades: Trade[]): { value: number; points: DrawdownPoint[] } {
  const points: DrawdownPoint[] = []
  let balance = 10000 // Starting balance
  let peak = balance
  let maxDrawdown = 0
  let inDrawdown = false
  
  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  
  sortedTrades.forEach(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    balance += pnl
    
    if (balance > peak) {
      peak = balance
      inDrawdown = false
    } else {
      inDrawdown = true
    }
    
    const drawdown = ((peak - balance) / peak) * 100
    maxDrawdown = Math.max(maxDrawdown, drawdown)
    
    points.push({
      date: new Date(trade.createdAt),
      value: balance,
      drawdown,
      peak,
      inDrawdown
    })
  })
  
  return { value: maxDrawdown, points }
}

export function calculateAverageDrawdown(trades: Trade[]): number {
  const { points } = calculateMaxDrawdown(trades)
  if (points.length === 0) return 0
  
  const drawdowns = points.filter(p => p.drawdown > 0).map(p => p.drawdown)
  if (drawdowns.length === 0) return 0
  
  return drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length
}

export function calculateRecoveryFactor(trades: Trade[]): number {
  const netProfit = calculateNetPnL(trades)
  const { value: maxDrawdown } = calculateMaxDrawdown(trades)
  
  if (maxDrawdown === 0) return netProfit > 0 ? Infinity : 0
  
  // Convert maxDrawdown from percentage to dollar amount
  const maxDrawdownDollars = (maxDrawdown / 100) * 10000 // Based on starting balance
  return netProfit / maxDrawdownDollars
}

export function calculateRiskOfRuin(trades: Trade[]): RiskOfRuinResult {
  const winRate = calculateWinRate(trades) / 100
  const avgWin = calculateAverageWin(trades)
  const avgLoss = calculateAverageLoss(trades)
  
  if (avgWin === 0 || avgLoss === 0 || winRate === 0 || winRate === 1) {
    return {
      probability: 0,
      kellyPercentage: 0,
      maxConsecutiveLosses: 0,
      recommendation: 'Insufficient data for risk calculation'
    }
  }
  
  // Kelly Criterion calculation
  const winLossRatio = avgWin / avgLoss
  const kellyPercentage = (winRate * winLossRatio - (1 - winRate)) / winLossRatio
  
  // Risk of Ruin calculation (simplified)
  const riskPerTrade = 0.02 // Assuming 2% risk per trade
  const probability = Math.pow((1 - winRate) / winRate * (avgLoss / avgWin), 50 / riskPerTrade) * 100
  
  // Max consecutive losses at 95% confidence
  const maxConsecutiveLosses = Math.ceil(Math.log(0.05) / Math.log(1 - winRate))
  
  let recommendation = ''
  if (probability < 1) recommendation = 'Very low risk - excellent risk management'
  else if (probability < 5) recommendation = 'Low risk - good risk management'
  else if (probability < 10) recommendation = 'Moderate risk - consider reducing position size'
  else recommendation = 'High risk - immediate risk management review needed'
  
  return {
    probability: Math.min(probability, 100),
    kellyPercentage: Math.max(0, Math.min(kellyPercentage, 0.25)) * 100,
    maxConsecutiveLosses,
    recommendation
  }
}

export function calculateRMultiple(trades: Trade[]): number {
  // Assuming fixed risk per trade (simplified)
  const riskPerTrade = 100 // $100 risk per trade
  const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
  
  if (closedTrades.length === 0) return 0
  
  const totalRMultiple = closedTrades.reduce((sum, trade) => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return sum + (pnl / riskPerTrade)
  }, 0)
  
  return totalRMultiple / closedTrades.length
}

// Advanced Risk-Adjusted Metrics

export function calculateSharpeRatio(trades: Trade[]): number {
  const returns = calculateReturns(trades)
  if (returns.length === 0) return 0
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const annualizedReturn = avgReturn * Math.sqrt(MARKET_ASSUMPTIONS.tradingDaysPerYear)
  
  // Calculate standard deviation
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)
  const annualizedStdDev = stdDev * Math.sqrt(MARKET_ASSUMPTIONS.tradingDaysPerYear)
  
  if (annualizedStdDev === 0) return 0
  
  const excessReturn = annualizedReturn - (MARKET_ASSUMPTIONS.riskFreeRate * 100)
  return excessReturn / annualizedStdDev
}

export function calculateSortinoRatio(trades: Trade[]): number {
  const returns = calculateReturns(trades)
  if (returns.length === 0) return 0
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const annualizedReturn = avgReturn * Math.sqrt(MARKET_ASSUMPTIONS.tradingDaysPerYear)
  
  // Calculate downside deviation (only negative returns)
  const negativeReturns = returns.filter(r => r < 0)
  if (negativeReturns.length === 0) return annualizedReturn > 0 ? Infinity : 0
  
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length
  const downsideDeviation = Math.sqrt(downsideVariance)
  const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(MARKET_ASSUMPTIONS.tradingDaysPerYear)
  
  if (annualizedDownsideDeviation === 0) return 0
  
  const excessReturn = annualizedReturn - (MARKET_ASSUMPTIONS.riskFreeRate * 100)
  return excessReturn / annualizedDownsideDeviation
}

export function calculateCalmarRatio(trades: Trade[]): number {
  // Calculate annualized return
  if (trades.length === 0) return 0
  
  const firstTradeDate = new Date(
    Math.min(...trades.map(t => new Date(t.createdAt).getTime()))
  )
  const lastTradeDate = new Date(
    Math.max(...trades.map(t => new Date(t.createdAt).getTime()))
  )
  
  const daysDiff = (lastTradeDate.getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysDiff < 30) return 0 // Need at least 30 days of data
  
  const totalReturn = calculateNetPnL(trades) / 10000 // As percentage of starting balance
  const annualizedReturn = (totalReturn * 365) / daysDiff
  
  const { value: maxDrawdown } = calculateMaxDrawdown(trades)
  if (maxDrawdown === 0) return annualizedReturn > 0 ? Infinity : 0
  
  return annualizedReturn / (maxDrawdown / 100)
}

export function calculateTreynorRatio(trades: Trade[]): number {
  const returns = calculateReturns(trades)
  if (returns.length === 0) return 0
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const annualizedReturn = avgReturn * Math.sqrt(MARKET_ASSUMPTIONS.tradingDaysPerYear)
  
  // Using assumed beta from constants
  const beta = MARKET_ASSUMPTIONS.marketBeta
  
  if (beta === 0) return 0
  
  const excessReturn = annualizedReturn - (MARKET_ASSUMPTIONS.riskFreeRate * 100)
  return excessReturn / beta
}

export function calculateJensensAlpha(trades: Trade[]): number {
  const returns = calculateReturns(trades)
  if (returns.length === 0) return 0
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const annualizedReturn = avgReturn * Math.sqrt(MARKET_ASSUMPTIONS.tradingDaysPerYear) / 100
  
  // Expected return based on CAPM
  const beta = MARKET_ASSUMPTIONS.marketBeta
  const expectedReturn = MARKET_ASSUMPTIONS.riskFreeRate + 
    beta * (MARKET_ASSUMPTIONS.marketReturn - MARKET_ASSUMPTIONS.riskFreeRate)
  
  // Alpha is the excess return over expected
  return (annualizedReturn - expectedReturn) * 100
}

// Generate insights based on metrics
export function generateInsights(trades: Trade[]): MetricInsight[] {
  const insights: MetricInsight[] = []
  
  const winRate = calculateWinRate(trades)
  const profitFactor = calculateProfitFactor(trades)
  const { value: maxDrawdown } = calculateMaxDrawdown(trades)
  const sharpeRatio = calculateSharpeRatio(trades)
  const avgWin = calculateAverageWin(trades)
  const avgLoss = calculateAverageLoss(trades)
  
  // Win rate insights
  if (winRate < 40) {
    insights.push({
      type: 'warning',
      title: 'Low Win Rate',
      description: `Your win rate is ${winRate.toFixed(1)}%. Consider reviewing your entry criteria.`,
      actionable: true,
      metric: 'winRate'
    })
  } else if (winRate > 70) {
    insights.push({
      type: 'success',
      title: 'Excellent Win Rate',
      description: `Your win rate of ${winRate.toFixed(1)}% is exceptional. Ensure you are not cutting winners too early.`,
      actionable: false,
      metric: 'winRate'
    })
  }
  
  // Profit factor insights
  if (profitFactor < 1) {
    insights.push({
      type: 'danger',
      title: 'Negative Profit Factor',
      description: 'You are losing more than you are winning. Immediate strategy review needed.',
      actionable: true,
      metric: 'profitFactor'
    })
  } else if (profitFactor > 2) {
    insights.push({
      type: 'success',
      title: 'Strong Profit Factor',
      description: `Your profit factor of ${profitFactor.toFixed(2)} indicates a robust trading system.`,
      actionable: false,
      metric: 'profitFactor'
    })
  }
  
  // Risk/reward insights
  if (avgWin > 0 && avgLoss > 0) {
    const riskRewardRatio = avgWin / avgLoss
    if (riskRewardRatio < 1) {
      insights.push({
        type: 'warning',
        title: 'Poor Risk/Reward Ratio',
        description: `You are risking $${avgLoss.toFixed(2)} to make $${avgWin.toFixed(2)}. Consider adjusting your targets.`,
        actionable: true,
        metric: 'expectancy'
      })
    }
  }
  
  // Drawdown insights
  if (maxDrawdown > 20) {
    insights.push({
      type: 'danger',
      title: 'High Maximum Drawdown',
      description: `Your maximum drawdown of ${maxDrawdown.toFixed(1)}% is concerning. Consider reducing position sizes.`,
      actionable: true,
      metric: 'maxDrawdown'
    })
  }
  
  // Sharpe ratio insights
  if (sharpeRatio < 0) {
    insights.push({
      type: 'danger',
      title: 'Negative Sharpe Ratio',
      description: 'Your risk-adjusted returns are negative. Strategy overhaul recommended.',
      actionable: true,
      metric: 'sharpeRatio'
    })
  } else if (sharpeRatio > 1.5) {
    insights.push({
      type: 'success',
      title: 'Excellent Risk-Adjusted Returns',
      description: `Your Sharpe ratio of ${sharpeRatio.toFixed(2)} indicates superior risk management.`,
      actionable: false,
      metric: 'sharpeRatio'
    })
  }
  
  // General insights
  if (trades.length < 30) {
    insights.push({
      type: 'info',
      title: 'Limited Trade Sample',
      description: 'With fewer than 30 trades, metrics may not be statistically significant yet.',
      actionable: false
    })
  }
  
  return insights
}