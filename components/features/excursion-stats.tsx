'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useExcursionStats } from '@/lib/hooks/use-excursion-data'
import { TrendingDown, TrendingUp, Target, Zap, RefreshCw, AlertCircle } from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  Cell
} from 'recharts'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: string
}

function StatCard({ label, value, icon, color = 'text-gray-600' }: StatCardProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon && <div className={color}>{icon}</div>}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export function ExcursionStats({ userId }: { userId: string }) {
  const { data: stats, isLoading, error, refetch, processHistorical } = useExcursionStats()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcessHistorical = async () => {
    setIsProcessing(true)
    try {
      await processHistorical()
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading && !stats) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-muted-foreground">Failed to load excursion statistics</p>
            <Button onClick={refetch} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  // Prepare scatter plot data
  const scatterData = stats.trades.map(trade => ({
    mae: trade.mae,
    mfe: trade.mfe,
    edgeRatio: trade.edgeRatio,
    pnl: trade.pnl,
    symbol: trade.symbol
  }))

  // Color function for scatter points
  const getPointColor = (pnl: number) => {
    if (pnl > 0) return '#10b981' // green
    if (pnl < 0) return '#ef4444' // red
    return '#6b7280' // gray
  }

  return (
    <div className="space-y-6">
      {/* Process Historical Trades Button */}
      {stats.totalTrades === 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Calculate Excursion Metrics
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Process historical trades to calculate MAE, MFE, and other excursion metrics
                </p>
              </div>
              <Button 
                onClick={handleProcessHistorical}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process All Trades'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Average Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Average Excursion Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard 
              label="Avg MAE" 
              value={`${stats.avgMAE.toFixed(2)}%`}
              icon={<TrendingDown className="h-5 w-5" />}
              color="text-red-600"
            />
            <StatCard 
              label="Avg MFE" 
              value={`${stats.avgMFE.toFixed(2)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              color="text-green-600"
            />
            <StatCard 
              label="Avg Edge Ratio" 
              value={stats.avgEdgeRatio.toFixed(2)}
              icon={<Target className="h-5 w-5" />}
              color="text-blue-600"
            />
            <StatCard 
              label="Avg Efficiency" 
              value={`${stats.avgEfficiency.toFixed(0)}%`}
              icon={<Zap className="h-5 w-5" />}
              color="text-amber-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MAE Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">MAE Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.maeDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* MFE Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">MFE Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.mfeDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Edge Ratio Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>MAE vs MFE Analysis</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Each point represents a trade. Color indicates P&L outcome.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="mae"
                type="number"
                name="MAE %"
                unit="%"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'MAE %', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                dataKey="mfe"
                type="number"
                name="MFE %"
                unit="%"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                label={{ value: 'MFE %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload || !payload[0]) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-background border rounded p-2 shadow-lg">
                      <p className="font-medium text-sm">{data.symbol}</p>
                      <p className="text-xs">MAE: {data.mae.toFixed(2)}%</p>
                      <p className="text-xs">MFE: {data.mfe.toFixed(2)}%</p>
                      <p className="text-xs">Edge: {data.edgeRatio.toFixed(2)}</p>
                      <p className={`text-xs font-medium ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        P&L: ${data.pnl.toFixed(2)}
                      </p>
                    </div>
                  )
                }}
              />
              <Scatter name="Trades" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getPointColor(entry.pnl)} />
                ))}
              </Scatter>
              {/* Reference lines */}
              <ReferenceLine 
                x={0} 
                y={0} 
                stroke="#666" 
                strokeDasharray="3 3" 
              />
              {/* Edge ratio = 1 line */}
              <ReferenceLine 
                stroke="#3b82f6" 
                strokeDasharray="5 5"
                segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }]}
                label={{ value: "Edge = 1", position: "top" }}
              />
              {/* Edge ratio = 2 line */}
              <ReferenceLine 
                stroke="#10b981" 
                strokeDasharray="5 5"
                segment={[{ x: 0, y: 0 }, { x: 5, y: 10 }]}
                label={{ value: "Edge = 2", position: "top" }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Insights */}
      {stats.totalTrades > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {stats.avgMAE > 3 && (
                <div className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <p>
                    Your average MAE of {stats.avgMAE.toFixed(1)}% is relatively high. 
                    Consider tighter stop losses or better entry timing to reduce drawdowns.
                  </p>
                </div>
              )}
              {stats.avgMFE > 5 && stats.avgEfficiency < 60 && (
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <p>
                    You're achieving good MFE ({stats.avgMFE.toFixed(1)}%) but only capturing {stats.avgEfficiency.toFixed(0)}% of it. 
                    Consider adjusting your exit strategy to capture more profits.
                  </p>
                </div>
              )}
              {stats.avgEdgeRatio > 2 && (
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <p>
                    Excellent edge ratio of {stats.avgEdgeRatio.toFixed(1)} shows good trade selection 
                    and favorable risk/reward setups.
                  </p>
                </div>
              )}
              {stats.avgEdgeRatio < 1 && (
                <div className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <p>
                    Edge ratio below 1.0 indicates your maximum drawdowns exceed maximum profits. 
                    Focus on improving entry timing and trade selection.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}