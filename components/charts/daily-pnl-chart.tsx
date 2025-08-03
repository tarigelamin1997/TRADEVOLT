'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import type { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface DailyPnLChartProps {
  trades: Trade[]
  days?: number
  height?: number
}

export function DailyPnLChart({ trades, days = 30, height = 300 }: DailyPnLChartProps) {
  // Calculate daily P&L for the last N days
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const dailyPnL: Record<string, number> = {}
  
  // Initialize all days with 0
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    dailyPnL[dateStr] = 0
  }

  // Calculate P&L for each day
  trades
    .filter(t => t.exit !== null && t.exit !== undefined)
    .filter(t => new Date(t.createdAt) >= startDate)
    .forEach(trade => {
      const dateStr = new Date(trade.createdAt).toISOString().split('T')[0]
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      if (dateStr in dailyPnL) {
        dailyPnL[dateStr] += pnl
      }
    })

  const sortedDates = Object.keys(dailyPnL).sort()
  const values = sortedDates.map(date => dailyPnL[date])
  
  const data = {
    labels: sortedDates.map(date => {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [{
      label: 'Daily P&L',
      data: values,
      backgroundColor: values.map(v => v >= 0 
        ? 'rgba(16, 185, 129, 0.8)' 
        : 'rgba(239, 68, 68, 0.8)'
      ),
      borderColor: values.map(v => v >= 0 
        ? 'rgb(16, 185, 129)' 
        : 'rgb(239, 68, 68)'
      ),
      borderWidth: 1,
      borderRadius: 4,
    }]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `P&L: ${value >= 0 ? '+' : ''}$${value.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return '$' + value
          }
        }
      }
    }
  }

  const totalPnL = values.reduce((sum, v) => sum + v, 0)
  const profitDays = values.filter(v => v > 0).length
  const lossDays = values.filter(v => v < 0).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold">Daily P&L</h3>
          <p className="text-sm text-muted-foreground">Last {days} days</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-green-600">{profitDays}</span> / <span className="text-red-600">{lossDays}</span> days
          </div>
        </div>
      </div>
      <div style={{ height }}>
        <Bar data={data} options={options} />
      </div>
    </motion.div>
  )
}