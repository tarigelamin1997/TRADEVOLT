'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import type { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'

ChartJS.register(ArcElement, Tooltip, Legend)

interface SymbolDistributionProps {
  trades: Trade[]
  metric?: 'count' | 'pnl'
  height?: number
}

export function SymbolDistribution({ trades, metric = 'pnl', height = 300 }: SymbolDistributionProps) {
  // Calculate metrics by symbol
  const symbolData: Record<string, { count: number; pnl: number }> = {}
  
  trades
    .filter(t => t.exit !== null && t.exit !== undefined)
    .forEach(trade => {
      if (!symbolData[trade.symbol]) {
        symbolData[trade.symbol] = { count: 0, pnl: 0 }
      }
      symbolData[trade.symbol].count++
      symbolData[trade.symbol].pnl += calculateMarketPnL(trade, trade.marketType || null) || 0
    })

  // Sort by selected metric and take top 10
  const sortedSymbols = Object.entries(symbolData)
    .sort((a, b) => {
      if (metric === 'count') {
        return b[1].count - a[1].count
      }
      return Math.abs(b[1].pnl) - Math.abs(a[1].pnl)
    })
    .slice(0, 10)

  const labels = sortedSymbols.map(([symbol]) => symbol)
  const values = sortedSymbols.map(([_, data]) => 
    metric === 'count' ? data.count : Math.abs(data.pnl)
  )

  // Generate colors
  const colors = [
    'rgba(99, 102, 241, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(250, 204, 21, 0.8)',
    'rgba(74, 222, 128, 0.8)',
    'rgba(248, 113, 113, 0.8)',
    'rgba(96, 165, 250, 0.8)'
  ]

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: colors.map(c => c.replace('0.8', '1')),
      borderWidth: 2,
    }]
  }

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (context) => {
            const symbol = context.label || ''
            const data = symbolData[symbol]
            if (metric === 'count') {
              return `${symbol}: ${data.count} trades (${((context.parsed / values.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)`
            } else {
              const pnl = data.pnl
              return `${symbol}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`
            }
          }
        }
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Symbol Distribution</h3>
        <p className="text-sm text-muted-foreground">
          Top 10 symbols by {metric === 'count' ? 'trade count' : 'P&L impact'}
        </p>
      </div>
      <div style={{ height }}>
        <Pie data={data} options={options} />
      </div>
    </motion.div>
  )
}