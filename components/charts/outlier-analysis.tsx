'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OutlierAnalysis } from '@/lib/services/behavioral-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed, safePercent } from '@/lib/utils/safe-format'
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutlierAnalysisProps {
  outliers: OutlierAnalysis
}

export function OutlierAnalysisChart({ outliers }: OutlierAnalysisProps) {
  const { settings } = useSettings()
  
  const outlierImpact = outliers.totalPnLWithOutliers !== 0
    ? ((outliers.totalPnLWithOutliers - outliers.performanceWithoutOutliers) / Math.abs(outliers.totalPnLWithOutliers)) * 100
    : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Outlier Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Largest Win/Loss Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Largest Win */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm mb-2">Largest Win</h4>
                  {outliers.largestWin ? (
                    <>
                      <p className="text-2xl font-bold text-green-600">
                        +{formatCurrency(outliers.largestWinPnL, settings)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {outliers.largestWin.symbol}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(outliers.largestWin.entryTime || outliers.largestWin.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2 text-xs space-y-1">
                        <p>Entry: ${safeToFixed(outliers.largestWin.entry, 2)}</p>
                        <p>Exit: ${safeToFixed(outliers.largestWin.exit, 2)}</p>
                        <p>Quantity: {outliers.largestWin.quantity}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">No winning trades yet</p>
                  )}
                </div>
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </motion.div>
            
            {/* Largest Loss */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm mb-2">Largest Loss</h4>
                  {outliers.largestLoss ? (
                    <>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(outliers.largestLossPnL, settings)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {outliers.largestLoss.symbol}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(outliers.largestLoss.entryTime || outliers.largestLoss.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2 text-xs space-y-1">
                        <p>Entry: ${safeToFixed(outliers.largestLoss.entry, 2)}</p>
                        <p>Exit: ${safeToFixed(outliers.largestLoss.exit, 2)}</p>
                        <p>Quantity: {outliers.largestLoss.quantity}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">No losing trades yet</p>
                  )}
                </div>
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </motion.div>
          </div>
          
          {/* Performance Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
          >
            <h4 className="font-medium text-sm mb-4">Performance Impact</h4>
            
            <div className="space-y-4">
              {/* Total P&L */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total P&L (All Trades)</span>
                <span className={cn(
                  "text-lg font-bold",
                  outliers.totalPnLWithOutliers >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(outliers.totalPnLWithOutliers, settings)}
                </span>
              </div>
              
              {/* P&L without outliers */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">P&L Without Top/Bottom 10%</span>
                <span className={cn(
                  "text-lg font-bold",
                  outliers.performanceWithoutOutliers >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(outliers.performanceWithoutOutliers, settings)}
                </span>
              </div>
              
              {/* Outlier Impact */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Outlier Impact</span>
                  <span className={cn(
                    "text-lg font-bold",
                    outlierImpact >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {outlierImpact >= 0 ? '+' : ''}{safePercent(outlierImpact, 1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.abs(outlierImpact) > 50 
                    ? "Your performance is heavily influenced by outliers"
                    : Math.abs(outlierImpact) > 20
                    ? "Outliers have moderate impact on your performance"
                    : "Your performance is consistent with minimal outlier impact"
                  }
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Outlier Ratio Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-muted-foreground">Outlier Contribution</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Core Performance (90% of trades)</span>
                <span>{safePercent(100 - (outliers.outlierRatio * 100), 1)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - (outliers.outlierRatio * 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="h-full bg-blue-600"
                />
              </div>
              
              <div className="flex items-center justify-between text-sm mt-4">
                <span>Outlier Contribution (top/bottom 10%)</span>
                <span>{safePercent(outliers.outlierRatio * 100, 1)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${outliers.outlierRatio * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className={cn(
                    "h-full",
                    outlierImpact >= 0 ? "bg-green-600" : "bg-red-600"
                  )}
                />
              </div>
            </div>
          </motion.div>
          
          {/* Insights */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Outlier Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {outliers.outlierRatio > 0.5 && (
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">High Dependency:</strong> Over {safePercent(outliers.outlierRatio * 100, 0)} of your performance comes from outlier trades. This suggests inconsistent trading.
                  </p>
                </div>
              )}
              
              {outliers.largestLossPnL && Math.abs(outliers.largestLossPnL) > Math.abs(outliers.largestWinPnL) * 1.5 && (
                <div className="flex gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-red-600">Risk Management:</strong> Your largest loss is significantly bigger than your largest win. Consider tighter stop losses.
                  </p>
                </div>
              )}
              
              {outlierImpact < -20 && (
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-red-600">Negative Outliers:</strong> Large losses are significantly impacting your overall performance. Focus on limiting downside risk.
                  </p>
                </div>
              )}
              
              {outlierImpact > 50 && (
                <div className="flex gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-green-600">Lucky Trades:</strong> A few big wins are carrying your performance. Work on improving consistency in regular trades.
                  </p>
                </div>
              )}
              
              <p className="pt-2">
                💡 <strong>Recommendation:</strong> {
                  outliers.outlierRatio > 0.5
                    ? "Focus on developing a more consistent trading approach with uniform position sizing."
                    : outlierImpact < -20
                    ? "Implement strict risk management rules to prevent large losses."
                    : outlierImpact > 50
                    ? "Don't rely on home runs. Build a sustainable edge in your regular trading."
                    : "Your performance shows good consistency. Continue managing risk effectively."
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}