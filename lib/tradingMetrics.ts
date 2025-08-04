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

// Raw calculation functions (for internal use)
function calculateWinRateRaw(trades: Trade[]): number {
  const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
  if (closedTrades.length === 0) return 0
  
  const winningTrades = closedTrades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl > 0
  })
  
  return (winningTrades.length / closedTrades.length) * 100
}

export function calculateWinRate(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'percentage'; description: string } {
  const winRateValue = calculateWinRateRaw(trades)
  
  return {
    value: winRateValue,
    // // formatted: `${winRateValue.toFixed(1)}%`,
    status: winRateValue >= 50 ? 'good' : winRateValue >= 40 ? 'warning' : 'danger',
    format: 'percentage',
    description: 'Percentage of trades that closed in profit'
  }
}

function calculateProfitFactorRaw(trades: Trade[]): number {
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

export function calculateProfitFactor(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'decimal'; description: string } {
  const pfValue = calculateProfitFactorRaw(trades)
  const displayValue = pfValue === Infinity ? 999 : pfValue
  
  return {
    value: displayValue,
    // // formatted: displayValue.toFixed(2),
    status: displayValue >= 1.5 ? 'good' : displayValue >= 1 ? 'warning' : 'danger',
    format: 'decimal',
    description: 'Ratio of gross profit to gross loss'
  }
}

export function calculateExpectancy(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'currency'; description: string } {
  const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
  if (closedTrades.length === 0) return { value: 0, status: 'warning', format: 'currency', description: 'Average amount made per trade' }
  
  const totalPnL = calculateNetPnL(closedTrades)
  const expectancyValue = totalPnL / closedTrades.length
  
  return {
    value: expectancyValue,
    // // formatted: `$${Math.abs(expectancyValue).toFixed(2)}`,
    status: expectancyValue > 0 ? 'good' : expectancyValue === 0 ? 'warning' : 'danger',
    format: 'currency',
    description: 'Average amount made per trade'
  }
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

function calculateMaxDrawdownRaw(trades: Trade[]): { value: number; points: DrawdownPoint[] } {
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

export function calculateMaxDrawdown(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'percentage'; description: string } {
  const { value: maxDrawdownValue } = calculateMaxDrawdownRaw(trades)
  
  return {
    value: maxDrawdownValue,
    // // formatted: `${maxDrawdownValue.toFixed(2)}%`,
    status: maxDrawdownValue < 10 ? 'good' : maxDrawdownValue < 20 ? 'warning' : 'danger',
    format: 'percentage',
    description: 'Largest peak-to-trough decline in account value'
  }
}

export function calculateAverageDrawdown(trades: Trade[]): number {
  const { points } = calculateMaxDrawdownRaw(trades)
  if (points.length === 0) return 0
  
  const drawdowns = points.filter(p => p.drawdown > 0).map(p => p.drawdown)
  if (drawdowns.length === 0) return 0
  
  return drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length
}

export function calculateRecoveryFactor(trades: Trade[]): number {
  const netProfit = calculateNetPnL(trades)
  const { value: maxDrawdown } = calculateMaxDrawdownRaw(trades)
  
  if (maxDrawdown === 0) return netProfit > 0 ? Infinity : 0
  
  // Convert maxDrawdown from percentage to dollar amount
  const maxDrawdownDollars = (maxDrawdown / 100) * 10000 // Based on starting balance
  return netProfit / maxDrawdownDollars
}

export function calculateRiskOfRuin(trades: Trade[]): RiskOfRuinResult {
  const winRate = calculateWinRateRaw(trades) / 100
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

function calculateSharpeRatioRaw(trades: Trade[]): number {
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

export function calculateSharpeRatio(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'decimal'; description: string } {
  const sharpeValue = calculateSharpeRatioRaw(trades)
  
  return {
    value: sharpeValue,
    // // formatted: sharpeValue.toFixed(2),
    status: sharpeValue > 1 ? 'good' : sharpeValue > 0 ? 'warning' : 'danger',
    format: 'decimal',
    description: 'Risk-adjusted return measure'
  }
}

export function calculateSortinoRatio(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'decimal'; description: string } {
  const returns = calculateReturns(trades)
  if (returns.length === 0) return { value: 0, status: 'warning', format: 'decimal', description: 'Risk-adjusted return using downside deviation' }
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const annualizedReturn = avgReturn * Math.sqrt(MARKET_ASSUMPTIONS.tradingDaysPerYear)
  
  // Calculate downside deviation (only negative returns)
  const negativeReturns = returns.filter(r => r < 0)
  if (negativeReturns.length === 0) {
    const value = annualizedReturn > 0 ? 999 : 0
    return { value, status: value > 0 ? 'good' : 'warning', format: 'decimal', description: 'Risk-adjusted return using downside deviation' }
  }
  
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length
  const downsideDeviation = Math.sqrt(downsideVariance)
  const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(MARKET_ASSUMPTIONS.tradingDaysPerYear)
  
  if (annualizedDownsideDeviation === 0) return { value: 0, status: 'warning', format: 'decimal', description: 'Risk-adjusted return using downside deviation' }
  
  const excessReturn = annualizedReturn - (MARKET_ASSUMPTIONS.riskFreeRate * 100)
  const sortinoValue = excessReturn / annualizedDownsideDeviation
  
  return {
    value: sortinoValue,
    // // formatted: sortinoValue.toFixed(2),
    status: sortinoValue > 1.5 ? 'good' : sortinoValue > 0 ? 'warning' : 'danger',
    format: 'decimal',
    description: 'Risk-adjusted return using downside deviation'
  }
}

export function calculateCalmarRatio(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'decimal'; description: string } {
  // Calculate annualized return
  if (trades.length === 0) return { value: 0, status: 'warning', format: 'decimal', description: 'Annualized return divided by maximum drawdown' }
  
  const firstTradeDate = new Date(
    Math.min(...trades.map(t => new Date(t.createdAt).getTime()))
  )
  const lastTradeDate = new Date(
    Math.max(...trades.map(t => new Date(t.createdAt).getTime()))
  )
  
  const daysDiff = (lastTradeDate.getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysDiff < 30) return { value: 0, status: 'warning', format: 'decimal', description: 'Annualized return divided by maximum drawdown' } // Need at least 30 days of data
  
  const totalReturn = calculateNetPnL(trades) / 10000 // As percentage of starting balance
  const annualizedReturn = (totalReturn * 365) / daysDiff
  
  const { value: maxDrawdown } = calculateMaxDrawdownRaw(trades)
  if (maxDrawdown === 0) {
    const value = annualizedReturn > 0 ? 999 : 0
    return { value, status: value > 0 ? 'good' : 'warning', format: 'decimal', description: 'Annualized return divided by maximum drawdown' }
  }
  
  const calmarValue = annualizedReturn / (maxDrawdown / 100)
  
  return {
    value: calmarValue,
    // // formatted: calmarValue.toFixed(2),
    status: calmarValue > 1 ? 'good' : calmarValue > 0 ? 'warning' : 'danger',
    format: 'decimal',
    description: 'Annualized return divided by maximum drawdown'
  }
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

// Additional Missing Metric Functions

export function calculateWinRateLongShort(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'percentage'; description: string } {
  const longTrades = trades.filter(t => t.type === 'BUY' && t.exit !== null && t.exit !== undefined)
  const shortTrades = trades.filter(t => t.type === 'SELL' && t.exit !== null && t.exit !== undefined)
  
  const longWinRate = longTrades.length > 0 ? calculateWinRateRaw(longTrades) : 0
  const shortWinRate = shortTrades.length > 0 ? calculateWinRateRaw(shortTrades) : 0
  
  // Return average of long and short win rates
  const avgWinRate = longTrades.length + shortTrades.length > 0 ? 
    (longWinRate * longTrades.length + shortWinRate * shortTrades.length) / (longTrades.length + shortTrades.length) : 0
  
  return {
    value: avgWinRate,
    status: avgWinRate >= 50 ? 'good' : avgWinRate >= 40 ? 'warning' : 'danger',
    format: 'percentage',
    description: 'Combined win rate across long and short trades'
  }
}

export function calculateAvgWinLoss(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'decimal'; description: string } {
  const avgWin = calculateAverageWin(trades)
  const avgLoss = calculateAverageLoss(trades)
  
  const ratio = avgLoss > 0 ? avgWin / avgLoss : 0
  
  return {
    value: ratio,
    // // formatted: ratio.toFixed(2),
    status: ratio >= 1.5 ? 'good' : ratio >= 1 ? 'warning' : 'danger',
    format: 'decimal',
    description: 'Average winning trade divided by average losing trade'
  }
}

export function calculateAvgRiskReward(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'decimal'; description: string } {
  // Same as avgWinLoss for now - represents risk/reward ratio
  const result = calculateAvgWinLoss(trades)
  return {
    ...result,
    description: 'Average risk to reward ratio across all trades'
  }
}

export function calculateKellyPercentage(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'percentage'; description: string } {
  const riskOfRuin = calculateRiskOfRuin(trades)
  
  return {
    value: riskOfRuin.kellyPercentage,
    // // formatted: `${riskOfRuin.kellyPercentage.toFixed(1)}%`,
    status: riskOfRuin.kellyPercentage > 15 ? 'good' : riskOfRuin.kellyPercentage > 5 ? 'warning' : 'danger',
    format: 'percentage',
    description: 'Optimal position size according to Kelly Criterion'
  }
}

export function calculateProfitFactorLongShort(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'decimal'; description: string } {
  const longTrades = trades.filter(t => t.type === 'BUY')
  const shortTrades = trades.filter(t => t.type === 'SELL')
  
  const longPF = longTrades.length > 0 ? calculateProfitFactorRaw(longTrades) : 0
  const shortPF = shortTrades.length > 0 ? calculateProfitFactorRaw(shortTrades) : 0
  
  // Return weighted average of long and short profit factors
  const totalTrades = longTrades.length + shortTrades.length
  const avgPF = totalTrades > 0 ? 
    (longPF * longTrades.length + shortPF * shortTrades.length) / totalTrades : 0
  
  return {
    value: avgPF,
    status: avgPF >= 1.5 ? 'good' : avgPF >= 1 ? 'warning' : 'danger',
    format: 'decimal',
    description: 'Combined profit factor across long and short trades'
  }
}

export function calculateConsistency(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'percentage'; description: string } {
  if (trades.length === 0) return { value: 0, status: 'warning', format: 'percentage', description: 'Percentage of profitable months' }
  
  // Calculate monthly P&L consistency
  const monthlyPnL = new Map<string, number>()
  
  trades.forEach(trade => {
    const date = new Date(trade.createdAt)
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    
    monthlyPnL.set(monthKey, (monthlyPnL.get(monthKey) || 0) + pnl)
  })
  
  const months = Array.from(monthlyPnL.values())
  if (months.length < 2) return { value: 0, status: 'warning', format: 'percentage', description: 'Percentage of profitable months' }
  
  const profitableMonths = months.filter(pnl => pnl > 0).length
  const consistency = (profitableMonths / months.length) * 100
  
  return {
    value: consistency,
    // // formatted: `${consistency.toFixed(1)}%`,
    status: consistency >= 70 ? 'good' : consistency >= 50 ? 'warning' : 'danger',
    format: 'percentage',
    description: 'Percentage of profitable months'
  }
}

export function calculatePayoffRatio(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'decimal'; description: string } {
  // Same as average win/loss ratio
  const result = calculateAvgWinLoss(trades)
  return {
    ...result,
    description: 'Average profit per winning trade vs average loss per losing trade'
  }
}

export function calculateUlcerIndex(trades: Trade[]): { value: number; status: 'good' | 'warning' | 'danger'; format: 'percentage'; description: string } {
  const { points } = calculateMaxDrawdownRaw(trades)
  if (points.length === 0) return { value: 0, status: 'warning', format: 'percentage', description: 'Risk measure based on depth and duration of drawdowns' }
  
  // Calculate squared drawdowns sum
  const squaredDrawdowns = points.reduce((sum, point) => {
    return sum + Math.pow(point.drawdown, 2)
  }, 0)
  
  const ulcerIndex = Math.sqrt(squaredDrawdowns / points.length)
  
  return {
    value: ulcerIndex,
    // // formatted: `${ulcerIndex.toFixed(2)}%`,
    status: ulcerIndex < 5 ? 'good' : ulcerIndex < 10 ? 'warning' : 'danger',
    format: 'percentage',
    description: 'Risk measure based on depth and duration of drawdowns'
  }
}

// Generate insights based on metrics
export function generateInsights(trades: Trade[]): MetricInsight[] {
  const insights: MetricInsight[] = []
  
  const winRate = calculateWinRateRaw(trades)
  const profitFactor = calculateProfitFactorRaw(trades)
  const { value: maxDrawdown } = calculateMaxDrawdownRaw(trades)
  const sharpeRatio = calculateSharpeRatioRaw(trades)
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