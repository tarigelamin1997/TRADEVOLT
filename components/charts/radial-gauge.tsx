'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { safeToFixed } from '@/lib/utils/safe-format'

ChartJS.register(ArcElement, Tooltip, Legend)

interface RadialGaugeProps {
  value: number
  max?: number
  label: string
  unit?: string
  color?: string
  backgroundColor?: string
  size?: number
  threshold?: {
    good: number
    warning: number
  }
}

export function RadialGauge({
  value,
  max = 100,
  label,
  unit = '%',
  color,
  backgroundColor = '#e5e7eb',
  size = 200,
  threshold
}: RadialGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  // Determine color based on thresholds
  const getColor = () => {
    if (color) return color
    if (!threshold) return '#10b981' // default green
    
    if (value >= threshold.good) return '#10b981' // green
    if (value >= threshold.warning) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  const data: ChartData<'doughnut'> = {
    datasets: [{
      data: [percentage, 100 - percentage],
      backgroundColor: [getColor(), backgroundColor],
      borderWidth: 0,
    }]
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  }

  return (
    <motion.div 
      className="relative"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ width: size, height: size }}
    >
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div 
          className="text-3xl font-bold"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {safeToFixed(value, 1)}{unit}
        </motion.div>
        <motion.div 
          className="text-sm text-muted-foreground"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {label}
        </motion.div>
      </div>
    </motion.div>
  )
}