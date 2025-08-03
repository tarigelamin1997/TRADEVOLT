'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SlippageMetrics } from '@/lib/services/execution-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed } from '@/lib/utils/safe-format'
import { Activity, TrendingDown, TrendingUp, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Trade } from '@/lib/db-memory'

interface SlippageChartProps {
  slippage: SlippageMetrics
  trades: Trade[]
}

export function SlippageChart({ slippage, trades }: SlippageChartProps) {
  const { settings } = useSettings()
  
  const getSlippageColor = (value: number) => {
    // For slippage, negative is better (got better price than intended)
    if (value < -0.1) return 'text-green-600'
    if (value < 0.1) return 'text-gray-600'
    if (value < 0.3) return 'text-amber-600'
    return 'text-red-600'
  }
  
  const getSlippageBarColor = (value: number) => {
    if (value < -0.1) return 'bg-green-500'
    if (value < 0.1) return 'bg-gray-500'
    if (value < 0.3) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // Calculate slippage distribution
  const slippageRanges = [
    { label: '< -0.1%', min: -Infinity, max: -0.1 },
    { label: '-0.1% to 0%', min: -0.1, max: 0 },
    { label: '0% to 0.1%', min: 0, max: 0.1 },
    { label: '0.1% to 0.3%', min: 0.1, max: 0.3 },
    { label: '> 0.3%', min: 0.3, max: Infinity }
  ]

  const entryDistribution = slippageRanges.map(range => {
    const count = trades.filter(t => {
      if (!t.intendedEntry) return false
      const slippage = t.type === 'BUY' 
        ? ((t.entry - t.intendedEntry) / t.intendedEntry) * 100
        : ((t.intendedEntry - t.entry) / t.intendedEntry) * 100
      return slippage >= range.min && slippage < range.max
    }).length
    return { ...range, count }
  })

  const maxCount = Math.max(...entryDistribution.map(d => d.count), 1)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Slippage Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Average Slippage */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Entry Slippage</span>
                {slippage.averageEntrySlippage > 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className={cn("text-2xl font-bold", getSlippageColor(slippage.averageEntrySlippage))}>
                {slippage.averageEntrySlippage >= 0 ? '+' : ''}{safeToFixed(slippage.averageEntrySlippage, 3)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {slippage.averageEntrySlippage > 0 ? 'Worse than intended' : 'Better than intended'}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Exit Slippage</span>
                {slippage.averageExitSlippage > 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className={cn("text-2xl font-bold", getSlippageColor(slippage.averageExitSlippage))}>
                {slippage.averageExitSlippage >= 0 ? '+' : ''}{safeToFixed(slippage.averageExitSlippage, 3)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {slippage.averageExitSlippage > 0 ? 'Worse than intended' : 'Better than intended'}
              </p>
            </motion.div>
          </div>
          
          {/* Total Cost */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "rounded-lg border-2 p-4",
              slippage.totalSlippageCost > 0 
                ? "bg-red-50 dark:bg-red-900/20 border-red-200"
                : "bg-green-50 dark:bg-green-900/20 border-green-200"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm mb-1">Total Slippage Cost</h4>
                <p className={cn("text-2xl font-bold", slippage.totalSlippageCost > 0 ? "text-red-600" : "text-green-600")}>
                  {slippage.totalSlippageCost >= 0 ? '-' : '+'}{formatCurrency(Math.abs(slippage.totalSlippageCost), settings)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {slippage.totalSlippageCost > 0 
                    ? 'Lost to slippage' 
                    : 'Saved from better execution'}
                </p>
              </div>
              <DollarSign className={cn("h-8 w-8", slippage.totalSlippageCost > 0 ? "text-red-600" : "text-green-600")} />
            </div>
          </motion.div>
          
          {/* Distribution Chart */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Entry Slippage Distribution</h4>
            <div className="space-y-2">
              {entryDistribution.map((range, index) => (
                <motion.div
                  key={range.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-muted-foreground w-20 text-right">{range.label}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(range.count / maxCount) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className={cn("h-full", 
                        range.max <= -0.1 ? "bg-green-500" :
                        range.max <= 0 ? "bg-green-400" :
                        range.max <= 0.1 ? "bg-gray-500" :
                        range.max <= 0.3 ? "bg-amber-500" :
                        "bg-red-500"
                      )}
                    />
                    {range.count > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                        {range.count}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Worst/Best Execution */}
          <div className="grid grid-cols-2 gap-4">
            {slippage.worstSlippage.trade && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Worst Slippage</h4>
                <p className="text-sm text-red-600">
                  {slippage.worstSlippage.trade.symbol}
                </p>
                <p className="text-xs text-red-600">
                  {safeToFixed(slippage.worstSlippage.amount, 3)}% • -{formatCurrency(slippage.worstSlippage.cost, settings)}
                </p>
              </div>
            )}
            
            {slippage.bestExecution.trade && slippage.bestExecution.cost < 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Best Execution</h4>
                <p className="text-sm text-green-600">
                  {slippage.bestExecution.trade.symbol}
                </p>
                <p className="text-xs text-green-600">
                  {safeToFixed(slippage.bestExecution.amount, 3)}% • +{formatCurrency(Math.abs(slippage.bestExecution.cost), settings)}
                </p>
              </div>
            )}
          </div>
          
          {/* Slippage by Market */}
          {Object.keys(slippage.slippageByMarket).length > 1 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Slippage by Market</h4>
              <div className="space-y-2">
                {Object.entries(slippage.slippageByMarket).map(([market, data], index) => (
                  <motion.div
                    key={market}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{market}</span>
                    <div className="flex items-center gap-4">
                      <span className={cn("text-xs", getSlippageColor(data.avgEntry))}>
                        Entry: {safeToFixed(data.avgEntry, 3)}%
                      </span>
                      <span className={cn("text-xs", getSlippageColor(data.avgExit))}>
                        Exit: {safeToFixed(data.avgExit, 3)}%
                      </span>
                      <span className={cn("text-xs font-medium", data.totalCost > 0 ? "text-red-600" : "text-green-600")}>
                        {formatCurrency(data.totalCost, settings)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}