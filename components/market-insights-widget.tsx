'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MarketAnalysisService } from '@/lib/services/market-analysis-service'
import type { Trade } from '@/lib/db-memory'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  AlertCircle,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MarketInsightsWidgetProps {
  trades: Trade[]
}

export function MarketInsightsWidget({ trades }: MarketInsightsWidgetProps) {
  const router = useRouter()
  
  // Get insights
  const symbolMetrics = MarketAnalysisService.analyzeSymbolPerformance(trades)
  const marketComparison = MarketAnalysisService.compareMarkets(trades)
  const directionalBias = MarketAnalysisService.getDirectionalBias(trades)
  const setupMetrics = MarketAnalysisService.analyzeBySetup(trades)
  
  const topSymbol = symbolMetrics[0]
  const topSetup = setupMetrics[0]
  const completedTrades = trades.filter(t => t.exit !== null && t.exit !== undefined)
  
  // Generate dynamic insights
  const insights = []
  
  if (topSymbol && topSymbol.totalPnL > 0) {
    insights.push({
      type: 'success' as const,
      icon: TrendingUp,
      title: 'Top Performing Symbol',
      message: `${topSymbol.symbol} generated $${topSymbol.totalPnL.toFixed(2)} profit`,
      action: () => router.push('/market-analysis?tab=symbols')
    })
  }
  
  if (marketComparison.bestMarket && marketComparison.performance[marketComparison.bestMarket]) {
    const bestMarketData = marketComparison.performance[marketComparison.bestMarket]
    insights.push({
      type: 'info' as const,
      icon: BarChart3,
      title: 'Best Market Type',
      message: `${marketComparison.bestMarket} has ${bestMarketData.metrics.winRate.toFixed(1)}% win rate`,
      action: () => router.push('/market-analysis?tab=markets')
    })
  }
  
  if (directionalBias.direction !== 'NEUTRAL' && directionalBias.strength > 60) {
    insights.push({
      type: 'warning' as const,
      icon: directionalBias.direction === 'LONG' ? TrendingUp : TrendingDown,
      title: 'Strong Directional Bias',
      message: directionalBias.recommendation,
      action: () => router.push('/market-analysis?tab=direction')
    })
  }
  
  if (topSetup && topSetup.winRate > 60) {
    insights.push({
      type: 'success' as const,
      icon: Activity,
      title: 'High Win Rate Setup',
      message: `"${topSetup.setup}" wins ${topSetup.winRate.toFixed(1)}% of the time`,
      action: () => router.push('/market-analysis?tab=setups')
    })
  }
  
  // If no specific insights, add general ones
  if (insights.length === 0) {
    if (completedTrades.length < 10) {
      insights.push({
        type: 'info' as const,
        icon: AlertCircle,
        title: 'Limited Data',
        message: 'Complete more trades for detailed market insights',
        action: null
      })
    } else {
      insights.push({
        type: 'info' as const,
        icon: Activity,
        title: 'Market Analysis Available',
        message: 'Review your trading patterns and performance',
        action: () => router.push('/market-analysis')
      })
    }
  }
  
  const getInsightColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'from-green-500/10 to-green-500/5 border-green-200 dark:border-green-800'
      case 'warning':
        return 'from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-800'
      case 'info':
        return 'from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-800'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Market Insights</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/market-analysis')}
              className="text-muted-foreground hover:text-foreground"
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => {
              const Icon = insight.icon
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={cn(
                    "relative p-4 rounded-lg border bg-gradient-to-r",
                    getInsightColor(insight.type),
                    insight.action && "cursor-pointer hover:opacity-80 transition-opacity"
                  )}
                  onClick={insight.action || undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      insight.type === 'success' && "bg-green-500/20 text-green-600",
                      insight.type === 'warning' && "bg-amber-500/20 text-amber-600",
                      insight.type === 'info' && "bg-blue-500/20 text-blue-600"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.message}</p>
                    </div>
                    {insight.action && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Top Symbol</p>
              <p className="text-sm font-semibold mt-1">
                {topSymbol?.symbol || 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Best Market</p>
              <p className="text-sm font-semibold mt-1">
                {marketComparison.bestMarket || 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Direction</p>
              <p className={cn(
                "text-sm font-semibold mt-1",
                directionalBias.direction === 'LONG' && "text-green-600",
                directionalBias.direction === 'SHORT' && "text-red-600",
                directionalBias.direction === 'NEUTRAL' && "text-gray-600"
              )}>
                {directionalBias.direction}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}