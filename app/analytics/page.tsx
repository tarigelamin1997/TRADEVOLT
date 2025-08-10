'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download } from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { MetricCard, MetricGrid, InsightCard } from '@/components/MetricCard'
import { METRIC_DEFINITIONS, METRIC_GROUPS, METRIC_THRESHOLDS } from '@/lib/constants/metrics'
import { MetricResult, MetricStatus } from '@/lib/types/metrics'
import * as metrics from '@/lib/tradingMetrics'
import { useSubscription } from '@/lib/subscription'
import { generateAnalyticsExport, exportToJSON, exportToCSV } from '@/lib/exportAnalytics'
import { EquityCurveChart, WinRateChart, ProfitDistributionChart } from '@/components/Charts'
import { ExcursionStats } from '@/components/features/excursion-stats'
import { useAuthUser } from '@/lib/auth-wrapper'
import { VisualMetricCard } from '@/components/visual-metric-card'
import { RadialGauge } from '@/components/charts/radial-gauge'
import { MAEMFEScatter } from '@/components/charts/mae-mfe-scatter'
import { COMPREHENSIVE_SAMPLE_TRADES } from '@/lib/comprehensive-sample-trades'

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuthUser()
  const { isPro } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<any[]>([])
  const [selectedMarket, setSelectedMarket] = useState<string>('all')
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [activeTab, setActiveTab] = useState('essential')

  // Fetch trades when component mounts
  useEffect(() => {
    // Check if demo mode
    const isDemoMode = !user || user.id === 'demo-user'
    
    if (isDemoMode) {
      // Load comprehensive sample trades for demo mode
      setTrades(COMPREHENSIVE_SAMPLE_TRADES)
      setLoading(false)
    } else {
      fetchTrades()
    }
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

  // Filter trades by market
  const filteredTrades = trades.filter(trade => 
    selectedMarket === 'all' || trade.marketType === selectedMarket
  )

  // Calculate total P&L
  const totalPnL = filteredTrades.reduce((sum, trade) => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null)
    return sum + (pnl || 0)
  }, 0)

  // Calculate all metrics
  const calculateAllMetrics = (): Record<string, MetricResult> => {
    const results: Record<string, MetricResult> = {}
    
    // Get all closed trades
    const closedTrades = filteredTrades.filter(trade => trade.exit)
    
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

  // Export functionality
  const handleExport = () => {
    const exportData = generateAnalyticsExport(filteredTrades, selectedMarket)
    
    if (exportFormat === 'csv') {
      exportToCSV(exportData)
    } else {
      exportToJSON(exportData)
    }
  }

  // Get metric by group
  const getMetricsByGroup = (group: string) => {
    const groupMetrics = METRIC_GROUPS[group]
    if (!groupMetrics) return []
    
    return groupMetrics.metrics.map(metricId => ({
      id: metricId,
      definition: METRIC_DEFINITIONS[metricId],
      result: calculatedMetrics[metricId]
    })).filter(m => m.definition && m.result)
  }

  // Generate insights
  const generateInsights = () => {
    const insights = []
    
    // Win rate insight
    if (calculatedMetrics.winRate) {
      const winRate = calculatedMetrics.winRate.value as number
      if (winRate < 40) {
        insights.push({
          type: 'warning' as const,
          title: 'Low Win Rate',
          message: 'Your win rate is below 40%. Consider reviewing your entry criteria.',
          actionable: true
        })
      } else if (winRate > 60) {
        insights.push({
          type: 'success' as const,
          title: 'Strong Win Rate',
          message: 'Your win rate is above 60%. Keep up the good work!',
          actionable: false
        })
      }
    }
    
    // Profit factor insight
    if (calculatedMetrics.profitFactor) {
      const pf = calculatedMetrics.profitFactor.value as number
      if (pf < 1) {
        insights.push({
          type: 'danger' as const,
          title: 'Negative Profit Factor',
          message: 'You\'re losing more than you\'re winning. Review your strategy.',
          actionable: true
        })
      } else if (pf > 2) {
        insights.push({
          type: 'success' as const,
          title: 'Excellent Profit Factor',
          message: 'Your profit factor is above 2. This indicates a strong edge.',
          actionable: false
        })
      }
    }
    
    // Risk-reward insight
    if (calculatedMetrics.avgRiskReward) {
      const rr = calculatedMetrics.avgRiskReward.value as number
      if (rr < 1.5) {
        insights.push({
          type: 'info' as const,
          title: 'Risk-Reward Ratio',
          message: 'Consider targeting higher reward relative to your risk.',
          actionable: true
        })
      }
    }
    
    return insights
  }

  const insights = generateInsights()

  return (
    <SidebarLayout currentPath="/analytics">
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600">
              Comprehensive trading performance analysis
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Markets</option>
              <option value="STOCKS">Stocks</option>
              <option value="OPTIONS">Options</option>
              <option value="FUTURES">Futures</option>
              <option value="FOREX">Forex</option>
              <option value="CRYPTO">Crypto</option>
            </select>
            
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Insights */}
            {insights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, index) => (
                  <InsightCard 
                    key={index} 
                    type={insight.type}
                    title={insight.title}
                    description={insight.message}
                    actionable={insight.actionable}
                  />
                ))}
              </div>
            )}

            {/* Metrics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="essential">Essential</TabsTrigger>
                <TabsTrigger value="risk">Risk Management</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="essential" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getMetricsByGroup('overview').map(({ id, definition, result }) => {
                    if (id === 'winRate' || id === 'profitFactor' || id === 'expectancy' || id === 'totalNetPnL') {
                      return (
                        <VisualMetricCard
                          key={id}
                          title={definition.name}
                          value={result.value}
                          format={result.format}
                          status={result.status}
                          description={definition.tooltipContent}
                          benchmark={definition.benchmark ? {
                            value: definition.benchmark,
                            label: 'Target'
                          } : undefined}
                        />
                      )
                    }
                    return (
                      <MetricCard
                        key={id}
                        title={definition.name}
                        metric={result}
                        tooltip={definition.tooltipContent}
                        requiresPro={false}
                        isPro={true}
                      />
                    )
                  })}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Equity Curve</h3>
                    <EquityCurveChart trades={filteredTrades} />
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Win Rate Analysis</h3>
                    <WinRateChart trades={filteredTrades} />
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="risk" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getMetricsByGroup('risk').map(({ id, definition, result }) => (
                    <MetricCard
                      key={id}
                      title={definition.name}
                      metric={result}
                      tooltip={definition.tooltipContent}
                      requiresPro={false}
                      isPro={true}
                    />
                  ))}
                </div>

                {/* Excursion Stats */}
                {/* <ExcursionStats userId="placeholder" /> */}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getMetricsByGroup('advanced').map(({ id, definition, result }) => (
                    <MetricCard
                      key={id}
                      title={definition.name}
                      metric={result}
                      tooltip={definition.tooltipContent}
                      requiresPro={false}
                      isPro={true}
                    />
                  ))}
                </div>

                {/* Profit Distribution */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Profit Distribution</h3>
                  <ProfitDistributionChart trades={filteredTrades} />
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarLayout>
  )
}