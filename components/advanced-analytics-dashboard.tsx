'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  Trophy,
  Zap,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricBenchmark {
  name: string
  value: number
  benchmark: number
  unit?: string
  status: 'excellent' | 'good' | 'warning' | 'danger'
  trend?: 'up' | 'down' | 'stable'
  description: string
}

interface AdvancedAnalyticsDashboardProps {
  metrics: {
    winRate: number
    profitFactor: number
    sharpeRatio: number
    maxDrawdown: number
    consistency: number
    kellyPercentage?: number
  }
}

export function AdvancedAnalyticsDashboard({ metrics }: AdvancedAnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  // Calculate overall health score
  const calculateHealthScore = () => {
    let score = 0
    let weights = 0
    
    // Win Rate (weight: 20%)
    if (metrics.winRate >= 55) score += 20
    else if (metrics.winRate >= 45) score += 15
    else if (metrics.winRate >= 40) score += 10
    else score += 5
    
    // Profit Factor (weight: 25%)
    if (metrics.profitFactor >= 2) score += 25
    else if (metrics.profitFactor >= 1.5) score += 20
    else if (metrics.profitFactor >= 1.2) score += 15
    else if (metrics.profitFactor >= 1) score += 10
    else score += 0
    
    // Sharpe Ratio (weight: 25%)
    if (metrics.sharpeRatio >= 2) score += 25
    else if (metrics.sharpeRatio >= 1.5) score += 20
    else if (metrics.sharpeRatio >= 1) score += 15
    else if (metrics.sharpeRatio >= 0.5) score += 10
    else score += 5
    
    // Max Drawdown (weight: 30%)
    if (metrics.maxDrawdown <= 10) score += 30
    else if (metrics.maxDrawdown <= 15) score += 25
    else if (metrics.maxDrawdown <= 20) score += 20
    else if (metrics.maxDrawdown <= 30) score += 10
    else score += 5
    
    return Math.round(score)
  }

  const healthScore = calculateHealthScore()
  
  const getHealthGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 70) return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 60) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 50) return { grade: 'C+', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (score >= 40) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const grade = getHealthGrade(healthScore)

  // Benchmarks for each metric
  const benchmarks: MetricBenchmark[] = [
    {
      name: 'Win Rate',
      value: metrics.winRate,
      benchmark: 55,
      unit: '%',
      status: metrics.winRate >= 55 ? 'excellent' : metrics.winRate >= 45 ? 'good' : metrics.winRate >= 40 ? 'warning' : 'danger',
      trend: 'up',
      description: 'Percentage of winning trades'
    },
    {
      name: 'Profit Factor',
      value: metrics.profitFactor,
      benchmark: 1.5,
      status: metrics.profitFactor >= 2 ? 'excellent' : metrics.profitFactor >= 1.5 ? 'good' : metrics.profitFactor >= 1.2 ? 'warning' : 'danger',
      trend: 'stable',
      description: 'Ratio of gross profit to gross loss'
    },
    {
      name: 'Sharpe Ratio',
      value: metrics.sharpeRatio,
      benchmark: 1.5,
      status: metrics.sharpeRatio >= 2 ? 'excellent' : metrics.sharpeRatio >= 1.5 ? 'good' : metrics.sharpeRatio >= 1 ? 'warning' : 'danger',
      trend: 'up',
      description: 'Risk-adjusted return measure'
    },
    {
      name: 'Max Drawdown',
      value: metrics.maxDrawdown,
      benchmark: 15,
      unit: '%',
      status: metrics.maxDrawdown <= 10 ? 'excellent' : metrics.maxDrawdown <= 15 ? 'good' : metrics.maxDrawdown <= 20 ? 'warning' : 'danger',
      trend: 'down',
      description: 'Largest peak-to-trough decline'
    }
  ]

  // Achievement badges based on performance
  const achievements = [
    {
      id: 'risk-master',
      name: 'Risk Master',
      icon: Shield,
      earned: metrics.sharpeRatio >= 1.5,
      description: 'Sharpe Ratio ≥ 1.5'
    },
    {
      id: 'consistent',
      name: 'Consistent Trader',
      icon: Target,
      earned: metrics.winRate >= 50,
      description: 'Win Rate ≥ 50%'
    },
    {
      id: 'profitable',
      name: 'Profit Machine',
      icon: TrendingUp,
      earned: metrics.profitFactor >= 1.5,
      description: 'Profit Factor ≥ 1.5'
    },
    {
      id: 'protected',
      name: 'Capital Guardian',
      icon: Shield,
      earned: metrics.maxDrawdown <= 15,
      description: 'Max Drawdown ≤ 15%'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50'
      case 'good': return 'text-blue-600 bg-blue-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'danger': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'warning': return 'bg-yellow-500'
      case 'danger': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trading Performance Analysis
            </span>
            <div className={cn('px-4 py-2 rounded-lg', grade.bg)}>
              <span className={cn('text-2xl font-bold', grade.color)}>
                Grade: {grade.grade}
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Your comprehensive trading health score and benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Health Score Gauge */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Health Score</span>
              <span className="text-2xl font-bold">{healthScore}/100</span>
            </div>
            <div className="relative">
              <Progress value={healthScore} className="h-4" />
              <div className="absolute top-0 left-0 w-full h-4 flex">
                <div className="w-[40%] border-r border-white/50" />
                <div className="w-[20%] border-r border-white/50" />
                <div className="w-[20%] border-r border-white/50" />
                <div className="w-[20%]" />
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Metric Benchmarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {benchmarks.map((metric) => (
              <div 
                key={metric.name}
                className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedMetric(metric.name)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    <span className={cn('px-2 py-1 rounded text-xs font-medium', getStatusColor(metric.status))}>
                      {metric.value.toFixed(2)}{metric.unit}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Current</span>
                    <span>Target: {metric.benchmark}{metric.unit}</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={metric.name === 'Max Drawdown' 
                        ? Math.max(0, 100 - (metric.value / metric.benchmark * 100))
                        : Math.min(100, (metric.value / metric.benchmark * 100))
                      } 
                      className={cn('h-2', getProgressColor(metric.status))}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Achievement Badges */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Achievements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {achievements.map((achievement) => {
                const Icon = achievement.icon
                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-all',
                      achievement.earned 
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300' 
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    )}
                  >
                    <Icon className={cn(
                      'h-8 w-8 mx-auto mb-2',
                      achievement.earned ? 'text-yellow-600' : 'text-gray-400'
                    )} />
                    <p className="text-xs font-medium">{achievement.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Personalized Recommendations
            </h3>
            <div className="space-y-2">
              {metrics.winRate < 50 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Improve Win Rate</p>
                    <p className="text-blue-700">Focus on trade quality over quantity. Consider tightening entry criteria.</p>
                  </div>
                </div>
              )}
              {metrics.maxDrawdown > 20 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-900">Reduce Risk Exposure</p>
                    <p className="text-red-700">Your drawdown is high. Consider reducing position sizes or tightening stop losses.</p>
                  </div>
                </div>
              )}
              {metrics.sharpeRatio < 1 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                  <Target className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Optimize Risk-Reward</p>
                    <p className="text-yellow-700">Work on improving risk-adjusted returns. Look for better reward-to-risk setups.</p>
                  </div>
                </div>
              )}
              {metrics.profitFactor >= 2 && metrics.winRate >= 55 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <Trophy className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Excellent Performance!</p>
                    <p className="text-green-700">You're in the top tier. Consider increasing position size gradually while maintaining discipline.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}