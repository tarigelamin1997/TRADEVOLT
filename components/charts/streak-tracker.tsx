'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StreakData } from '@/lib/services/behavioral-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed } from '@/lib/utils/safe-format'
import { TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakTrackerProps {
  streaks: StreakData
}

export function StreakTracker({ streaks }: StreakTrackerProps) {
  const { settings } = useSettings()
  
  const getStreakColor = (type: 'win' | 'loss' | 'none') => {
    switch (type) {
      case 'win': return 'text-green-600'
      case 'loss': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
  
  const getStreakBgColor = (type: 'win' | 'loss' | 'none') => {
    switch (type) {
      case 'win': return 'bg-green-50 dark:bg-green-900/20 border-green-200'
      case 'loss': return 'bg-red-50 dark:bg-red-900/20 border-red-200'
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200'
    }
  }

  // Create visual representation of streaks
  const createStreakVisual = (count: number, type: 'win' | 'loss') => {
    const maxDisplay = 20
    const displayCount = Math.min(count, maxDisplay)
    const elements = []
    
    for (let i = 0; i < displayCount; i++) {
      elements.push(
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.02 }}
          className={cn(
            "w-2 h-6 rounded",
            type === 'win' ? 'bg-green-500' : 'bg-red-500'
          )}
        />
      )
    }
    
    if (count > maxDisplay) {
      elements.push(
        <span key="more" className="text-xs text-muted-foreground ml-2">
          +{count - maxDisplay} more
        </span>
      )
    }
    
    return elements
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Win/Loss Streak Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-lg border-2 p-4",
              getStreakBgColor(streaks.current.type)
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm mb-1">Current Streak</h4>
                {streaks.current.type === 'none' ? (
                  <p className="text-2xl font-bold text-gray-600">No Active Streak</p>
                ) : (
                  <>
                    <p className={cn("text-3xl font-bold", getStreakColor(streaks.current.type))}>
                      {streaks.current.count} {streaks.current.type === 'win' ? 'Wins' : 'Losses'}
                    </p>
                    {streaks.current.startDate && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Started: {new Date(streaks.current.startDate).toLocaleDateString()}
                      </p>
                    )}
                    <p className={cn("text-sm font-medium mt-2", getStreakColor(streaks.current.type))}>
                      Streak P&L: {formatCurrency(streaks.currentStreakPnL, settings)}
                    </p>
                  </>
                )}
              </div>
              <div>
                {streaks.current.type === 'win' ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : streaks.current.type === 'loss' ? (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-gray-600" />
                )}
              </div>
            </div>
            
            {/* Visual representation */}
            {streaks.current.type !== 'none' && (
              <div className="flex items-center gap-1 mt-4 flex-wrap">
                {createStreakVisual(streaks.current.count, streaks.current.type)}
              </div>
            )}
          </motion.div>
          
          {/* Streak Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Longest Win Streak</div>
              <div className="text-2xl font-bold text-green-600">
                {streaks.longestWinStreak}
              </div>
              <div className="text-xs text-green-600">consecutive wins</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Longest Loss Streak</div>
              <div className="text-2xl font-bold text-red-600">
                {streaks.longestLossStreak}
              </div>
              <div className="text-xs text-red-600">consecutive losses</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Avg Win Streak</div>
              <div className="text-2xl font-bold">
                {safeToFixed(streaks.averageWinStreak, 1)}
              </div>
              <div className="text-xs text-muted-foreground">trades per streak</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <div className="text-sm text-muted-foreground">Avg Loss Streak</div>
              <div className="text-2xl font-bold">
                {safeToFixed(streaks.averageLossStreak, 1)}
              </div>
              <div className="text-xs text-muted-foreground">trades per streak</div>
            </motion.div>
          </div>
          
          {/* Streak History Visualization */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Historical Streaks</h4>
            
            <div className="space-y-2">
              {/* Longest Win Streak */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-medium">Best Win Streak</span>
                  <span className="text-muted-foreground">{streaks.longestWinStreak} wins</span>
                </div>
                <div className="flex items-center gap-1">
                  {createStreakVisual(streaks.longestWinStreak, 'win')}
                </div>
              </div>
              
              {/* Longest Loss Streak */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 font-medium">Worst Loss Streak</span>
                  <span className="text-muted-foreground">{streaks.longestLossStreak} losses</span>
                </div>
                <div className="flex items-center gap-1">
                  {createStreakVisual(streaks.longestLossStreak, 'loss')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Insights */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Streak Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {streaks.current.type === 'loss' && streaks.current.count >= 3 && (
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-red-600">Active Loss Streak:</strong> You're in a {streaks.current.count}-trade losing streak. Consider taking a break to reset mentally.
                  </p>
                </div>
              )}
              
              {streaks.longestLossStreak > 5 && (
                <div className="flex gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">Long Loss Streaks:</strong> Your worst streak was {streaks.longestLossStreak} losses. Implement stop-loss rules after consecutive losses.
                  </p>
                </div>
              )}
              
              {streaks.averageWinStreak < streaks.averageLossStreak && (
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-amber-600">Streak Imbalance:</strong> Your losing streaks ({safeToFixed(streaks.averageLossStreak, 1)}) are longer than winning streaks ({safeToFixed(streaks.averageWinStreak, 1)}).
                  </p>
                </div>
              )}
              
              {streaks.current.type === 'win' && streaks.current.count >= 5 && (
                <div className="flex gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-green-600">Hot Streak:</strong> Great job on your {streaks.current.count}-trade winning streak! Stay disciplined and stick to your plan.
                  </p>
                </div>
              )}
              
              <p className="pt-2">
                💡 <strong>Tip:</strong> {
                  streaks.current.type === 'loss' && streaks.current.count >= 2
                    ? "After 2 losses, reduce position size by 50% until you break the streak."
                    : streaks.longestLossStreak > streaks.longestWinStreak
                    ? "Focus on improving your win rate to create longer winning streaks."
                    : "Track your emotional state during streaks to maintain objectivity."
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}