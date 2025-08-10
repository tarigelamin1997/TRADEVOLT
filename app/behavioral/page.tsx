'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '@/components/sidebar-layout'
import { VoltScoreGauge } from '@/components/charts/volt-score-gauge'
import { ConsistencyHeatmap } from '@/components/charts/consistency-heatmap'
import { StreakTracker } from '@/components/charts/streak-tracker'
import { RevengeAlert } from '@/components/charts/revenge-alert'
import { OutlierAnalysisChart } from '@/components/charts/outlier-analysis'
import { BehavioralAnalysisService, type BehavioralMetrics } from '@/lib/services/behavioral-analysis-service'
import { motion } from 'framer-motion'
import { 
  Brain,
  TrendingUp,
  Shield,
  Target,
  Activity,
  Zap
} from 'lucide-react'
import type { Trade } from '@/lib/db-memory'
import { COMPREHENSIVE_SAMPLE_TRADES } from '@/lib/comprehensive-sample-trades'
import { useAuthUser } from '@/lib/auth-wrapper'

export default function BehavioralPage() {
  const { user } = useAuthUser()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<BehavioralMetrics | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    // Check if demo mode
    const isDemoMode = !user || user.id === 'demo-user'
    
    if (isDemoMode) {
      // Load comprehensive sample trades for demo mode
      setTrades(COMPREHENSIVE_SAMPLE_TRADES as Trade[])
      setIsLoading(false)
    } else {
      fetchTrades()
    }
  }, [])

  useEffect(() => {
    if (trades.length > 0) {
      analyzeMetrics()
    }
  }, [trades, timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getTrades' })
      })
      const data = await res.json()
      setTrades(data.trades || [])
    } catch (error) {
      console.error('Failed to fetch trades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeMetrics = () => {
    // Filter trades based on time range
    const now = new Date()
    const filteredTrades = timeRange === 'all' ? trades : trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime || trade.createdAt)
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      return tradeDate >= cutoffDate
    })

    const behavioralMetrics = BehavioralAnalysisService.analyzeBehavior(filteredTrades)
    setMetrics(behavioralMetrics)
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
              <Brain className="h-8 w-8 text-primary" />
              Behavioral & Consistency Metrics
            </h1>
            <p className="text-muted-foreground">
              Analyze your trading psychology, consistency, and behavioral patterns
            </p>
          </motion.div>

          {/* Time Range Selector */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2"
          >
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' :
                 range === '30d' ? 'Last 30 Days' :
                 range === '90d' ? 'Last 90 Days' : 'All Time'}
              </button>
            ))}
          </motion.div>

          {metrics && (
            <>
              {/* Quick Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Brain className="h-5 w-5 opacity-80" />
                    <span className="text-xs opacity-80">Volt Score</span>
                  </div>
                  <div className="text-3xl font-bold">{metrics.voltScore}</div>
                  <div className="text-xs opacity-80">Overall Performance</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`rounded-xl p-4 text-white ${
                    metrics.dailyConsistency.score >= 70 
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : metrics.dailyConsistency.score >= 50
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                      : 'bg-gradient-to-br from-red-500 to-red-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-5 w-5 opacity-80" />
                    <span className="text-xs opacity-80">Consistency</span>
                  </div>
                  <div className="text-3xl font-bold">{metrics.dailyConsistency.score}</div>
                  <div className="text-xs opacity-80">Daily Consistency</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`rounded-xl p-4 text-white ${
                    metrics.streaks.current.type === 'win'
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : metrics.streaks.current.type === 'loss'
                      ? 'bg-gradient-to-br from-red-500 to-red-600'
                      : 'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="h-5 w-5 opacity-80" />
                    <span className="text-xs opacity-80">Current Streak</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {metrics.streaks.current.count || 0}
                  </div>
                  <div className="text-xs opacity-80">
                    {metrics.streaks.current.type === 'none' ? 'No Streak' : 
                     metrics.streaks.current.type === 'win' ? 'Win Streak' : 'Loss Streak'}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className={`rounded-xl p-4 text-white ${
                    !metrics.revengeTrading.detected
                      ? 'bg-gradient-to-br from-green-500 to-green-600'
                      : 'bg-gradient-to-br from-red-500 to-red-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="h-5 w-5 opacity-80" />
                    <span className="text-xs opacity-80">Discipline</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {100 - metrics.revengeTrading.score}
                  </div>
                  <div className="text-xs opacity-80">Discipline Score</div>
                </motion.div>
              </div>

              {/* Main Metrics Components */}
              <div className="space-y-6">
                {/* Volt Score */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <VoltScoreGauge 
                    score={metrics.voltScore} 
                    components={metrics.components} 
                  />
                </motion.div>

                {/* Consistency Heatmap */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <ConsistencyHeatmap consistency={metrics.dailyConsistency} />
                </motion.div>

                {/* Streak Tracker */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <StreakTracker streaks={metrics.streaks} />
                </motion.div>

                {/* Revenge Trading Alert */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <RevengeAlert revenge={metrics.revengeTrading} />
                </motion.div>

                {/* Outlier Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <OutlierAnalysisChart outliers={metrics.outliers} />
                </motion.div>
              </div>

              {/* Summary Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Behavioral Insights & Recommendations
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Strengths</h4>
                    <ul className="space-y-2 text-sm">
                      {metrics.components.winRate >= 50 && (
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Solid win rate of {metrics.components.winRate.toFixed(1)}%</span>
                        </li>
                      )}
                      {metrics.components.consistency >= 70 && (
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Excellent daily consistency</span>
                        </li>
                      )}
                      {!metrics.revengeTrading.detected && (
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>No revenge trading patterns detected</span>
                        </li>
                      )}
                      {metrics.components.profitFactor >= 60 && (
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>Strong profit factor performance</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Areas for Improvement</h4>
                    <ul className="space-y-2 text-sm">
                      {metrics.components.winRate < 40 && (
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600">!</span>
                          <span>Improve win rate (currently {metrics.components.winRate.toFixed(1)}%)</span>
                        </li>
                      )}
                      {metrics.components.consistency < 50 && (
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600">!</span>
                          <span>Work on daily consistency</span>
                        </li>
                      )}
                      {metrics.revengeTrading.detected && (
                        <li className="flex items-start gap-2">
                          <span className="text-red-600">!</span>
                          <span>Address revenge trading behavior</span>
                        </li>
                      )}
                      {metrics.outliers.outlierRatio > 0.5 && (
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600">!</span>
                          <span>Reduce dependency on outlier trades</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}