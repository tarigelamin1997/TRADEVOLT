'use client'

import { Card } from '@/components/ui/card'
import { Sparkline, TrendIndicator } from '@/components/charts/sparkline'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface VisualMetricCardProps {
  title: string
  value: number | string
  format?: 'currency' | 'percentage' | 'number' | 'decimal'
  trend?: {
    data: number[]
    current: number
    previous: number
  }
  status?: 'good' | 'warning' | 'danger'
  description?: string
  benchmark?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  sparklineColor?: string
}

export function VisualMetricCard({
  title,
  value,
  format = 'number',
  trend,
  status = 'good',
  description,
  benchmark,
  icon,
  sparklineColor
}: VisualMetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'decimal':
        return val.toFixed(2)
      default:
        return val.toLocaleString()
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20'
      case 'warning':
        return 'border-amber-200 bg-amber-50 dark:bg-amber-900/20'
      case 'danger':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20'
    }
  }

  const getSparklineColor = () => {
    if (sparklineColor) return sparklineColor
    switch (status) {
      case 'good':
        return '#10b981'
      case 'warning':
        return '#f59e0b'
      case 'danger':
        return '#ef4444'
    }
  }

  const getIconColor = () => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-amber-600'
      case 'danger':
        return 'text-red-600'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`p-4 border-2 transition-all ${getStatusColor()}`}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {icon && (
                <div className={`${getIconColor()}`}>
                  {icon}
                </div>
              )}
              <h3 className="text-sm font-medium text-muted-foreground">
                {title}
              </h3>
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {trend && <TrendIndicator current={trend.current} previous={trend.previous} />}
          </div>

          {/* Value */}
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold">
              {formatValue(value)}
            </div>
            {trend && trend.data.length > 0 && (
              <div className="ml-4">
                <Sparkline 
                  data={trend.data} 
                  color={getSparklineColor()}
                  width={80}
                  height={24}
                />
              </div>
            )}
          </div>

          {/* Benchmark */}
          {benchmark && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{benchmark.label}</span>
                <span className="font-medium">{formatValue(benchmark.value)}</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    status === 'good' ? 'bg-green-600' : 
                    status === 'warning' ? 'bg-amber-600' : 'bg-red-600'
                  }`}
                  style={{
                    width: `${Math.min(
                      (typeof value === 'number' ? (value / benchmark.value) * 100 : 0),
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}