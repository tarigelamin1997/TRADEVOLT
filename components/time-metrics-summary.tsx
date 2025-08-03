'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeAnalysisService } from '@/lib/services/time-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  Calendar,
  TrendingUp,
  Timer,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Trade } from '@/lib/db-memory'

interface TimeMetricsSummaryProps {
  trades: Trade[]
}

export function TimeMetricsSummary({ trades }: TimeMetricsSummaryProps) {
  const router = useRouter()
  const { settings } = useSettings()
  const [metrics, setMetrics] = useState({
    avgHoldTime: 0,
    bestHour: { hour: 0, pnl: 0 },
    bestDay: { day: '', pnl: 0 },
    currentHourPerformance: { isGood: false, pnl: 0 }
  })
  
  useEffect(() => {
    if (trades.length === 0) return
    
    // Calculate metrics
    const holdTimeStats = TimeAnalysisService.getHoldTimeStats(trades)
    const hourlyStats = TimeAnalysisService.getHourlyStats(trades)
    const dayStats = TimeAnalysisService.getDayOfWeekStats(trades)
    
    // Find best hour
    const bestHour = hourlyStats.reduce((best, curr) => 
      curr.totalPnL > best.totalPnL ? curr : best
    , hourlyStats[0])
    
    // Find best day
    const bestDay = dayStats.reduce((best, curr) => 
      curr.totalPnL > best.totalPnL ? curr : best
    , dayStats[0])
    
    // Check current hour performance
    const currentHour = new Date().getHours()
    const currentHourStats = hourlyStats.find(h => h.hour === currentHour)
    const avgHourlyPnL = hourlyStats.reduce((sum, h) => sum + h.totalPnL, 0) / hourlyStats.length
    
    setMetrics({
      avgHoldTime: holdTimeStats.avgHoldTime,
      bestHour: { hour: bestHour.hour, pnl: bestHour.totalPnL },
      bestDay: { day: bestDay.dayName, pnl: bestDay.totalPnL },
      currentHourPerformance: {
        isGood: currentHourStats ? currentHourStats.totalPnL > avgHourlyPnL : false,
        pnl: currentHourStats?.totalPnL || 0
      }
    })
  }, [trades])
  
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
  }
  
  const currentHour = new Date().getHours()
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Time Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/time-analysis')}
            className="text-xs"
          >
            View Details
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Trading Conditions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-3 rounded-lg",
            metrics.currentHourPerformance.isGood
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-full",
              metrics.currentHourPerformance.isGood
                ? "bg-green-100 dark:bg-green-800"
                : "bg-yellow-100 dark:bg-yellow-800"
            )}>
              <TrendingUp className={cn(
                "h-4 w-4",
                metrics.currentHourPerformance.isGood
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              )} />
            </div>
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium",
                metrics.currentHourPerformance.isGood
                  ? "text-green-800 dark:text-green-300"
                  : "text-yellow-800 dark:text-yellow-300"
              )}>
                {metrics.currentHourPerformance.isGood
                  ? `Good trading conditions at ${formatHour(currentHour)}`
                  : `Caution: Below average hour for trading`}
              </p>
              <p className={cn(
                "text-xs mt-1",
                metrics.currentHourPerformance.isGood
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              )}>
                Historical P&L at this hour: {formatCurrency(metrics.currentHourPerformance.pnl, settings)}
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Key Time Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Best Hour</span>
            </div>
            <div className="text-lg font-bold">{formatHour(metrics.bestHour.hour)}</div>
            <div className="text-xs text-green-600">
              +{formatCurrency(metrics.bestHour.pnl, settings)}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Best Day</span>
            </div>
            <div className="text-lg font-bold">{metrics.bestDay.day}</div>
            <div className="text-xs text-green-600">
              +{formatCurrency(metrics.bestDay.pnl, settings)}
            </div>
          </motion.div>
        </div>
        
        {/* Average Hold Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Avg Hold Time
              </span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {TimeAnalysisService.formatHoldTime(metrics.avgHoldTime)}
            </span>
          </div>
        </motion.div>
        
        {/* Trading Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-muted-foreground"
        >
          💡 <strong>Today&apos;s Tip:</strong> {
            currentDayName === metrics.bestDay.day
              ? `It&apos;s ${currentDayName} - your best trading day! Stay focused.`
              : `Consider smaller positions today. Your best day is ${metrics.bestDay.day}.`
          }
        </motion.div>
      </CardContent>
    </Card>
  )
}