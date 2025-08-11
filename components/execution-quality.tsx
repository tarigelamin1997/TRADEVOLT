'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

interface ExecutionMetrics {
  slippage: number
  fillRate: number
  avgExecutionTime: number
  bestExecution: number
  worstExecution: number
  executionScore: number
  missedOpportunities: number
  partialFills: number
  totalExecutions: number
}

interface ExecutionQualityProps {
  trades: Trade[]
  settings?: any
}

export function ExecutionQuality({ trades, settings }: ExecutionQualityProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [metrics, setMetrics] = useState<ExecutionMetrics>({
    slippage: 0,
    fillRate: 0,
    avgExecutionTime: 0,
    bestExecution: 0,
    worstExecution: 0,
    executionScore: 0,
    missedOpportunities: 0,
    partialFills: 0,
    totalExecutions: 0
  })

  useEffect(() => {
    calculateMetrics()
  }, [trades, timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  const calculateMetrics = () => {
    // Filter trades based on time range
    const now = new Date()
    const filteredTrades = timeRange === 'all' ? trades : trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime || trade.createdAt)
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      return tradeDate >= cutoffDate
    })

    if (filteredTrades.length === 0) {
      setMetrics({
        slippage: 0,
        fillRate: 100,
        avgExecutionTime: 0,
        bestExecution: 0,
        worstExecution: 0,
        executionScore: 100,
        missedOpportunities: 0,
        partialFills: 0,
        totalExecutions: 0
      })
      return
    }

    // Calculate slippage (difference between expected and actual entry)
    const slippageData = filteredTrades.map(trade => {
      // Simulate slippage based on market conditions (in real app, this would come from actual execution data)
      const expectedEntry = trade.entry
      const actualEntry = trade.entry * (1 + (Math.random() * 0.002 - 0.001)) // ±0.1% simulated slippage
      return Math.abs(actualEntry - expectedEntry) / expectedEntry * 100
    })
    const avgSlippage = slippageData.reduce((a, b) => a + b, 0) / slippageData.length

    // Calculate fill rate (percentage of orders filled completely)
    const fillRate = 95 + Math.random() * 5 // Simulated 95-100% fill rate

    // Calculate average execution time (in milliseconds)
    const avgExecutionTime = 50 + Math.random() * 100 // Simulated 50-150ms

    // Calculate best and worst executions (in terms of price improvement)
    const executionDeltas = filteredTrades.map(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || 'STOCKS') || 0
      const expectedPnl = pnl * 0.98 // Expected 2% worse due to slippage
      return ((pnl - expectedPnl) / Math.abs(expectedPnl)) * 100
    })
    const bestExecution = Math.max(...executionDeltas)
    const worstExecution = Math.min(...executionDeltas)

    // Calculate execution score (0-100)
    let score = 100
    score -= avgSlippage * 10 // Deduct for slippage
    score -= (100 - fillRate) * 2 // Deduct for incomplete fills
    score -= Math.max(0, avgExecutionTime - 100) * 0.1 // Deduct for slow execution
    score = Math.max(0, Math.min(100, score))

    // Simulate missed opportunities and partial fills
    const missedOpportunities = Math.floor(filteredTrades.length * 0.02) // 2% missed
    const partialFills = Math.floor(filteredTrades.length * 0.05) // 5% partial

    setMetrics({
      slippage: avgSlippage,
      fillRate,
      avgExecutionTime,
      bestExecution,
      worstExecution,
      executionScore: score,
      missedOpportunities,
      partialFills,
      totalExecutions: filteredTrades.length
    })
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 50) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const grade = getScoreGrade(metrics.executionScore)

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Execution Data</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Start trading to see your execution quality metrics
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
          <Button
            key={range}
            onClick={() => setTimeRange(range)}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
          >
            {range === '7d' ? 'Last 7 Days' :
             range === '30d' ? 'Last 30 Days' :
             range === '90d' ? 'Last 90 Days' : 'All Time'}
          </Button>
        ))}
      </div>

      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Execution Quality Score
            </span>
            <div className={cn('px-4 py-2 rounded-lg', grade.bg)}>
              <span className={cn('text-2xl font-bold', grade.color)}>
                {grade.grade}
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Analysis of your trade execution efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-2xl font-bold">{metrics.executionScore.toFixed(0)}/100</span>
            </div>
            <Progress value={metrics.executionScore} className="h-4" />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Slippage</span>
              <ArrowDownRight className={cn(
                "h-4 w-4",
                metrics.slippage < 0.1 ? "text-green-500" : 
                metrics.slippage < 0.2 ? "text-yellow-500" : "text-red-500"
              )} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.slippage.toFixed(3)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average price slippage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Fill Rate</span>
              <CheckCircle className={cn(
                "h-4 w-4",
                metrics.fillRate > 98 ? "text-green-500" : 
                metrics.fillRate > 95 ? "text-yellow-500" : "text-red-500"
              )} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.fillRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Complete order fills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Execution Speed</span>
              <Timer className={cn(
                "h-4 w-4",
                metrics.avgExecutionTime < 100 ? "text-green-500" : 
                metrics.avgExecutionTime < 200 ? "text-yellow-500" : "text-red-500"
              )} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgExecutionTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average execution time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Executions</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalExecutions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Trades executed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Execution Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Execution Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Best Execution</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  +{metrics.bestExecution.toFixed(2)}%
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Price improvement
                </p>
              </div>

              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">Worst Execution</span>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.worstExecution.toFixed(2)}%
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Price deterioration
                </p>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Execution Issues</span>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-700 dark:text-yellow-300">Missed:</span>
                    <span className="font-bold text-yellow-600">{metrics.missedOpportunities}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-700 dark:text-yellow-300">Partial:</span>
                    <span className="font-bold text-yellow-600">{metrics.partialFills}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Recommendations to Improve Execution
              </h4>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                {metrics.slippage > 0.1 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Consider using limit orders instead of market orders to reduce slippage</span>
                  </li>
                )}
                {metrics.fillRate < 98 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Review your order sizes relative to market liquidity</span>
                  </li>
                )}
                {metrics.avgExecutionTime > 150 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Consider upgrading to a faster broker or better internet connection</span>
                  </li>
                )}
                {metrics.missedOpportunities > 0 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Set up alerts and automated orders to capture more opportunities</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}