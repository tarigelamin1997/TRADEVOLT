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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Download,
} from "lucide-react"
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

// Menu items (same as history page)
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

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuthUser()
  const [trades, setTrades] = useState<Trade[]>([])
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
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

  // Filter trades by timeframe
  const filterTradesByTimeframe = () => {
    const now = new Date()
    const filtered = trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt)
      switch (timeframe) {
        case 'day':
          return tradeDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return tradeDate >= weekAgo
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return tradeDate >= monthAgo
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          return tradeDate >= yearAgo
        default:
          return true
      }
    })
    return filtered
  }

  const filteredTrades = filterTradesByTimeframe()

  // Basic calculations for old stats
  const closedTrades = filteredTrades.filter(t => t.exit !== null && t.exit !== undefined)
  const openTrades = filteredTrades.filter(t => t.exit === null || t.exit === undefined)
  const winningTrades = filteredTrades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl > 0
  })
  const losingTrades = filteredTrades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl < 0
  })

  // Calculate all metrics
  const calculateMetric = (metricId: string): MetricResult => {
    const definition = METRIC_DEFINITIONS[metricId]
    let value = 0
    let status: MetricStatus = 'good'
    
    switch (metricId) {
      case 'netPnL':
        value = metrics.calculateNetPnL(filteredTrades)
        status = value >= 0 ? 'good' : 'danger'
        break
      case 'winRate':
        value = metrics.calculateWinRate(filteredTrades)
        if (value < METRIC_THRESHOLDS.winRate.danger) status = 'danger'
        else if (value < METRIC_THRESHOLDS.winRate.warning) status = 'warning'
        break
      case 'profitFactor':
        value = metrics.calculateProfitFactor(filteredTrades)
        if (value < METRIC_THRESHOLDS.profitFactor.danger) status = 'danger'
        else if (value < METRIC_THRESHOLDS.profitFactor.warning) status = 'warning'
        break
      case 'expectancy':
        value = metrics.calculateExpectancy(filteredTrades)
        status = value >= 0 ? 'good' : 'danger'
        break
      case 'averageWin':
        value = metrics.calculateAverageWin(filteredTrades)
        status = 'good'
        break
      case 'averageLoss':
        value = metrics.calculateAverageLoss(filteredTrades)
        status = 'warning'
        break
      case 'totalTrades':
        value = filteredTrades.length
        status = 'good'
        break
      case 'maxDrawdown':
        value = metrics.calculateMaxDrawdown(filteredTrades).value
        if (value > METRIC_THRESHOLDS.maxDrawdown.danger) status = 'danger'
        else if (value > METRIC_THRESHOLDS.maxDrawdown.warning) status = 'warning'
        break
      case 'avgDrawdown':
        value = metrics.calculateAverageDrawdown(filteredTrades)
        status = value > 20 ? 'danger' : value > 10 ? 'warning' : 'good'
        break
      case 'recoveryFactor':
        value = metrics.calculateRecoveryFactor(filteredTrades)
        status = value < 1 ? 'danger' : value < 2 ? 'warning' : 'good'
        break
      case 'riskOfRuin':
        value = metrics.calculateRiskOfRuin(filteredTrades).probability
        if (value > METRIC_THRESHOLDS.riskOfRuin.danger) status = 'danger'
        else if (value > METRIC_THRESHOLDS.riskOfRuin.warning) status = 'warning'
        break
      case 'rMultiple':
        value = metrics.calculateRMultiple(filteredTrades)
        status = value < 0 ? 'danger' : value < 1 ? 'warning' : 'good'
        break
      case 'sharpeRatio':
        value = metrics.calculateSharpeRatio(filteredTrades)
        if (value < METRIC_THRESHOLDS.sharpeRatio.danger) status = 'danger'
        else if (value < METRIC_THRESHOLDS.sharpeRatio.warning) status = 'warning'
        break
      case 'sortinoRatio':
        value = metrics.calculateSortinoRatio(filteredTrades)
        if (value < METRIC_THRESHOLDS.sortinoRatio.danger) status = 'danger'
        else if (value < METRIC_THRESHOLDS.sortinoRatio.warning) status = 'warning'
        break
      case 'calmarRatio':
        value = metrics.calculateCalmarRatio(filteredTrades)
        status = value < 0.5 ? 'danger' : value < 1 ? 'warning' : 'good'
        break
      case 'treynorRatio':
        value = metrics.calculateTreynorRatio(filteredTrades)
        status = value < 0 ? 'danger' : value < 0.1 ? 'warning' : 'good'
        break
      case 'jensensAlpha':
        value = metrics.calculateJensensAlpha(filteredTrades)
        status = value < -5 ? 'danger' : value < 0 ? 'warning' : 'good'
        break
    }
    
    return {
      value,
      status,
      description: definition.description,
      format: definition.format,
      benchmark: definition.benchmark
    }
  }
  
  // Generate insights
  const insights = metrics.generateInsights(filteredTrades)

  // Get trades by symbol
  const tradesBySymbol = filteredTrades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { trades: 0, pnl: 0 }
    }
    acc[trade.symbol].trades++
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    acc[trade.symbol].pnl += pnl
    return acc
  }, {} as Record<string, { trades: number; pnl: number }>)

  // Get top performers
  const topPerformers = Object.entries(tradesBySymbol)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .slice(0, 5)

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
                        isActive={item.url === '/analytics'}
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
                      <SidebarMenuButton onClick={() => handleMenuClick(item.url)}>
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
                <h1 className="text-2xl font-bold">Analytics</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={timeframe === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('day')}
                >
                  Day
                </Button>
                <Button
                  variant={timeframe === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('week')}
                >
                  Week
                </Button>
                <Button
                  variant={timeframe === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('month')}
                >
                  Month
                </Button>
                <Button
                  variant={timeframe === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('year')}
                >
                  Year
                </Button>
                <Button
                  variant={timeframe === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeframe('all')}
                >
                  All
                </Button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Beta Banner */}
                <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-purple-900">🎉 Beta Access - All Features Unlocked!</h3>
                      <p className="text-sm text-purple-700">Enjoy full access to all 16 professional metrics during our beta period</p>
                    </div>
                    <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full font-medium">BETA</span>
                  </div>
                </Card>
                
                {/* Insights Section */}
                {insights.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Key Insights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {insights.slice(0, 4).map((insight, idx) => (
                        <InsightCard key={idx} {...insight} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Metrics Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="risk">Risk Management</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="excursion">Excursion</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <MetricGrid columns={4}>
                      {METRIC_GROUPS.overview.metrics.map(metricId => {
                        const definition = METRIC_DEFINITIONS[metricId]
                        const result = calculateMetric(metricId)
                        return (
                          <MetricCard
                            key={metricId}
                            title={definition.name}
                            metric={result}
                            tooltip={definition.tooltipContent}
                            requiresPro={false}
                            isPro={true}
                          />
                        )
                      })}
                    </MetricGrid>
                  </TabsContent>
                  
                  <TabsContent value="risk" className="space-y-4">
                    <MetricGrid columns={3}>
                      {METRIC_GROUPS.risk.metrics.map(metricId => {
                        const definition = METRIC_DEFINITIONS[metricId]
                        const result = calculateMetric(metricId)
                        return (
                          <MetricCard
                            key={metricId}
                            title={definition.name}
                            metric={result}
                            tooltip={definition.tooltipContent}
                            requiresPro={false}
                            isPro={true}
                          />
                        )
                      })}
                    </MetricGrid>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <MetricGrid columns={3}>
                      {METRIC_GROUPS.advanced.metrics.map(metricId => {
                        const definition = METRIC_DEFINITIONS[metricId]
                        const result = calculateMetric(metricId)
                        return (
                          <MetricCard
                            key={metricId}
                            title={definition.name}
                            metric={result}
                            tooltip={definition.tooltipContent}
                            requiresPro={false}
                            isPro={true}
                          />
                        )
                      })}
                    </MetricGrid>
                  </TabsContent>
                  
                  <TabsContent value="excursion" className="space-y-4">
                    <ExcursionStats userId={user.id} />
                  </TabsContent>
                </Tabs>

                {/* Export Button */}
                <div className="flex justify-end mt-6 gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      const data = generateAnalyticsExport(filteredTrades, timeframe)
                      exportToCSV(data)
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export as CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      const data = generateAnalyticsExport(filteredTrades, timeframe)
                      exportToJSON(data)
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export as JSON
                  </Button>
                </div>
                
                {/* Trade Statistics and Top Symbols */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Trade Statistics</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Trades</span>
                        <span className="font-medium">{filteredTrades.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Closed Trades</span>
                        <span className="font-medium">{closedTrades.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Open Trades</span>
                        <span className="font-medium">{openTrades.length}</span>
                      </div>
                      <div className="border-t pt-3"></div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Winning Trades</span>
                        <span className="font-medium text-green-600">{winningTrades.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Losing Trades</span>
                        <span className="font-medium text-red-600">{losingTrades.length}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Top Performing Symbols</h2>
                    <div className="space-y-3">
                      {topPerformers.length > 0 ? (
                        topPerformers.map(([symbol, data]) => (
                          <div key={symbol} className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{symbol}</span>
                              <span className="text-sm text-gray-600 ml-2">({data.trades} trades)</span>
                            </div>
                            <span className={`font-medium ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${data.pnl.toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center">No trades found</p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Chart Visualizations */}
                <div className="mt-6 space-y-6">
                  <h2 className="text-xl font-semibold">Performance Visualizations</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <EquityCurveChart trades={filteredTrades} />
                    <WinRateChart trades={filteredTrades} />
                  </div>
                  <ProfitDistributionChart trades={filteredTrades} />
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}