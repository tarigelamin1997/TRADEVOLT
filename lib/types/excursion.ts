export interface PriceData {
  timestamp: Date
  price: number
  volume?: number
}

export interface RunningPnL {
  timestamp: Date
  price: number
  pnl: number
  pnlPercent: number
  maeAtTime: number
  mfeAtTime: number
}

export interface ExcursionMetrics {
  mae: number
  mfe: number
  edgeRatio: number
  updrawPercent: number | null
}

export interface ExcursionData extends ExcursionMetrics {
  runningPnL: RunningPnL[]
  priceData: PriceData[]
}

export interface ExcursionStats {
  avgMAE: number
  avgMFE: number
  avgEdgeRatio: number
  avgEfficiency: number
  totalTrades: number
  maeDistribution: { range: string; count: number }[]
  mfeDistribution: { range: string; count: number }[]
  trades: Array<{
    id: string
    symbol: string
    mae: number
    mfe: number
    edgeRatio: number
    pnl: number
  }>
}

export interface PriceDataProvider {
  fetchHistoricalData(
    symbol: string,
    startTime: Date,
    endTime: Date,
    interval: '1m' | '5m' | '15m' | '1h'
  ): Promise<PriceData[]>
}