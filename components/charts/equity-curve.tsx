'use client'

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
  ChartOptions
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import type { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { safeToFixed } from '@/lib/utils/safe-format'

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

interface EquityCurveChartProps {
  trades: Trade[]
  startingBalance?: number
  height?: number
}

export function EquityCurveChart({ trades, startingBalance = 10000, height = 300 }: EquityCurveChartProps) {
  // Sort trades by date and calculate cumulative P&L
  const sortedTrades = [...trades]
    .filter(t => t.exit !== null && t.exit !== undefined)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  let balance = startingBalance
  const dataPoints = [{ date: 'Start', balance: startingBalance, pnl: 0 }]

  sortedTrades.forEach(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    balance += pnl
    dataPoints.push({
      date: new Date(trade.createdAt).toLocaleDateString(),
      balance,
      pnl
    })
  })

  const data = {
    labels: dataPoints.map(d => d.date),
    datasets: [{
      label: 'Account Balance',
      data: dataPoints.map(d => d.balance),
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: 'rgb(99, 102, 241)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            const pnl = dataPoints[context.dataIndex].pnl
            return [
              `Balance: $${value.toLocaleString()}`,
              `Trade P&L: ${pnl >= 0 ? '+' : ''}$${safeToFixed(pnl, 2)}`
            ]
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
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString()
          }
        }
      }
    }
  }

  const totalPnL = balance - startingBalance
  const totalReturn = ((balance - startingBalance) / startingBalance) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold">Equity Curve</h3>
          <p className="text-sm text-muted-foreground">Account growth over time</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            ${balance.toLocaleString()}
          </div>
          <div className={`text-sm ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPnL >= 0 ? '+' : ''}{safeToFixed(totalReturn, 2)}% All Time
          </div>
        </div>
      </div>
      <div style={{ height }}>
        <Line data={data} options={options} />
      </div>
    </motion.div>
  )
}