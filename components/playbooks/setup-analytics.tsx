'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TradingSetupService, type SetupPerformanceMetrics } from '@/lib/services/trading-setup-service'
import { type TradingSetup } from '@/lib/db-memory'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Shield,
  AlertTriangle,
  DollarSign,
  Percent,
  Hash,
  Calendar
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Trade } from '@/lib/db-memory'

interface SetupAnalyticsProps {
  setups: TradingSetup[]
  trades: Trade[]
}

export function SetupAnalytics({ setups, trades }: SetupAnalyticsProps) {
  const { settings } = useSettings()
  
  // Calculate metrics for all setups
  const setupMetrics = setups.map(setup => ({
    setup,
    metrics: TradingSetupService.analyzeSetupPerformance(setup, trades)
  })).filter(({ metrics }) => metrics.totalTrades > 0)

  // Sort by various criteria
  const byWinRate = [...setupMetrics].sort((a, b) => b.metrics.winRate - a.metrics.winRate)
  const byProfitability = [...setupMetrics].sort((a, b) => b.metrics.totalPnL - a.metrics.totalPnL)
  const byFrequency = [...setupMetrics].sort((a, b) => b.metrics.totalTrades - a.metrics.totalTrades)
  const byExpectancy = [...setupMetrics].sort((a, b) => b.metrics.expectancy - a.metrics.expectancy)

  // Prepare data for charts
  const performanceData = setupMetrics.map(({ setup, metrics }) => ({
    name: setup.name,
    winRate: metrics.winRate,
    profitFactor: metrics.profitFactor,
    expectancy: metrics.expectancy,
    trades: metrics.totalTrades,
    pnl: metrics.totalPnL,
    avgWin: metrics.avgWin,
    avgLoss: metrics.avgLoss,
    compliance: metrics.avgComplianceScore
  }))

  const categoryData = setupMetrics.reduce((acc, { setup, metrics }) => {
    const category = setup.category
    if (!acc[category]) {
      acc[category] = {
        category,
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        wins: 0
      }
    }
    acc[category].totalTrades += metrics.totalTrades
    acc[category].totalPnL += metrics.totalPnL
    acc[category].wins += metrics.wins
    return acc
  }, {} as Record<string, any>)

  const categoryChartData = Object.values(categoryData).map((cat: any) => ({
    ...cat,
    winRate: cat.totalTrades > 0 ? (cat.wins / cat.totalTrades) * 100 : 0
  }))

  // Radar chart data for top 5 setups
  const radarData = byProfitability.slice(0, 5).map(({ setup, metrics }) => ({
    setup: setup.name,
    winRate: metrics.winRate,
    profitFactor: Math.min(metrics.profitFactor, 5) * 20, // Scale to 100
    expectancy: Math.min(metrics.expectancy / 100, 1) * 100, // Normalize
    compliance: metrics.avgComplianceScore,
    frequency: Math.min(metrics.totalTrades / 50, 1) * 100 // Normalize
  }))

  // Time-based performance
  const monthlyPerformance = setupMetrics.reduce((acc, { setup, metrics }) => {
    trades
      .filter(t => t.setupId === setup.id && t.exit)
      .forEach(trade => {
        const month = new Date(trade.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' })
        if (!acc[month]) {
          acc[month] = { month, pnl: 0, trades: 0 }
        }
        acc[month].pnl += metrics.totalPnL / metrics.totalTrades // Average PnL per trade
        acc[month].trades += 1
      })
    return acc
  }, {} as Record<string, any>)

  const monthlyData = Object.values(monthlyPerformance).sort((a: any, b: any) => {
    const dateA = new Date(a.month)
    const dateB = new Date(b.month)
    return dateA.getTime() - dateB.getTime()
  })

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {
                entry.name.includes('Rate') || entry.name.includes('compliance') 
                  ? `${entry.value.toFixed(1)}%`
                  : entry.name.includes('pnl') || entry.name.includes('Win') || entry.name.includes('Loss') || entry.name.includes('expectancy')
                  ? formatCurrency(entry.value, settings)
                  : entry.value.toFixed(2)
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Active Setups</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{setupMetrics.length}</div>
              <p className="text-xs text-muted-foreground">
                {setups.length} total defined
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Best Win Rate</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {byWinRate.length > 0 ? (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {byWinRate[0].metrics.winRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {byWinRate[0].setup.name}
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold">-</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Top Expectancy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {byExpectancy.length > 0 ? (
                <>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(byExpectancy[0].metrics.expectancy, settings)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {byExpectancy[0].setup.name}
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold">-</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Most Profitable</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {byProfitability.length > 0 ? (
                <>
                  <div className={cn(
                    "text-2xl font-bold",
                    byProfitability[0].metrics.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(byProfitability[0].metrics.totalPnL, settings)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {byProfitability[0].setup.name}
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold">-</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Comparison</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="radar">Multi-Factor Analysis</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="winRate" fill="#10B981" name="Win Rate %" />
                    <Bar yAxisId="left" dataKey="compliance" fill="#8B5CF6" name="Compliance %" />
                    <Bar yAxisId="right" dataKey="expectancy" fill="#F59E0B" name="Expectancy $" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Win vs Loss Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="avgWin" fill="#10B981" name="Avg Win" />
                      <Bar dataKey="avgLoss" fill="#EF4444" name="Avg Loss" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trade Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceData}
                        dataKey="trades"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: ${entry.trades}`}
                      >
                        {performanceData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="totalTrades" fill="#3B82F6" name="Total Trades" />
                    <Bar yAxisId="right" dataKey="totalPnL" fill="#8B5CF6" name="Total P&L" />
                    <Bar yAxisId="left" dataKey="winRate" fill="#10B981" name="Win Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={categoryChartData.map(cat => ({
                      name: cat.category,
                      size: cat.totalTrades,
                      fill: COLORS[categoryChartData.indexOf(cat) % COLORS.length]
                    }))}
                    dataKey="size"
                    aspectRatio={4/3}
                    stroke="#fff"
                  />
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Setup Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comparing top 5 setups across multiple performance dimensions
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="setup" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Win Rate" dataKey="winRate" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    <Radar name="Profit Factor" dataKey="profitFactor" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                    <Radar name="Expectancy" dataKey="expectancy" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    <Radar name="Compliance" dataKey="compliance" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    <Radar name="Frequency" dataKey="frequency" stroke="#EC4899" fill="#EC4899" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="pnl" stroke="#8B5CF6" name="Avg P&L per Trade" />
                    <Line type="monotone" dataKey="trades" stroke="#3B82F6" name="Trade Count" yAxisId="right" />
                    <YAxis yAxisId="right" orientation="right" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Setup Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Setup Performance Details</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {setupMetrics.map(({ setup, metrics }) => (
            <Card key={setup.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{setup.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{setup.category}</Badge>
                      <Badge variant="secondary">{metrics.totalTrades} trades</Badge>
                    </div>
                  </div>
                  <div className={cn(
                    "text-2xl font-bold",
                    metrics.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(metrics.totalPnL, settings)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className={cn(
                      "font-medium",
                      metrics.winRate >= 50 ? "text-green-600" : "text-red-600"
                    )}>
                      {metrics.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profit Factor</p>
                    <p className={cn(
                      "font-medium",
                      metrics.profitFactor >= 1 ? "text-green-600" : "text-red-600"
                    )}>
                      {metrics.profitFactor.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expectancy</p>
                    <p className={cn(
                      "font-medium",
                      metrics.expectancy >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(metrics.expectancy, settings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Compliance</p>
                    <p className={cn(
                      "font-medium",
                      metrics.avgComplianceScore >= 80 ? "text-green-600" : 
                      metrics.avgComplianceScore >= 60 ? "text-amber-600" : "text-red-600"
                    )}>
                      {metrics.avgComplianceScore.toFixed(0)}%
                    </p>
                  </div>
                </div>
                {metrics.lastUsed && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Last used {formatDistanceToNow(metrics.lastUsed, { addSuffix: true })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}