'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketTypeMetrics } from '@/lib/services/market-analysis-service'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Target,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { safeToFixed } from '@/lib/utils/safe-format'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

interface MarketTypeComparisonProps {
  marketMetrics: MarketTypeMetrics[]
  timeSeriesData?: {
    date: string
    [key: string]: string | number
  }[]
}

export function MarketTypeComparison({ marketMetrics, timeSeriesData }: MarketTypeComparisonProps) {
  // Prepare radar chart data
  const radarData = marketMetrics.map(market => ({
    market: market.marketType,
    winRate: market.metrics.winRate,
    profitFactor: Math.min(market.metrics.profitFactor * 20, 100), // Scale for visibility
    avgPnL: Math.max(0, (market.metrics.avgPnL + 100) / 2), // Normalize to 0-100
    trades: Math.min((market.metrics.trades / Math.max(...marketMetrics.map(m => m.metrics.trades))) * 100, 100)
  }))

  const getMarketColor = (marketType: string) => {
    const colors: Record<string, string> = {
      FUTURES: 'rgb(99, 102, 241)',
      FOREX: 'rgb(168, 85, 247)', 
      STOCKS: 'rgb(34, 197, 94)',
      OPTIONS: 'rgb(251, 146, 60)',
      CRYPTO: 'rgb(236, 72, 153)'
    }
    return colors[marketType] || 'rgb(107, 114, 128)'
  }

  const getMarketIcon = (marketType: string) => {
    switch (marketType) {
      case 'FUTURES':
        return <BarChart3 className="h-5 w-5" />
      case 'FOREX':
        return <DollarSign className="h-5 w-5" />
      case 'STOCKS':
        return <TrendingUp className="h-5 w-5" />
      case 'OPTIONS':
        return <Target className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Market Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketMetrics.map((market, index) => (
          <motion.div
            key={market.marketType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10"
                style={{ backgroundColor: getMarketColor(market.marketType) }}
              />
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: `${getMarketColor(market.marketType)}20`,
                        color: getMarketColor(market.marketType)
                      }}
                    >
                      {getMarketIcon(market.marketType)}
                    </div>
                    <CardTitle className="text-lg">{market.marketType}</CardTitle>
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">
                    #{market.comparison.rank}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Total P&L */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total P&L</span>
                  <span className={cn(
                    "text-lg font-semibold",
                    market.metrics.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ${safeToFixed(Math.abs(market.metrics.totalPnL), 2)}
                  </span>
                </div>

                {/* Win Rate */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${market.metrics.winRate}%`,
                          backgroundColor: market.metrics.winRate >= 50 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {safeToFixed(market.metrics.winRate, 1)}%
                    </span>
                  </div>
                </div>

                {/* Trades & Avg P&L */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="text-sm font-medium">{market.metrics.trades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg P&L</p>
                    <p className={cn(
                      "text-sm font-medium",
                      market.metrics.avgPnL >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${safeToFixed(market.metrics.avgPnL, 2)}
                    </p>
                  </div>
                </div>

                {/* Comparison vs Overall */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">vs Overall Performance</p>
                  <div className="flex items-center gap-2">
                    {market.comparison.vsOverall >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      market.comparison.vsOverall >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {market.comparison.vsOverall >= 0 ? '+' : ''}{safeToFixed(market.comparison.vsOverall, 1)}%
                    </span>
                  </div>
                </div>

                {/* Best/Worst Symbol */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Best Symbol</p>
                    <p className="font-medium text-green-600">{market.metrics.bestSymbol}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Worst Symbol</p>
                    <p className="font-medium text-red-600">{market.metrics.worstSymbol}</p>
                  </div>
                </div>

                {/* Commission & Slippage */}
                {(market.metrics.commission > 0 || market.metrics.slippage > 0) && (
                  <div className="pt-2 border-t text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commission</span>
                      <span className="text-red-600">-${safeToFixed(market.metrics.commission, 2)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Slippage</span>
                      <span className="text-red-600">-${safeToFixed(market.metrics.slippage, 2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Radar Chart Comparison */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Multi-Metric Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="market" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <Radar
                    name="Win Rate"
                    dataKey="winRate"
                    stroke="rgb(34, 197, 94)"
                    fill="rgb(34, 197, 94)"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Profit Factor"
                    dataKey="profitFactor"
                    stroke="rgb(99, 102, 241)"
                    fill="rgb(99, 102, 241)"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Avg P&L"
                    dataKey="avgPnL"
                    stroke="rgb(251, 146, 60)"
                    fill="rgb(251, 146, 60)"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Trade Volume"
                    dataKey="trades"
                    stroke="rgb(168, 85, 247)"
                    fill="rgb(168, 85, 247)"
                    fillOpacity={0.2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Larger area indicates better overall performance across metrics
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Timeline */}
      {timeSeriesData && timeSeriesData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Performance Timeline by Market</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    {marketMetrics.map(market => (
                      <Line
                        key={market.marketType}
                        type="monotone"
                        dataKey={market.marketType}
                        stroke={getMarketColor(market.marketType)}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}