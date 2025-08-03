'use client'

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import type { Trade } from '@/lib/db-memory'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

interface MAEMFEScatterProps {
  trades: Trade[]
  height?: number
}

export function MAEMFEScatter({ trades, height = 400 }: MAEMFEScatterProps) {
  // Filter trades with excursion data
  const tradesWithExcursions = trades.filter(
    t => t.mae !== null && t.mae !== undefined && 
         t.mfe !== null && t.mfe !== undefined &&
         t.exit !== null && t.exit !== undefined
  )

  // Separate winning and losing trades
  const winningTrades = tradesWithExcursions.filter(t => {
    const pnl = t.type === 'BUY' 
      ? ((t.exit! - t.entry) / t.entry) * 100
      : ((t.entry - t.exit!) / t.entry) * 100
    return pnl > 0
  })

  const losingTrades = tradesWithExcursions.filter(t => {
    const pnl = t.type === 'BUY' 
      ? ((t.exit! - t.entry) / t.entry) * 100
      : ((t.entry - t.exit!) / t.entry) * 100
    return pnl <= 0
  })

  const data = {
    datasets: [
      {
        label: 'Winning Trades',
        data: winningTrades.map(t => ({ x: t.mae || 0, y: t.mfe || 0 })),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Losing Trades',
        data: losingTrades.map(t => ({ x: t.mae || 0, y: t.mfe || 0 })),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  }

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (context) => {
            const point = context.raw as { x: number; y: number }
            return [
              `MAE: ${point.x.toFixed(2)}%`,
              `MFE: ${point.y.toFixed(2)}%`,
              `Edge Ratio: ${(point.y / point.x).toFixed(2)}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Maximum Adverse Excursion (%)',
          font: {
            size: 14
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Maximum Favorable Excursion (%)',
          font: {
            size: 14
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  }

  // Calculate average edge ratio
  const avgEdgeRatio = tradesWithExcursions.length > 0
    ? tradesWithExcursions.reduce((sum, t) => sum + (t.edgeRatio || 0), 0) / tradesWithExcursions.length
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold">MAE vs MFE Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Trade quality visualization
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Avg Edge Ratio</div>
          <div className="text-2xl font-bold">{avgEdgeRatio.toFixed(2)}x</div>
        </div>
      </div>
      <div style={{ height }}>
        <Scatter data={data} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <span className="text-green-600 font-medium">{winningTrades.length}</span>
          <span className="text-muted-foreground"> winning trades</span>
        </div>
        <div className="text-center">
          <span className="text-red-600 font-medium">{losingTrades.length}</span>
          <span className="text-muted-foreground"> losing trades</span>
        </div>
      </div>
    </motion.div>
  )
}