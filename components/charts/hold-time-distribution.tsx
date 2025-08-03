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
import { TimeAnalysisService, type HoldTimeStats } from '@/lib/services/time-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { cn } from '@/lib/utils'
import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import type { Trade } from '@/lib/db-memory'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface HoldTimeDistributionProps {
  trades: Trade[]
}

export function HoldTimeDistribution({ trades }: HoldTimeDistributionProps) {
  const { settings } = useSettings()
  const [holdTimeStats, setHoldTimeStats] = useState<HoldTimeStats | null>(null)
  const [selectedRange, setSelectedRange] = useState<string | null>(null)
  
  useEffect(() => {
    const stats = TimeAnalysisService.getHoldTimeStats(trades)
    setHoldTimeStats(stats)
  }, [trades])
  
  if (!holdTimeStats) return null
  
  // Find the most profitable hold time range
  const mostProfitableRange = holdTimeStats.distribution.reduce((best, curr) => 
    curr.avgPnL > best.avgPnL ? curr : best
  , holdTimeStats.distribution[0] || { range: '', avgPnL: 0 })
  
  // Find the most common hold time range
  const mostCommonRange = holdTimeStats.distribution.reduce((most, curr) => 
    curr.count > most.count ? curr : most
  , holdTimeStats.distribution[0] || { range: '', count: 0 })
  
  // Prepare chart data
  const chartData: ChartData<'bar' | 'line'> = {
    labels: holdTimeStats.distribution.map(d => d.range),
    datasets: [
      {
        label: 'Number of Trades',
        data: holdTimeStats.distribution.map(d => d.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        yAxisID: 'y',
        type: 'bar' as const
      },
      {
        label: 'Win Rate %',
        data: holdTimeStats.distribution.map(d => d.winRate),
        type: 'line' as const,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        yAxisID: 'y1',
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }
    ]
  }
  
  const options: ChartOptions<'bar' | 'line'> = {
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
              const range = holdTimeStats.distribution[index]
              return [
                `Avg P&L: ${formatCurrency(range.avgPnL, settings)}`,
                `Total P&L: ${formatCurrency(range.totalPnL, settings)}`
              ]
            }
            return []
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Number of Trades'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Win Rate %'
        },
        grid: {
          drawOnChartArea: false
        },
        min: 0,
        max: 100
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index
        const range = holdTimeStats.distribution[index]
        setSelectedRange(range.range)
      }
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Hold Time Analysis
        </CardTitle>
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
                <span className="text-xs text-muted-foreground">Average</span>
              </div>
              <div className="text-lg font-bold">
                {TimeAnalysisService.formatHoldTime(holdTimeStats.avgHoldTime)}
              </div>
              <div className="text-xs text-muted-foreground">Avg hold time</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600">Winners</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {TimeAnalysisService.formatHoldTime(holdTimeStats.avgWinningHoldTime)}
              </div>
              <div className="text-xs text-green-600">Avg winning hold</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-600">Losers</span>
              </div>
              <div className="text-lg font-bold text-red-600">
                {TimeAnalysisService.formatHoldTime(holdTimeStats.avgLosingHoldTime)}
              </div>
              <div className="text-xs text-red-600">Avg losing hold</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-600">Median</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {TimeAnalysisService.formatHoldTime(holdTimeStats.medianHoldTime)}
              </div>
              <div className="text-xs text-blue-600">Median hold time</div>
            </motion.div>
          </div>
          
          {/* Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="h-[300px]"
          >
            <Bar data={chartData} options={options} />
          </motion.div>
          
          {/* Distribution Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="overflow-x-auto"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Hold Time Range</th>
                  <th className="text-right py-2">Count</th>
                  <th className="text-right py-2">Win Rate</th>
                  <th className="text-right py-2">Avg P&L</th>
                  <th className="text-right py-2">Total P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdTimeStats.distribution.map((range, index) => (
                  <motion.tr
                    key={range.range}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className={cn(
                      "border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
                      selectedRange === range.range && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                    onClick={() => setSelectedRange(range.range)}
                  >
                    <td className="py-2 font-medium">{range.range}</td>
                    <td className="text-right py-2">{range.count}</td>
                    <td className="text-right py-2">
                      <span className={cn(
                        "font-medium",
                        range.winRate >= 60 ? "text-green-600" :
                        range.winRate >= 40 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {range.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className={cn(
                      "text-right py-2",
                      range.avgPnL > 0 ? "text-green-600" : range.avgPnL < 0 ? "text-red-600" : ""
                    )}>
                      {range.avgPnL > 0 ? '+' : ''}{formatCurrency(range.avgPnL, settings)}
                    </td>
                    <td className={cn(
                      "text-right py-2 font-medium",
                      range.totalPnL > 0 ? "text-green-600" : range.totalPnL < 0 ? "text-red-600" : ""
                    )}>
                      {range.totalPnL > 0 ? '+' : ''}{formatCurrency(range.totalPnL, settings)}
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
            transition={{ delay: 0.9 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3"
          >
            <h4 className="font-medium text-sm">Hold Time Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="mb-2">📊 <strong>Trading Style Analysis:</strong></p>
                <ul className="space-y-1 ml-4">
                  {mostCommonRange.range === '< 5 min' && (
                    <li>• You appear to be a scalper, with most trades held under 5 minutes</li>
                  )}
                  {(mostCommonRange.range === '5-30 min' || mostCommonRange.range === '30-60 min') && (
                    <li>• You primarily day trade, holding positions for {mostCommonRange.range}</li>
                  )}
                  {mostCommonRange.range.includes('hour') && (
                    <li>• You favor intraday swing trading with holds of {mostCommonRange.range}</li>
                  )}
                  {mostCommonRange.range === '> 1 day' && (
                    <li>• You have a swing trading style, holding positions overnight</li>
                  )}
                </ul>
              </div>
              
              <div>
                <p className="mb-2">💡 <strong>Performance Recommendations:</strong></p>
                <ul className="space-y-1 ml-4">
                  {mostProfitableRange.range !== mostCommonRange.range && (
                    <li>• Your most profitable hold time is {mostProfitableRange.range} (avg: {formatCurrency(mostProfitableRange.avgPnL, settings)})</li>
                  )}
                  {holdTimeStats.avgWinningHoldTime > holdTimeStats.avgLosingHoldTime * 1.5 && (
                    <li>• You hold winners {((holdTimeStats.avgWinningHoldTime / holdTimeStats.avgLosingHoldTime) - 1).toFixed(0)}x longer than losers - good discipline!</li>
                  )}
                  {holdTimeStats.avgLosingHoldTime > holdTimeStats.avgWinningHoldTime && (
                    <li>• ⚠️ You hold losers longer than winners - consider tighter stop losses</li>
                  )}
                  {holdTimeStats.distribution.some(d => d.winRate < 40) && (
                    <li>• Avoid holding trades {holdTimeStats.distribution.find(d => d.winRate < 40)?.range} (low win rate)</li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}