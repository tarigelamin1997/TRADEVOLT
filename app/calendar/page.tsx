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
  ChevronLeft,
  ChevronRight,
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

export default function CalendarPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  // Calendar helpers
  const getMonthData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { year, month, daysInMonth, startingDayOfWeek }
  }

  const getTradesForDate = (date: Date) => {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt)
      return tradeDate.toDateString() === date.toDateString()
    })
  }

  const getPnLForDate = (date: Date) => {
    const dateTrades = getTradesForDate(date)
    return dateTrades.reduce((sum, trade) => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return sum + pnl
    }, 0)
  }

  const { year, month, daysInMonth, startingDayOfWeek } = getMonthData()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1))
  }

  const today = new Date()

  // Get trades for selected date
  const selectedDateTrades = selectedDate ? getTradesForDate(selectedDate) : []

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
                        isActive={item.url === '/calendar'}
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
                        isActive={item.url === '/calendar'}
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
                <h1 className="text-2xl font-bold">Trading Calendar</h1>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Calendar */}
                  <div className="lg:col-span-2">
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">{monthName} {year}</h2>
                        <div className="flex gap-2">
                          <Button size="icon" variant="outline" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setCurrentDate(new Date())}
                          >
                            Today
                          </Button>
                          <Button size="icon" variant="outline" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Days of week */}
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells for days before month starts */}
                        {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                          <div key={`empty-${idx}`} className="aspect-square" />
                        ))}

                        {/* Days of the month */}
                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                          const day = idx + 1
                          const date = new Date(year, month, day)
                          const isToday = date.toDateString() === today.toDateString()
                          const isSelected = selectedDate?.toDateString() === date.toDateString()
                          const dateTrades = getTradesForDate(date)
                          const datePnL = getPnLForDate(date)
                          const hasWins = dateTrades.some(t => {
                            const pnl = calculateMarketPnL(t, t.marketType || null) || 0
                            return pnl > 0
                          })
                          const hasLosses = dateTrades.some(t => {
                            const pnl = calculateMarketPnL(t, t.marketType || null) || 0
                            return pnl < 0
                          })

                          return (
                            <button
                              key={day}
                              onClick={() => setSelectedDate(date)}
                              className={`
                                aspect-square p-2 rounded-lg border transition-all
                                ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                                ${dateTrades.length > 0 ? 'font-medium' : ''}
                                hover:bg-gray-50
                              `}
                            >
                              <div className="h-full flex flex-col justify-between">
                                <div className="text-sm">{day}</div>
                                {dateTrades.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-xs text-gray-600">
                                      {dateTrades.length} trade{dateTrades.length > 1 ? 's' : ''}
                                    </div>
                                    <div className={`text-xs font-medium ${
                                      datePnL >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      ${Math.abs(datePnL).toFixed(0)}
                                    </div>
                                    <div className="flex gap-1 justify-center">
                                      {hasWins && (
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                      )}
                                      {hasLosses && (
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Selected date details */}
                  <div>
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        {selectedDate 
                          ? selectedDate.toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Select a date'}
                      </h3>

                      {selectedDate && selectedDateTrades.length === 0 && (
                        <p className="text-gray-500">No trades on this date</p>
                      )}

                      {selectedDate && selectedDateTrades.length > 0 && (
                        <div className="space-y-4">
                          {/* Day summary */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Trades</span>
                              <span className="font-medium">{selectedDateTrades.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Day P&L</span>
                              <span className={`font-medium ${
                                getPnLForDate(selectedDate) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${getPnLForDate(selectedDate).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Trades</h4>
                            <div className="space-y-2">
                              {selectedDateTrades.map(trade => {
                                const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
                                return (
                                  <div key={trade.id} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium">{trade.symbol}</p>
                                        <p className="text-sm text-gray-600">
                                          {trade.type} • {trade.quantity} @ ${trade.entry}
                                        </p>
                                      </div>
                                      <span className={`text-sm font-medium ${
                                        pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        ${pnl.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* Monthly stats */}
                    <Card className="p-6 mt-6">
                      <h3 className="text-lg font-semibold mb-4">Month Statistics</h3>
                      <div className="space-y-2">
                        {(() => {
                          const monthTrades = trades.filter(trade => {
                            const tradeDate = new Date(trade.createdAt)
                            return tradeDate.getMonth() === month && tradeDate.getFullYear() === year
                          })
                          const monthPnL = monthTrades.reduce((sum, trade) => {
                            const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
                            return sum + pnl
                          }, 0)
                          const tradingDays = new Set(monthTrades.map(t => 
                            new Date(t.createdAt).toDateString()
                          )).size

                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Trading Days</span>
                                <span className="font-medium">{tradingDays}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Trades</span>
                                <span className="font-medium">{monthTrades.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Month P&L</span>
                                <span className={`font-medium ${
                                  monthPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ${monthPnL.toFixed(2)}
                                </span>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}