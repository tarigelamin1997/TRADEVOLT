'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommissionMetrics } from '@/lib/services/execution-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed, safePercent } from '@/lib/utils/safe-format'
import { DollarSign, TrendingDown, PieChart, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommissionBreakdownProps {
  commission: CommissionMetrics
}

export function CommissionBreakdown({ commission }: CommissionBreakdownProps) {
  const { settings } = useSettings()
  
  const getImpactColor = (percent: number) => {
    if (percent < 5) return 'text-green-600'
    if (percent < 15) return 'text-amber-600'
    if (percent < 25) return 'text-orange-600'
    return 'text-red-600'
  }
  
  const getImpactBgColor = (percent: number) => {
    if (percent < 5) return 'bg-green-50 dark:bg-green-900/20 border-green-200'
    if (percent < 15) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'
    if (percent < 25) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200'
    return 'bg-red-50 dark:bg-red-900/20 border-red-200'
  }

  // Calculate pie chart data
  const marketData = Object.entries(commission.commissionByMarket).map(([market, data]) => ({
    market,
    value: data.total,
    percentage: (data.total / commission.totalCommission) * 100
  })).sort((a, b) => b.value - a.value)

  // Colors for pie chart
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Calculate pie chart paths
  let cumulativePercentage = 0
  const pieSlices = marketData.map((data, index) => {
    const startAngle = (cumulativePercentage / 100) * 360
    cumulativePercentage += data.percentage
    const endAngle = (cumulativePercentage / 100) * 360
    
    const startAngleRad = (startAngle - 90) * Math.PI / 180
    const endAngleRad = (endAngle - 90) * Math.PI / 180
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
    
    const x1 = 50 + 40 * Math.cos(startAngleRad)
    const y1 = 50 + 40 * Math.sin(startAngleRad)
    const x2 = 50 + 40 * Math.cos(endAngleRad)
    const y2 = 50 + 40 * Math.sin(endAngleRad)
    
    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ')
    
    return {
      ...data,
      path: pathData,
      color: pieColors[index % pieColors.length]
    }
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Commission Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Total Commission Impact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "rounded-lg border-2 p-4",
              getImpactBgColor(commission.commissionAsPercentOfPnL)
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm mb-1">Commission Impact on P&L</h4>
                <p className={cn("text-3xl font-bold", getImpactColor(commission.commissionAsPercentOfPnL))}>
                  {safePercent(commission.commissionAsPercentOfPnL, 1)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total: {formatCurrency(commission.totalCommission, settings)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg per trade: {formatCurrency(commission.averagePerTrade, settings)}
                </p>
              </div>
              {commission.commissionAsPercentOfPnL > 20 && (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </motion.div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" />
                Total Commission
              </div>
              <p className="text-xl font-bold">
                {formatCurrency(commission.totalCommission, settings)}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingDown className="h-3 w-3" />
                % of Volume
              </div>
              <p className="text-xl font-bold">
                {safePercent(commission.commissionAsPercentOfVolume, 3)}
              </p>
            </motion.div>
          </div>
          
          {/* Commission by Market - Pie Chart and List */}
          {Object.keys(commission.commissionByMarket).length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Commission by Market</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Pie Chart */}
                {pieSlices.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center"
                  >
                    <svg viewBox="0 0 100 100" className="w-32 h-32">
                      {pieSlices.map((slice, index) => (
                        <motion.path
                          key={slice.market}
                          d={slice.path}
                          fill={slice.color}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          style={{ transformOrigin: '50px 50px' }}
                        />
                      ))}
                    </svg>
                  </motion.div>
                )}
                
                {/* Market List */}
                <div className="space-y-2">
                  {marketData.map((data, index) => (
                    <motion.div
                      key={data.market}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: pieColors[index % pieColors.length] }}
                        />
                        <span className="font-medium">{data.market}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatCurrency(data.value, settings)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({safePercent(data.percentage, 0)})
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Break-even Move by Market */}
          {Object.keys(commission.breakEvenMove).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Break-even Move Required</h4>
              <div className="space-y-2">
                {Object.entries(commission.breakEvenMove).map(([market, move], index) => (
                  <motion.div
                    key={market}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{market}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, move * 20)}%` }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                          className={cn("h-full rounded-full",
                            move < 0.1 ? "bg-green-500" :
                            move < 0.3 ? "bg-amber-500" :
                            "bg-red-500"
                          )}
                        />
                      </div>
                      <span className={cn("text-sm font-medium min-w-[4ch]",
                        move < 0.1 ? "text-green-600" :
                        move < 0.3 ? "text-amber-600" :
                        "text-red-600"
                      )}>
                        {safePercent(move, 2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Insights */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Commission Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {commission.commissionAsPercentOfPnL > 25 && (
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-red-600">High Commission Impact:</strong> Trading costs are consuming {safePercent(commission.commissionAsPercentOfPnL, 0)} of your profits. Consider switching brokers or reducing trade frequency.
                  </p>
                </div>
              )}
              
              {commission.commissionAsPercentOfPnL > 15 && commission.commissionAsPercentOfPnL <= 25 && (
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">Moderate Commission Impact:</strong> Commissions are taking {safePercent(commission.commissionAsPercentOfPnL, 0)} of profits. Look for ways to reduce costs.
                  </p>
                </div>
              )}
              
              {commission.averagePerTrade > 10 && (
                <div className="flex gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">High Per-Trade Cost:</strong> Average commission of {formatCurrency(commission.averagePerTrade, settings)} per trade. Consider larger position sizes to improve cost efficiency.
                  </p>
                </div>
              )}
              
              {commission.commissionAsPercentOfPnL < 10 && (
                <p className="text-green-600">
                  ✅ Your commission costs are well-managed at {safePercent(commission.commissionAsPercentOfPnL, 1)} of profits.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}