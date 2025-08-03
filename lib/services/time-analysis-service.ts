import type { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

export interface HourlyStats {
  hour: number // 0-23
  totalTrades: number
  winRate: number
  totalPnL: number
  avgPnL: number
  bestTrade: Trade | null
  worstTrade: Trade | null
}

export interface DayStats {
  dayOfWeek: number // 0-6 (Sun-Sat)
  dayName: string
  totalTrades: number
  winRate: number
  totalPnL: number
  avgPnL: number
  winningTrades: number
  losingTrades: number
}

export interface HoldTimeStats {
  avgHoldTime: number // in minutes
  medianHoldTime: number
  avgWinningHoldTime: number
  avgLosingHoldTime: number
  distribution: {
    range: string
    count: number
    winRate: number
    avgPnL: number
    totalPnL: number
  }[]
}

export interface FrequencyStats {
  avgTradesPerDay: number
  avgTradesPerWeek: number
  avgTradesPerMonth: number
  mostActiveDay: string
  leastActiveDay: string
  tradingDays: number
  nonTradingDays: number
  maxTradesInDay: number
  consistency: number // 0-100 score
}

export interface PeriodStats {
  period: string
  startDate: Date
  endDate: Date
  totalTrades: number
  winRate: number
  totalPnL: number
  avgPnL: number
  bestDay: number
  worstDay: number
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export class TimeAnalysisService {
  
  // Calculate hold time in minutes
  static calculateHoldTime(trade: Trade): number | null {
    if (!trade.entryTime || !trade.exitTime || !trade.exit) return null
    
    const entry = new Date(trade.entryTime)
    const exit = new Date(trade.exitTime)
    const diffMs = exit.getTime() - entry.getTime()
    
    return Math.round(diffMs / (1000 * 60)) // Convert to minutes
  }
  
  // Get hold time statistics
  static getHoldTimeStats(trades: Trade[]): HoldTimeStats {
    const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
    const holdTimes: { time: number; pnl: number; trade: Trade }[] = []
    
    for (const trade of closedTrades) {
      const holdTime = this.calculateHoldTime(trade)
      if (holdTime !== null) {
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        holdTimes.push({ time: holdTime, pnl, trade })
      }
    }
    
    if (holdTimes.length === 0) {
      return {
        avgHoldTime: 0,
        medianHoldTime: 0,
        avgWinningHoldTime: 0,
        avgLosingHoldTime: 0,
        distribution: []
      }
    }
    
    // Calculate averages
    const allTimes = holdTimes.map(h => h.time)
    const winningTimes = holdTimes.filter(h => h.pnl > 0).map(h => h.time)
    const losingTimes = holdTimes.filter(h => h.pnl < 0).map(h => h.time)
    
    const avgHoldTime = allTimes.reduce((a, b) => a + b, 0) / allTimes.length
    const medianHoldTime = this.median(allTimes)
    const avgWinningHoldTime = winningTimes.length > 0 
      ? winningTimes.reduce((a, b) => a + b, 0) / winningTimes.length
      : 0
    const avgLosingHoldTime = losingTimes.length > 0
      ? losingTimes.reduce((a, b) => a + b, 0) / losingTimes.length
      : 0
    
    // Create distribution
    const ranges = [
      { min: 0, max: 5, label: '< 5 min' },
      { min: 5, max: 30, label: '5-30 min' },
      { min: 30, max: 60, label: '30-60 min' },
      { min: 60, max: 240, label: '1-4 hours' },
      { min: 240, max: 1440, label: '4-24 hours' },
      { min: 1440, max: Infinity, label: '> 1 day' }
    ]
    
    const distribution = ranges.map(range => {
      const tradesInRange = holdTimes.filter(h => 
        h.time >= range.min && h.time < range.max
      )
      
      const wins = tradesInRange.filter(h => h.pnl > 0).length
      const totalPnL = tradesInRange.reduce((sum, h) => sum + h.pnl, 0)
      
      return {
        range: range.label,
        count: tradesInRange.length,
        winRate: tradesInRange.length > 0 ? (wins / tradesInRange.length) * 100 : 0,
        avgPnL: tradesInRange.length > 0 ? totalPnL / tradesInRange.length : 0,
        totalPnL
      }
    }).filter(d => d.count > 0)
    
    return {
      avgHoldTime,
      medianHoldTime,
      avgWinningHoldTime,
      avgLosingHoldTime,
      distribution
    }
  }
  
  // Get hourly performance statistics
  static getHourlyStats(trades: Trade[]): HourlyStats[] {
    const hourlyMap = new Map<number, { trades: Trade[]; pnls: number[] }>()
    
    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, { trades: [], pnls: [] })
    }
    
    // Group trades by hour
    for (const trade of trades) {
      if (trade.entryTime) {
        const hour = new Date(trade.entryTime).getHours()
        const hourData = hourlyMap.get(hour)!
        hourData.trades.push(trade)
        
        if (trade.exit !== null && trade.exit !== undefined) {
          const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
          hourData.pnls.push(pnl)
        }
      }
    }
    
    // Calculate stats for each hour
    const stats: HourlyStats[] = []
    
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyMap.get(hour)!
      const wins = hourData.pnls.filter(pnl => pnl > 0).length
      const totalPnL = hourData.pnls.reduce((sum, pnl) => sum + pnl, 0)
      
      // Find best and worst trades
      let bestTrade: Trade | null = null
      let worstTrade: Trade | null = null
      let bestPnL = -Infinity
      let worstPnL = Infinity
      
      for (const trade of hourData.trades) {
        if (trade.exit !== null && trade.exit !== undefined) {
          const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
          if (pnl > bestPnL) {
            bestPnL = pnl
            bestTrade = trade
          }
          if (pnl < worstPnL) {
            worstPnL = pnl
            worstTrade = trade
          }
        }
      }
      
      stats.push({
        hour,
        totalTrades: hourData.trades.length,
        winRate: hourData.pnls.length > 0 ? (wins / hourData.pnls.length) * 100 : 0,
        totalPnL,
        avgPnL: hourData.pnls.length > 0 ? totalPnL / hourData.pnls.length : 0,
        bestTrade,
        worstTrade
      })
    }
    
    return stats
  }
  
  // Get day of week performance statistics
  static getDayOfWeekStats(trades: Trade[]): DayStats[] {
    const dayMap = new Map<number, { trades: Trade[]; pnls: number[]; wins: number }>()
    
    // Initialize all days
    for (let day = 0; day < 7; day++) {
      dayMap.set(day, { trades: [], pnls: [], wins: 0 })
    }
    
    // Group trades by day of week
    for (const trade of trades) {
      const dayOfWeek = new Date(trade.createdAt).getDay()
      const dayData = dayMap.get(dayOfWeek)!
      dayData.trades.push(trade)
      
      if (trade.exit !== null && trade.exit !== undefined) {
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        dayData.pnls.push(pnl)
        if (pnl > 0) dayData.wins++
      }
    }
    
    // Calculate stats for each day
    const stats: DayStats[] = []
    
    for (let day = 0; day < 7; day++) {
      const dayData = dayMap.get(day)!
      const totalPnL = dayData.pnls.reduce((sum, pnl) => sum + pnl, 0)
      const losses = dayData.pnls.length - dayData.wins
      
      stats.push({
        dayOfWeek: day,
        dayName: DAY_NAMES[day],
        totalTrades: dayData.trades.length,
        winRate: dayData.pnls.length > 0 ? (dayData.wins / dayData.pnls.length) * 100 : 0,
        totalPnL,
        avgPnL: dayData.pnls.length > 0 ? totalPnL / dayData.pnls.length : 0,
        winningTrades: dayData.wins,
        losingTrades: losses
      })
    }
    
    return stats
  }
  
  // Get trade frequency statistics
  static getTradeFrequency(trades: Trade[]): FrequencyStats {
    if (trades.length === 0) {
      return {
        avgTradesPerDay: 0,
        avgTradesPerWeek: 0,
        avgTradesPerMonth: 0,
        mostActiveDay: 'N/A',
        leastActiveDay: 'N/A',
        tradingDays: 0,
        nonTradingDays: 0,
        maxTradesInDay: 0,
        consistency: 0
      }
    }
    
    // Count trades per day
    const dailyTrades = new Map<string, number>()
    let minDate = new Date()
    let maxDate = new Date(0)
    
    for (const trade of trades) {
      const date = new Date(trade.createdAt)
      const dateStr = date.toDateString()
      dailyTrades.set(dateStr, (dailyTrades.get(dateStr) || 0) + 1)
      
      if (date < minDate) minDate = date
      if (date > maxDate) maxDate = date
    }
    
    // Calculate date range
    const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const weeksDiff = daysDiff / 7
    const monthsDiff = daysDiff / 30
    
    // Find most/least active days
    let mostActiveDay = ''
    let leastActiveDay = ''
    let maxTrades = 0
    let minTrades = Infinity
    
    dailyTrades.forEach((count, date) => {
      if (count > maxTrades) {
        maxTrades = count
        mostActiveDay = date
      }
      if (count < minTrades) {
        minTrades = count
        leastActiveDay = date
      }
    })
    
    // Calculate consistency score (standard deviation based)
    const tradeCounts = Array.from(dailyTrades.values())
    const avgDailyTrades = tradeCounts.reduce((a, b) => a + b, 0) / tradeCounts.length
    const variance = tradeCounts.reduce((sum, count) => 
      sum + Math.pow(count - avgDailyTrades, 2), 0
    ) / tradeCounts.length
    const stdDev = Math.sqrt(variance)
    const consistency = Math.max(0, 100 - (stdDev / avgDailyTrades) * 100)
    
    return {
      avgTradesPerDay: trades.length / daysDiff,
      avgTradesPerWeek: trades.length / weeksDiff,
      avgTradesPerMonth: trades.length / monthsDiff,
      mostActiveDay: new Date(mostActiveDay).toLocaleDateString(),
      leastActiveDay: new Date(leastActiveDay).toLocaleDateString(),
      tradingDays: dailyTrades.size,
      nonTradingDays: daysDiff - dailyTrades.size,
      maxTradesInDay: maxTrades,
      consistency: Math.round(consistency)
    }
  }
  
  // Get performance by time period
  static getPerformanceByPeriod(
    trades: Trade[], 
    period: 'day' | 'week' | 'month'
  ): PeriodStats[] {
    const periodMap = new Map<string, { trades: Trade[]; startDate: Date; endDate: Date }>()
    
    // Group trades by period
    for (const trade of trades) {
      const date = new Date(trade.createdAt)
      let periodKey: string
      let startDate: Date
      let endDate: Date
      
      switch (period) {
        case 'day':
          periodKey = date.toDateString()
          startDate = new Date(date)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(date)
          endDate.setHours(23, 59, 59, 999)
          break
          
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          weekStart.setHours(0, 0, 0, 0)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekEnd.setHours(23, 59, 59, 999)
          periodKey = `${weekStart.toDateString()} - ${weekEnd.toDateString()}`
          startDate = weekStart
          endDate = weekEnd
          break
          
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          startDate = new Date(date.getFullYear(), date.getMonth(), 1)
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
          break
      }
      
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, { trades: [], startDate, endDate })
      }
      
      periodMap.get(periodKey)!.trades.push(trade)
    }
    
    // Calculate stats for each period
    const stats: PeriodStats[] = []
    
    periodMap.forEach((data, periodKey) => {
      const closedTrades = data.trades.filter(t => t.exit !== null && t.exit !== undefined)
      const pnls = closedTrades.map(t => calculateMarketPnL(t, t.marketType || null) || 0)
      const wins = pnls.filter(pnl => pnl > 0).length
      const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0)
      
      // Calculate daily P&L within the period
      const dailyPnLs = new Map<string, number>()
      closedTrades.forEach(trade => {
        const dateStr = new Date(trade.createdAt).toDateString()
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        dailyPnLs.set(dateStr, (dailyPnLs.get(dateStr) || 0) + pnl)
      })
      
      const dailyValues = Array.from(dailyPnLs.values())
      const bestDay = dailyValues.length > 0 ? Math.max(...dailyValues) : 0
      const worstDay = dailyValues.length > 0 ? Math.min(...dailyValues) : 0
      
      stats.push({
        period: periodKey,
        startDate: data.startDate,
        endDate: data.endDate,
        totalTrades: data.trades.length,
        winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
        totalPnL,
        avgPnL: closedTrades.length > 0 ? totalPnL / closedTrades.length : 0,
        bestDay,
        worstDay
      })
    })
    
    // Sort by date
    return stats.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }
  
  // Helper function to calculate median
  private static median(values: number[]): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }
  
  // Format hold time for display
  static formatHoldTime(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined || isNaN(minutes)) {
      return '0 min'
    }
    
    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const mins = Math.round(minutes % 60)
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    } else {
      const days = Math.floor(minutes / 1440)
      const hours = Math.floor((minutes % 1440) / 60)
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`
    }
  }
}