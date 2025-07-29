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
  TrendingDown,
  AlertCircle,
  Activity,
  Clock,
} from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'

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

export default function MarketAnalysisPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMarket, setSelectedMarket] = useState<string>('all')

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

  // Analysis helpers
  const getMarketTypes = () => {
    const types = new Set(trades.map(t => t.marketType || 'Unknown'))
    return Array.from(types).filter(t => t !== 'Unknown')
  }

  const filteredTrades = selectedMarket === 'all' 
    ? trades 
    : trades.filter(t => t.marketType === selectedMarket)

  const analyzeSymbol = (symbol: string) => {
    const symbolTrades = filteredTrades.filter(t => t.symbol === symbol)
    const wins = symbolTrades.filter(t => {
      const pnl = calculateMarketPnL(t, t.marketType || null) || 0
      return pnl > 0
    }).length
    const totalPnL = symbolTrades.reduce((sum, t) => {
      const pnl = calculateMarketPnL(t, t.marketType || null) || 0
      return sum + pnl
    }, 0)
    const avgPnL = symbolTrades.length > 0 ? totalPnL / symbolTrades.length : 0
    const winRate = symbolTrades.length > 0 ? (wins / symbolTrades.length) * 100 : 0

    return {
      symbol,
      trades: symbolTrades.length,
      wins,
      losses: symbolTrades.length - wins,
      totalPnL,
      avgPnL,
      winRate
    }
  }

  const getSymbolAnalysis = () => {
    const symbols = new Set(filteredTrades.map(t => t.symbol))
    return Array.from(symbols)
      .map(analyzeSymbol)
      .sort((a, b) => b.totalPnL - a.totalPnL)
  }

  const getTimeAnalysis = () => {
    const hourlyStats: Record<number, { trades: number, pnl: number }> = {}
    
    filteredTrades.forEach(trade => {
      const hour = new Date(trade.entryTime || trade.createdAt).getHours()
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { trades: 0, pnl: 0 }
      }
      hourlyStats[hour].trades++
      hourlyStats[hour].pnl += calculateMarketPnL(trade, trade.marketType || null) || 0
    })

    return Object.entries(hourlyStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        ...stats,
        avgPnL: stats.trades > 0 ? stats.pnl / stats.trades : 0
      }))
      .sort((a, b) => a.hour - b.hour)
  }

  const getDayOfWeekAnalysis = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayStats: Record<string, { trades: number, pnl: number }> = {}
    
    days.forEach(day => {
      dayStats[day] = { trades: 0, pnl: 0 }
    })
    
    filteredTrades.forEach(trade => {
      const dayName = days[new Date(trade.createdAt).getDay()]
      dayStats[dayName].trades++
      dayStats[dayName].pnl += calculateMarketPnL(trade, trade.marketType || null) || 0
    })

    return days.map(day => ({
      day,
      ...dayStats[day],
      avgPnL: dayStats[day].trades > 0 ? dayStats[day].pnl / dayStats[day].trades : 0
    }))
  }

  const symbolAnalysis = getSymbolAnalysis()
  const timeAnalysis = getTimeAnalysis()
  const dayAnalysis = getDayOfWeekAnalysis()
  const marketTypes = getMarketTypes()

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
                        isActive={item.url === '/analysis'}
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
                        isActive={item.url === '/analysis'}
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
                <h1 className="text-2xl font-bold">Market Analysis</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedMarket === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMarket('all')}
                >
                  All Markets
                </Button>
                {marketTypes.map(market => (
                  <Button
                    key={market}
                    variant={selectedMarket === market ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedMarket(market)}
                  >
                    {market}
                  </Button>
                ))}
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Top Symbols */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Symbol Performance Analysis</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Symbol</th>
                          <th className="text-center py-2">Trades</th>
                          <th className="text-center py-2">Win Rate</th>
                          <th className="text-right py-2">Total P&L</th>
                          <th className="text-right py-2">Avg P&L</th>
                          <th className="text-center py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {symbolAnalysis.slice(0, 10).map(analysis => (
                          <tr key={analysis.symbol} className="border-b">
                            <td className="py-3 font-medium">{analysis.symbol}</td>
                            <td className="text-center">{analysis.trades}</td>
                            <td className="text-center">
                              <span className={`font-medium ${
                                analysis.winRate >= 50 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {analysis.winRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className={`text-right font-medium ${
                              analysis.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${analysis.totalPnL.toFixed(2)}
                            </td>
                            <td className={`text-right ${
                              analysis.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${analysis.avgPnL.toFixed(2)}
                            </td>
                            <td className="text-center">
                              {analysis.totalPnL > 100 ? (
                                <span className="text-green-600">
                                  <TrendingUp className="h-4 w-4 inline" />
                                </span>
                              ) : analysis.totalPnL < -100 ? (
                                <span className="text-red-600">
                                  <TrendingDown className="h-4 w-4 inline" />
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  <Activity className="h-4 w-4 inline" />
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {symbolAnalysis.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No trades to analyze</p>
                  )}
                </Card>

                {/* Time Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Best Trading Hours
                    </h3>
                    <div className="space-y-2">
                      {timeAnalysis.length > 0 ? (
                        timeAnalysis
                          .sort((a, b) => b.pnl - a.pnl)
                          .slice(0, 5)
                          .map(hour => (
                            <div key={hour.hour} className="flex justify-between items-center">
                              <span>{hour.hour}:00 - {hour.hour + 1}:00</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">{hour.trades} trades</span>
                                <span className={`font-medium ${
                                  hour.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ${hour.pnl.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500">No hourly data available</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Best Trading Days
                    </h3>
                    <div className="space-y-2">
                      {dayAnalysis
                        .filter(d => d.trades > 0)
                        .sort((a, b) => b.pnl - a.pnl)
                        .map(day => (
                          <div key={day.day} className="flex justify-between items-center">
                            <span>{day.day}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">{day.trades} trades</span>
                              <span className={`font-medium ${
                                day.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${day.pnl.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>

                {/* Insights */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Market Insights
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const insights = []
                      
                      // Best performing symbol
                      if (symbolAnalysis.length > 0 && symbolAnalysis[0].totalPnL > 0) {
                        insights.push({
                          type: 'success',
                          text: `${symbolAnalysis[0].symbol} is your best performing symbol with $${symbolAnalysis[0].totalPnL.toFixed(2)} profit`
                        })
                      }
                      
                      // Worst performing symbol
                      const worstSymbol = symbolAnalysis[symbolAnalysis.length - 1]
                      if (worstSymbol && worstSymbol.totalPnL < -50) {
                        insights.push({
                          type: 'warning',
                          text: `Consider reducing exposure to ${worstSymbol.symbol} (${worstSymbol.totalPnL.toFixed(2)} loss)`
                        })
                      }
                      
                      // Best time
                      if (timeAnalysis.length > 0) {
                        const bestHour = timeAnalysis.sort((a, b) => b.pnl - a.pnl)[0]
                        if (bestHour.pnl > 0) {
                          insights.push({
                            type: 'info',
                            text: `Your most profitable trading hour is ${bestHour.hour}:00 with avg $${bestHour.avgPnL.toFixed(2)} per trade`
                          })
                        }
                      }
                      
                      // Day analysis
                      const profitableDays = dayAnalysis.filter(d => d.pnl > 0 && d.trades > 0)
                      if (profitableDays.length > 0) {
                        const bestDay = profitableDays.sort((a, b) => b.pnl - a.pnl)[0]
                        insights.push({
                          type: 'info',
                          text: `${bestDay.day} is your most profitable day with $${bestDay.pnl.toFixed(2)} total profit`
                        })
                      }
                      
                      if (insights.length === 0) {
                        insights.push({
                          type: 'info',
                          text: 'Start trading to see personalized market insights'
                        })
                      }
                      
                      return insights.map((insight, idx) => (
                        <div key={idx} className={`p-3 rounded-lg flex items-start gap-3 ${
                          insight.type === 'success' ? 'bg-green-50 text-green-900' :
                          insight.type === 'warning' ? 'bg-yellow-50 text-yellow-900' :
                          'bg-blue-50 text-blue-900'
                        }`}>
                          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{insight.text}</p>
                        </div>
                      ))
                    })()}
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