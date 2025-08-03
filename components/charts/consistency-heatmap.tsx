'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DailyConsistency } from '@/lib/services/behavioral-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed } from '@/lib/utils/safe-format'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface ConsistencyHeatmapProps {
  consistency: DailyConsistency
}

export function ConsistencyHeatmap({ consistency }: ConsistencyHeatmapProps) {
  const { settings } = useSettings()
  
  // Get min and max P&L for color scaling
  const pnlValues = consistency.dailyPnL.map(d => d.pnl)
  const maxPnL = Math.max(...pnlValues, 1)
  const minPnL = Math.min(...pnlValues, -1)
  const maxAbsPnL = Math.max(Math.abs(maxPnL), Math.abs(minPnL))
  
  // Get color based on P&L
  const getHeatmapColor = (pnl: number): string => {
    if (pnl === 0) return 'bg-gray-100 dark:bg-gray-800'
    
    const intensity = Math.abs(pnl) / maxAbsPnL
    
    if (pnl > 0) {
      if (intensity > 0.75) return 'bg-green-600'
      if (intensity > 0.5) return 'bg-green-500'
      if (intensity > 0.25) return 'bg-green-400'
      return 'bg-green-300'
    } else {
      if (intensity > 0.75) return 'bg-red-600'
      if (intensity > 0.5) return 'bg-red-500'
      if (intensity > 0.25) return 'bg-red-400'
      return 'bg-red-300'
    }
  }
  
  // Group by weeks for better visualization
  const weeks: { date: string; pnl: number }[][] = []
  let currentWeek: { date: string; pnl: number }[] = []
  
  consistency.dailyPnL.forEach((day, index) => {
    currentWeek.push(day)
    if (currentWeek.length === 7 || index === consistency.dailyPnL.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  // Get consistency level
  const getConsistencyLevel = () => {
    if (consistency.score >= 80) return { label: 'Highly Consistent', color: 'text-green-600' }
    if (consistency.score >= 60) return { label: 'Moderately Consistent', color: 'text-amber-600' }
    if (consistency.score >= 40) return { label: 'Somewhat Consistent', color: 'text-orange-600' }
    return { label: 'Inconsistent', color: 'text-red-600' }
  }
  
  const consistencyLevel = getConsistencyLevel()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Daily Consistency Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Consistency Score</div>
              <div className={`text-2xl font-bold ${consistencyLevel.color}`}>
                {consistency.score}
              </div>
              <div className={`text-xs ${consistencyLevel.color}`}>
                {consistencyLevel.label}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Profitable Days</div>
              <div className="text-2xl font-bold text-green-600">
                {safeToFixed(consistency.profitableDaysPercent, 1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Win rate by day
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Daily Sharpe</div>
              <div className={`text-2xl font-bold ${
                consistency.dailySharpe > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {safeToFixed(consistency.dailySharpe, 2)}
              </div>
              <div className="text-xs text-muted-foreground">
                Risk-adjusted returns
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Volatility (CV)</div>
              <div className="text-2xl font-bold">
                {safeToFixed(consistency.cv, 2)}
              </div>
              <div className="text-xs text-muted-foreground">
                Lower is better
              </div>
            </motion.div>
          </div>
          
          {/* Heatmap */}
          {consistency.dailyPnL.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Daily P&L Heatmap</h4>
              
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 text-xs text-center text-muted-foreground mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              
              {/* Weeks */}
              <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const day = week[dayIndex]
                      if (!day) {
                        return <div key={dayIndex} className="aspect-square" />
                      }
                      
                      return (
                        <motion.div
                          key={day.date}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: weekIndex * 0.05 + dayIndex * 0.01,
                            type: "spring",
                            stiffness: 200
                          }}
                          className={`
                            aspect-square rounded p-1 cursor-pointer transition-all hover:scale-105
                            ${getHeatmapColor(day.pnl)}
                            border border-gray-200 dark:border-gray-700
                            relative group
                          `}
                        >
                          <div className="text-xs font-medium text-center">
                            {new Date(day.date).getDate()}
                          </div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              <div>{day.date}</div>
                              <div className={day.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {formatCurrency(day.pnl, settings)}
                              </div>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="border-4 border-transparent border-t-gray-900" />
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs mt-4">
                <span className="text-muted-foreground">P&L Range:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded" />
                  <span>Large Loss</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded" />
                  <span>Small Loss</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
                  <span>Break Even</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded" />
                  <span>Small Profit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded" />
                  <span>Large Profit</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Insights */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Consistency Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {consistency.cv > 2 && (
                <div className="flex gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">High Volatility:</strong> Your daily results vary significantly (CV: {safeToFixed(consistency.cv, 2)}). Consider implementing stricter position sizing rules.
                  </p>
                </div>
              )}
              
              {consistency.profitableDaysPercent < 50 && (
                <div className="flex gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-red-600">Low Win Days:</strong> Only {safeToFixed(consistency.profitableDaysPercent, 1)}% of your trading days are profitable. Focus on quality over quantity.
                  </p>
                </div>
              )}
              
              {consistency.dailySharpe < 0 && (
                <div className="flex gap-2">
                  <Activity className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-red-600">Negative Sharpe:</strong> Your risk-adjusted returns are negative. Review your risk management approach.
                  </p>
                </div>
              )}
              
              {consistency.score >= 80 && (
                <div className="flex gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-green-600">Excellent Consistency:</strong> Your trading shows remarkable consistency. This is a sign of good discipline and risk management.
                  </p>
                </div>
              )}
              
              <p className="pt-2">
                💡 <strong>Recommendation:</strong> {
                  consistency.cv > 2 
                    ? "Focus on reducing daily P&L variance through consistent position sizing."
                    : consistency.profitableDaysPercent < 50
                    ? "Improve entry criteria to increase the percentage of profitable days."
                    : consistency.score < 60
                    ? "Work on developing more consistent trading habits and routines."
                    : "Maintain your current approach while looking for incremental improvements."
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}