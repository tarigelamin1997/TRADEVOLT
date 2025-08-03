'use client'

import { Sparklines, SparklinesLine, SparklinesSpots, SparklinesReferenceLine } from 'react-sparklines'
import { motion } from 'framer-motion'

interface SparklineProps {
  data: number[]
  color?: string
  showSpots?: boolean
  showReference?: boolean
  width?: number
  height?: number
  margin?: number
}

export function Sparkline({
  data,
  color = '#10b981',
  showSpots = true,
  showReference = true,
  width = 100,
  height = 30,
  margin = 5
}: SparklineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Sparklines 
        data={data} 
        width={width} 
        height={height} 
        margin={margin}
      >
        <SparklinesLine 
          color={color} 
          style={{ strokeWidth: 2 }}
        />
        {showSpots && (
          <SparklinesSpots 
            size={3}
            style={{ fill: color }}
          />
        )}
        {showReference && (
          <SparklinesReferenceLine 
            type="mean" 
            style={{ stroke: '#94a3b8', strokeOpacity: 0.5, strokeDasharray: '2, 2' }}
          />
        )}
      </Sparklines>
    </motion.div>
  )
}

interface TrendIndicatorProps {
  current: number
  previous: number
  showPercentage?: boolean
}

export function TrendIndicator({ current, previous, showPercentage = true }: TrendIndicatorProps) {
  const change = current - previous
  const percentChange = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0
  const isPositive = change >= 0

  return (
    <motion.div 
      className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span>{isPositive ? '▲' : '▼'}</span>
      {showPercentage ? (
        <span className="font-medium">{Math.abs(percentChange).toFixed(1)}%</span>
      ) : (
        <span className="font-medium">{Math.abs(change).toFixed(2)}</span>
      )}
    </motion.div>
  )
}