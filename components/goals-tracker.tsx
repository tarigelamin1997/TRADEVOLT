'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Percent,
  Calendar,
  Trophy,
  Edit,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/calculations'
import { quickToast } from '@/lib/toast-utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Goal {
  id: string
  type: 'monthly_pnl' | 'win_rate' | 'daily_pnl' | 'trades_count'
  target: number
  period: 'daily' | 'weekly' | 'monthly'
  createdAt: Date
}

interface GoalsTrackerProps {
  trades: any[]
}

export function GoalsTracker({ trades }: GoalsTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [newGoal, setNewGoal] = useState({
    type: 'monthly_pnl' as Goal['type'],
    target: 0,
    period: 'monthly' as Goal['period']
  })
  
  // Load goals from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('trading_goals')
    if (stored) {
      setGoals(JSON.parse(stored))
    }
  }, [])
  
  // Calculate current metrics
  const currentMetrics = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    
    // Filter trades by period
    const monthlyTrades = trades.filter(t => new Date(t.entryDate) >= startOfMonth)
    const weeklyTrades = trades.filter(t => new Date(t.entryDate) >= startOfWeek)
    const dailyTrades = trades.filter(t => new Date(t.entryDate) >= startOfDay)
    
    // Calculate P&L
    const monthlyPnL = monthlyTrades
      .filter(t => t.exitDate && t.pnl !== undefined)
      .reduce((sum, t) => sum + t.pnl, 0)
    
    const weeklyPnL = weeklyTrades
      .filter(t => t.exitDate && t.pnl !== undefined)
      .reduce((sum, t) => sum + t.pnl, 0)
    
    const dailyPnL = dailyTrades
      .filter(t => t.exitDate && t.pnl !== undefined)
      .reduce((sum, t) => sum + t.pnl, 0)
    
    // Calculate win rate
    const closedTrades = trades.filter(t => t.exitDate && t.pnl !== undefined)
    const winRate = closedTrades.length > 0
      ? (closedTrades.filter(t => t.pnl >= 0).length / closedTrades.length) * 100
      : 0
    
    return {
      monthly_pnl: monthlyPnL,
      weekly_pnl: weeklyPnL,
      daily_pnl: dailyPnL,
      win_rate: winRate,
      monthly_trades: monthlyTrades.length,
      weekly_trades: weeklyTrades.length,
      daily_trades: dailyTrades.length
    }
  }, [trades])
  
  // Calculate goal progress
  const getGoalProgress = (goal: Goal) => {
    let current = 0
    let max = goal.target
    
    switch (goal.type) {
      case 'monthly_pnl':
        current = goal.period === 'monthly' ? currentMetrics.monthly_pnl :
                  goal.period === 'weekly' ? currentMetrics.weekly_pnl :
                  currentMetrics.daily_pnl
        break
      case 'win_rate':
        current = currentMetrics.win_rate
        max = 100
        break
      case 'daily_pnl':
        current = currentMetrics.daily_pnl
        break
      case 'trades_count':
        current = goal.period === 'monthly' ? currentMetrics.monthly_trades :
                  goal.period === 'weekly' ? currentMetrics.weekly_trades :
                  currentMetrics.daily_trades
        break
    }
    
    const percentage = max !== 0 ? (current / max) * 100 : 0
    return {
      current,
      target: goal.target,
      percentage: Math.min(100, Math.max(0, percentage)),
      achieved: percentage >= 100
    }
  }
  
  // Save goal
  const saveGoal = () => {
    const goal: Goal = {
      id: editingGoal?.id || Date.now().toString(),
      ...newGoal,
      createdAt: editingGoal?.createdAt || new Date()
    }
    
    const updated = editingGoal
      ? goals.map(g => g.id === goal.id ? goal : g)
      : [...goals, goal]
    
    setGoals(updated)
    localStorage.setItem('trading_goals', JSON.stringify(updated))
    
    setShowGoalDialog(false)
    setEditingGoal(null)
    setNewGoal({ type: 'monthly_pnl', target: 0, period: 'monthly' })
    
    quickToast.saved()
  }
  
  // Delete goal
  const deleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id)
    setGoals(updated)
    localStorage.setItem('trading_goals', JSON.stringify(updated))
    quickToast.deleted()
  }
  
  // Get goal icon
  const getGoalIcon = (type: Goal['type']) => {
    switch (type) {
      case 'monthly_pnl':
        return <DollarSign className="h-4 w-4" />
      case 'win_rate':
        return <Percent className="h-4 w-4" />
      case 'daily_pnl':
        return <TrendingUp className="h-4 w-4" />
      case 'trades_count':
        return <Calendar className="h-4 w-4" />
    }
  }
  
  // Get goal label
  const getGoalLabel = (goal: Goal) => {
    const periodLabel = goal.period.charAt(0).toUpperCase() + goal.period.slice(1)
    switch (goal.type) {
      case 'monthly_pnl':
        return `${periodLabel} P&L Target`
      case 'win_rate':
        return 'Win Rate Target'
      case 'daily_pnl':
        return 'Daily P&L Target'
      case 'trades_count':
        return `${periodLabel} Trade Count`
    }
  }
  
  // Achievement celebration
  const celebrateAchievement = (goal: Goal) => {
    quickToast.success(`🎉 Goal Achieved: ${getGoalLabel(goal)}!`)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Trading Goals
            </span>
            <Button
              size="sm"
              onClick={() => {
                setEditingGoal(null)
                setNewGoal({ type: 'monthly_pnl', target: 0, period: 'monthly' })
                setShowGoalDialog(true)
              }}
            >
              Add Goal
            </Button>
          </CardTitle>
          <CardDescription>
            Set targets and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm text-muted-foreground mb-4">
                No goals set yet. Set your first goal to start tracking progress!
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoalDialog(true)}
              >
                Set Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(goal => {
                const progress = getGoalProgress(goal)
                const isAchieved = progress.achieved
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      isAchieved && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getGoalIcon(goal.type)}
                        <span className="font-medium">{getGoalLabel(goal)}</span>
                        {isAchieved && (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Achieved
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGoal(goal)
                          setNewGoal({
                            type: goal.type,
                            target: goal.target,
                            period: goal.period
                          })
                          setShowGoalDialog(true)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {goal.type === 'monthly_pnl' || goal.type === 'daily_pnl'
                            ? formatCurrency(progress.current)
                            : goal.type === 'win_rate'
                            ? `${progress.current.toFixed(1)}%`
                            : progress.current}
                          {' / '}
                          {goal.type === 'monthly_pnl' || goal.type === 'daily_pnl'
                            ? formatCurrency(progress.target)
                            : goal.type === 'win_rate'
                            ? `${progress.target}%`
                            : progress.target}
                        </span>
                      </div>
                      <Progress 
                        value={progress.percentage} 
                        className={cn(
                          "h-2",
                          isAchieved && "[&>div]:bg-green-600"
                        )}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progress.percentage.toFixed(0)}% complete</span>
                        {!isAchieved && progress.percentage > 50 && (
                          <span className="text-blue-600">
                            <Zap className="h-3 w-3 inline mr-1" />
                            Keep going!
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Goal' : 'Set New Goal'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Goal Type</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={newGoal.type}
                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as Goal['type'] })}
              >
                <option value="monthly_pnl">P&L Target</option>
                <option value="win_rate">Win Rate</option>
                <option value="daily_pnl">Daily P&L</option>
                <option value="trades_count">Trade Count</option>
              </select>
            </div>
            
            {newGoal.type !== 'win_rate' && (
              <div>
                <Label>Period</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={newGoal.period}
                  onChange={(e) => setNewGoal({ ...newGoal, period: e.target.value as Goal['period'] })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            
            <div>
              <Label>Target</Label>
              <Input
                type="number"
                step={newGoal.type === 'win_rate' ? '1' : '100'}
                value={newGoal.target}
                onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) || 0 })}
                placeholder={
                  newGoal.type === 'monthly_pnl' || newGoal.type === 'daily_pnl'
                    ? 'e.g., 5000'
                    : newGoal.type === 'win_rate'
                    ? 'e.g., 60'
                    : 'e.g., 20'
                }
              />
              {newGoal.type === 'win_rate' && (
                <p className="text-xs text-muted-foreground mt-1">Enter percentage (0-100)</p>
              )}
            </div>
            
            <div className="flex justify-between">
              {editingGoal && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteGoal(editingGoal.id)
                    setShowGoalDialog(false)
                    setEditingGoal(null)
                  }}
                >
                  Delete
                </Button>
              )}
              
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveGoal}>
                  {editingGoal ? 'Update' : 'Set'} Goal
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}