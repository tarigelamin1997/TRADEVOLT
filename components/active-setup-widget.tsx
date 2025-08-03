'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TradingSetupService, type TradingSetup, type SetupPerformanceMetrics } from '@/lib/services/trading-setup-service'
import { findUserByClerkId, findTradesByUserId, type Trade } from '@/lib/db-memory'
import { motion } from 'framer-motion'
import { 
  BookOpen,
  TrendingUp,
  Shield,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export function ActiveSetupWidget() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSetups, setActiveSetups] = useState<TradingSetup[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [disciplineScore, setDisciplineScore] = useState(100)
  const [currentSetupMetrics, setCurrentSetupMetrics] = useState<SetupPerformanceMetrics | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const user = await findUserByClerkId('demo-user')
      if (!user) return

      const [userSetups, userTrades] = await Promise.all([
        TradingSetupService.getSetupsByUserId(user.id),
        findTradesByUserId(user.id)
      ])

      const active = userSetups.filter(s => s.isActive)
      setActiveSetups(active)
      setTrades(userTrades)

      // Calculate discipline score
      const discipline = TradingSetupService.calculateDisciplineScore(user.id, userTrades)
      setDisciplineScore(discipline.overallScore)

      // Get metrics for most used setup
      if (active.length > 0 && userTrades.length > 0) {
        const setupMetrics = active
          .map(setup => TradingSetupService.analyzeSetupPerformance(setup, userTrades))
          .sort((a, b) => b.totalTrades - a.totalTrades)[0]
        
        if (setupMetrics && setupMetrics.totalTrades > 0) {
          setCurrentSetupMetrics(setupMetrics)
        }
      }
    } catch (error) {
      console.error('Failed to fetch setup data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </Card>
      </motion.div>
    )
  }

  const getDisciplineColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  const getDisciplineStatus = (score: number) => {
    if (score >= 90) return { icon: CheckCircle, text: 'Excellent', color: 'text-green-600' }
    if (score >= 70) return { icon: AlertCircle, text: 'Good', color: 'text-amber-600' }
    return { icon: AlertCircle, text: 'Needs Work', color: 'text-red-600' }
  }

  const disciplineStatus = getDisciplineStatus(disciplineScore)
  const DisciplineIcon = disciplineStatus.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Trading Playbooks
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/playbooks')}
              className="text-muted-foreground hover:text-foreground"
            >
              Manage
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Active Setups Summary */}
          <div className="space-y-4">
            {activeSetups.length > 0 ? (
              <>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Active Setups</p>
                    <p className="text-2xl font-bold text-purple-600">{activeSetups.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Discipline Score</p>
                    <p className={cn("text-2xl font-bold", getDisciplineColor(disciplineScore))}>
                      {disciplineScore.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Current Setup Performance */}
                {currentSetupMetrics && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Most Used Setup</h4>
                    <div className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{currentSetupMetrics.setupName}</span>
                        <Badge variant="outline" className="text-xs">
                          {currentSetupMetrics.totalTrades} trades
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Win Rate</p>
                          <p className={cn(
                            "font-medium",
                            currentSetupMetrics.winRate >= 50 ? "text-green-600" : "text-red-600"
                          )}>
                            {currentSetupMetrics.winRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expectancy</p>
                          <p className={cn(
                            "font-medium",
                            currentSetupMetrics.expectancy >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            ${currentSetupMetrics.expectancy.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Compliance</p>
                          <p className={cn(
                            "font-medium",
                            getDisciplineColor(currentSetupMetrics.avgComplianceScore)
                          )}>
                            {currentSetupMetrics.avgComplianceScore.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {currentSetupMetrics.lastUsed && (
                        <p className="text-xs text-muted-foreground">
                          Last used {formatDistanceToNow(currentSetupMetrics.lastUsed, { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Discipline Status */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <DisciplineIcon className={cn("h-5 w-5", disciplineStatus.color)} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Rule Discipline</p>
                    <p className={cn("text-sm", disciplineStatus.color)}>
                      {disciplineStatus.text}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-gray-300" />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/playbooks?tab=analytics')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/playbooks?tab=discipline')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Discipline Score
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-medium mb-1">No Active Setups</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Define your trading strategies to track performance
                </p>
                <Button 
                  size="sm"
                  onClick={() => router.push('/playbooks')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create Your First Setup
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}