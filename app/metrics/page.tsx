'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  User,
  ChevronsUpDown,
  Calendar,
  Home,
  TrendingUp,
  Search,
  Settings,
  Import,
  BarChart3,
  History,
  DollarSign,
  PieChart,
  FileText,
  Info,
  Crown,
} from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { MetricCard, MetricGrid } from '@/components/MetricCard'
import { METRIC_DEFINITIONS, METRIC_THRESHOLDS } from '@/lib/constants/metrics'
import { MetricResult, MetricStatus } from '@/lib/types/metrics'
import * as metrics from '@/lib/tradingMetrics'
import { useSubscription } from '@/lib/subscription'

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Trade History", url: "/history", icon: History },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "P&L Report", url: "/pnl", icon: DollarSign },
  { title: "Import Trades", url: "#import", icon: Import },
]

const toolsMenuItems = [
  { title: "Market Analysis", url: "/analysis", icon: TrendingUp },
  { title: "Performance Metrics", url: "/metrics", icon: PieChart },
  { title: "Trade Journal", url: "/journal", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
]

const settingsMenuItems = [
  { title: "Search", url: "/search", icon: Search },
  { title: "Settings", url: "/settings", icon: Settings },
]

interface Trade {
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

export default function PerformanceMetricsPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { subscription } = useSubscription()

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
      setTrades(data.trades || [])
    } catch (error) {
      console.error('Failed to fetch trades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMenuClick = (url: string) => {
    router.push(url)
  }

  // Calculate all metrics
  const calculateAllMetrics = () => {
    const allMetrics = Object.keys(METRIC_DEFINITIONS).map(metricId => {
      const definition = METRIC_DEFINITIONS[metricId]
      let value = 0
      let status: MetricStatus = 'good'
      
      switch (metricId) {
        case 'netPnL':
          value = metrics.calculateNetPnL(trades)
          status = value >= 0 ? 'good' : 'danger'
          break
        case 'winRate':
          value = metrics.calculateWinRate(trades)
          if (value < METRIC_THRESHOLDS.winRate.danger) status = 'danger'
          else if (value < METRIC_THRESHOLDS.winRate.warning) status = 'warning'
          break
        case 'profitFactor':
          value = metrics.calculateProfitFactor(trades)
          if (value < METRIC_THRESHOLDS.profitFactor.danger) status = 'danger'
          else if (value < METRIC_THRESHOLDS.profitFactor.warning) status = 'warning'
          break
        case 'expectancy':
          value = metrics.calculateExpectancy(trades)
          status = value >= 0 ? 'good' : 'danger'
          break
        case 'averageWin':
          value = metrics.calculateAverageWin(trades)
          status = 'good'
          break
        case 'averageLoss':
          value = metrics.calculateAverageLoss(trades)
          status = 'warning'
          break
        case 'totalTrades':
          value = trades.length
          status = 'good'
          break
        case 'maxDrawdown':
          value = metrics.calculateMaxDrawdown(trades).value
          if (value > METRIC_THRESHOLDS.maxDrawdown.danger) status = 'danger'
          else if (value > METRIC_THRESHOLDS.maxDrawdown.warning) status = 'warning'
          break
        case 'avgDrawdown':
          value = metrics.calculateAverageDrawdown(trades)
          status = value > 20 ? 'danger' : value > 10 ? 'warning' : 'good'
          break
        case 'recoveryFactor':
          value = metrics.calculateRecoveryFactor(trades)
          status = value < 1 ? 'danger' : value < 2 ? 'warning' : 'good'
          break
        case 'riskOfRuin':
          value = metrics.calculateRiskOfRuin(trades).probability
          if (value > METRIC_THRESHOLDS.riskOfRuin.danger) status = 'danger'
          else if (value > METRIC_THRESHOLDS.riskOfRuin.warning) status = 'warning'
          break
        case 'rMultiple':
          value = metrics.calculateRMultiple(trades)
          status = value < 0 ? 'danger' : value < 1 ? 'warning' : 'good'
          break
        case 'sharpeRatio':
          value = metrics.calculateSharpeRatio(trades)
          if (value < METRIC_THRESHOLDS.sharpeRatio.danger) status = 'danger'
          else if (value < METRIC_THRESHOLDS.sharpeRatio.warning) status = 'warning'
          break
        case 'sortinoRatio':
          value = metrics.calculateSortinoRatio(trades)
          if (value < METRIC_THRESHOLDS.sortinoRatio.danger) status = 'danger'
          else if (value < METRIC_THRESHOLDS.sortinoRatio.warning) status = 'warning'
          break
        case 'calmarRatio':
          value = metrics.calculateCalmarRatio(trades)
          status = value < 0.5 ? 'danger' : value < 1 ? 'warning' : 'good'
          break
        case 'treynorRatio':
          value = metrics.calculateTreynorRatio(trades)
          status = value < 0 ? 'danger' : value < 0.1 ? 'warning' : 'good'
          break
        case 'jensensAlpha':
          value = metrics.calculateJensensAlpha(trades)
          status = value < -5 ? 'danger' : value < 0 ? 'warning' : 'good'
          break
      }
      
      const result: MetricResult = {
        value,
        status,
        description: definition.description,
        format: definition.format,
        benchmark: definition.benchmark
      }
      
      return { id: metricId, definition, result }
    })
    
    return allMetrics
  }

  const allMetrics = calculateAllMetrics()
  const insights = metrics.generateInsights(trades)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        isActive={item.url === '/metrics'}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        isActive={item.url === '/metrics'}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton onClick={() => handleMenuClick(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarGroup>
              <SidebarMenuButton className="w-full justify-between gap-3 h-12">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 rounded-md" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Demo User</span>
                    <span className="text-xs text-muted-foreground">demo@tradevolt.com</span>
                  </div>
                </div>
                <ChevronsUpDown className="h-5 w-5" />
              </SidebarMenuButton>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="flex h-16 items-center gap-4 border-b px-6">
              <SidebarTrigger className="h-7 w-7" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Performance Metrics</h1>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Pro upgrade banner */}
                {subscription.plan === 'free' && (
                  <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <div>
                          <h3 className="font-semibold text-purple-900">Unlock All Performance Metrics</h3>
                          <p className="text-sm text-purple-700">Get detailed insights with advanced risk-adjusted metrics</p>
                        </div>
                      </div>
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => router.push('/subscribe')}
                      >
                        Upgrade to Pro
                      </Button>
                    </div>
                  </Card>
                )}
                
                {/* Metric explanations */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Understanding Your Metrics
                  </h2>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <p className="mb-3">
                      Performance metrics help you understand your trading effectiveness beyond simple profit and loss. 
                      They provide insights into consistency, risk management, and long-term sustainability.
                    </p>
                    <ul className="space-y-2">
                      <li><strong>Essential Metrics:</strong> Basic measurements every trader should track</li>
                      <li><strong>Risk Management:</strong> Understand your exposure and potential for losses</li>
                      <li><strong>Advanced Analytics:</strong> Professional-grade metrics used by hedge funds</li>
                    </ul>
                  </div>
                </Card>

                {/* All metrics grid */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">All Performance Metrics</h2>
                  <MetricGrid columns={3}>
                    {allMetrics.map(({ id, definition, result }) => (
                      <MetricCard
                        key={id}
                        title={definition.name}
                        metric={result}
                        tooltip={definition.tooltipContent}
                        requiresPro={definition.requiresPro}
                        isPro={subscription.plan === 'pro'}
                        size="medium"
                      />
                    ))}
                  </MetricGrid>
                </div>

                {/* Risk of Ruin Details */}
                {subscription.plan === 'pro' && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk of Ruin Analysis</h3>
                    <div className="space-y-4">
                      {(() => {
                        const rorResult = metrics.calculateRiskOfRuin(trades)
                        return (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Risk of Ruin</p>
                                <p className="text-xl font-bold">{rorResult.probability.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Kelly %</p>
                                <p className="text-xl font-bold">{rorResult.kellyPercentage.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Max Consecutive Losses</p>
                                <p className="text-xl font-bold">{rorResult.maxConsecutiveLosses}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Recommendation</p>
                                <p className="text-sm font-medium">{rorResult.recommendation}</p>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </Card>
                )}

                {/* Insights */}
                {insights.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.map((insight, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="flex items-start gap-3">
                            <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                              insight.type === 'success' ? 'text-green-600' :
                              insight.type === 'warning' ? 'text-yellow-600' :
                              insight.type === 'danger' ? 'text-red-600' :
                              'text-blue-600'
                            }`} />
                            <div>
                              <h4 className="font-medium mb-1">{insight.title}</h4>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                              {insight.actionable && (
                                <p className="text-xs mt-2 text-blue-600 font-medium">Action Required</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}