'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeAnalysisService, type FrequencyStats, type PeriodStats } from '@/lib/services/time-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  BarChart3
} from 'lucide-react'
import type { Trade } from '@/lib/db-memory'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TradeFrequencyProps {
  trades: Trade[]
}

export function TradeFrequency({ trades }: TradeFrequencyProps) {
  const { settings } = useSettings()
  const [frequencyStats, setFrequencyStats] = useState<FrequencyStats | null>(null)
  const [periodStats, setPeriodStats] = useState<PeriodStats[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day')
  
  useEffect(() => {
    const freqStats = TimeAnalysisService.getTradeFrequency(trades)
    const periodData = TimeAnalysisService.getPerformanceByPeriod(trades, selectedPeriod)
    setFrequencyStats(freqStats)
    setPeriodStats(periodData)
  }, [trades, selectedPeriod])
  
  if (!frequencyStats) return null
  
  // Determine if overtrading
  const isOvertrading = frequencyStats.avgTradesPerDay > 10 || frequencyStats.maxTradesInDay > 20
  const consistencyLevel = frequencyStats.consistency >= 70 ? 'high' : 
                          frequencyStats.consistency >= 40 ? 'medium' : 'low'
  
  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: periodStats.map(p => {
      if (selectedPeriod === 'day') {
        return new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (selectedPeriod === 'week') {
        return `Week of ${new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      } else {
        return new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    }),
    datasets: [
      {
        label: 'Number of Trades',
        data: periodStats.map(p => p.totalTrades),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Cumulative P&L',
        data: (() => {
          let cumulative = 0
          return periodStats.map(p => {
            cumulative += p.totalPnL
            return cumulative
          })
        })(),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        yAxisID: 'y1'
      }
    ]
  }
  
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          afterLabel: (context) => {
            if (context.datasetIndex === 0) {
              const index = context.dataIndex
              const period = periodStats[index]
              return [
                `Win Rate: ${period.winRate.toFixed(1)}%`,
                `Avg P&L: ${formatCurrency(period.avgPnL, settings)}`
              ]
            }
            return []
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Number of Trades'
        },
        beginAtZero: true
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Cumulative P&L'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trade Frequency Analysis
          </CardTitle>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('day')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                selectedPeriod === 'day'
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              Daily
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                selectedPeriod === 'week'
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                selectedPeriod === 'month'
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              Monthly
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Daily Avg</span>
              </div>
              <div className="text-2xl font-bold">
                {frequencyStats.avgTradesPerDay?.toFixed(1) || '0.0'}
              </div>
              <div className="text-xs text-muted-foreground">trades per day</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "rounded-lg p-4",
                isOvertrading 
                  ? "bg-red-50 dark:bg-red-900/20" 
                  : "bg-green-50 dark:bg-green-900/20"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                {isOvertrading ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span className={cn(
                  "text-xs",
                  isOvertrading ? "text-red-600" : "text-green-600"
                )}>
                  {isOvertrading ? "High Volume" : "Balanced"}
                </span>
              </div>
              <div className={cn(
                "text-2xl font-bold",
                isOvertrading ? "text-red-600" : "text-green-600"
              )}>
                {frequencyStats.maxTradesInDay}
              </div>
              <div className={cn(
                "text-xs",
                isOvertrading ? "text-red-600" : "text-green-600"
              )}>
                max trades/day
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-600">Activity</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {frequencyStats.tradingDays}
              </div>
              <div className="text-xs text-blue-600">
                trading days ({frequencyStats.nonTradingDays} rest days)
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className={cn(
                "rounded-lg p-4",
                consistencyLevel === 'high' ? "bg-green-50 dark:bg-green-900/20" :
                consistencyLevel === 'medium' ? "bg-yellow-50 dark:bg-yellow-900/20" :
                "bg-red-50 dark:bg-red-900/20"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className={cn(
                  "h-4 w-4",
                  consistencyLevel === 'high' ? "text-green-600" :
                  consistencyLevel === 'medium' ? "text-yellow-600" :
                  "text-red-600"
                )} />
                <span className={cn(
                  "text-xs",
                  consistencyLevel === 'high' ? "text-green-600" :
                  consistencyLevel === 'medium' ? "text-yellow-600" :
                  "text-red-600"
                )}>
                  Consistency
                </span>
              </div>
              <div className={cn(
                "text-2xl font-bold",
                consistencyLevel === 'high' ? "text-green-600" :
                consistencyLevel === 'medium' ? "text-yellow-600" :
                "text-red-600"
              )}>
                {frequencyStats.consistency}%
              </div>
              <div className={cn(
                "text-xs",
                consistencyLevel === 'high' ? "text-green-600" :
                consistencyLevel === 'medium' ? "text-yellow-600" :
                "text-red-600"
              )}>
                {consistencyLevel} consistency
              </div>
            </motion.div>
          </div>
          
          {/* Frequency Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="h-[300px]"
          >
            <Line data={chartData} options={options} />
          </motion.div>
          
          {/* Activity Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Trading Frequency</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Day</span>
                  <span className="font-medium">{frequencyStats.avgTradesPerDay?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Week</span>
                  <span className="font-medium">{frequencyStats.avgTradesPerWeek?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Month</span>
                  <span className="font-medium">{frequencyStats.avgTradesPerMonth?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Peak Activity</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Most Active</span>
                  <span className="font-medium">{frequencyStats.mostActiveDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Least Active</span>
                  <span className="font-medium">{frequencyStats.leastActiveDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max in Day</span>
                  <span className="font-medium">{frequencyStats.maxTradesInDay} trades</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Trading Pattern</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Days</span>
                  <span className="font-medium">{frequencyStats.tradingDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rest Days</span>
                  <span className="font-medium">{frequencyStats.nonTradingDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consistency</span>
                  <span className={cn(
                    "font-medium",
                    consistencyLevel === 'high' ? "text-green-600" :
                    consistencyLevel === 'medium' ? "text-yellow-600" :
                    "text-red-600"
                  )}>
                    {consistencyLevel}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Insights and Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3"
          >
            <h4 className="font-medium text-sm">Trading Activity Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {isOvertrading && (
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-red-600">Overtrading Alert:</strong> You&apos;re averaging {frequencyStats.avgTradesPerDay?.toFixed(1) || '0.0'} trades per day with a peak of {frequencyStats.maxTradesInDay}. Consider being more selective with your entries to improve quality over quantity.
                  </p>
                </div>
              )}
              
              {consistencyLevel === 'low' && (
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-yellow-600">Inconsistent Trading:</strong> Your trading frequency varies significantly day to day. Consider establishing a more consistent routine.
                  </p>
                </div>
              )}
              
              {frequencyStats.tradingDays > frequencyStats.nonTradingDays * 5 && (
                <div className="flex gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-blue-600">Rest Days:</strong> You&apos;ve traded {frequencyStats.tradingDays} days vs {frequencyStats.nonTradingDays} rest days. Consider taking more breaks to avoid burnout.
                  </p>
                </div>
              )}
              
              {consistencyLevel === 'high' && !isOvertrading && (
                <div className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-green-600">Excellent Discipline:</strong> Your trading frequency is consistent and balanced. This disciplined approach is key to long-term success.
                  </p>
                </div>
              )}
              
              <p className="pt-2">
                💡 <strong>Optimal Frequency:</strong> Based on your data, aim for 
                {' '}{Math.round(frequencyStats.avgTradesPerDay * 0.8)}-{Math.round(frequencyStats.avgTradesPerDay * 1.2)} trades per day
                to maintain consistency while avoiding overtrading.
              </p>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}