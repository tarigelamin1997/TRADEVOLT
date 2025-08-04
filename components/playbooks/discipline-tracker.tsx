'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { TradingSetupService, type DisciplineMetrics } from '@/lib/services/trading-setup-service'
import { findUserByClerkId, findTradesByUserId, type Trade } from '@/lib/db-memory'
import { formatCurrency } from '@/lib/calculations'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { useSettings } from '@/lib/settings'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Brain,
  Zap,
  Target,
  Activity,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Flame,
  BookOpen,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'

export function DisciplineTracker() {
  const { settings } = useSettings()
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<Trade[]>([])
  const [discipline, setDiscipline] = useState<DisciplineMetrics | null>(null)
  const [consecutiveLosses, setConsecutiveLosses] = useState(0)
  const [consecutiveWins, setConsecutiveWins] = useState(0)
  const [tiltAlert, setTiltAlert] = useState<{
    active: boolean
    reason: string
    severity: 'low' | 'medium' | 'high'
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const user = await findUserByClerkId('demo-user')
      if (!user) return

      const userTrades = await findTradesByUserId(user.id)
      setTrades(userTrades)

      const disciplineMetrics = TradingSetupService.calculateDisciplineScore(user.id, userTrades)
      setDiscipline(disciplineMetrics)

      // Calculate consecutive wins/losses
      const recentClosedTrades = userTrades
        .filter(t => t.exit)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      let consecutiveL = 0
      let consecutiveW = 0
      
      for (const trade of recentClosedTrades) {
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        if (pnl < 0) {
          if (consecutiveW > 0) break
          consecutiveL++
        } else {
          if (consecutiveL > 0) break
          consecutiveW++
        }
      }
      
      setConsecutiveLosses(consecutiveL)
      setConsecutiveWins(consecutiveW)

      // Check for tilt conditions
      checkForTilt(userTrades, disciplineMetrics)
    } catch (error) {
      console.error('Failed to fetch discipline data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkForTilt = (trades: Trade[], metrics: DisciplineMetrics) => {
    const recentTrades = trades
      .filter(t => t.exit)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    // Check various tilt conditions
    const conditions: { severity: 'high' | 'medium' | 'low', reason: string }[] = []

    // 1. Consecutive losses
    let consecutiveLosses = 0
    for (const trade of recentTrades) {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      if (pnl < 0) {
        consecutiveLosses++
      } else {
        break
      }
    }
    
    if (consecutiveLosses >= 3) {
      conditions.push({
        severity: consecutiveLosses >= 5 ? 'high' : 'medium',
        reason: `${consecutiveLosses} consecutive losses detected`
      })
    }

    // 2. Revenge trading (increased position sizes after losses)
    if (recentTrades.length >= 3) {
      const lastThree = recentTrades.slice(0, 3)
      const avgSize = lastThree.reduce((sum, t) => sum + t.quantity, 0) / 3
      const normalSize = trades.slice(10, 20).reduce((sum, t) => sum + t.quantity, 0) / 10
      
      if (avgSize > normalSize * 1.5) {
        conditions.push({
          severity: avgSize > normalSize * 2 ? 'high' : 'medium',
          reason: 'Position sizes increased significantly after losses'
        })
      }
    }

    // 3. Rule compliance drop
    if (metrics.overallScore < 60) {
      conditions.push({
        severity: metrics.overallScore < 40 ? 'high' : 'medium',
        reason: `Rule compliance dropped to ${metrics.overallScore.toFixed(0)}%`
      })
    }

    // 4. Overtrading
    const todaysTrades = trades.filter(t => {
      const today = new Date()
      const tradeDate = new Date(t.createdAt)
      return tradeDate.toDateString() === today.toDateString()
    })
    
    if (todaysTrades.length > 10) {
      conditions.push({
        severity: todaysTrades.length > 15 ? 'high' : 'low',
        reason: `${todaysTrades.length} trades today - possible overtrading`
      })
    }

    // Set the most severe condition as the active alert
    if (conditions.length > 0) {
      const severityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 }
      conditions.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])
      setTiltAlert({
        active: true,
        reason: conditions[0].reason,
        severity: conditions[0].severity
      })
    } else {
      setTiltAlert(null)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  if (!discipline) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No discipline data available</p>
      </Card>
    )
  }

  // Prepare chart data
  const scoreHistory = trades
    .filter(t => t.ruleCompliance?.score !== undefined)
    .slice(-30)
    .map((trade, index) => ({
      trade: index + 1,
      score: trade.ruleCompliance?.score || 0,
      date: new Date(trade.createdAt).toLocaleDateString()
    }))

  const getDisciplineLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', icon: CheckCircle2 }
    if (score >= 75) return { label: 'Good', color: 'text-emerald-600', icon: Shield }
    if (score >= 60) return { label: 'Fair', color: 'text-amber-600', icon: AlertCircle }
    if (score >= 40) return { label: 'Poor', color: 'text-orange-600', icon: AlertTriangle }
    return { label: 'Critical', color: 'text-red-600', icon: Flame }
  }

  const level = getDisciplineLevel(discipline.overallScore)
  const LevelIcon = level.icon

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">Trade #{label}</p>
          <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
          <p className={cn(
            "text-sm font-medium",
            payload[0].value >= 80 ? "text-green-600" : 
            payload[0].value >= 60 ? "text-amber-600" : "text-red-600"
          )}>
            Compliance: {payload[0].value}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Tilt Alert */}
      <AnimatePresence>
        {tiltAlert?.active && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant={tiltAlert.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Tilt Warning</AlertTitle>
              <AlertDescription>{tiltAlert.reason}</AlertDescription>
              <div className="mt-3">
                <Button 
                  size="sm" 
                  variant="default"
                  className={tiltAlert.severity === 'high' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                  onClick={() => setTiltAlert(null)}
                >
                  Acknowledge
                </Button>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Discipline Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Discipline Score</CardTitle>
            <LevelIcon className={cn("h-6 w-6", level.color)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className={cn("text-6xl font-bold", level.color)}>
              {discipline.overallScore.toFixed(0)}
            </div>
            <p className="text-lg font-medium mt-2">{level.label}</p>
            <Progress 
              value={discipline.overallScore} 
              className="mt-4 h-3"
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-muted-foreground">Trades w/ Setup</p>
              <p className="text-lg font-semibold">
                {discipline.tradesWithSetup} / {discipline.totalTrades}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground">Avg Compliance</p>
              <p className={cn(
                "text-lg font-semibold",
                discipline.avgComplianceScore >= 80 ? "text-green-600" : 
                discipline.avgComplianceScore >= 60 ? "text-amber-600" : "text-red-600"
              )}>
                {discipline.avgComplianceScore.toFixed(0)}%
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <div className="flex items-center justify-center gap-1">
                <p className="text-lg font-semibold">
                  {consecutiveLosses > 0 
                    ? consecutiveLosses 
                    : consecutiveWins}
                </p>
                {consecutiveLosses > 0 ? (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="text-sm text-muted-foreground">Rule Violations</p>
              <p className="text-lg font-semibold text-red-600">
                {discipline.violationsByRule.reduce((sum, r) => sum + r.count, 0)}
              </p>
            </div>
          </div>

          {/* Compliance Trend Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Compliance Trend</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trade" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={80} stroke="#10B981" strokeDasharray="5 5" />
                  <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="5 5" />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Most Violated Rules */}
          {discipline.violationsByRule.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Most Violated Rules</h4>
              <div className="space-y-2">
                {discipline.violationsByRule.slice(0, 5).map((violation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{violation.ruleText || 'Unknown Rule'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {violation.setupName}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            violation.importance === 'Critical' && "border-red-600 text-red-600",
                            violation.importance === 'Important' && "border-amber-600 text-amber-600"
                          )}
                        >
                          {violation.importance}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{violation.count}</p>
                      <p className="text-xs text-muted-foreground">violations</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.href = '/playbooks'}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Review Setups
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.href = '/playbooks?tab=analytics'}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trading Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Last 10 Trades</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">
                    {discipline.recentTrades.wins}W / {discipline.recentTrades.losses}L
                  </span>
                  <Badge variant={discipline.recentTrades.winRate >= 50 ? "success" : "destructive"}>
                    {discipline.recentTrades.winRate.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Trade Duration</p>
                <p className="text-2xl font-bold">
                  {discipline.recentTrades.avgHoldTime 
                    ? `${Math.round(discipline.recentTrades.avgHoldTime / 60)}m`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Behavioral Insights */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Behavioral Insights</h5>
              {consecutiveLosses >= 3 && (
                <Alert>
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    You&apos;re on a losing streak. Consider taking a break or reducing position sizes.
                  </AlertDescription>
                </Alert>
              )}
              
              {discipline.avgComplianceScore < 60 && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your rule compliance is low. Focus on following your trading plan.
                  </AlertDescription>
                </Alert>
              )}
              
              {discipline.overallScore >= 90 && (
                <Alert className="border-green-600">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Excellent discipline! Keep maintaining your trading rules.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}