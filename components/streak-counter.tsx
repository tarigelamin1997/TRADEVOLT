'use client'

import { useMemo, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, TrendingUp, TrendingDown, Calendar, Target, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface StreakCounterProps {
  trades: any[]
  lastLoginDate?: Date
}

export function StreakCounter({ trades, lastLoginDate }: StreakCounterProps) {
  const [dailyStreak, setDailyStreak] = useState(0)
  
  // Calculate win/loss streaks
  const { currentWinStreak, currentLossStreak, bestWinStreak, worstLossStreak } = useMemo(() => {
    const sortedTrades = [...trades]
      .filter(t => t.exitDate && t.pnl !== undefined)
      .sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())
    
    let currentWin = 0
    let currentLoss = 0
    let bestWin = 0
    let worstLoss = 0
    let tempWin = 0
    let tempLoss = 0
    
    for (const trade of sortedTrades) {
      if (trade.pnl >= 0) {
        tempWin++
        tempLoss = 0
        bestWin = Math.max(bestWin, tempWin)
        
        if (sortedTrades.indexOf(trade) === 0) {
          currentWin = tempWin
        }
      } else {
        tempLoss++
        tempWin = 0
        worstLoss = Math.max(worstLoss, tempLoss)
        
        if (sortedTrades.indexOf(trade) === 0) {
          currentLoss = tempLoss
        }
      }
    }
    
    return {
      currentWinStreak: currentWin,
      currentLossStreak: currentLoss,
      bestWinStreak: bestWin,
      worstLossStreak: worstLoss
    }
  }, [trades])
  
  // Calculate daily login streak
  useEffect(() => {
    const calculateDailyStreak = () => {
      const lastLogin = localStorage.getItem('last_login')
      const today = new Date().toDateString()
      const storedStreak = parseInt(localStorage.getItem('daily_streak') || '0')
      
      if (lastLogin === today) {
        // Already logged in today
        setDailyStreak(storedStreak)
      } else if (lastLogin) {
        const lastDate = new Date(lastLogin)
        const todayDate = new Date(today)
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          // Consecutive day
          const newStreak = storedStreak + 1
          setDailyStreak(newStreak)
          localStorage.setItem('daily_streak', newStreak.toString())
        } else {
          // Streak broken
          setDailyStreak(1)
          localStorage.setItem('daily_streak', '1')
        }
      } else {
        // First login
        setDailyStreak(1)
        localStorage.setItem('daily_streak', '1')
      }
      
      localStorage.setItem('last_login', today)
    }
    
    calculateDailyStreak()
  }, [])
  
  // Get best and worst trades
  const { bestTrade, worstTrade } = useMemo(() => {
    const closedTrades = trades.filter(t => t.exitDate && t.pnl !== undefined)
    
    if (closedTrades.length === 0) {
      return { bestTrade: null, worstTrade: null }
    }
    
    const best = closedTrades.reduce((prev, current) => 
      (current.pnl > prev.pnl) ? current : prev
    )
    
    const worst = closedTrades.reduce((prev, current) => 
      (current.pnl < prev.pnl) ? current : prev
    )
    
    return { bestTrade: best, worstTrade: worst }
  }, [trades])
  
  // Get streak emoji
  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥'
    if (streak >= 14) return '🔥🔥'
    if (streak >= 7) return '🔥'
    if (streak >= 3) return '⭐'
    return '✨'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Daily Login Streak */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-2 right-2 text-2xl">
          {getStreakEmoji(dailyStreak)}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Daily Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={dailyStreak}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-3xl font-bold"
            >
              {dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}
            </motion.div>
          </AnimatePresence>
          <p className="text-xs text-muted-foreground mt-1">
            Keep logging trades daily!
          </p>
        </CardContent>
      </Card>

      {/* Current Win Streak */}
      <Card className={cn(
        "relative overflow-hidden",
        currentWinStreak > 0 && "border-green-200 bg-green-50/50 dark:bg-green-950/20"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Win Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-green-600">
              {currentWinStreak}
            </div>
            <span className="text-sm text-muted-foreground">
              {currentWinStreak === 1 ? 'win' : 'wins'}
            </span>
          </div>
          {bestWinStreak > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Best: {bestWinStreak} wins
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Loss Streak */}
      <Card className={cn(
        "relative overflow-hidden",
        currentLossStreak > 0 && "border-red-200 bg-red-50/50 dark:bg-red-950/20"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            Loss Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-red-600">
              {currentLossStreak}
            </div>
            <span className="text-sm text-muted-foreground">
              {currentLossStreak === 1 ? 'loss' : 'losses'}
            </span>
          </div>
          {worstLossStreak > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Worst: {worstLossStreak} losses
            </p>
          )}
        </CardContent>
      </Card>

      {/* Best Trade */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            Best Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bestTrade ? (
            <>
              <div className="text-2xl font-bold text-green-600">
                +${Math.abs(bestTrade.pnl).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {bestTrade.symbol} • {new Date(bestTrade.exitDate).toLocaleDateString()}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No trades yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}