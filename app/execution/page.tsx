'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExecutionAnalysisService, type ExecutionMetrics } from '@/lib/services/execution-analysis-service'
import { findUserByClerkId, findTradesByUserId } from '@/lib/db-memory'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Target, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Zap
} from 'lucide-react'
import { SlippageChart } from '@/components/charts/slippage-chart'
import { HitRateGauge } from '@/components/charts/hit-rate-gauge'
import { PartialExitTimeline } from '@/components/charts/partial-exit-timeline'
import { CommissionBreakdown } from '@/components/charts/commission-breakdown'
import { ExecutionScoreCard } from '@/components/execution-score-card'
import { format, subDays, subMonths, subYears, isAfter } from 'date-fns'

const TIME_PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' }
] as const

export default function ExecutionAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null)
  const [timePeriod, setTimePeriod] = useState<string>('30d')
  const [selectedMarket, setSelectedMarket] = useState<string>('all')
  const [trades, setTrades] = useState<any[]>([])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timePeriod, selectedMarket])

  const fetchData = async () => {
    try {
      setLoading(true)
      const user = await findUserByClerkId('demo-user')
      if (!user) return

      let allTrades = await findTradesByUserId(user.id)
      
      // Filter by time period
      if (timePeriod !== 'all') {
        const now = new Date()
        let startDate: Date
        
        switch (timePeriod) {
          case '7d':
            startDate = subDays(now, 7)
            break
          case '30d':
            startDate = subDays(now, 30)
            break
          case '90d':
            startDate = subDays(now, 90)
            break
          case '1y':
            startDate = subYears(now, 1)
            break
          default:
            startDate = new Date(0)
        }
        
        allTrades = allTrades.filter(trade => 
          isAfter(new Date(trade.entryTime || trade.createdAt), startDate)
        )
      }
      
      // Filter by market type
      if (selectedMarket !== 'all') {
        allTrades = allTrades.filter(trade => trade.marketType === selectedMarket)
      }

      setTrades(allTrades)
      
      // Calculate metrics
      const executionMetrics = ExecutionAnalysisService.analyzeExecution(allTrades)
      setMetrics(executionMetrics)
    } catch (error) {
      console.error('Failed to fetch execution data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!metrics || trades.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Execution Data</h3>
          <p className="text-muted-foreground">
            Start trading to see your execution quality metrics
          </p>
        </Card>
      </div>
    )
  }

  // Get unique market types
  const marketTypes = Array.from(new Set(trades.map(t => t.marketType || 'UNKNOWN')))

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Execution Quality</h1>
            <p className="text-sm text-muted-foreground">
              Analyze your trade execution efficiency
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              {marketTypes.map(market => (
                <SelectItem key={market} value={market}>
                  {market}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Execution Score Card */}
      <ExecutionScoreCard score={metrics.executionScore} insights={metrics.insights} />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg Slippage</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {((Math.abs(metrics.slippage.averageEntrySlippage) + Math.abs(metrics.slippage.averageExitSlippage)) / 2).toFixed(3)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cost: ${Math.abs(metrics.slippage.totalSlippageCost).toFixed(2)}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">SL Hit Rate</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {metrics.hitRates.stopLoss.rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.hitRates.stopLoss.tradesHit}/{metrics.hitRates.stopLoss.totalTrades} trades
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">TP Hit Rate</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {metrics.hitRates.takeProfit.rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Missed: ${metrics.hitRates.takeProfit.missedProfit.toFixed(2)}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Commission Impact</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {metrics.commission.commissionAsPercentOfPnL.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: ${metrics.commission.totalCommission.toFixed(2)}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slippage Analysis */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <SlippageChart slippage={metrics.slippage} trades={trades} />
        </motion.div>

        {/* Hit Rate Gauges */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <HitRateGauge hitRates={metrics.hitRates} />
        </motion.div>

        {/* Commission Breakdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <CommissionBreakdown commission={metrics.commission} />
        </motion.div>

        {/* Partial Exits Timeline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <PartialExitTimeline 
            trades={trades.filter(t => t.partialExits && t.partialExits.length > 0)}
            metrics={metrics.partialExits}
          />
        </motion.div>
      </div>
    </div>
  )
}