'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Info, Crown } from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { MetricCard, MetricGrid } from '@/components/MetricCard'
import { METRIC_DEFINITIONS, METRIC_THRESHOLDS } from '@/lib/constants/metrics'
import { MetricResult, MetricStatus } from '@/lib/types/metrics'
import * as metrics from '@/lib/tradingMetrics'
import { useSubscription } from '@/lib/subscription'

export default function MetricsPage() {
  const router = useRouter()
  const { isPro, subscribe } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '30d' | '90d' | '1y'>('all')

  // Fetch trades when component mounts
  useEffect(() => {
    fetchTrades()
  }, [])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getTrades' })
      })
      
      if (!response.ok) throw new Error('Failed to fetch trades')
      
      const data = await response.json()
      setTrades(data.trades || [])
    } catch (error) {
      console.error('Failed to fetch trades:', error)
      setTrades([])
    } finally {
      setLoading(false)
    }
  }

  // Filter trades by period
  const filteredTrades = trades.filter(trade => {
    if (selectedPeriod === 'all') return true
    
    const tradeDate = new Date(trade.createdAt)
    const now = new Date()
    const daysDiff = (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24)
    
    switch (selectedPeriod) {
      case '30d': return daysDiff <= 30
      case '90d': return daysDiff <= 90
      case '1y': return daysDiff <= 365
      default: return true
    }
  })

  // Calculate all metrics
  const calculateAllMetrics = (): Record<string, MetricResult> => {
    const results: Record<string, MetricResult> = {}
    
    // Get all closed trades
    const closedTrades = filteredTrades.filter(trade => trade.exit)
    
    // Calculate total P&L
    const totalPnL = filteredTrades.reduce((sum, trade) => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null)
      return sum + (pnl || 0)
    }, 0)
    
    // Essential Metrics
    results.winRate = metrics.calculateWinRate(closedTrades)
    results.profitFactor = metrics.calculateProfitFactor(closedTrades)
    results.expectancy = metrics.calculateExpectancy(closedTrades)
    results.totalNetPnL = {
      value: totalPnL,
      status: totalPnL >= 0 ? 'good' : 'danger',
      format: 'currency',
      description: 'Total profit or loss from all trades'
    }
    results.winRateLongShort = metrics.calculateWinRateLongShort(closedTrades)
    results.avgWinLoss = metrics.calculateAvgWinLoss(closedTrades)
    results.totalTrades = {
      value: filteredTrades.length,
      status: 'warning',
      format: 'number',
      description: 'Total number of trades entered'
    }
    results.totalClosedTrades = {
      value: closedTrades.length,
      status: 'warning',
      format: 'number',
      description: 'Total number of trades that have been closed'
    }
    
    // Risk Management Metrics
    results.maxDrawdown = metrics.calculateMaxDrawdown(closedTrades)
    results.avgRiskReward = metrics.calculateAvgRiskReward(closedTrades)
    results.kellyPercentage = metrics.calculateKellyPercentage(closedTrades)
    results.sharpeRatio = metrics.calculateSharpeRatio(closedTrades)
    results.sortinoRatio = metrics.calculateSortinoRatio(closedTrades)
    results.calmarRatio = metrics.calculateCalmarRatio(closedTrades)
    
    // Advanced Metrics
    results.profitFactorLongShort = metrics.calculateProfitFactorLongShort(closedTrades)
    results.consistency = metrics.calculateConsistency(closedTrades)
    results.payoffRatio = metrics.calculatePayoffRatio(closedTrades)
    results.ulcerIndex = metrics.calculateUlcerIndex(closedTrades)
    
    return results
  }

  const calculatedMetrics = calculateAllMetrics()

  // Group metrics by category
  const essentialMetrics = ['winRate', 'profitFactor', 'expectancy', 'totalNetPnL', 'winRateLongShort', 'avgWinLoss', 'totalTrades', 'totalClosedTrades']
  const riskMetrics = ['maxDrawdown', 'avgRiskReward', 'kellyPercentage', 'sharpeRatio', 'sortinoRatio', 'calmarRatio']
  const advancedMetrics = ['profitFactorLongShort', 'consistency', 'payoffRatio', 'ulcerIndex']

  return (
    <SidebarLayout currentPath="/metrics">
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Performance Metrics</h1>
            <p className="text-sm text-gray-600">
              Deep dive into your trading performance with 16 professional metrics
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            
            {!isPro && (
              <Button onClick={subscribe} variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Crown className="h-4 w-4 mr-1" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Essential Metrics */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Essential Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {essentialMetrics.map(metricId => {
                  const definition = METRIC_DEFINITIONS[metricId]
                  const metric = calculatedMetrics[metricId]
                  
                  if (!definition || !metric) return null
                  
                  return (
                    <MetricCard
                      key={metricId}
                      title={definition.name}
                      metric={metric}
                      tooltip={definition.tooltipContent}
                      requiresPro={false}
                      isPro={isPro}
                    />
                  )
                })}
              </div>
            </div>

            {/* Risk Management Metrics */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Risk Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {riskMetrics.map(metricId => {
                  const definition = METRIC_DEFINITIONS[metricId]
                  const metric = calculatedMetrics[metricId]
                  
                  if (!definition || !metric) return null
                  
                  return (
                    <MetricCard
                      key={metricId}
                      title={definition.name}
                      metric={metric}
                      tooltip={definition.tooltipContent}
                      requiresPro={definition.requiresPro}
                      isPro={isPro}
                    />
                  )
                })}
              </div>
            </div>

            {/* Advanced Metrics */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Advanced Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {advancedMetrics.map(metricId => {
                  const definition = METRIC_DEFINITIONS[metricId]
                  const metric = calculatedMetrics[metricId]
                  
                  if (!definition || !metric) return null
                  
                  return (
                    <MetricCard
                      key={metricId}
                      title={definition.name}
                      metric={metric}
                      tooltip={definition.tooltipContent}
                      requiresPro={definition.requiresPro}
                      isPro={isPro}
                    />
                  )
                })}
              </div>
            </div>

            {/* Info Card */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Understanding Your Metrics
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    These metrics provide comprehensive insights into your trading performance. 
                    Hover over any metric to see detailed explanations and benchmarks. 
                    Green indicates good performance, yellow is neutral, and red suggests areas for improvement.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Key Metrics to Watch:</p>
                      <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                        <li>• Win Rate: Aim for 45-55% with good R:R</li>
                        <li>• Profit Factor: Target above 1.5</li>
                        <li>• Sharpe Ratio: Higher is better (&gt;1 is good)</li>
                        <li>• Max Drawdown: Keep below 20%</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Pro Tips:</p>
                      <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                        <li>• Focus on consistency over high win rates</li>
                        <li>• Monitor risk metrics closely</li>
                        <li>• Use Kelly % for position sizing</li>
                        <li>• Track metrics over different timeframes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </SidebarLayout>
  )
}