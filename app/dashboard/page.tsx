'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Button } from '@/components/ui/button'
import { TradeForm } from '@/components/trade-form'
import { RadialGauge } from '@/components/charts/radial-gauge'
import { EquityCurveChart } from '@/components/charts/equity-curve'
import { DailyPnLChart } from '@/components/charts/daily-pnl-chart'
import { SymbolDistribution } from '@/components/charts/symbol-distribution'
import { TradingCalendarHeatmap } from '@/components/charts/calendar-heatmap'
import { VisualMetricCard } from '@/components/visual-metric-card'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Plus,
  BarChart3,
  Target,
  Zap,
  Shield,
  Award,
  X
} from 'lucide-react'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { useSettings } from '@/lib/settings'
import { formatCurrency } from '@/lib/calculations'
import { useRouter } from 'next/navigation'
import type { Trade } from '@/lib/db-memory'

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
  last30Days: {
    pnl: number[]
    dates: string[]
  }
}

export default function VisualDashboardPage() {
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
    currentStreak: { type: 'none', count: 0 },
    last30Days: { pnl: [], dates: [] }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showTradeForm, setShowTradeForm] = useState(false)

  useEffect(() => {
    fetchTrades()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    
    const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
    const openTrades = trades.filter(t => t.exit === null || t.exit === undefined)
    
    // Calculate P&L
    let totalPnL = 0
    let todayPnL = 0
    const wins: number[] = []
    const losses: number[] = []
    
    closedTrades.forEach(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      totalPnL += pnl
      
      if (new Date(trade.createdAt).toDateString() === today) {
        todayPnL += pnl
      }
      
      if (pnl > 0) {
        wins.push(pnl)
      } else if (pnl < 0) {
        losses.push(Math.abs(pnl))
      }
    })
    
    // Calculate last 30 days P&L
    const last30Days = { pnl: [] as number[], dates: [] as string[] }
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    let runningPnL = 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toDateString()
      const dayTrades = closedTrades.filter(t => new Date(t.createdAt).toDateString() === dayStr)
      const dayPnL = dayTrades.reduce((sum, t) => sum + (calculateMarketPnL(t, t.marketType || null) || 0), 0)
      runningPnL += dayPnL
      last30Days.dates.push(dayStr)
      last30Days.pnl.push(runningPnL)
    }
    
    // Calculate current streak
    const sortedClosedTrades = [...closedTrades].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    let currentStreak = { type: 'none' as 'win' | 'loss' | 'none', count: 0 }
    if (sortedClosedTrades.length > 0) {
      const firstTradePnL = calculateMarketPnL(sortedClosedTrades[0], sortedClosedTrades[0].marketType || null) || 0
      currentStreak.type = firstTradePnL >= 0 ? 'win' : 'loss'
      currentStreak.count = 1
      
      for (let i = 1; i < sortedClosedTrades.length; i++) {
        const pnl = calculateMarketPnL(sortedClosedTrades[i], sortedClosedTrades[i].marketType || null) || 0
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
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      avgWin: wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
      avgLoss: losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
      profitFactor: losses.reduce((a, b) => a + b, 0) > 0 
        ? wins.reduce((a, b) => a + b, 0) / losses.reduce((a, b) => a + b, 0) 
        : wins.length > 0 ? Infinity : 0,
      currentStreak,
      last30Days
    })
  }

  const handleTradeAdded = () => {
    fetchTrades()
    setShowTradeForm(false)
  }

  const getPnLTrend = () => {
    if (stats.last30Days.pnl.length < 2) return { data: [], current: 0, previous: 0 }
    const data = stats.last30Days.pnl.slice(-7)
    const current = data[data.length - 1] || 0
    const previous = data[data.length - 2] || 0
    return { data, current, previous }
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
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold">Trading Dashboard</h1>
            <p className="text-muted-foreground">Track your performance with beautiful visualizations</p>
          </div>
          <Button onClick={() => setShowTradeForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Trade
          </Button>
        </motion.div>

        {/* Key Metrics with Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center"
          >
            <RadialGauge
              value={stats.winRate}
              label="Win Rate"
              threshold={{ good: 50, warning: 40 }}
              size={180}
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {Math.floor(stats.winRate * stats.closedTrades / 100)} wins / {stats.closedTrades} trades
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center"
          >
            <RadialGauge
              value={Math.min(stats.profitFactor, 5)}
              max={5}
              label="Profit Factor"
              unit="x"
              threshold={{ good: 1.5, warning: 1 }}
              size={180}
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                ${stats.avgWin.toFixed(2)} avg win / ${stats.avgLoss.toFixed(2)} avg loss
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Net P&L</h3>
                <div className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats.totalPnL, settings)}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${stats.totalPnL >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {stats.totalPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Today&apos;s P&L</span>
                <span className={`font-medium ${stats.todayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.todayPnL >= 0 ? '+' : ''}{formatCurrency(stats.todayPnL, settings)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Visual Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <VisualMetricCard
            title="Total Trades"
            value={stats.totalTrades}
            icon={<Activity className="h-4 w-4" />}
            status="good"
            trend={getPnLTrend()}
          />
          <VisualMetricCard
            title="Open Positions"
            value={stats.openTrades}
            icon={<Target className="h-4 w-4" />}
            status={stats.openTrades > 5 ? 'warning' : 'good'}
            description="Currently active trades"
          />
          <VisualMetricCard
            title="Current Streak"
            value={`${stats.currentStreak.count} ${stats.currentStreak.type}s`}
            icon={<Zap className="h-4 w-4" />}
            status={stats.currentStreak.type === 'win' ? 'good' : 'danger'}
          />
          <VisualMetricCard
            title="Risk Score"
            value={stats.profitFactor < 1 ? 'High' : stats.profitFactor < 1.5 ? 'Medium' : 'Low'}
            icon={<Shield className="h-4 w-4" />}
            status={stats.profitFactor < 1 ? 'danger' : stats.profitFactor < 1.5 ? 'warning' : 'good'}
            benchmark={{ value: 1.5, label: 'Target Profit Factor' }}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EquityCurveChart trades={trades} />
          <DailyPnLChart trades={trades} days={30} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SymbolDistribution trades={trades} metric="pnl" />
          <SymbolDistribution trades={trades} metric="count" />
        </div>

        {/* Calendar Heatmap */}
        <TradingCalendarHeatmap trades={trades} />

        {/* Trade Form Modal */}
        <AnimatePresence>
          {showTradeForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add New Trade</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTradeForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <TradeForm onAdd={handleTradeAdded} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SidebarLayout>
  )
}