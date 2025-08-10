'use client'

import { useState, useEffect } from 'react'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MarketAnalysisService } from '@/lib/services/market-analysis-service'
import { type Trade } from '@/lib/db-memory'
import { COMPREHENSIVE_SAMPLE_TRADES } from '@/lib/comprehensive-sample-trades'
import { useAuthUser } from '@/lib/auth-wrapper'
import { motion } from 'framer-motion'
import { 
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  PieChart,
  Calendar
} from 'lucide-react'
import { format, subDays, subMonths, subYears, isAfter } from 'date-fns'
import { SymbolPerformanceTable } from '@/components/market/symbol-performance-table'
import { MarketTypeComparison } from '@/components/market/market-type-comparison'
import { DirectionalAnalysis } from '@/components/market/directional-analysis'
import { SetupPerformanceMatrix } from '@/components/market/setup-performance-matrix'

const TIME_PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' }
] as const

export default function MarketAnalysisPage() {
  const { user } = useAuthUser()
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<Trade[]>([])
  const [timePeriod, setTimePeriod] = useState<string>('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Check if demo mode
    const isDemoMode = !user || user.id === 'demo-user'
    
    if (isDemoMode) {
      // Load comprehensive sample trades for demo mode
      filterTradesByPeriod(COMPREHENSIVE_SAMPLE_TRADES as Trade[])
    } else {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timePeriod, user])

  const filterTradesByPeriod = (allTrades: Trade[]) => {
    let filteredTrades = [...allTrades]
    
    // Filter by time period
    if (timePeriod !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (timePeriod) {
        case '7d':
          startDate = subDays(now, 7)
          break
        case '30d':
          startDate = subDays(now, 30)
          break
        case '90d':
          startDate = subDays(now, 90)
          break
        case '1y':
          startDate = subYears(now, 1)
          break
        default:
          startDate = new Date(0)
      }
      
      filteredTrades = filteredTrades.filter(trade => 
        isAfter(new Date(trade.entryTime || trade.createdAt), startDate)
      )
    }

    setTrades(filteredTrades)
    setLoading(false)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getTrades' })
      })
      
      if (!response.ok) throw new Error('Failed to fetch trades')
      
      const data = await response.json()
      filterTradesByPeriod(data.trades || [])
    } catch (error) {
      console.error('Failed to fetch market analysis data:', error)
      setTrades([])
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SidebarLayout currentPath="/market-analysis">
        <div className="flex h-full flex-col">
          <header className="flex h-16 items-center gap-4 border-b px-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Market & Symbol Analysis</h1>
              <p className="text-sm text-muted-foreground">
                Deep dive into your trading performance
              </p>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout currentPath="/market-analysis">
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Market & Symbol Analysis</h1>
            <p className="text-sm text-muted-foreground">
              Deep dive into your trading performance
            </p>
          </div>
          
          <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_PERIODS.map(period => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
          </Select>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="symbols">Symbols</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="direction">Direction</TabsTrigger>
          <TabsTrigger value="setups">Setups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab trades={trades} />
        </TabsContent>

        <TabsContent value="symbols" className="space-y-6">
          <SymbolsTab trades={trades} />
        </TabsContent>

        <TabsContent value="markets" className="space-y-6">
          <MarketsTab trades={trades} />
        </TabsContent>

        <TabsContent value="direction" className="space-y-6">
          <DirectionTab trades={trades} />
        </TabsContent>

        <TabsContent value="setups" className="space-y-6">
          <SetupsTab trades={trades} />
        </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarLayout>
  )
}

// Overview Tab Component
function OverviewTab({ trades }: { trades: Trade[] }) {
  const symbolMetrics = MarketAnalysisService.analyzeSymbolPerformance(trades)
  const marketComparison = MarketAnalysisService.compareMarkets(trades)
  const directionalBias = MarketAnalysisService.getDirectionalBias(trades)
  const setupMetrics = MarketAnalysisService.analyzeBySetup(trades)

  const topSymbols = symbolMetrics.slice(0, 5)
  const topSetups = setupMetrics.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Top Symbol</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{topSymbols[0]?.symbol || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topSymbols[0] ? `$${topSymbols[0].totalPnL.toFixed(2)} P&L` : 'No data'}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Best Market</span>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{marketComparison.bestMarket}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {marketComparison.performance[marketComparison.bestMarket]?.metrics.winRate.toFixed(1)}% win rate
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Direction Bias</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{directionalBias.direction}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {directionalBias.strength.toFixed(0)}% strength
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Top Setup</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold truncate">{topSetups[0]?.setup || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topSetups[0] ? `${topSetups[0].winRate.toFixed(1)}% win rate` : 'No data'}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performing Symbols</h3>
            <div className="space-y-3">
              {topSymbols.map((symbol, index) => (
                <div key={symbol.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{symbol.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {symbol.totalTrades} trades • {symbol.winRate.toFixed(1)}% win rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${symbol.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${symbol.totalPnL.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PF: {symbol.profitFactor.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Market Insights</h3>
            <div className="space-y-3">
              {marketComparison.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                <p className="text-sm">{directionalBias.recommendation}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Symbols Tab Component
function SymbolsTab({ trades }: { trades: Trade[] }) {
  const symbolMetrics = MarketAnalysisService.analyzeSymbolPerformance(trades)
  
  if (symbolMetrics.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-3">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No Symbol Data</h3>
          <p className="text-muted-foreground">
            Start trading to see symbol performance analysis
          </p>
        </div>
      </Card>
    )
  }

  return <SymbolPerformanceTable symbols={symbolMetrics} />
}

// Markets Tab Component
function MarketsTab({ trades }: { trades: Trade[] }) {
  const marketMetrics = MarketAnalysisService.analyzeByMarketType(trades)
  
  if (marketMetrics.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-3">
          <PieChart className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No Market Data</h3>
          <p className="text-muted-foreground">
            Start trading to see market type comparison
          </p>
        </div>
      </Card>
    )
  }

  return <MarketTypeComparison marketMetrics={marketMetrics} />
}

// Direction Tab Component
function DirectionTab({ trades }: { trades: Trade[] }) {
  const directionalMetrics = MarketAnalysisService.analyzeLongVsShort(trades)
  const totalTrades = trades.filter(t => t.exit !== null && t.exit !== undefined).length
  
  if (totalTrades === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-3">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">No Directional Data</h3>
          <p className="text-muted-foreground">
            Complete some trades to see long vs short analysis
          </p>
        </div>
      </Card>
    )
  }

  return <DirectionalAnalysis metrics={directionalMetrics} totalTrades={totalTrades} />
}

// Setups Tab Component
function SetupsTab({ trades }: { trades: Trade[] }) {
  const setupMetrics = MarketAnalysisService.analyzeBySetup(trades)
  
  return <SetupPerformanceMatrix setupMetrics={setupMetrics} />
}