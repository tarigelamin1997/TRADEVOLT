'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HitRateMetrics } from '@/lib/services/execution-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed, safePercent } from '@/lib/utils/safe-format'
import { Target, Shield, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HitRateGaugeProps {
  hitRates: HitRateMetrics
}

export function HitRateGauge({ hitRates }: HitRateGaugeProps) {
  const { settings } = useSettings()
  
  const createGauge = (rate: number, type: 'stopLoss' | 'takeProfit') => {
    // Calculate rotation for needle (-90 to 90 degrees)
    const rotation = (rate / 100) * 180 - 90
    
    // Get color based on rate and type
    const getColor = () => {
      if (type === 'stopLoss') {
        // For SL, 30-40% is ideal (not too high, not too low)
        if (rate >= 25 && rate <= 45) return '#10b981' // green
        if (rate >= 20 && rate <= 50) return '#f59e0b' // amber
        return '#ef4444' // red
      } else {
        // For TP, higher is better
        if (rate >= 60) return '#10b981' // green
        if (rate >= 40) return '#f59e0b' // amber
        return '#ef4444' // red
      }
    }
    
    return (
      <svg viewBox="0 0 200 120" className="w-full">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Colored zones for visual reference */}
        {type === 'stopLoss' ? (
          <>
            {/* Red zone: 0-20% and 50-100% */}
            <path
              d="M 20 100 A 80 80 0 0 1 56 35"
              fill="none"
              stroke="#ef4444"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 144 35 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#ef4444"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Amber zone: 20-25% and 45-50% */}
            <path
              d="M 56 35 A 80 80 0 0 1 70 25"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 130 25 A 80 80 0 0 1 144 35"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Green zone: 25-45% */}
            <path
              d="M 70 25 A 80 80 0 0 1 130 25"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
          </>
        ) : (
          <>
            {/* Red zone: 0-40% */}
            <path
              d="M 20 100 A 80 80 0 0 1 92 20"
              fill="none"
              stroke="#ef4444"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Amber zone: 40-60% */}
            <path
              d="M 92 20 A 80 80 0 0 1 128 30"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Green zone: 60-100% */}
            <path
              d="M 128 30 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
          </>
        )}
        
        {/* Needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke={getColor()}
            strokeWidth="3"
          />
          <circle cx="100" cy="100" r="6" fill={getColor()} />
        </motion.g>
        
        {/* Labels */}
        <text x="20" y="115" className="text-xs fill-current text-muted-foreground">0%</text>
        <text x="92" y="15" className="text-xs fill-current text-muted-foreground">50%</text>
        <text x="165" y="115" className="text-xs fill-current text-muted-foreground">100%</text>
      </svg>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Hit Rate Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Gauges */}
          <div className="grid grid-cols-2 gap-6">
            {/* Stop Loss Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h4 className="font-medium text-sm mb-2 flex items-center justify-center gap-1">
                  <Shield className="h-4 w-4" />
                  Stop Loss Hit Rate
                </h4>
                <div className="relative">
                  {createGauge(hitRates.stopLoss.rate, 'stopLoss')}
                  <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
                    <div className="text-3xl font-bold">
                      {safePercent(hitRates.stopLoss.rate, 1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hitRates.stopLoss.tradesHit}/{hitRates.stopLoss.totalTrades}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* SL Metrics */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Loss</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(hitRates.stopLoss.averageLoss, settings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate (No SL)</span>
                  <span className="font-medium">
                    {safePercent(hitRates.stopLoss.winRateWithoutSL, 1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Distance</span>
                  <span className="font-medium">
                    {safePercent(hitRates.stopLoss.averageMove, 2)}
                  </span>
                </div>
              </div>
            </motion.div>
            
            {/* Take Profit Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h4 className="font-medium text-sm mb-2 flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Take Profit Hit Rate
                </h4>
                <div className="relative">
                  {createGauge(hitRates.takeProfit.rate, 'takeProfit')}
                  <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
                    <div className="text-3xl font-bold">
                      {safePercent(hitRates.takeProfit.rate, 1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hitRates.takeProfit.tradesHit}/{hitRates.takeProfit.totalTrades}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* TP Metrics */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Gain</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(hitRates.takeProfit.averageGain, settings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Missed Profit</span>
                  <span className="font-medium text-amber-600">
                    {formatCurrency(hitRates.takeProfit.missedProfit, settings)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Distance</span>
                  <span className="font-medium">
                    {safePercent(hitRates.takeProfit.averageMove, 2)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Time to Hit */}
          <div className="grid grid-cols-2 gap-4">
            {hitRates.stopLoss.timeToHit !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  Avg Time to SL
                </div>
                <p className="text-lg font-medium">
                  {safeToFixed(hitRates.stopLoss.timeToHit, 1)} hours
                </p>
              </motion.div>
            )}
            
            {hitRates.takeProfit.timeToHit !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  Avg Time to TP
                </div>
                <p className="text-lg font-medium">
                  {safeToFixed(hitRates.takeProfit.timeToHit, 1)} hours
                </p>
              </motion.div>
            )}
          </div>
          
          {/* Insights */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Hit Rate Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {hitRates.stopLoss.rate > 50 && (
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">High SL Hit Rate:</strong> Your stops are being hit {safePercent(hitRates.stopLoss.rate, 0)} of the time. Consider wider stops or better entry timing.
                  </p>
                </div>
              )}
              
              {hitRates.stopLoss.rate < 20 && hitRates.stopLoss.totalTrades > 10 && (
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">Low SL Hit Rate:</strong> Only {safePercent(hitRates.stopLoss.rate, 0)} of stops hit. You might be exiting winners too early.
                  </p>
                </div>
              )}
              
              {hitRates.takeProfit.rate < 40 && hitRates.takeProfit.totalTrades > 10 && (
                <div className="flex gap-2">
                  <Target className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">Low TP Hit Rate:</strong> Only {safePercent(hitRates.takeProfit.rate, 0)} of targets reached. Consider more realistic profit targets.
                  </p>
                </div>
              )}
              
              {hitRates.takeProfit.missedProfit > 100 && (
                <div className="flex gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">Missed Profits:</strong> You&apos;ve left {formatCurrency(hitRates.takeProfit.missedProfit, settings)} on the table. Review your exit strategy.
                  </p>
                </div>
              )}
              
              {hitRates.stopLoss.rate >= 25 && hitRates.stopLoss.rate <= 45 && hitRates.takeProfit.rate >= 50 && (
                <p className="text-green-600">
                  ✅ Your hit rates are well-balanced, indicating good trade management.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}