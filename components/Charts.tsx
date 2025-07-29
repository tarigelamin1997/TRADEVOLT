'use client'

import { Card } from '@/components/ui/card'
import { Trade } from '@/lib/types/metrics'
import { calculateMarketPnL } from '@/lib/market-knowledge'

interface ChartProps {
  trades: Trade[]
}

export function EquityCurveChart({ trades }: ChartProps) {
  // Sort trades by date
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  
  let balance = 10000 // Starting balance
  const dataPoints: { date: string; balance: number }[] = [
    { date: 'Start', balance }
  ]
  
  sortedTrades.forEach(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    balance += pnl
    dataPoints.push({
      date: new Date(trade.createdAt).toLocaleDateString(),
      balance
    })
  })
  
  // Find min and max for scaling
  const maxBalance = Math.max(...dataPoints.map(d => d.balance))
  const minBalance = Math.min(...dataPoints.map(d => d.balance))
  const range = maxBalance - minBalance || 1000
  
  // Create SVG path
  const width = 800
  const height = 300
  const padding = 40
  
  const points = dataPoints.map((point, i) => {
    const x = (i / (dataPoints.length - 1)) * (width - 2 * padding) + padding
    const y = height - padding - ((point.balance - minBalance) / range) * (height - 2 * padding)
    return `${x},${y}`
  }).join(' ')
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
      <div className="w-full overflow-x-auto">
        <svg width={width} height={height} className="min-w-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(i => (
            <line
              key={i}
              x1={padding}
              x2={width - padding}
              y1={padding + i * (height - 2 * padding)}
              y2={padding + i * (height - 2 * padding)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Axis labels */}
          <text x={padding} y={height - 10} fontSize="12" fill="#6b7280">
            {dataPoints[0].date}
          </text>
          <text x={width - padding} y={height - 10} fontSize="12" fill="#6b7280" textAnchor="end">
            {dataPoints[dataPoints.length - 1].date}
          </text>
          <text x={10} y={padding} fontSize="12" fill="#6b7280">
            ${maxBalance.toFixed(0)}
          </text>
          <text x={10} y={height - padding} fontSize="12" fill="#6b7280">
            ${minBalance.toFixed(0)}
          </text>
          
          {/* The curve */}
          <polyline
            points={points}
            fill="none"
            stroke={balance >= 10000 ? "#10b981" : "#ef4444"}
            strokeWidth="2"
          />
          
          {/* Data points */}
          {dataPoints.map((point, i) => {
            const x = (i / (dataPoints.length - 1)) * (width - 2 * padding) + padding
            const y = height - padding - ((point.balance - minBalance) / range) * (height - 2 * padding)
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={point.balance >= 10000 ? "#10b981" : "#ef4444"}
              />
            )
          })}
        </svg>
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <span>Starting: $10,000</span>
        <span>Current: ${balance.toFixed(2)}</span>
        <span className={balance >= 10000 ? "text-green-600" : "text-red-600"}>
          {balance >= 10000 ? '+' : ''}{((balance - 10000) / 10000 * 100).toFixed(1)}%
        </span>
      </div>
    </Card>
  )
}

export function WinRateChart({ trades }: ChartProps) {
  const closedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
  const wins = closedTrades.filter(trade => {
    const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
    return pnl > 0
  }).length
  const losses = closedTrades.length - wins
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0
  
  const radius = 80
  const strokeWidth = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (winRate / 100) * circumference
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Win Rate Analysis</h3>
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="#10b981"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{winRate.toFixed(1)}%</span>
            <span className="text-sm text-gray-600">Win Rate</span>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Winning Trades</span>
          <span className="font-semibold text-green-600">{wins}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Losing Trades</span>
          <span className="font-semibold text-red-600">{losses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Closed</span>
          <span className="font-semibold">{closedTrades.length}</span>
        </div>
      </div>
    </Card>
  )
}

export function ProfitDistributionChart({ trades }: ChartProps) {
  const tradesPnL = trades
    .filter(t => t.exit !== null && t.exit !== undefined)
    .map(trade => calculateMarketPnL(trade, trade.marketType || null) || 0)
    .sort((a, b) => a - b)
  
  if (tradesPnL.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Profit Distribution</h3>
        <p className="text-gray-500 text-center py-8">No closed trades to display</p>
      </Card>
    )
  }
  
  // Create buckets for the histogram
  const bucketCount = Math.min(10, tradesPnL.length)
  const min = Math.min(...tradesPnL)
  const max = Math.max(...tradesPnL)
  const bucketSize = (max - min) / bucketCount || 1
  
  const buckets = Array(bucketCount).fill(0)
  tradesPnL.forEach(pnl => {
    const bucketIndex = Math.min(
      Math.floor((pnl - min) / bucketSize),
      bucketCount - 1
    )
    buckets[bucketIndex]++
  })
  
  const maxCount = Math.max(...buckets)
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Profit Distribution</h3>
      <div className="space-y-2">
        {buckets.map((count, i) => {
          const rangeStart = min + i * bucketSize
          const rangeEnd = min + (i + 1) * bucketSize
          const percentage = (count / maxCount) * 100
          const isProfit = rangeEnd > 0
          
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-24 text-right">
                ${rangeStart.toFixed(0)} - ${rangeEnd.toFixed(0)}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className={`h-full rounded-full ${
                    isProfit ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
                <span className="absolute right-2 top-0 h-full flex items-center text-xs">
                  {count}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Avg Profit</p>
          <p className="font-semibold text-green-600">
            ${tradesPnL.filter(p => p > 0).reduce((a, b) => a + b, 0) / 
              Math.max(tradesPnL.filter(p => p > 0).length, 1) || 0}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Avg Loss</p>
          <p className="font-semibold text-red-600">
            ${Math.abs(tradesPnL.filter(p => p < 0).reduce((a, b) => a + b, 0) / 
              Math.max(tradesPnL.filter(p => p < 0).length, 1)) || 0}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Total P&L</p>
          <p className={`font-semibold ${
            tradesPnL.reduce((a, b) => a + b, 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${tradesPnL.reduce((a, b) => a + b, 0).toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  )
}