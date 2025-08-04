'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'

export default function PnLReportPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState<any[]>([])
  const [filter, setFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month')
  const [selectedMarket, setSelectedMarket] = useState<string>('all')

  useEffect(() => {
    fetchTrades()
  }, [])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getTrades' })
      })
      
      if (!response.ok) throw new Error('Failed to fetch trades')
      
      const data = await response.json()
      setTrades(data.trades || [])
    } catch (error) {
      console.error('Failed to fetch trades:', error)
      setTrades([])
    } finally {
      setLoading(false)
    }
  }

  // Filter trades by market
  const filteredTrades = trades.filter(trade => 
    selectedMarket === 'all' || trade.marketType === selectedMarket
  )

  // Group trades by period
  const groupTradesByPeriod = () => {
    const groups: Record<string, any[]> = {}
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.createdAt)
      let key = ''
      
      switch (filter) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = date.getFullYear().toString()
          break
        default:
          key = 'All Time'
      }
      
      if (!groups[key]) groups[key] = []
      groups[key].push(trade)
    })
    
    return groups
  }

  const groupedTrades = groupTradesByPeriod()

  // Calculate P&L for a group of trades
  const calculateGroupPnL = (trades: any[]) => {
    const stats = {
      totalPnL: 0,
      wins: 0,
      losses: 0,
      totalTrades: trades.length,
      closedTrades: 0,
    }
    
    trades.forEach(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null)
      if (pnl !== null) {
        stats.totalPnL += pnl
        stats.closedTrades++
        if (pnl > 0) stats.wins++
        else if (pnl < 0) stats.losses++
      }
    })
    
    return stats
  }

  // Calculate cumulative P&L
  const calculateCumulativePnL = () => {
    const sorted = [...filteredTrades].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    let cumulative = 0
    return sorted.map(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      cumulative += pnl
      return {
        date: new Date(trade.createdAt).toLocaleDateString(),
        pnl,
        cumulative,
        trade
      }
    })
  }

  const cumulativeData = calculateCumulativePnL()
  const totalPnL = cumulativeData[cumulativeData.length - 1]?.cumulative || 0

  // Get best and worst periods
  const periodStats = Object.entries(groupedTrades).map(([period, trades]) => {
    const stats = calculateGroupPnL(trades)
    return { period, ...stats }
  }).sort((a, b) => b.totalPnL - a.totalPnL)

  const bestPeriod = periodStats[0]
  const worstPeriod = periodStats[periodStats.length - 1]

  // Calculate average monthly P&L
  const monthlyPnLs = Object.entries(groupedTrades)
    .filter(([period]) => period !== 'All Time')
    .map(([_, trades]) => calculateGroupPnL(trades).totalPnL)
  
  const avgMonthlyPnL = monthlyPnLs.length > 0
    ? monthlyPnLs.reduce((sum, pnl) => sum + pnl, 0) / monthlyPnLs.length
    : 0

  return (
    <SidebarLayout currentPath="/pnl">
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">P&L Report</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Markets</option>
              <option value="STOCKS">Stocks</option>
              <option value="OPTIONS">Options</option>
              <option value="FUTURES">Futures</option>
              <option value="FOREX">Forex</option>
              <option value="CRYPTO">Crypto</option>
            </select>
            
            <div className="flex rounded-md border">
              {['day', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setFilter(period as any)}
                  className={`px-3 py-1 text-sm capitalize transition-colors ${
                    filter === period 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <h3 className="text-sm text-gray-600">Total P&L</h3>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalPnL, settings)}
                </p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-sm text-gray-600">Best Month</h3>
                <p className="text-2xl font-bold text-green-600">
                  {bestPeriod ? formatCurrency(bestPeriod.totalPnL, settings) : '$0.00'}
                </p>
                <p className="text-xs text-gray-500">{bestPeriod?.period || '-'}</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-sm text-gray-600">Worst Month</h3>
                <p className="text-2xl font-bold text-red-600">
                  {worstPeriod && worstPeriod.totalPnL < 0 
                    ? formatCurrency(worstPeriod.totalPnL, settings) 
                    : '$0.00'}
                </p>
                <p className="text-xs text-gray-500">{worstPeriod?.period || '-'}</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-sm text-gray-600">Average Monthly P&L</h3>
                <p className={`text-2xl font-bold ${avgMonthlyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(avgMonthlyPnL, settings)}
                </p>
              </Card>
            </div>

            {/* P&L by Period Table */}
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">P&L by {filter === 'all' ? 'Period' : filter}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Period</th>
                        <th className="text-right p-2">Trades</th>
                        <th className="text-right p-2">Closed</th>
                        <th className="text-right p-2">Wins</th>
                        <th className="text-right p-2">Losses</th>
                        <th className="text-right p-2">Win Rate</th>
                        <th className="text-right p-2">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedTrades).map(([period, trades]) => {
                        const stats = calculateGroupPnL(trades)
                        const winRate = stats.closedTrades > 0 
                          ? (stats.wins / stats.closedTrades * 100).toFixed(1)
                          : '0.0'
                        
                        return (
                          <tr key={period} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{period}</td>
                            <td className="text-right p-2">{stats.totalTrades}</td>
                            <td className="text-right p-2">{stats.closedTrades}</td>
                            <td className="text-right p-2 text-green-600">{stats.wins}</td>
                            <td className="text-right p-2 text-red-600">{stats.losses}</td>
                            <td className="text-right p-2">{winRate}%</td>
                            <td className={`text-right p-2 font-medium ${
                              stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(stats.totalPnL, settings)}
                            </td>
                          </tr>
                        )
                      })}
                      
                      {/* Total Row */}
                      <tr className="font-bold bg-gray-50">
                        <td className="p-2">Total</td>
                        <td className="text-right p-2">{filteredTrades.length}</td>
                        <td className="text-right p-2">
                          {periodStats.reduce((sum, s) => sum + s.closedTrades, 0)}
                        </td>
                        <td className="text-right p-2 text-green-600">
                          {periodStats.reduce((sum, s) => sum + s.wins, 0)}
                        </td>
                        <td className="text-right p-2 text-red-600">
                          {periodStats.reduce((sum, s) => sum + s.losses, 0)}
                        </td>
                        <td className="text-right p-2">
                          {periodStats.reduce((sum, s) => sum + s.closedTrades, 0) > 0
                            ? (periodStats.reduce((sum, s) => sum + s.wins, 0) / 
                               periodStats.reduce((sum, s) => sum + s.closedTrades, 0) * 100).toFixed(1)
                            : '0.0'}%
                        </td>
                        <td className={`text-right p-2 ${
                          totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(totalPnL, settings)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Cumulative P&L Chart */}
            <Card>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Cumulative P&L</h2>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Chart showing cumulative P&L over time</p>
                    <p className="text-sm">(Integration with charting library needed)</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </SidebarLayout>
  )
}