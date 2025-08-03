'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PartialExitMetrics } from '@/lib/services/execution-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed, safePercent } from '@/lib/utils/safe-format'
import { GitBranch, TrendingUp, Target, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

interface PartialExitTimelineProps {
  trades: Trade[]
  metrics: PartialExitMetrics
}

export function PartialExitTimeline({ trades, metrics }: PartialExitTimelineProps) {
  const { settings } = useSettings()
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600'
    if (efficiency >= 70) return 'text-amber-600'
    if (efficiency >= 50) return 'text-orange-600'
    return 'text-red-600'
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  // Take first 5 trades with partial exits for visualization
  const sampleTrades = trades.slice(0, 5)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Partial Exit Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Overall Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Trades w/ Partials</div>
              <div className="text-2xl font-bold">
                {metrics.tradesWithPartials}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Avg Efficiency</div>
              <div className={cn("text-2xl font-bold", getEfficiencyColor(metrics.averageEfficiency))}>
                {safePercent(metrics.averageEfficiency, 1)}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Success Rate</div>
              <div className={cn("text-2xl font-bold", getEfficiencyColor(metrics.scaleOutSuccess))}>
                {safePercent(metrics.scaleOutSuccess, 1)}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Management Score</div>
              <div className={cn("text-2xl font-bold", getScoreColor(metrics.positionManagementScore))}>
                {Math.round(metrics.positionManagementScore)}
              </div>
            </motion.div>
          </div>
          
          {/* Sample Trade Timelines */}
          {sampleTrades.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Recent Partial Exit Trades</h4>
              
              <div className="space-y-4">
                {sampleTrades.map((trade, index) => {
                  if (!trade.partialExits || trade.partialExits.length === 0) return null
                  
                  const totalPnL = calculateMarketPnL(trade, trade.marketType || null) || 0
                  const isProfit = totalPnL > 0
                  
                  // Calculate position percentages
                  let remainingQty = trade.quantity
                  const exits = trade.partialExits.map((exit, i) => {
                    const percentage = (exit.quantity / trade.quantity) * 100
                    remainingQty -= exit.quantity
                    const exitPnL = trade.type === 'BUY'
                      ? (exit.price - trade.entry) * exit.quantity
                      : (trade.entry - exit.price) * exit.quantity
                    
                    return {
                      ...exit,
                      percentage,
                      pnl: exitPnL,
                      cumulativePosition: ((trade.quantity - remainingQty) / trade.quantity) * 100
                    }
                  })
                  
                  // Add final exit if exists
                  if (trade.exit && remainingQty > 0) {
                    const finalPnL = trade.type === 'BUY'
                      ? (trade.exit - trade.entry) * remainingQty
                      : (trade.entry - trade.exit) * remainingQty
                    
                    exits.push({
                      id: 'final',
                      price: trade.exit,
                      quantity: remainingQty,
                      timestamp: trade.exitTime || trade.createdAt,
                      percentage: (remainingQty / trade.quantity) * 100,
                      pnl: finalPnL,
                      cumulativePosition: 100,
                      reason: 'MANUAL'
                    } as any)
                  }
                  
                  return (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-medium">{trade.symbol}</h5>
                          <p className="text-sm text-muted-foreground">
                            {trade.type} • Entry: ${safeToFixed(trade.entry, 2)} • Qty: {trade.quantity}
                          </p>
                        </div>
                        <span className={cn(
                          "text-sm font-medium px-2 py-1 rounded",
                          isProfit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {formatCurrency(totalPnL, settings)}
                        </span>
                      </div>
                      
                      {/* Timeline */}
                      <div className="relative">
                        {/* Progress bar background */}
                        <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded" />
                        
                        {/* Entry marker */}
                        <div className="absolute top-0 left-0 flex flex-col items-center">
                          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">E</span>
                          </div>
                          <span className="text-xs mt-1">Entry</span>
                        </div>
                        
                        {/* Exit markers */}
                        {exits.map((exit, i) => (
                          <motion.div
                            key={exit.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6 + index * 0.1 + i * 0.05 }}
                            className="absolute top-0 flex flex-col items-center"
                            style={{ left: `${exit.cumulativePosition}%` }}
                          >
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center",
                              exit.pnl > 0 ? "bg-green-500" : "bg-red-500"
                            )}>
                              <span className="text-xs text-white font-bold">
                                {i + 1}
                              </span>
                            </div>
                            <span className="text-xs mt-1 whitespace-nowrap">
                              {safePercent(exit.percentage, 0)}
                            </span>
                            <span className={cn(
                              "text-xs font-medium",
                              exit.pnl > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCurrency(exit.pnl, settings)}
                            </span>
                          </motion.div>
                        ))}
                        
                        {/* Add spacing for timeline */}
                        <div className="h-20" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* No Partial Exits Message */}
          {trades.length === 0 && (
            <div className="text-center py-8">
              <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No trades with partial exits found
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Partial exits help manage risk and lock in profits
              </p>
            </div>
          )}
          
          {/* Insights */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Position Management Insights
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {metrics.averageEfficiency < 70 && metrics.tradesWithPartials > 5 && (
                <div className="flex gap-2">
                  <Target className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">Low Efficiency:</strong> Your partial exits are capturing only {safePercent(metrics.averageEfficiency, 0)} of optimal profits. Consider adjusting your scale-out levels.
                  </p>
                </div>
              )}
              
              {metrics.scaleOutSuccess < 50 && metrics.tradesWithPartials > 5 && (
                <div className="flex gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">Poor Success Rate:</strong> Only {safePercent(metrics.scaleOutSuccess, 0)} of partial exits are profitable. Review your exit timing.
                  </p>
                </div>
              )}
              
              {metrics.positionManagementScore >= 70 && (
                <p className="text-green-600">
                  ✅ Good position management with a score of {Math.round(metrics.positionManagementScore)}/100.
                </p>
              )}
              
              <p className="pt-2">
                💡 <strong>Tip:</strong> {
                  metrics.averageEfficiency < 70
                    ? "Use technical levels or percentage-based targets for partial exits."
                    : metrics.tradesWithPartials === 0
                    ? "Consider using partial exits to reduce risk and secure profits."
                    : "Your partial exit strategy is working well. Keep refining your levels."
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}