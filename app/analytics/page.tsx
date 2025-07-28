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
  LineChart,
  TrendingDown,
  Activity,
} from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'

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
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month')

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

  // Calculate analytics
  const analytics = {
    totalTrades: filteredTrades.length,
    closedTrades: filteredTrades.filter(t => t.exit !== null).length,
    openTrades: filteredTrades.filter(t => t.exit === null).length,
    
    totalPnL: filteredTrades.reduce((sum, trade) => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return sum + pnl
    }, 0),
    
    winningTrades: filteredTrades.filter(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return pnl > 0
    }).length,
    
    losingTrades: filteredTrades.filter(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return pnl < 0
    }).length,
    
    largestWin: Math.max(...filteredTrades.map(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return pnl > 0 ? pnl : 0
    }), 0),
    
    largestLoss: Math.min(...filteredTrades.map(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return pnl < 0 ? pnl : 0
    }), 0),
    
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    expectancy: 0,
  }

  // Calculate averages and ratios
  if (analytics.winningTrades > 0) {
    const wins = filteredTrades.filter(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return pnl > 0
    })
    analytics.averageWin = wins.reduce((sum, trade) => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return sum + pnl
    }, 0) / wins.length
  }

  if (analytics.losingTrades > 0) {
    const losses = filteredTrades.filter(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return pnl < 0
    })
    analytics.averageLoss = Math.abs(losses.reduce((sum, trade) => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return sum + pnl
    }, 0) / losses.length)
  }

  // Profit Factor = Total Wins / Total Losses
  if (analytics.averageLoss > 0 && analytics.losingTrades > 0) {
    const totalWins = analytics.averageWin * analytics.winningTrades
    const totalLosses = analytics.averageLoss * analytics.losingTrades
    analytics.profitFactor = totalWins / totalLosses
  }

  // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
  if (analytics.closedTrades > 0) {
    const winRate = analytics.winningTrades / analytics.closedTrades
    const lossRate = analytics.losingTrades / analytics.closedTrades
    analytics.expectancy = (winRate * analytics.averageWin) - (lossRate * analytics.averageLoss)
  }

  const winRate = analytics.closedTrades > 0 
    ? (analytics.winningTrades / analytics.closedTrades * 100) 
    : 0

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
              <div className="p-6 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm text-gray-600">Total P&L</h3>
                        <p className={`text-2xl font-bold ${analytics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${analytics.totalPnL.toFixed(2)}
                        </p>
                      </div>
                      {analytics.totalPnL >= 0 ? (
                        <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm text-gray-600">Win Rate</h3>
                        <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-600 opacity-20" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm text-gray-600">Profit Factor</h3>
                        <p className="text-2xl font-bold">{analytics.profitFactor.toFixed(2)}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-600 opacity-20" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm text-gray-600">Expectancy</h3>
                        <p className={`text-2xl font-bold ${analytics.expectancy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${analytics.expectancy.toFixed(2)}
                        </p>
                      </div>
                      <LineChart className="h-8 w-8 text-orange-600 opacity-20" />
                    </div>
                  </Card>
                </div>

                {/* Trade Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Trade Statistics</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Trades</span>
                        <span className="font-medium">{analytics.totalTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Closed Trades</span>
                        <span className="font-medium">{analytics.closedTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Open Trades</span>
                        <span className="font-medium">{analytics.openTrades}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Winning Trades</span>
                        <span className="font-medium text-green-600">{analytics.winningTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Losing Trades</span>
                        <span className="font-medium text-red-600">{analytics.losingTrades}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Win</span>
                        <span className="font-medium text-green-600">${analytics.averageWin.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Loss</span>
                        <span className="font-medium text-red-600">${analytics.averageLoss.toFixed(2)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Largest Win</span>
                        <span className="font-medium text-green-600">${analytics.largestWin.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Largest Loss</span>
                        <span className="font-medium text-red-600">${Math.abs(analytics.largestLoss).toFixed(2)}</span>
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

                {/* Win/Loss Distribution */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Win/Loss Distribution</h2>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex gap-8 mb-4">
                        <div>
                          <div className="text-3xl font-bold text-green-600">{analytics.winningTrades}</div>
                          <div className="text-sm text-gray-600">Wins</div>
                        </div>
                        <div className="text-3xl font-bold text-gray-400">vs</div>
                        <div>
                          <div className="text-3xl font-bold text-red-600">{analytics.losingTrades}</div>
                          <div className="text-sm text-gray-600">Losses</div>
                        </div>
                      </div>
                      <div className="w-64 h-8 bg-gray-200 rounded-full overflow-hidden mx-auto">
                        <div 
                          className="h-full bg-green-600 transition-all duration-500"
                          style={{ width: `${winRate}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{winRate.toFixed(1)}% Win Rate</p>
                    </div>
                  </div>
                </Card>
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}