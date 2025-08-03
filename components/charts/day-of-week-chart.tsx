'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeAnalysisService, type DayStats } from '@/lib/services/time-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'
import { safePercent } from '@/lib/utils/safe-format'
import type { Trade } from '@/lib/db-memory'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface DayOfWeekChartProps {
  trades: Trade[]
}

export function DayOfWeekChart({ trades }: DayOfWeekChartProps) {
  const { settings } = useSettings()
  const [dayStats, setDayStats] = useState<DayStats[]>([])
  const [selectedMetric, setSelectedMetric] = useState<'pnl' | 'count' | 'winrate'>('pnl')
  
  useEffect(() => {
    const stats = TimeAnalysisService.getDayOfWeekStats(trades)
    setDayStats(stats)
  }, [trades])
  
  // Find best and worst days
  const bestDay = dayStats.reduce((best, curr) => 
    curr.totalPnL > best.totalPnL ? curr : best
  , dayStats[0] || { dayName: '', totalPnL: 0 })
  
  const worstDay = dayStats.reduce((worst, curr) => 
    curr.totalPnL < worst.totalPnL ? curr : worst
  , dayStats[0] || { dayName: '', totalPnL: 0 })
  
  const mostActiveDay = dayStats.reduce((most, curr) => 
    curr.totalTrades > most.totalTrades ? curr : most
  , dayStats[0] || { dayName: '', totalTrades: 0 })
  
  // Prepare chart data based on selected metric
  const getChartData = (): ChartData<'bar'> => {
    const labels = dayStats.map(d => d.dayName)
    
    switch (selectedMetric) {
      case 'pnl':
        return {
          labels,
          datasets: [{
            label: 'Total P&L',
            data: dayStats.map(d => d.totalPnL),
            backgroundColor: dayStats.map(d => 
              d.totalPnL > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
            ),
            borderColor: dayStats.map(d => 
              d.totalPnL > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
            ),
            borderWidth: 2
          }]
        }
        
      case 'count':
        return {
          labels,
          datasets: [
            {
              label: 'Winning Trades',
              data: dayStats.map(d => d.winningTrades),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 2
            },
            {
              label: 'Losing Trades',
              data: dayStats.map(d => d.losingTrades),
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 2
            }
          ]
        }
        
      case 'winrate':
        return {
          labels,
          datasets: [{
            label: 'Win Rate %',
            data: dayStats.map(d => d.winRate),
            backgroundColor: dayStats.map(d => {
              if (d.winRate >= 60) return 'rgba(34, 197, 94, 0.8)'
              if (d.winRate >= 40) return 'rgba(251, 191, 36, 0.8)'
              return 'rgba(239, 68, 68, 0.8)'
            }),
            borderColor: dayStats.map(d => {
              if (d.winRate >= 60) return 'rgb(34, 197, 94)'
              if (d.winRate >= 40) return 'rgb(251, 191, 36)'
              return 'rgb(239, 68, 68)'
            }),
            borderWidth: 2
          }]
        }
    }
  }
  
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: selectedMetric === 'count',
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            
            switch (selectedMetric) {
              case 'pnl':
                return `${label}: ${formatCurrency(value, settings)}`
              case 'winrate':
                return `${label}: ${safePercent(value, 1)}`
              default:
                return `${label}: ${value}`
            }
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
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            switch (selectedMetric) {
              case 'pnl':
                return formatCurrency(Number(value), settings)
              case 'winrate':
                return `${value}%`
              default:
                return value
            }
          }
        }
      }
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Day of Week Performance</CardTitle>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric('pnl')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                selectedMetric === 'pnl'
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              P&L
            </button>
            <button
              onClick={() => setSelectedMetric('count')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                selectedMetric === 'count'
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              Trade Count
            </button>
            <button
              onClick={() => setSelectedMetric('winrate')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                selectedMetric === 'winrate'
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              Win Rate
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
            >
              <div className="text-sm text-green-700 dark:text-green-400">Best Day</div>
              <div className="text-xl font-bold text-green-800 dark:text-green-300">
                {bestDay.dayName}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                +{formatCurrency(bestDay.totalPnL, settings)}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800"
            >
              <div className="text-sm text-red-700 dark:text-red-400">Worst Day</div>
              <div className="text-xl font-bold text-red-800 dark:text-red-300">
                {worstDay.dayName}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                {formatCurrency(worstDay.totalPnL, settings)}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
            >
              <div className="text-sm text-blue-700 dark:text-blue-400">Most Active</div>
              <div className="text-xl font-bold text-blue-800 dark:text-blue-300">
                {mostActiveDay.dayName}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {mostActiveDay.totalTrades} trades
              </div>
            </motion.div>
          </div>
          
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="h-[300px]"
          >
            <Bar data={getChartData()} options={options} />
          </motion.div>
          
          {/* Day Details Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="overflow-x-auto"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Day</th>
                  <th className="text-right py-2">Trades</th>
                  <th className="text-right py-2">Wins</th>
                  <th className="text-right py-2">Losses</th>
                  <th className="text-right py-2">Win Rate</th>
                  <th className="text-right py-2">Total P&L</th>
                  <th className="text-right py-2">Avg P&L</th>
                </tr>
              </thead>
              <tbody>
                {dayStats.map((day, index) => (
                  <motion.tr
                    key={day.dayName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-2 font-medium">{day.dayName}</td>
                    <td className="text-right py-2">{day.totalTrades}</td>
                    <td className="text-right py-2 text-green-600">{day.winningTrades}</td>
                    <td className="text-right py-2 text-red-600">{day.losingTrades}</td>
                    <td className="text-right py-2">
                      <span className={cn(
                        "font-medium",
                        day.winRate >= 60 ? "text-green-600" :
                        day.winRate >= 40 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {safePercent(day.winRate, 1)}
                      </span>
                    </td>
                    <td className={cn(
                      "text-right py-2 font-medium",
                      day.totalPnL > 0 ? "text-green-600" : day.totalPnL < 0 ? "text-red-600" : ""
                    )}>
                      {day.totalPnL > 0 ? '+' : ''}{formatCurrency(day.totalPnL, settings)}
                    </td>
                    <td className={cn(
                      "text-right py-2",
                      day.avgPnL > 0 ? "text-green-600" : day.avgPnL < 0 ? "text-red-600" : ""
                    )}>
                      {day.avgPnL > 0 ? '+' : ''}{formatCurrency(day.avgPnL, settings)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
          
          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2"
          >
            <h4 className="font-medium text-sm">Trading Insights</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your best trading day is {bestDay.dayName} with an average P&L of {formatCurrency(bestDay.avgPnL, settings)}</li>
              <li>• You tend to trade most frequently on {mostActiveDay.dayName} ({mostActiveDay.totalTrades} trades)</li>
              {worstDay.totalPnL < 0 && (
                <li>• Consider reducing position sizes on {worstDay.dayName} (current avg loss: {formatCurrency(worstDay.avgPnL, settings)})</li>
              )}
              {dayStats.filter(d => d.winRate >= 60).length > 0 && (
                <li>• You have a win rate above 60% on {dayStats.filter(d => d.winRate >= 60).map(d => d.dayName).join(', ')}</li>
              )}
            </ul>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}