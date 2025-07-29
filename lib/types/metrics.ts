// Trading Metrics Type Definitions

export interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  entry: number
  exit?: number | null
  quantity: number
  notes?: string | null
  marketType?: string | null
  createdAt: string
  entryTime?: string | null
  exitTime?: string | null
}

export type MetricCategory = 'essential' | 'risk' | 'advanced'
export type MetricStatus = 'good' | 'warning' | 'danger'
export type MetricFormat = 'currency' | 'percentage' | 'decimal' | 'number'
export type TrendDirection = 'up' | 'down' | 'stable'

export interface MetricDefinition {
  id: string
  name: string
  description: string
  category: MetricCategory
  requiresPro: boolean
  benchmark?: number
  format: MetricFormat
  tooltipContent?: string
}

export interface MetricResult {
  value: number
  status: MetricStatus
  trend?: TrendDirection
  benchmark?: number
  description: string
  format: MetricFormat
}

export interface DrawdownPoint {
  date: Date
  value: number
  drawdown: number
  peak: number
  inDrawdown: boolean
}

export interface RiskOfRuinResult {
  probability: number
  kellyPercentage: number
  maxConsecutiveLosses: number
  recommendation: string
}

export interface MetricInsight {
  type: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description: string
  actionable: boolean
  metric?: string
}

export interface AllMetrics {
  // Essential Metrics
  netPnL: number
  winRate: number
  profitFactor: number
  expectancy: number
  averageWin: number
  averageLoss: number
  totalTrades: number
  
  // Risk Management Metrics
  maxDrawdown: number
  avgDrawdown: number
  recoveryFactor: number
  riskOfRuin: number
  rMultiple: number
  
  // Advanced Risk-Adjusted Metrics
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  treynorRatio: number
  jensensAlpha: number
}

export interface MetricGroup {
  title: string
  description: string
  metrics: string[]
}

export interface SubscriptionStatus {
  plan: 'free' | 'pro'
  expiresAt?: Date
  daysRemaining?: number
}