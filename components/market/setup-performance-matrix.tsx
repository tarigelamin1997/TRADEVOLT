'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SetupMetrics } from '@/lib/services/market-analysis-service'
import { motion } from 'framer-motion'
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { safeToFixed } from '@/lib/utils/safe-format'
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'

interface SetupPerformanceMatrixProps {
  setupMetrics: SetupMetrics[]
}

interface TreemapData {
  name: string
  size: number
  value: number
  winRate: number
  trades: number
  [key: string]: any
}

export function SetupPerformanceMatrix({ setupMetrics }: SetupPerformanceMatrixProps) {
  // Prepare data for treemap
  const treemapData: TreemapData[] = setupMetrics.map(setup => ({
    name: setup.setup,
    size: Math.abs(setup.totalPnL),
    value: setup.totalPnL,
    winRate: setup.winRate,
    trades: setup.trades
  }))

  // Prepare data for scatter plot (Win Rate vs Expectancy)
  const scatterData = setupMetrics.map(setup => ({
    x: setup.winRate,
    y: setup.expectancy,
    name: setup.setup,
    trades: setup.trades,
    totalPnL: setup.totalPnL
  }))

  // Prepare time of day performance data
  const timeOfDayData = setupMetrics.length > 0 ? 
    Array.from({ length: 24 }, (_, hour) => {
      const hourData: any = { hour: `${hour}:00` }
      setupMetrics.forEach(setup => {
        const hourlyData = setup.timeOfDayPerformance.find(h => h.hour === hour)
        hourData[setup.setup] = hourlyData?.avgPnL || 0
      })
      return hourData
    }) : []

  const getSetupColor = (pnl: number, opacity = 1) => {
    if (pnl > 0) return `rgba(34, 197, 94, ${opacity})`
    return `rgba(239, 68, 68, ${opacity})`
  }

  const CustomTreemapContent = ({ 
    x, y, width, height, index, name, value, winRate, trades 
  }: any) => {
    const color = getSetupColor(value)
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: '#fff',
            strokeWidth: 2,
            strokeOpacity: 1,
          }}
        />
        {width > 50 && height > 50 && (
          <>
            <text 
              x={x + width / 2} 
              y={y + height / 2 - 10} 
              textAnchor="middle" 
              fill="#fff" 
              fontSize={14}
              fontWeight="bold"
            >
              {name}
            </text>
            <text 
              x={x + width / 2} 
              y={y + height / 2 + 10} 
              textAnchor="middle" 
              fill="#fff" 
              fontSize={12}
            >
              ${safeToFixed(value, 0)}
            </text>
            {height > 70 && (
              <text 
                x={x + width / 2} 
                y={y + height / 2 + 25} 
                textAnchor="middle" 
                fill="#fff" 
                fontSize={10}
                opacity={0.8}
              >
                {safeToFixed(winRate, 1)}% WR
              </text>
            )}
          </>
        )}
      </g>
    )
  }

  return (
    <div className="space-y-6">
      {/* Setup Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {setupMetrics.slice(0, 6).map((setup, index) => (
          <motion.div
            key={setup.setup}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20",
                setup.totalPnL >= 0 ? "bg-green-600" : "bg-red-600"
              )} />
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base truncate pr-2">{setup.setup}</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Win Rate & Trades */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className={cn(
                      "text-lg font-semibold",
                      setup.winRate >= 50 ? "text-green-600" : "text-red-600"
                    )}>
                      {safeToFixed(setup.winRate, 1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="text-lg font-semibold">{setup.trades}</p>
                  </div>
                </div>

                {/* Expectancy & Total P&L */}
                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Expectancy</span>
                    <span className={cn(
                      "text-sm font-medium",
                      setup.expectancy >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${safeToFixed(setup.expectancy, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total P&L</span>
                    <span className={cn(
                      "text-sm font-medium",
                      setup.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${safeToFixed(setup.totalPnL, 2)}
                    </span>
                  </div>
                </div>

                {/* Best/Worst Markets */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Best</span>
                    <Badge variant="outline" className="text-xs">
                      {setup.bestMarket}
                    </Badge>
                  </div>
                  {setup.worstMarket !== setup.bestMarket && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Worst</span>
                      <Badge variant="outline" className="text-xs">
                        {setup.worstMarket}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Confidence Correlation */}
                {setup.confidenceCorrelation !== 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <div className="flex items-center gap-1">
                        {setup.confidenceCorrelation > 0.5 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : setup.confidenceCorrelation < -0.5 ? (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        ) : (
                          <BarChart3 className="h-3 w-3 text-gray-600" />
                        )}
                        <span className="text-xs font-medium">
                          {safeToFixed(setup.confidenceCorrelation * 100, 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Setup P&L Treemap */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Setup Performance Heat Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  content={<CustomTreemapContent />}
                >
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">P&L: ${safeToFixed(data.value, 2)}</p>
                            <p className="text-sm">Win Rate: {safeToFixed(data.winRate, 1)}%</p>
                            <p className="text-sm">Trades: {data.trades}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Box size represents absolute P&L impact • Green = Profitable • Red = Loss
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Win Rate vs Expectancy Scatter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Win Rate vs Expectancy Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Win Rate" 
                    unit="%" 
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Expectancy" 
                    unit="$" 
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Win Rate: {safeToFixed(data.x, 1)}%</p>
                            <p className="text-sm">Expectancy: ${safeToFixed(data.y, 2)}</p>
                            <p className="text-sm">Trades: {data.trades}</p>
                            <p className="text-sm">Total P&L: ${safeToFixed(data.totalPnL, 2)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter name="Setups" data={scatterData} fill="#8884d8">
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSetupColor(entry.totalPnL)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600" />
                <span>Profitable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600" />
                <span>Loss</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Time of Day Performance */}
      {timeOfDayData.length > 0 && setupMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time of Day Performance by Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeOfDayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                      formatter={(value: number) => `$${safeToFixed(value, 2)}`}
                    />
                    <Legend />
                    {setupMetrics.slice(0, 5).map((setup, index) => (
                      <Line
                        key={setup.setup}
                        type="monotone"
                        dataKey={setup.setup}
                        stroke={`hsl(${index * 60}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Average P&L by hour for each trading setup
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No Data Message */}
      {setupMetrics.length === 0 && (
        <Card className="p-8">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Setup Data Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start tagging your trades with setups to see performance analysis here.
              Setups help you identify which strategies work best.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}