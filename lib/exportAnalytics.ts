import { Trade } from '@/lib/types/metrics'
import * as metrics from '@/lib/tradingMetrics'
import { METRIC_DEFINITIONS } from '@/lib/constants/metrics'

interface ExportData {
  generatedAt: string
  timeframe: string
  trades: {
    total: number
    closed: number
    open: number
    winning: number
    losing: number
  }
  metrics: {
    essential: Record<string, number>
    risk: Record<string, number>
    advanced: Record<string, number>
  }
  insights: Array<{
    type: string
    title: string
    description: string
  }>
}

export function generateAnalyticsExport(trades: Trade[], timeframe: string): ExportData {
  // Calculate basic stats
  const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
  const openTrades = trades.filter(t => t.exit === null || t.exit === undefined)
  const winningTrades = trades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl > 0
  })
  const losingTrades = trades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl < 0
  })

  // Calculate all metrics
  const essentialMetrics = {
    netPnL: metrics.calculateNetPnL(trades),
    winRate: metrics.calculateWinRate(trades),
    profitFactor: metrics.calculateProfitFactor(trades),
    expectancy: metrics.calculateExpectancy(trades),
    averageWin: metrics.calculateAverageWin(trades),
    averageLoss: metrics.calculateAverageLoss(trades),
    totalTrades: trades.length
  }

  const riskMetrics = {
    maxDrawdown: metrics.calculateMaxDrawdown(trades).value,
    avgDrawdown: metrics.calculateAverageDrawdown(trades),
    recoveryFactor: metrics.calculateRecoveryFactor(trades),
    riskOfRuin: metrics.calculateRiskOfRuin(trades).probability,
    rMultiple: metrics.calculateRMultiple(trades)
  }

  const advancedMetrics = {
    sharpeRatio: metrics.calculateSharpeRatio(trades),
    sortinoRatio: metrics.calculateSortinoRatio(trades),
    calmarRatio: metrics.calculateCalmarRatio(trades),
    treynorRatio: metrics.calculateTreynorRatio(trades),
    jensensAlpha: metrics.calculateJensensAlpha(trades)
  }

  // Get insights
  const insights = metrics.generateInsights(trades)

  return {
    generatedAt: new Date().toISOString(),
    timeframe,
    trades: {
      total: trades.length,
      closed: closedTrades.length,
      open: openTrades.length,
      winning: winningTrades.length,
      losing: losingTrades.length
    },
    metrics: {
      essential: essentialMetrics,
      risk: riskMetrics,
      advanced: advancedMetrics
    },
    insights: insights.map(i => ({
      type: i.type,
      title: i.title,
      description: i.description
    }))
  }
}

export function exportToJSON(data: ExportData): void {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `trading-analytics-${data.timeframe}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToCSV(data: ExportData): void {
  const csvRows: string[] = []
  
  // Header
  csvRows.push('Trading Analytics Report')
  csvRows.push(`Generated At,${data.generatedAt}`)
  csvRows.push(`Timeframe,${data.timeframe}`)
  csvRows.push('')
  
  // Trade Statistics
  csvRows.push('Trade Statistics')
  csvRows.push('Metric,Value')
  csvRows.push(`Total Trades,${data.trades.total}`)
  csvRows.push(`Closed Trades,${data.trades.closed}`)
  csvRows.push(`Open Trades,${data.trades.open}`)
  csvRows.push(`Winning Trades,${data.trades.winning}`)
  csvRows.push(`Losing Trades,${data.trades.losing}`)
  csvRows.push('')
  
  // Essential Metrics
  csvRows.push('Essential Metrics')
  csvRows.push('Metric,Value')
  Object.entries(data.metrics.essential).forEach(([key, value]) => {
    const definition = METRIC_DEFINITIONS[key]
    const formattedValue = formatMetricValue(value, definition?.format || 'number')
    csvRows.push(`${definition?.name || key},${formattedValue}`)
  })
  csvRows.push('')
  
  // Risk Metrics
  csvRows.push('Risk Management Metrics')
  csvRows.push('Metric,Value')
  Object.entries(data.metrics.risk).forEach(([key, value]) => {
    const definition = METRIC_DEFINITIONS[key]
    const formattedValue = formatMetricValue(value, definition?.format || 'number')
    csvRows.push(`${definition?.name || key},${formattedValue}`)
  })
  csvRows.push('')
  
  // Advanced Metrics
  csvRows.push('Advanced Risk-Adjusted Metrics')
  csvRows.push('Metric,Value')
  Object.entries(data.metrics.advanced).forEach(([key, value]) => {
    const definition = METRIC_DEFINITIONS[key]
    const formattedValue = formatMetricValue(value, definition?.format || 'number')
    csvRows.push(`${definition?.name || key},${formattedValue}`)
  })
  csvRows.push('')
  
  // Insights
  csvRows.push('Key Insights')
  csvRows.push('Type,Title,Description')
  data.insights.forEach(insight => {
    csvRows.push(`${insight.type},"${insight.title}","${insight.description}"`)
  })
  
  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `trading-analytics-${data.timeframe}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatMetricValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return `$${value.toFixed(2)}`
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'decimal':
      return value.toFixed(2)
    case 'number':
      return Math.round(value).toString()
    default:
      return value.toString()
  }
}

// Import the missing function
import { calculateMarketPnL } from '@/lib/market-knowledge'