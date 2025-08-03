'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExecutionAnalysisService, type ExecutionMetrics } from '@/lib/services/execution-analysis-service'
import { Zap, Activity, Target, DollarSign, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Trade } from '@/lib/db-memory'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safePercent } from '@/lib/utils/safe-format'

interface ExecutionSummaryCardProps {
  trades: Trade[]
}

export function ExecutionSummaryCard({ trades }: ExecutionSummaryCardProps) {
  const { settings } = useSettings()
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null)

  useEffect(() => {
    if (trades.length > 0) {
      const executionMetrics = ExecutionAnalysisService.analyzeExecution(trades)
      setMetrics(executionMetrics)
    }
  }, [trades])

  if (!metrics) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Average'
    return 'Poor'
  }

  // Calculate average slippage
  const avgSlippage = (Math.abs(metrics.slippage.averageEntrySlippage) + Math.abs(metrics.slippage.averageExitSlippage)) / 2

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Execution Quality
            </div>
            <Link href="/execution">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                View Details
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Execution Score */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Execution Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-3xl font-bold", getScoreColor(metrics.executionScore))}>
                    {metrics.executionScore}
                  </span>
                  <span className={cn("text-sm", getScoreColor(metrics.executionScore))}>
                    {getScoreLabel(metrics.executionScore)}
                  </span>
                </div>
              </div>
              
              {/* Mini gauge visualization */}
              <div className="relative w-20 h-10">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path
                    d="M 10 45 A 35 35 0 0 1 90 45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M 10 45 A 35 35 0 0 1 90 45"
                    fill="none"
                    stroke={metrics.executionScore >= 60 ? '#10b981' : metrics.executionScore >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: metrics.executionScore / 100 }}
                    transition={{ duration: 1 }}
                  />
                </svg>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Activity className="h-3 w-3" />
                  Avg Slippage
                </div>
                <p className={cn("text-lg font-bold",
                  avgSlippage < 0.1 ? "text-green-600" :
                  avgSlippage < 0.3 ? "text-amber-600" :
                  "text-red-600"
                )}>
                  {avgSlippage.toFixed(3)}%
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Target className="h-3 w-3" />
                  SL/TP Hit
                </div>
                <p className="text-lg font-bold">
                  {safePercent(metrics.hitRates.stopLoss.rate, 0)}/{safePercent(metrics.hitRates.takeProfit.rate, 0)}
                </p>
              </div>
            </div>
            
            {/* Commission Impact */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                Commission Impact
              </div>
              <span className={cn("font-medium",
                metrics.commission.commissionAsPercentOfPnL < 10 ? "text-green-600" :
                metrics.commission.commissionAsPercentOfPnL < 20 ? "text-amber-600" :
                "text-red-600"
              )}>
                {safePercent(metrics.commission.commissionAsPercentOfPnL, 1)} of P&L
              </span>
            </div>
            
            {/* Quick Insight */}
            {metrics.insights.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  {metrics.insights[0]}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}