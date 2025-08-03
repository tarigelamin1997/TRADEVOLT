'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '@/components/sidebar-layout'
import { HourlyHeatmap } from '@/components/charts/hourly-heatmap'
import { DayOfWeekChart } from '@/components/charts/day-of-week-chart'
import { HoldTimeDistribution } from '@/components/charts/hold-time-distribution'
import { TradeFrequency } from '@/components/charts/trade-frequency'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Calendar,
  Activity,
  TrendingUp,
  BarChart3,
  Timer
} from 'lucide-react'
import { TimeAnalysisService } from '@/lib/services/time-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed } from '@/lib/utils/safe-format'
import type { Trade } from '@/lib/db-memory'

export default function TimeAnalysisPage() {
  const { settings } = useSettings()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quickStats, setQuickStats] = useState({
    avgHoldTime: 0,
    bestHour: 0,
    bestDay: '',
    totalTradingDays: 0,
    avgTradesPerDay: 0
  })

  useEffect(() => {
    fetchTrades()
  }, [])

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getTrades' })
      })
      const data = await res.json()
      const trades = data.trades || []
      setTrades(trades)
      
      // Calculate quick stats
      if (trades.length > 0) {
        const holdTimeStats = TimeAnalysisService.getHoldTimeStats(trades)
        const hourlyStats = TimeAnalysisService.getHourlyStats(trades)
        const dayStats = TimeAnalysisService.getDayOfWeekStats(trades)
        const frequencyStats = TimeAnalysisService.getTradeFrequency(trades)
        
        const bestHour = hourlyStats.length > 0 ? hourlyStats.reduce((best, curr) => 
          curr.totalPnL > best.totalPnL ? curr : best
        , hourlyStats[0]) : { hour: 0, totalPnL: 0 }
        
        const bestDay = dayStats.length > 0 ? dayStats.reduce((best, curr) => 
          curr.totalPnL > best.totalPnL ? curr : best
        , dayStats[0]) : { dayName: 'Monday', totalPnL: 0 }
        
        setQuickStats({
          avgHoldTime: holdTimeStats.avgHoldTime,
          bestHour: bestHour.hour,
          bestDay: bestDay.dayName,
          totalTradingDays: frequencyStats.tradingDays,
          avgTradesPerDay: frequencyStats.avgTradesPerDay
        })
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </SidebarLayout>
    )
  }

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              Time-Based Analytics
            </h1>
            <p className="text-muted-foreground">
              Discover your optimal trading times and patterns based on historical performance
            </p>
          </motion.div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Timer className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-80">Avg Hold</span>
              </div>
              <div className="text-2xl font-bold">
                {TimeAnalysisService.formatHoldTime(quickStats.avgHoldTime)}
              </div>
              <div className="text-xs opacity-80">Average hold time</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-80">Best Hour</span>
              </div>
              <div className="text-2xl font-bold">
                {formatHour(quickStats.bestHour)}
              </div>
              <div className="text-xs opacity-80">Most profitable hour</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-80">Best Day</span>
              </div>
              <div className="text-2xl font-bold">
                {quickStats.bestDay}
              </div>
              <div className="text-xs opacity-80">Most profitable day</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-80">Trading Days</span>
              </div>
              <div className="text-2xl font-bold">
                {quickStats.totalTradingDays}
              </div>
              <div className="text-xs opacity-80">Active trading days</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 opacity-80" />
                <span className="text-xs opacity-80">Daily Avg</span>
              </div>
              <div className="text-2xl font-bold">
                {safeToFixed(quickStats.avgTradesPerDay, 1)}
              </div>
              <div className="text-xs opacity-80">Trades per day</div>
            </motion.div>
          </div>

          {/* Time-Based Charts */}
          <div className="space-y-6">
            {/* Hourly Performance Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <HourlyHeatmap trades={trades} />
            </motion.div>

            {/* Day of Week Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <DayOfWeekChart trades={trades} />
            </motion.div>

            {/* Hold Time Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <HoldTimeDistribution trades={trades} />
            </motion.div>

            {/* Trade Frequency Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <TradeFrequency trades={trades} />
            </motion.div>
          </div>

          {/* Summary Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Time-Based Trading Recommendations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Optimal Trading Schedule</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Focus your trading around <strong>{formatHour(quickStats.bestHour)}</strong> for best results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Prioritize <strong>{quickStats.bestDay}</strong> for higher probability trades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Maintain an average hold time of <strong>{TimeAnalysisService.formatHoldTime(quickStats.avgHoldTime)}</strong></span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Risk Management Tips</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span>Avoid overtrading - aim for <strong>{Math.round(quickStats.avgTradesPerDay || 0)}</strong> quality trades per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span>Review trades outside your optimal hours for improvement areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span>Consider smaller positions during historically weak time periods</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  )
}