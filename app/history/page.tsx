'use client'

import { SidebarLayout } from '@/components/sidebar-layout'
import { Import, Plus } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CSVImport } from '@/components/csv-import'
import { TradeForm } from '@/components/trade-form'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { useUser } from '@clerk/nextjs'
import { useSettings } from '@/lib/settings'
import { calculatePnLWithCommission, formatCurrency, formatDateTime, checkDailyLossLimit, checkStreaks, getTableDensityClass } from '@/lib/calculations'


interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  entry: number
  exit?: number | null
  quantity: number
  notes?: string | null
  marketType?: string | null
  createdAt: string
  entryTime?: string | null
  exitTime?: string | null
  // Excursion metrics
  mae?: number | null
  mfe?: number | null
  edgeRatio?: number | null
  updrawPercent?: number | null
}

// Check if Clerk is configured
const isClerkConfigured = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

function TradeHistoryContent({ user }: { user: any }) {
  const router = useRouter()
  const { settings } = useSettings()
  const [trades, setTrades] = useState<Trade[]>([])
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([])
  const [showImport, setShowImport] = useState(false)
  const [showAddTrade, setShowAddTrade] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMarket, setFilterMarket] = useState('ALL')
  const [sortBy, setSortBy] = useState('date')
  const [isLoading, setIsLoading] = useState(true)
  const [alert, setAlert] = useState<string | null>(null)

  useEffect(() => {
    fetchTrades()
  }, [])

  useEffect(() => {
    filterAndSortTrades()
  }, [trades, searchTerm, filterMarket, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Check for alerts when trades change
    if (trades.length > 0 && settings.alerts.enableNotifications) {
      // Check daily loss limit
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todaysTrades = trades.filter(t => {
        const tradeDate = new Date(t.createdAt)
        tradeDate.setHours(0, 0, 0, 0)
        return tradeDate.getTime() === today.getTime()
      })
      
      const lossCheck = checkDailyLossLimit(todaysTrades, settings)
      if (lossCheck.exceeded) {
        setAlert(`⚠️ Daily loss limit exceeded: ${formatCurrency(lossCheck.totalLoss, settings)}`)
      }
      
      // Check for streaks
      const streakCheck = checkStreaks(trades, settings)
      if (streakCheck.alert) {
        setAlert(streakCheck.alert)
      }
    }
  }, [trades, settings]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getTrades' })
      })
      const data = await res.json()
      setTrades(data.trades || [])
    } catch (error) {
      console.error('Failed to fetch trades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortTrades = () => {
    let filtered = [...trades]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by market type
    if (filterMarket !== 'ALL') {
      filtered = filtered.filter(trade => trade.marketType === filterMarket)
    }

    // Sort trades
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'symbol':
          return a.symbol.localeCompare(b.symbol)
        case 'pnl':
          const pnlA = calculateMarketPnL(a, a.marketType || null) || 0
          const pnlB = calculateMarketPnL(b, b.marketType || null) || 0
          return pnlB - pnlA
        default:
          return 0
      }
    })

    setFilteredTrades(filtered)
  }

  const handleMenuClick = (url: string) => {
    if (url === '#import') {
      setShowImport(true)
    } else {
      router.push(url)
    }
  }

  const exportToCSV = () => {
    const headers = ['Entry Time', 'Exit Time', 'Symbol', 'Type', 'Entry Price', 'Exit Price', 'Quantity', 'Market', 'Result', 'P&L', 'MAE %', 'MFE %', 'Edge Ratio', 'Notes']
    const rows = filteredTrades.map(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null)
      const result = pnl !== null ? (pnl >= 0 ? 'WIN' : 'LOSS') : ''
      return [
        new Date(trade.createdAt).toLocaleString(),
        trade.exit ? new Date(trade.createdAt).toLocaleString() : '',
        trade.symbol,
        trade.type,
        trade.entry,
        trade.exit || '',
        trade.quantity,
        trade.marketType || '',
        result,
        pnl ? pnl.toFixed(2) : '',
        trade.mae !== null && trade.mae !== undefined ? trade.mae.toFixed(2) : '',
        trade.mfe !== null && trade.mfe !== undefined ? trade.mfe.toFixed(2) : '',
        trade.edgeRatio !== null && trade.edgeRatio !== undefined ? trade.edgeRatio.toFixed(2) : '',
        trade.notes || ''
      ]
    })

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Calculate stats with commission
  const stats = {
    totalTrades: filteredTrades.length,
    totalPnL: filteredTrades.reduce((sum, trade) => {
      const pnl = calculatePnLWithCommission(trade, settings) || 0
      return sum + pnl
    }, 0),
    winningTrades: filteredTrades.filter(trade => {
      const pnl = calculatePnLWithCommission(trade, settings) || 0
      return pnl > 0
    }).length,
    losingTrades: filteredTrades.filter(trade => {
      const pnl = calculatePnLWithCommission(trade, settings) || 0
      return pnl < 0
    }).length,
  }

  const winRate = stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades * 100) : 0

  return (
    <SidebarLayout currentPath="/history">
      <>
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Trade History</h1>
          </div>
        </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Alert */}
                {alert && (
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800">{alert}</span>
                      <button 
                        onClick={() => setAlert(null)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        ✕
                      </button>
                    </div>
                  </Card>
                )}
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Total Trades</h3>
                    <p className="text-2xl font-bold">{stats.totalTrades}</p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Total P&L</h3>
                    <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalPnL, settings)}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Win Rate</h3>
                    <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Win/Loss</h3>
                    <p className="text-2xl font-bold">
                      <span className="text-green-600">{stats.winningTrades}</span>
                      /
                      <span className="text-red-600">{stats.losingTrades}</span>
                    </p>
                  </Card>
                </div>

                {/* Filters and Actions */}
                <Card className="p-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <input
                      type="text"
                      placeholder="Search by symbol or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-2 border rounded-md"
                    />
                    <select
                      value={filterMarket}
                      onChange={(e) => setFilterMarket(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="ALL">All Markets</option>
                      <option value="FUTURES">Futures</option>
                      <option value="OPTIONS">Options</option>
                      <option value="FOREX">Forex</option>
                      <option value="CRYPTO">Crypto</option>
                      <option value="STOCKS">Stocks</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="symbol">Sort by Symbol</option>
                      <option value="pnl">Sort by P&L</option>
                    </select>
                    <Button onClick={() => setShowImport(true)} variant="outline">
                      Import CSV
                    </Button>
                    <Button onClick={exportToCSV} variant="outline">
                      Export CSV
                    </Button>
                    <Button 
                      onClick={() => setShowAddTrade(true)} 
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Trade
                    </Button>
                  </div>
                </Card>

                {/* Add Trade Form */}
                {showAddTrade && (
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Add New Trade</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowAddTrade(false)}
                      >
                        ✕
                      </Button>
                    </div>
                    <TradeForm 
                      onAdd={() => {
                        fetchTrades()
                        setShowAddTrade(false)
                      }} 
                    />
                  </Card>
                )}

                {/* Trade Table */}
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entry Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exit Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Symbol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entry Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exit Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Market
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Result
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            P&L
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            MAE
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            MFE
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Edge
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTrades.map((trade) => {
                          const pnl = calculatePnLWithCommission(trade, settings)
                          const result = pnl !== null ? (pnl >= 0 ? 'WIN' : 'LOSS') : '-'
                          const cellClass = getTableDensityClass(settings.display.tableDensity)
                          return (
                            <tr key={trade.id} className="hover:bg-gray-50">
                              <td className={`whitespace-nowrap text-gray-900 ${cellClass}`}>
                                {trade.entryTime ? formatDateTime(trade.entryTime, settings) : formatDateTime(trade.createdAt, settings)}
                              </td>
                              <td className={`whitespace-nowrap text-gray-900 ${cellClass}`}>
                                {trade.exitTime ? formatDateTime(trade.exitTime, settings) : '-'}
                              </td>
                              <td className={`whitespace-nowrap font-medium text-gray-900 ${cellClass}`}>
                                {trade.symbol}
                              </td>
                              <td className={`whitespace-nowrap ${cellClass}`}>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  trade.type === 'BUY' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {trade.type}
                                </span>
                              </td>
                              <td className={`whitespace-nowrap text-gray-900 ${cellClass}`}>
                                {formatCurrency(trade.entry, settings)}
                              </td>
                              <td className={`whitespace-nowrap text-gray-900 ${cellClass}`}>
                                {trade.exit ? formatCurrency(trade.exit, settings) : '-'}
                              </td>
                              <td className={`whitespace-nowrap text-gray-900 ${cellClass}`}>
                                {trade.quantity}
                              </td>
                              <td className={`whitespace-nowrap text-gray-900 ${cellClass}`}>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {trade.marketType || 'Unknown'}
                                </span>
                              </td>
                              <td className={`whitespace-nowrap ${cellClass}`}>
                                {result !== '-' ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    result === 'WIN' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {result}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className={`whitespace-nowrap ${cellClass}`}>
                                {pnl !== null ? (
                                  <span className={pnl >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {formatCurrency(pnl, settings)}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className={`text-center ${cellClass}`}>
                                {trade.mae !== null && trade.mae !== undefined ? (
                                  <span className="text-red-600 font-medium">
                                    -{trade.mae.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className={`text-center ${cellClass}`}>
                                {trade.mfe !== null && trade.mfe !== undefined ? (
                                  <span className="text-green-600 font-medium">
                                    +{trade.mfe.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className={`text-center ${cellClass}`}>
                                {trade.edgeRatio !== null && trade.edgeRatio !== undefined ? (
                                  <span className={trade.edgeRatio >= 2 ? 'text-green-600 font-medium' : 'text-amber-600'}>
                                    {trade.edgeRatio.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className={`text-gray-500 max-w-xs truncate ${cellClass}`}>
                                {trade.notes || '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filteredTrades.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {trades.length === 0 ? 'No trades found. Import some trades to get started.' : 'No trades match your filters.'}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </main>

        {/* Import Modal */}
        {showImport && (
          <CSVImport
            onImport={(importedTrades) => {
              fetchTrades()
            }}
            onClose={() => setShowImport(false)}
          />
        )}
      </>
    </SidebarLayout>
  )
}

function AuthenticatedHistoryPage() {
  const { user } = useUser()
  return <TradeHistoryContent user={user} />
}

export default function TradeHistoryPage() {
  if (!isClerkConfigured) {
    return <TradeHistoryContent user={null} />
  }
  
  return <AuthenticatedHistoryPage />
}