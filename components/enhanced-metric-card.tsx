'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/calculations'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MetricData {
  value: number
  previousValue?: number
  data?: number[]
}

interface EnhancedMetricCardProps {
  title: string
  value: number | string
  previousValue?: number | string
  format?: 'currency' | 'percent' | 'number'
  data?: number[]
  description?: string
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
  positiveIsGood?: boolean
}

// Simple sparkline component
function Sparkline({ data, color = 'blue' }: { data: number[], color?: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')
  
  const lastValue = data[data.length - 1]
  const isPositive = lastValue > data[0]
  
  return (
    <svg className="w-full h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? '#10b981' : '#ef4444'}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={`${points} 100,100 0,100`}
        fill={isPositive ? '#10b98120' : '#ef444420'}
        stroke="none"
      />
    </svg>
  )
}

export function EnhancedMetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  data,
  description,
  icon,
  onClick,
  className,
  positiveIsGood = true
}: EnhancedMetricCardProps) {
  
  // Calculate change percentage
  const change = useMemo(() => {
    if (!previousValue || typeof value !== 'number' || typeof previousValue !== 'number') {
      return null
    }
    
    if (previousValue === 0) return value > 0 ? 100 : 0
    return ((value - previousValue) / Math.abs(previousValue)) * 100
  }, [value, previousValue])
  
  // Format display value
  const displayValue = useMemo(() => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'percent':
        return `${value.toFixed(1)}%`
      default:
        return value.toLocaleString()
    }
  }, [value, format])
  
  // Format previous value for comparison
  const displayPreviousValue = useMemo(() => {
    if (!previousValue) return null
    if (typeof previousValue === 'string') return previousValue
    
    switch (format) {
      case 'currency':
        return formatCurrency(previousValue)
      case 'percent':
        return `${previousValue.toFixed(1)}%`
      default:
        return previousValue.toLocaleString()
    }
  }, [previousValue, format])
  
  // Determine trend
  const getTrendIcon = () => {
    if (change === null) return null
    
    if (Math.abs(change) < 0.01) {
      return <Minus className="h-4 w-4 text-gray-500" />
    }
    
    const isPositiveChange = change > 0
    const isGoodChange = positiveIsGood ? isPositiveChange : !isPositiveChange
    
    if (isPositiveChange) {
      return (
        <TrendingUp 
          className={cn(
            "h-4 w-4",
            isGoodChange ? "text-green-600" : "text-red-600"
          )}
        />
      )
    } else {
      return (
        <TrendingDown 
          className={cn(
            "h-4 w-4",
            isGoodChange ? "text-green-600" : "text-red-600"
          )}
        />
      )
    }
  }
  
  const trendIcon = getTrendIcon()
  const isGoodChange = change !== null && (positiveIsGood ? change > 0 : change < 0)

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
      data-tour="stats"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Main value with trend */}
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold">{displayValue}</div>
            {trendIcon && change !== null && (
              <div className={cn(
                "flex items-center gap-1 text-sm",
                isGoodChange ? "text-green-600" : "text-red-600"
              )}>
                {trendIcon}
                <span className="font-medium">
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Previous value comparison */}
          {displayPreviousValue && (
            <p className="text-xs text-muted-foreground">
              vs {displayPreviousValue} previous period
            </p>
          )}
          
          {/* Sparkline */}
          {data && data.length > 1 && (
            <div className="pt-2">
              <Sparkline data={data} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}