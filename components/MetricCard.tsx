import React from 'react'
import { Card } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info,
  Lock 
} from 'lucide-react'
import { MetricResult, MetricStatus, TrendDirection } from '@/lib/types/metrics'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MetricCardProps {
  title: string
  metric: MetricResult
  tooltip?: string
  requiresPro?: boolean
  isPro?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function MetricCard({ 
  title, 
  metric, 
  tooltip,
  requiresPro = false,
  isPro = false,
  size = 'medium'
}: MetricCardProps) {
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `$${Math.abs(value).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'decimal':
        return value.toFixed(2)
      case 'number':
        return Math.round(value).toLocaleString()
      default:
        return value.toString()
    }
  }

  const getStatusColor = (status: MetricStatus) => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'danger':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend?: TrendDirection) => {
    if (!trend) return null
    
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      case 'stable':
        return <Minus className="h-4 w-4" />
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          card: 'p-3',
          title: 'text-xs',
          value: 'text-lg',
          description: 'text-xs'
        }
      case 'large':
        return {
          card: 'p-6',
          title: 'text-base',
          value: 'text-3xl',
          description: 'text-sm'
        }
      default:
        return {
          card: 'p-4',
          title: 'text-sm',
          value: 'text-2xl',
          description: 'text-xs'
        }
    }
  }

  const sizeClasses = getSizeClasses()
  const needsProAccess = requiresPro && !isPro

  return (
    <Card className={`relative ${sizeClasses.card} ${needsProAccess ? 'opacity-75' : ''}`}>
      {needsProAccess && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <Lock className="h-6 w-6 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Pro Feature</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium text-gray-600 ${sizeClasses.title}`}>
              {title}
            </h3>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className={`font-bold ${sizeClasses.value} ${getStatusColor(metric.status)}`}>
            {metric.value < 0 && metric.format === 'currency' && '-'}
            {formatValue(metric.value, metric.format)}
          </div>
          
          {metric.description && (
            <p className={`text-gray-500 mt-1 ${sizeClasses.description}`}>
              {metric.description}
            </p>
          )}
          
          {metric.benchmark !== undefined && (
            <div className={`flex items-center gap-2 mt-2 ${sizeClasses.description}`}>
              <span className="text-gray-500">Benchmark:</span>
              <span className="font-medium">
                {formatValue(metric.benchmark, metric.format)}
              </span>
            </div>
          )}
        </div>
        
        {metric.trend && (
          <div className={`${getStatusColor(metric.status)}`}>
            {getTrendIcon(metric.trend)}
          </div>
        )}
      </div>
    </Card>
  )
}

interface MetricGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
}

export function MetricGrid({ children, columns = 3 }: MetricGridProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns]

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {children}
    </div>
  )
}

interface InsightCardProps {
  type: 'success' | 'warning' | 'danger' | 'info'
  title: string
  description: string
  actionable?: boolean
}

export function InsightCard({ type, title, description, actionable }: InsightCardProps) {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    danger: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900'
  }

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600'
  }

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[type]}`}>
      <div className="flex gap-3">
        <Info className={`h-5 w-5 ${iconColors[type]} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm opacity-90">{description}</p>
          {actionable && (
            <p className="text-xs mt-2 font-medium">Action Required</p>
          )}
        </div>
      </div>
    </div>
  )
}