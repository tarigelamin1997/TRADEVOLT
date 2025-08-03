'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DirectionalMetrics } from '@/lib/services/market-analysis-service'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  Target,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'

interface DirectionalAnalysisProps {
  metrics: DirectionalMetrics
  totalTrades: number
}

export function DirectionalAnalysis({ metrics, totalTrades }: DirectionalAnalysisProps) {
  // Prepare data for visualizations
  const directionData = [
    {
      name: 'Long',
      trades: metrics.long.trades,
      winRate: metrics.long.winRate,
      avgPnL: metrics.long.avgPnL,
      totalPnL: metrics.long.totalPnL,
      profitFactor: metrics.long.profitFactor,
      avgHoldTime: metrics.long.avgHoldTime,
      color: '#22c55e'
    },
    {
      name: 'Short',
      trades: metrics.short.trades,
      winRate: metrics.short.winRate,
      avgPnL: metrics.short.avgPnL,
      totalPnL: metrics.short.totalPnL,
      profitFactor: metrics.short.profitFactor,
      avgHoldTime: metrics.short.avgHoldTime,
      color: '#ef4444'
    }
  ]

  const winRateComparison = [
    { name: 'Long', value: metrics.long.winRate, fill: '#22c55e' },
    { name: 'Short', value: metrics.short.winRate, fill: '#ef4444' }
  ]

  const tradeDistribution = [
    { name: 'Long', value: metrics.long.trades, fill: '#22c55e' },
    { name: 'Short', value: metrics.short.trades, fill: '#ef4444' }
  ]

  const getBiasColor = () => {
    if (metrics.bias === 'LONG') return 'text-green-600'
    if (metrics.bias === 'SHORT') return 'text-red-600'
    return 'text-gray-600'
  }

  const getBiasIcon = () => {
    if (metrics.bias === 'LONG') return <TrendingUp className="h-6 w-6 text-green-600" />
    if (metrics.bias === 'SHORT') return <TrendingDown className="h-6 w-6 text-red-600" />
    return <Activity className="h-6 w-6 text-gray-600" />
  }

  return (
    <div className="space-y-6">
      {/* Bias Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Directional Bias Analysis</span>
              {getBiasIcon()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your Trading Bias</p>
                <p className={cn("text-4xl font-bold", getBiasColor())}>
                  {metrics.bias}
                </p>
              </div>
              
              {/* Bias Strength Meter */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Weak</span>
                  <span>Strong</span>
                </div>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.biasStrength}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "absolute left-0 top-0 h-full rounded-full",
                      metrics.bias === 'LONG' ? "bg-green-600" :
                      metrics.bias === 'SHORT' ? "bg-red-600" :
                      "bg-gray-600"
                    )}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-white mix-blend-difference">
                      {metrics.biasStrength.toFixed(0)}% Strength
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {metrics.bias === 'LONG' && 
                  "You show a strong preference for long positions. Your long trades consistently outperform shorts."
                }
                {metrics.bias === 'SHORT' && 
                  "You show a strong preference for short positions. Your short trades consistently outperform longs."
                }
                {metrics.bias === 'NEUTRAL' && 
                  "You trade both directions with balanced performance. No significant directional bias detected."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {directionData.map((direction, index) => (
          <motion.div
            key={direction.name}
            initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden">
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10",
                direction.name === 'Long' ? "bg-green-600" : "bg-red-600"
              )} />
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {direction.name === 'Long' ? 
                    <TrendingUp className="h-5 w-5 text-green-600" /> : 
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  }
                  {direction.name} Performance
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      direction.winRate >= 50 ? "text-green-600" : "text-red-600"
                    )}>
                      {direction.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trades</p>
                    <p className="text-2xl font-bold">{direction.trades}</p>
                  </div>
                </div>

                {/* P&L Metrics */}
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total P&L</span>
                    <span className={cn(
                      "font-semibold",
                      direction.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${direction.totalPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg P&L</span>
                    <span className={cn(
                      "font-medium",
                      direction.avgPnL >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${direction.avgPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Profit Factor</span>
                    <span className={cn(
                      "font-medium",
                      direction.profitFactor >= 1.5 ? "text-green-600" :
                      direction.profitFactor >= 1 ? "text-amber-600" :
                      "text-red-600"
                    )}>
                      {direction.profitFactor.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Hold Time */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Avg Hold Time</span>
                  </div>
                  <span className="font-medium">{direction.avgHoldTime.toFixed(1)}h</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Win Rate Comparison */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Win Rate Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={winRateComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {winRateComparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trade Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {tradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} trades`, 'Count']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2 text-sm text-muted-foreground">
                Total Trades: {totalTrades}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* P&L Distribution Comparison */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={directionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalPnL" name="Total P&L ($)" radius={[8, 8, 0, 0]}>
                    {directionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="profitFactor" name="Profit Factor" radius={[8, 8, 0, 0]}>
                    {directionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} opacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}