'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeAnalysisService, type HourlyStats } from '@/lib/services/time-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'
import { safePercent, safeToFixed } from '@/lib/utils/safe-format'
import type { Trade } from '@/lib/db-memory'

interface HourlyHeatmapProps {
  trades: Trade[]
}

export function HourlyHeatmap({ trades }: HourlyHeatmapProps) {
  const { settings } = useSettings()
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([])
  const [selectedHour, setSelectedHour] = useState<HourlyStats | null>(null)
  
  useEffect(() => {
    const stats = TimeAnalysisService.getHourlyStats(trades)
    setHourlyStats(stats)
  }, [trades])
  
  // Find max values for scaling
  const maxPnL = Math.max(...hourlyStats.map(h => Math.abs(h.totalPnL)), 1)
  const maxTrades = Math.max(...hourlyStats.map(h => h.totalTrades), 1)
  
  // Get color based on P&L
  const getHeatmapColor = (pnl: number): string => {
    if (pnl === 0) return 'bg-gray-100 dark:bg-gray-800'
    
    const intensity = Math.abs(pnl) / maxPnL
    
    if (pnl > 0) {
      if (intensity > 0.75) return 'bg-green-600 text-white'
      if (intensity > 0.5) return 'bg-green-500 text-white'
      if (intensity > 0.25) return 'bg-green-400 text-white'
      return 'bg-green-300'
    } else {
      if (intensity > 0.75) return 'bg-red-600 text-white'
      if (intensity > 0.5) return 'bg-red-500 text-white'
      if (intensity > 0.25) return 'bg-red-400 text-white'
      return 'bg-red-300'
    }
  }
  
  // Format hour for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
  }
  
  // Group hours into time periods
  const timePeriods = [
    { name: 'Pre-Market', hours: [4, 5, 6, 7, 8] },
    { name: 'Morning', hours: [9, 10, 11] },
    { name: 'Midday', hours: [12, 13, 14] },
    { name: 'Afternoon', hours: [15, 16, 17] },
    { name: 'Evening', hours: [18, 19, 20] },
    { name: 'Night', hours: [21, 22, 23, 0, 1, 2, 3] }
  ]
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Trading Hours Analysis</span>
          <span className="text-sm font-normal text-muted-foreground">
            (Local Time)
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Most Profitable Hour</div>
              <div className="text-lg font-bold">
                {(() => {
                  const best = hourlyStats.reduce((best, curr) => 
                    curr.totalPnL > best.totalPnL ? curr : best
                  , hourlyStats[0] || { hour: 0, totalPnL: 0 })
                  return best ? formatHour(best.hour) : 'N/A'
                })()}
              </div>
              <div className="text-sm text-green-600">
                {formatCurrency(Math.max(...hourlyStats.map(h => h.totalPnL), 0), settings)}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Most Active Hour</div>
              <div className="text-lg font-bold">
                {(() => {
                  const mostActive = hourlyStats.reduce((best, curr) => 
                    curr.totalTrades > best.totalTrades ? curr : best
                  , hourlyStats[0] || { hour: 0, totalTrades: 0 })
                  return mostActive ? formatHour(mostActive.hour) : 'N/A'
                })()}
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.max(...hourlyStats.map(h => h.totalTrades), 0)} trades
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Best Win Rate Hour</div>
              <div className="text-lg font-bold">
                {(() => {
                  const bestWR = hourlyStats
                    .filter(h => h.totalTrades > 0)
                    .reduce((best, curr) => 
                      curr.winRate > best.winRate ? curr : best
                    , hourlyStats[0] || { hour: 0, winRate: 0 })
                  return bestWR ? formatHour(bestWR.hour) : 'N/A'
                })()}
              </div>
              <div className="text-sm text-muted-foreground">
                {safePercent(Math.max(...hourlyStats.map(h => h.winRate || 0), 0), 1)} win rate
              </div>
            </div>
          </div>
          
          {/* Hourly Heatmap Grid */}
          <div className="space-y-4">
            {timePeriods.map((period, periodIndex) => (
              <div key={period.name} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{period.name}</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {period.hours.map((hour, index) => {
                    const stats = hourlyStats.find(h => h.hour === hour) || {
                      hour,
                      totalTrades: 0,
                      totalPnL: 0,
                      winRate: 0,
                      avgPnL: 0,
                      bestTrade: null,
                      worstTrade: null
                    }
                    
                    return (
                      <motion.div
                        key={hour}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          delay: periodIndex * 0.1 + index * 0.02,
                          type: "spring",
                          stiffness: 200
                        }}
                        className={cn(
                          "relative p-3 rounded-lg cursor-pointer transition-all hover:scale-105",
                          getHeatmapColor(stats.totalPnL),
                          "border border-gray-200 dark:border-gray-700"
                        )}
                        onClick={() => setSelectedHour(stats)}
                      >
                        <div className="text-xs font-medium">{formatHour(hour)}</div>
                        {stats.totalTrades > 0 && (
                          <>
                            <div className="text-xs font-bold mt-1">
                              {stats.totalPnL > 0 ? '+' : ''}{formatCurrency(stats.totalPnL, settings)}
                            </div>
                            <div className="text-xs opacity-80">
                              {stats.totalTrades} trade{stats.totalTrades > 1 ? 's' : ''}
                            </div>
                            {stats.winRate > 0 && (
                              <div className="absolute top-1 right-1">
                                <div className="w-8 h-3 bg-black/20 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-white/40"
                                    style={{ width: `${stats.winRate}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground">P&L Intensity:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded" />
              <span>High Profit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded" />
              <span>Medium Profit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
              <span>No Trades</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded" />
              <span>Medium Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded" />
              <span>High Loss</span>
            </div>
          </div>
          
          {/* Selected Hour Details */}
          {selectedHour && selectedHour.totalTrades > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3"
            >
              <h4 className="font-medium">{formatHour(selectedHour.hour)} Details</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total P&L</span>
                  <div className={cn(
                    "font-bold",
                    selectedHour.totalPnL > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {selectedHour.totalPnL > 0 ? '+' : ''}{formatCurrency(selectedHour.totalPnL, settings)}
                  </div>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Avg P&L</span>
                  <div className={cn(
                    "font-bold",
                    selectedHour.avgPnL > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {selectedHour.avgPnL > 0 ? '+' : ''}{formatCurrency(selectedHour.avgPnL, settings)}
                  </div>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Win Rate</span>
                  <div className="font-bold">{safePercent(selectedHour.winRate, 1)}</div>
                </div>
                
                <div>
                  <span className="text-muted-foreground">Total Trades</span>
                  <div className="font-bold">{selectedHour.totalTrades}</div>
                </div>
              </div>
              
              {selectedHour.bestTrade && (
                <div className="pt-3 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Best Trade</div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{selectedHour.bestTrade.symbol}</span>
                    <span className="text-green-600 font-bold">
                      +{formatCurrency(
                        selectedHour.bestTrade.exit && selectedHour.bestTrade.exit !== null
                          ? (selectedHour.bestTrade.exit - selectedHour.bestTrade.entry) * selectedHour.bestTrade.quantity
                          : 0,
                        settings
                      )}
                    </span>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setSelectedHour(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Click to close
              </button>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}