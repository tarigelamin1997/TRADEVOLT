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
  Download,
  Filter,
} from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'

// Menu items (same as other pages)
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

export default function PnLReportPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [filterMarket, setFilterMarket] = useState('ALL')

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

  // Filter trades by market
  const filteredTrades = filterMarket === 'ALL' 
    ? trades 
    : trades.filter(t => t.marketType === filterMarket)

  // Group trades by time period
  const groupTrades = () => {
    const groups: Record<string, Trade[]> = {}
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.createdAt)
      let key = ''
      
      switch (groupBy) {
        case 'day':
          key = date.toLocaleDateString()
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = `Week of ${weekStart.toLocaleDateString()}`
          break
        case 'month':
          key = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`
          break
        case 'year':
          key = date.getFullYear().toString()
          break
      }
      
      if (!groups[key]) groups[key] = []
      groups[key].push(trade)
    })
    
    return groups
  }

  const groupedTrades = groupTrades()

  // Calculate P&L for a group of trades
  const calculateGroupPnL = (trades: Trade[]) => {
    const stats = {
      totalPnL: 0,
      wins: 0,
      losses: 0,
      totalTrades: trades.length,
      closedTrades: 0,
    }
    
    trades.forEach(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null)
      if (pnl !== null) {
        stats.totalPnL += pnl
        stats.closedTrades++
        if (pnl > 0) stats.wins++
        else if (pnl < 0) stats.losses++
      }
    })
    
    return stats
  }

  // Calculate cumulative P&L
  const calculateCumulativePnL = () => {
    const sorted = [...filteredTrades].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    let cumulative = 0
    return sorted.map(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      cumulative += pnl
      return {
        date: new Date(trade.createdAt).toLocaleDateString(),
        pnl,
        cumulative,
        trade
      }
    })
  }

  const cumulativeData = calculateCumulativePnL()
  const totalPnL = cumulativeData[cumulativeData.length - 1]?.cumulative || 0

  // Get best and worst periods
  const periodStats = Object.entries(groupedTrades).map(([period, trades]) => {
    const stats = calculateGroupPnL(trades)
    return { period, ...stats }
  }).sort((a, b) => b.totalPnL - a.totalPnL)

  const bestPeriod = periodStats[0]
  const worstPeriod = periodStats[periodStats.length - 1]

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
                        isActive={item.url === '/pnl'}
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
                <h1 className="text-2xl font-bold">P&L Report</h1>
              </div>
              <div className="flex gap-2 items-center">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterMarket}
                  onChange={(e) => setFilterMarket(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="ALL">All Markets</option>
                  <option value="FUTURES">Futures</option>
                  <option value="OPTIONS">Options</option>
                  <option value="FOREX">Forex</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="STOCKS">Stocks</option>
                </select>
                <div className="flex gap-1">
                  <Button
                    variant={groupBy === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('day')}
                  >
                    Day
                  </Button>
                  <Button
                    variant={groupBy === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('week')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={groupBy === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('month')}
                  >
                    Month
                  </Button>
                  <Button
                    variant={groupBy === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupBy('year')}
                  >
                    Year
                  </Button>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Total P&L</h3>
                    <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${totalPnL.toFixed(2)}
                    </p>
                  </Card>
                  
                  {bestPeriod && (
                    <Card className="p-4">
                      <h3 className="text-sm text-gray-600">Best {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</h3>
                      <p className="text-2xl font-bold text-green-600">
                        ${bestPeriod.totalPnL.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{bestPeriod.period}</p>
                    </Card>
                  )}
                  
                  {worstPeriod && worstPeriod.totalPnL < 0 && (
                    <Card className="p-4">
                      <h3 className="text-sm text-gray-600">Worst {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</h3>
                      <p className="text-2xl font-bold text-red-600">
                        ${worstPeriod.totalPnL.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{worstPeriod.period}</p>
                    </Card>
                  )}
                  
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Average {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}ly P&L</h3>
                    <p className="text-2xl font-bold">
                      ${(totalPnL / Object.keys(groupedTrades).length || 0).toFixed(2)}
                    </p>
                  </Card>
                </div>

                {/* P&L by Period */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">P&L by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2">Period</th>
                          <th className="text-right py-2">Trades</th>
                          <th className="text-right py-2">Closed</th>
                          <th className="text-right py-2">Wins</th>
                          <th className="text-right py-2">Losses</th>
                          <th className="text-right py-2">Win Rate</th>
                          <th className="text-right py-2">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodStats.map(({ period, totalPnL, wins, losses, totalTrades, closedTrades }) => {
                          const winRate = closedTrades > 0 ? (wins / closedTrades * 100) : 0
                          return (
                            <tr key={period} className="border-b hover:bg-gray-50">
                              <td className="py-3">{period}</td>
                              <td className="text-right">{totalTrades}</td>
                              <td className="text-right">{closedTrades}</td>
                              <td className="text-right text-green-600">{wins}</td>
                              <td className="text-right text-red-600">{losses}</td>
                              <td className="text-right">{winRate.toFixed(1)}%</td>
                              <td className={`text-right font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${totalPnL.toFixed(2)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="border-t-2">
                        <tr className="font-semibold">
                          <td className="py-3">Total</td>
                          <td className="text-right">{filteredTrades.length}</td>
                          <td className="text-right">
                            {filteredTrades.filter(t => t.exit !== null).length}
                          </td>
                          <td className="text-right text-green-600">
                            {filteredTrades.filter(t => {
                              const pnl = calculateMarketPnL(t, t.marketType || null)
                              return pnl !== null && pnl > 0
                            }).length}
                          </td>
                          <td className="text-right text-red-600">
                            {filteredTrades.filter(t => {
                              const pnl = calculateMarketPnL(t, t.marketType || null)
                              return pnl !== null && pnl < 0
                            }).length}
                          </td>
                          <td className="text-right">
                            {(() => {
                              const closed = filteredTrades.filter(t => t.exit !== null).length
                              const wins = filteredTrades.filter(t => {
                                const pnl = calculateMarketPnL(t, t.marketType || null)
                                return pnl !== null && pnl > 0
                              }).length
                              return closed > 0 ? (wins / closed * 100).toFixed(1) : '0.0'
                            })()}%
                          </td>
                          <td className={`text-right font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${totalPnL.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>

                {/* Cumulative P&L Chart (Placeholder) */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Cumulative P&L</h2>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">
                      Chart showing cumulative P&L over time
                      <br />
                      <span className="text-sm">(Integration with charting library needed)</span>
                    </p>
                  </div>
                </Card>

                {/* Recent P&L Entries */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Recent P&L Entries</h2>
                  <div className="space-y-2">
                    {cumulativeData.slice(-10).reverse().map((entry, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{entry.trade.symbol}</span>
                          <span className="text-sm text-gray-500 ml-2">{entry.date}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-medium ${entry.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${entry.pnl.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 ml-4">
                            Balance: ${entry.cumulative.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
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