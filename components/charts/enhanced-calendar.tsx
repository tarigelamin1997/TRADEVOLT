'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Trophy,
  Target,
  Zap,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'
import { safePercent, safeToFixed } from '@/lib/utils/safe-format'
import type { Trade } from '@/lib/db-memory'

interface EnhancedCalendarProps {
  trades: Trade[]
}

type ViewMode = 'month' | 'week' | 'year'

interface DayData {
  date: Date
  pnl: number
  trades: Trade[]
  winRate: number
  wins: number
  losses: number
}

interface WeekData {
  weekNumber: number
  startDate: Date
  endDate: Date
  pnl: number
  tradeCount: number
  winRate: number
  wins: number
  losses: number
}

export function EnhancedCalendar({ trades }: EnhancedCalendarProps) {
  const { settings } = useSettings()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
  const [monthData, setMonthData] = useState<Map<string, DayData>>(new Map())
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([])
  const [monthStats, setMonthStats] = useState({
    totalPnL: 0,
    totalTrades: 0,
    winRate: 0,
    wins: 0,
    losses: 0,
    bestDay: 0,
    worstDay: 0,
    avgDailyPnL: 0,
    profitableDays: 0,
    losingDays: 0
  })

  useEffect(() => {
    calculateMonthData()
  }, [currentDate, trades, viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const calculateMonthData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const dayMap = new Map<string, DayData>()
    const weekMap = new Map<number, WeekData>()
    
    let totalPnL = 0
    let totalWins = 0
    let totalLosses = 0
    let bestDay = 0
    let worstDay = 0
    let profitableDays = 0
    let losingDays = 0
    
    // Process each day in the month
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString()
      const dayTrades = trades.filter(t => {
        const tradeDate = new Date(t.createdAt)
        return tradeDate.toDateString() === dateKey && (t.exit !== null && t.exit !== undefined)
      })
      
      let dayPnL = 0
      let dayWins = 0
      let dayLosses = 0
      
      dayTrades.forEach(trade => {
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        dayPnL += pnl
        if (pnl > 0) {
          dayWins++
          totalWins++
        } else if (pnl < 0) {
          dayLosses++
          totalLosses++
        }
      })
      
      const dayData: DayData = {
        date: new Date(d),
        pnl: dayPnL,
        trades: dayTrades,
        winRate: dayTrades.length > 0 ? (dayWins / dayTrades.length) * 100 : 0,
        wins: dayWins,
        losses: dayLosses
      }
      
      dayMap.set(dateKey, dayData)
      
      if (dayPnL !== 0) {
        totalPnL += dayPnL
        if (dayPnL > bestDay) bestDay = dayPnL
        if (dayPnL < worstDay) worstDay = dayPnL
        if (dayPnL > 0) profitableDays++
        else losingDays++
      }
      
      // Calculate weekly data
      const weekNumber = getWeekNumber(d)
      if (!weekMap.has(weekNumber)) {
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        weekMap.set(weekNumber, {
          weekNumber,
          startDate: weekStart,
          endDate: weekEnd,
          pnl: 0,
          tradeCount: 0,
          winRate: 0,
          wins: 0,
          losses: 0
        })
      }
      
      const week = weekMap.get(weekNumber)!
      week.pnl += dayPnL
      week.tradeCount += dayTrades.length
      week.wins += dayWins
      week.losses += dayLosses
    }
    
    // Calculate week win rates
    weekMap.forEach(week => {
      const totalTrades = week.wins + week.losses
      week.winRate = totalTrades > 0 ? (week.wins / totalTrades) * 100 : 0
    })
    
    setMonthData(dayMap)
    setWeeklyData(Array.from(weekMap.values()))
    
    const totalTrades = totalWins + totalLosses
    setMonthStats({
      totalPnL,
      totalTrades,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      wins: totalWins,
      losses: totalLosses,
      bestDay,
      worstDay,
      avgDailyPnL: totalPnL / lastDay.getDate(),
      profitableDays,
      losingDays
    })
  }

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      
      switch (viewMode) {
        case 'month':
          newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1))
          break
        case 'week':
          newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7))
          break
        case 'year':
          newDate.setFullYear(prev.getFullYear() + (direction === 'prev' ? -1 : 1))
          break
      }
      
      return newDate
    })
  }
  
  const getDateDisplay = () => {
    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      case 'week':
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      case 'year':
        return currentDate.getFullYear().toString()
    }
  }

  const getDayColor = (pnl: number): string => {
    if (pnl === 0) return 'bg-gray-50 dark:bg-gray-800'
    if (pnl > 0) {
      if (pnl > monthStats.avgDailyPnL * 2) return 'bg-green-600 text-white'
      if (pnl > monthStats.avgDailyPnL) return 'bg-green-500 text-white'
      return 'bg-green-400 text-white'
    } else {
      if (pnl < monthStats.avgDailyPnL * 2) return 'bg-red-600 text-white'
      if (pnl < monthStats.avgDailyPnL) return 'bg-red-500 text-white'
      return 'bg-red-400 text-white'
    }
  }

  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    
    const days = []
    
    // Add padding for start of month
    for (let i = 0; i < startPadding; i++) {
      days.push(<div key={`pad-start-${i}`} className="p-2" />)
    }
    
    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      const dateKey = date.toDateString()
      const dayData = monthData.get(dateKey)
      
      days.push(
        <motion.div
          key={day}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: day * 0.01 }}
          className={cn(
            "relative p-2 rounded-lg cursor-pointer transition-all hover:scale-105",
            getDayColor(dayData?.pnl || 0),
            dayData && dayData.trades.length > 0 && "border-2 border-white/20"
          )}
          onClick={() => dayData && setSelectedDay(dayData)}
        >
          <div className="text-xs font-medium">{day}</div>
          {dayData && dayData.pnl !== 0 && (
            <>
              <div className="text-xs font-bold mt-1">
                {dayData.pnl > 0 ? '+' : ''}{formatCurrency(dayData.pnl, settings)}
              </div>
              {dayData.trades.length > 0 && (
                <div className="text-xs opacity-80">
                  {dayData.trades.length} trade{dayData.trades.length > 1 ? 's' : ''}
                </div>
              )}
              {dayData.winRate > 0 && (
                <div className="absolute top-1 right-1">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold">{Math.round(dayData.winRate)}%</span>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )
    }
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        {days}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay())
    const days = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateKey = date.toDateString()
      const dayData = monthData.get(dateKey)
      
      days.push(
        <motion.div
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => dayData && setSelectedDay(dayData)}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-bold">{date.getDate()}</div>
            </div>
            {dayData && dayData.trades.length > 0 && (
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
                {dayData.trades.length} trade{dayData.trades.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {dayData && dayData.pnl !== 0 ? (
            <div className="space-y-2">
              <div className={cn(
                "text-xl font-bold",
                dayData.pnl > 0 ? "text-green-600" : "text-red-600"
              )}>
                {dayData.pnl > 0 ? '+' : ''}{formatCurrency(dayData.pnl, settings)}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-medium">{safePercent(dayData.winRate, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">W/L</span>
                <span className="font-medium">{dayData.wins}/{dayData.losses}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm mt-4">
              No trades
            </div>
          )}
        </motion.div>
      )
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days}
      </div>
    )
  }

  const renderYearView = () => {
    const year = currentDate.getFullYear()
    const months = []
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      let monthPnL = 0
      let monthTrades = 0
      let monthWins = 0
      let monthLosses = 0
      
      // Calculate month stats
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day)
        const dayTrades = trades.filter(t => {
          const tradeDate = new Date(t.createdAt)
          return tradeDate.toDateString() === date.toDateString() && (t.exit !== null && t.exit !== undefined)
        })
        
        dayTrades.forEach(trade => {
          const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
          monthPnL += pnl
          monthTrades++
          if (pnl > 0) monthWins++
          else if (pnl < 0) monthLosses++
        })
      }
      
      const monthWinRate = monthTrades > 0 ? (monthWins / monthTrades) * 100 : 0
      
      months.push(
        <motion.div
          key={month}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: month * 0.05 }}
          className={cn(
            "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all",
            monthPnL > 0 && "ring-2 ring-green-500",
            monthPnL < 0 && "ring-2 ring-red-500"
          )}
          onClick={() => {
            setCurrentDate(new Date(year, month, 1))
            setViewMode('month')
          }}
        >
          <div className="text-sm font-medium text-muted-foreground mb-2">
            {monthDate.toLocaleDateString('en-US', { month: 'short' })}
          </div>
          
          {monthTrades > 0 ? (
            <>
              <div className={cn(
                "text-lg font-bold mb-1",
                monthPnL > 0 ? "text-green-600" : monthPnL < 0 ? "text-red-600" : "text-gray-500"
              )}>
                {monthPnL > 0 ? '+' : ''}{formatCurrency(monthPnL, settings)}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>{monthTrades} trades</div>
                <div>{monthWins}W / {monthLosses}L</div>
                <div className="font-medium">{safePercent(monthWinRate, 0)} WR</div>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground text-center mt-4">
              No trades
            </div>
          )}
        </motion.div>
      )
    }
    
    // Calculate year totals
    const yearStats = trades.reduce((acc, trade) => {
      const tradeDate = new Date(trade.createdAt)
      if (tradeDate.getFullYear() === year && trade.exit !== null && trade.exit !== undefined) {
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        acc.totalPnL += pnl
        acc.totalTrades++
        if (pnl > 0) acc.wins++
        else if (pnl < 0) acc.losses++
      }
      return acc
    }, { totalPnL: 0, totalTrades: 0, wins: 0, losses: 0 })
    
    const yearWinRate = yearStats.totalTrades > 0 ? (yearStats.wins / yearStats.totalTrades) * 100 : 0
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-4">{year} Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm opacity-80">Total P&L</div>
              <div className="text-2xl font-bold">
                {yearStats.totalPnL > 0 ? '+' : ''}{formatCurrency(yearStats.totalPnL, settings)}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-80">Total Trades</div>
              <div className="text-2xl font-bold">{yearStats.totalTrades}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Win Rate</div>
              <div className="text-2xl font-bold">{safePercent(yearWinRate, 1)}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">W/L Ratio</div>
              <div className="text-2xl font-bold">{yearStats.wins}/{yearStats.losses}</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {months}
        </div>
      </div>
    )
  }

  const renderPerformanceStats = () => {
    const bestTrade = trades.reduce((best, trade) => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      const bestPnl = calculateMarketPnL(best, best.marketType || null) || 0
      return pnl > bestPnl ? trade : best
    }, trades[0] || null)
    
    const worstTrade = trades.reduce((worst, trade) => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      const worstPnl = calculateMarketPnL(worst, worst.marketType || null) || 0
      return pnl < worstPnl ? trade : worst
    }, trades[0] || null)
    
    const bestStreak = calculateBestStreak()
    const currentStreak = calculateCurrentStreak()
    
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Performance Stats</h3>
        
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Best Trade</span>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
            {bestTrade && (
              <>
                <div className="text-sm font-bold text-green-600">
                  +{formatCurrency(calculateMarketPnL(bestTrade, bestTrade.marketType || null) || 0, settings)}
                </div>
                <div className="text-xs text-muted-foreground">{bestTrade.symbol}</div>
              </>
            )}
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Worst Trade</span>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            {worstTrade && (
              <>
                <div className="text-sm font-bold text-red-600">
                  {formatCurrency(calculateMarketPnL(worstTrade, worstTrade.marketType || null) || 0, settings)}
                </div>
                <div className="text-xs text-muted-foreground">{worstTrade.symbol}</div>
              </>
            )}
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Best Streak</span>
              <Zap className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-sm font-bold">{bestStreak} wins</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Current Streak</span>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-sm font-bold">
              {currentStreak.count} {currentStreak.type}s
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Avg Trade</span>
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </div>
            <div className={cn(
              "text-sm font-bold",
              monthStats.totalTrades > 0 && monthStats.totalPnL / monthStats.totalTrades > 0 ? "text-green-600" : "text-red-600"
            )}>
              {monthStats.totalTrades > 0 ? formatCurrency(monthStats.totalPnL / monthStats.totalTrades, settings) : '$0'}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const calculateBestStreak = () => {
    const sortedTrades = [...trades]
      .filter(t => t.exit !== null && t.exit !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    let bestStreak = 0
    let currentStreak = 0
    
    sortedTrades.forEach(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      if (pnl > 0) {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })
    
    return bestStreak
  }
  
  const calculateCurrentStreak = () => {
    const sortedTrades = [...trades]
      .filter(t => t.exit !== null && t.exit !== undefined)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    if (sortedTrades.length === 0) return { type: 'none' as const, count: 0 }
    
    const firstPnL = calculateMarketPnL(sortedTrades[0], sortedTrades[0].marketType || null) || 0
    const type = firstPnL > 0 ? 'win' : 'loss'
    let count = 1
    
    for (let i = 1; i < sortedTrades.length; i++) {
      const pnl = calculateMarketPnL(sortedTrades[i], sortedTrades[i].marketType || null) || 0
      const isWin = pnl > 0
      if ((type === 'win' && isWin) || (type === 'loss' && !isWin)) {
        count++
      } else {
        break
      }
    }
    
    return { type, count }
  }

  const renderWeekSummaries = () => {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Weekly Summary</h3>
        {weeklyData.map((week, index) => (
          <motion.div
            key={week.weekNumber}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Week {week.weekNumber}</span>
              <span className={cn(
                "text-sm font-bold",
                week.pnl > 0 ? "text-green-600" : week.pnl < 0 ? "text-red-600" : "text-gray-500"
              )}>
                {week.pnl > 0 ? '+' : ''}{formatCurrency(week.pnl, settings)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{week.tradeCount} trades</span>
              <span>{week.wins}W / {week.losses}L</span>
            </div>
            {week.winRate > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${week.winRate}%` }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Trading Calendar</CardTitle>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[200px] text-center">
                {getDateDisplay()}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Month Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Total P&L</div>
            <div className={cn(
              "text-lg font-bold",
              monthStats.totalPnL > 0 ? "text-green-600" : monthStats.totalPnL < 0 ? "text-red-600" : "text-gray-500"
            )}>
              {monthStats.totalPnL > 0 ? '+' : ''}{formatCurrency(monthStats.totalPnL, settings)}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Win Rate</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {safePercent(monthStats.winRate, 1)}
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Total Trades</div>
            <div className="text-lg font-bold">{monthStats.totalTrades}</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Best Day</div>
            <div className="text-lg font-bold text-green-600">
              +{formatCurrency(monthStats.bestDay, settings)}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Worst Day</div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(monthStats.worstDay, settings)}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Avg Daily P&L</div>
            <div className={cn(
              "text-lg font-bold",
              monthStats.avgDailyPnL > 0 ? "text-green-600" : monthStats.avgDailyPnL < 0 ? "text-red-600" : "text-gray-500"
            )}>
              {monthStats.avgDailyPnL > 0 ? '+' : ''}{formatCurrency(monthStats.avgDailyPnL, settings)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === 'month' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              {renderMonthView()}
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              {renderWeekSummaries()}
              {renderPerformanceStats()}
            </div>
          </div>
        )}
        
        {viewMode === 'week' && renderWeekView()}
        
        {viewMode === 'year' && renderYearView()}
        
        {/* Day Details Modal */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedDay(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">
                  {selectedDay.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Daily P&L</span>
                    <span className={cn(
                      "text-xl font-bold",
                      selectedDay.pnl > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {selectedDay.pnl > 0 ? '+' : ''}{formatCurrency(selectedDay.pnl, settings)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trades</span>
                    <span className="font-medium">{selectedDay.trades.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-medium">{safePercent(selectedDay.winRate, 1)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Wins/Losses</span>
                    <span className="font-medium">{selectedDay.wins}W / {selectedDay.losses}L</span>
                  </div>
                  
                  <div className="pt-4 border-t space-y-2">
                    <h4 className="font-medium mb-2">Trade Details</h4>
                    {selectedDay.trades.map((trade, index) => {
                      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{trade.symbol}</span>
                          <span className={cn(
                            "font-medium",
                            pnl > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {pnl > 0 ? '+' : ''}{formatCurrency(pnl, settings)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6" 
                  onClick={() => setSelectedDay(null)}
                >
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}