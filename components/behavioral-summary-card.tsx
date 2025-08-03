'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BehavioralAnalysisService, type BehavioralMetrics } from '@/lib/services/behavioral-analysis-service'
import { Brain, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Trade } from '@/lib/db-memory'

interface BehavioralSummaryCardProps {
  trades: Trade[]
}

export function BehavioralSummaryCard({ trades }: BehavioralSummaryCardProps) {
  const router = useRouter()
  const [metrics, setMetrics] = useState<BehavioralMetrics | null>(null)

  useEffect(() => {
    if (trades.length > 0) {
      const behavioralMetrics = BehavioralAnalysisService.analyzeBehavior(trades)
      setMetrics(behavioralMetrics)
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
    return 'Needs Work'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
        
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Behavioral Analysis
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/behavioral')}
              className="text-xs"
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Volt Score */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volt Score™</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-3xl font-bold", getScoreColor(metrics.voltScore))}>
                    {metrics.voltScore}
                  </span>
                  <span className={cn("text-sm", getScoreColor(metrics.voltScore))}>
                    {getScoreLabel(metrics.voltScore)}
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
                    stroke={metrics.voltScore >= 60 ? '#10b981' : metrics.voltScore >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: metrics.voltScore / 100 }}
                    transition={{ duration: 1 }}
                  />
                </svg>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Consistency</p>
                <p className={cn("text-lg font-bold", getScoreColor(metrics.dailyConsistency.score))}>
                  {metrics.dailyConsistency.score}%
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Current Streak</p>
                <p className={cn(
                  "text-lg font-bold",
                  metrics.streaks.current.type === 'win' ? 'text-green-600' :
                  metrics.streaks.current.type === 'loss' ? 'text-red-600' :
                  'text-gray-600'
                )}>
                  {metrics.streaks.current.count || 0} {metrics.streaks.current.type}
                </p>
              </div>
            </div>
            
            {/* Alerts */}
            {(metrics.revengeTrading.detected || metrics.streaks.current.type === 'loss' && metrics.streaks.current.count >= 3) && (
              <div className="space-y-2">
                {metrics.revengeTrading.detected && (
                  <div className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 rounded p-2">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Revenge trading detected</span>
                  </div>
                )}
                
                {metrics.streaks.current.type === 'loss' && metrics.streaks.current.count >= 3 && (
                  <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded p-2">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Active losing streak</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Quick Insight */}
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                {metrics.voltScore >= 80 ? (
                  <>
                    <TrendingUp className="inline h-3 w-3 text-green-600 mr-1" />
                    Excellent trading discipline and consistency
                  </>
                ) : metrics.voltScore >= 60 ? (
                  <>
                    <TrendingUp className="inline h-3 w-3 text-amber-600 mr-1" />
                    Good performance with room for improvement
                  </>
                ) : (
                  <>
                    <AlertTriangle className="inline h-3 w-3 text-red-600 mr-1" />
                    Focus on improving consistency and discipline
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}