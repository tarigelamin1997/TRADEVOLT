'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Target, Flag, Zap } from 'lucide-react'
import type { Trade } from '@prisma/client'
import type { ExcursionData } from '@/lib/types/excursion'
import { RunningPnLChart } from '@/components/charts/running-pnl-chart'
import { ExcursionCalculator } from '@/lib/services/excursion-calculator'

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  color: 'red' | 'green' | 'blue' | 'amber' | 'gray'
  icon: React.ReactNode
}

function MetricCard({ title, value, description, color, icon }: MetricCardProps) {
  const colorClasses = {
    red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    gray: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${colorClasses[color]}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

interface ExcursionMetricsProps {
  trade: Trade
  excursionData?: ExcursionData | null
  onCalculate?: () => void
}

export function ExcursionMetrics({ trade, excursionData, onCalculate }: ExcursionMetricsProps) {
  const calculateEfficiency = () => {
    if (!trade.exit || !excursionData?.mfe || excursionData.mfe === 0) {
      return 'N/A'
    }

    const efficiency = ExcursionCalculator.calculateExitEfficiency(
      trade,
      excursionData.mfe
    )

    return efficiency !== null ? `${efficiency.toFixed(0)}%` : 'N/A'
  }

  const getEfficiencyColor = () => {
    if (!trade.exit || !excursionData?.mfe) return 'gray'
    
    const efficiency = ExcursionCalculator.calculateExitEfficiency(
      trade,
      excursionData.mfe
    )

    if (efficiency === null) return 'gray'
    if (efficiency >= 80) return 'green'
    if (efficiency >= 60) return 'blue'
    if (efficiency >= 40) return 'amber'
    return 'red'
  }

  if (!excursionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade Excursion Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No excursion data available for this trade.
            </p>
            {trade.entryTime && onCalculate && (
              <button
                onClick={onCalculate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Calculate Excursion Metrics
              </button>
            )}
            {!trade.entryTime && (
              <p className="text-sm text-muted-foreground">
                Trade must have entry time to calculate excursions.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Excursion Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            title="MAE"
            value={`-${excursionData.mae.toFixed(2)}%`}
            description="Max Adverse Excursion"
            color="red"
            icon={<TrendingDown className="h-4 w-4" />}
          />
          <MetricCard
            title="MFE"
            value={`+${excursionData.mfe.toFixed(2)}%`}
            description="Max Favorable Excursion"
            color="green"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Edge Ratio"
            value={excursionData.edgeRatio.toFixed(2)}
            description="MFE/MAE Ratio"
            color={excursionData.edgeRatio > 2 ? 'green' : 'amber'}
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            title="Updraw"
            value={excursionData.updrawPercent !== null ? `${excursionData.updrawPercent.toFixed(0)}%` : 'N/A'}
            description="% to Take Profit"
            color="blue"
            icon={<Flag className="h-4 w-4" />}
          />
          <MetricCard
            title="Efficiency"
            value={calculateEfficiency()}
            description="Exit Efficiency"
            color={getEfficiencyColor()}
            icon={<Zap className="h-4 w-4" />}
          />
        </div>
        
        {excursionData.runningPnL && excursionData.runningPnL.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3">Trade Journey</h3>
            <RunningPnLChart data={excursionData.runningPnL} />
          </div>
        )}

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-3">Key Insights</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {excursionData.mae > 5 && (
              <p className="flex items-start gap-2">
                <span className="text-red-600">•</span>
                High MAE of {excursionData.mae.toFixed(1)}% suggests stop loss may have been too wide or entry timing was poor.
              </p>
            )}
            {excursionData.mfe > 10 && trade.exit && (
              <p className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                Strong MFE of {excursionData.mfe.toFixed(1)}% shows good trade selection.
              </p>
            )}
            {excursionData.edgeRatio < 1 && (
              <p className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                Edge ratio below 1.0 indicates risk exceeded reward potential.
              </p>
            )}
            {excursionData.updrawPercent !== null && excursionData.updrawPercent < 50 && (
              <p className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                Price only reached {excursionData.updrawPercent.toFixed(0)}% of take profit target - consider adjusting targets.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}