'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TradeForm } from '@/components/trade-form'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Plus,
  Upload,
  BarChart3,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { useSettings } from '@/lib/settings'
import { formatCurrency } from '@/lib/calculations'
import { useRouter } from 'next/navigation'

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

interface DashboardStats {
  totalTrades: number
  openTrades: number
  closedTrades: number
  totalPnL: number
  todayPnL: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number }
}

export default function DashboardPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalTrades: 0,
    openTrades: 0,
    closedTrades: 0,
    totalPnL: 0,
    todayPnL: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    currentStreak: { type: 'none', count: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showTradeForm, setShowTradeForm] = useState(false)

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
      calculateStats(trades)
    } catch (error) {
      console.error('Failed to fetch trades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (trades: Trade[]) => {
    const today = new Date().toDateString()
    const todayTrades = trades.filter(t => new Date(t.createdAt).toDateString() === today)
    
    const closedTrades = trades.filter(t => t.exit !== null)
    const openTrades = trades.filter(t => t.exit === null)
    
    let totalPnL = 0
    let todayPnL = 0
    let wins = 0
    let losses = 0
    let totalWin = 0
    let totalLoss = 0
    
    // Calculate P&L and win/loss stats
    closedTrades.forEach(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      totalPnL += pnl
      
      if (new Date(trade.createdAt).toDateString() === today) {
        todayPnL += pnl
      }
      
      if (pnl > 0) {
        wins++
        totalWin += pnl
      } else if (pnl < 0) {
        losses++
        totalLoss += Math.abs(pnl)
      }
    })
    
    // Calculate streak
    const sortedClosed = [...closedTrades].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    let currentStreak = { type: 'none' as 'win' | 'loss' | 'none', count: 0 }
    if (sortedClosed.length > 0) {
      const firstPnL = calculateMarketPnL(sortedClosed[0], sortedClosed[0].marketType || null) || 0
      currentStreak.type = firstPnL >= 0 ? 'win' : 'loss'
      currentStreak.count = 1
      
      for (let i = 1; i < sortedClosed.length; i++) {
        const pnl = calculateMarketPnL(sortedClosed[i], sortedClosed[i].marketType || null) || 0
        const isWin = pnl >= 0
        if ((currentStreak.type === 'win' && isWin) || (currentStreak.type === 'loss' && !isWin)) {
          currentStreak.count++
        } else {
          break
        }
      }
    }
    
    setStats({
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      totalPnL,
      todayPnL,
      winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
      avgWin: wins > 0 ? totalWin / wins : 0,
      avgLoss: losses > 0 ? totalLoss / losses : 0,
      profitFactor: totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? Infinity : 0,
      currentStreak
    })
  }

  const recentTrades = trades.slice(0, 5)

  return (
    <SidebarLayout currentPath="/dashboard">
      <>
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={() => setShowTradeForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Trade
            </Button>
            <Button
              onClick={() => router.push('/history')}
              variant="outline"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.totalPnL, settings)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From {stats.closedTrades} closed trades
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.todayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.todayPnL, settings)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.todayPnL >= 0 ? (
                      <span className="flex items-center text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Profitable day
                      </span>
                    ) : stats.todayPnL < 0 ? (
                      <span className="flex items-center text-red-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Loss day
                      </span>
                    ) : (
                      'No trades today'
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Profit Factor: {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  {stats.currentStreak.type === 'win' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : stats.currentStreak.type === 'loss' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.currentStreak.count > 0 ? (
                      <span className={stats.currentStreak.type === 'win' ? 'text-green-600' : 'text-red-600'}>
                        {stats.currentStreak.count} {stats.currentStreak.type}s
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.openTrades} open positions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Trades */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                  <CardDescription>Your last 5 trades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTrades.length > 0 ? (
                      recentTrades.map(trade => {
                        const pnl = calculateMarketPnL(trade, trade.marketType || null)
                        return (
                          <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${trade.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {trade.type === 'BUY' ? (
                                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{trade.symbol}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(trade.createdAt).toLocaleDateString()} • 
                                  {trade.exit ? ' Closed' : ' Open'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {pnl !== null ? (
                                <p className={`font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(pnl, settings)}
                                </p>
                              ) : (
                                <p className="text-gray-500">Open</p>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-center text-gray-500 py-4">No trades yet</p>
                    )}
                  </div>
                  <Button
                    onClick={() => router.push('/history')}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    View All Trades
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Key metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Average Win</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(stats.avgWin, settings)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Average Loss</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(stats.avgLoss, settings)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Trades</span>
                    <span className="font-medium">{stats.totalTrades}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Open Positions</span>
                    <span className="font-medium">{stats.openTrades}</span>
                  </div>
                  
                  <div className="pt-4 border-t space-y-2">
                    <Button
                      onClick={() => router.push('/analytics')}
                      className="w-full"
                      variant="outline"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button
                      onClick={() => router.push('/journal')}
                      className="w-full"
                      variant="outline"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Trade Journal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trading Goals Progress */}
            {settings.goals.monthlyProfitTarget > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Goal Progress</CardTitle>
                  <CardDescription>
                    Target: {formatCurrency(settings.goals.monthlyProfitTarget, settings)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Progress</span>
                      <span className="font-medium">
                        {formatCurrency(stats.totalPnL, settings)} / {formatCurrency(settings.goals.monthlyProfitTarget, settings)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (stats.totalPnL / settings.goals.monthlyProfitTarget) * 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {((stats.totalPnL / settings.goals.monthlyProfitTarget) * 100).toFixed(1)}% of monthly target
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* Trade Form Modal */}
        {showTradeForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle>Add New Trade</CardTitle>
                <Button
                  onClick={() => setShowTradeForm(false)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <TradeForm
                  onTradeAdded={() => {
                    setShowTradeForm(false)
                    fetchTrades()
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </>
    </SidebarLayout>
  )
}