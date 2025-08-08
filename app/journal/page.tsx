'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarLayout, SidebarTrigger } from '@/components/sidebar-layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CSVImport } from '@/components/csv-import'
import { TradeFormEnhanced } from '@/components/trade-form-enhanced'
import { RichTextEditor } from '@/components/rich-text-editor'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { useUser } from '@clerk/nextjs'
import { useSettings } from '@/lib/settings'
import { calculatePnLWithCommission, formatCurrency, formatDateTime, checkDailyLossLimit, checkStreaks, getTableDensityClass } from '@/lib/calculations'
import { TimeAnalysisService } from '@/lib/services/time-analysis-service'
import { safeToFixed } from '@/lib/utils/safe-format'
import type { Trade } from '@/lib/db-memory'
import { 
  BookOpen,
  Plus,
  Import,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  Edit,
  Save,
  X,
  Star,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Eye,
  FileDown,
  BarChart3,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"

// Check if Clerk is configured
const isClerkConfigured = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

interface JournalEntry {
  tradeId: string
  trade: Trade
  notes: string
  rating: number
}

function TradeRow({ trade, onClick, settings }: { trade: Trade, onClick: () => void, settings: any }) {
  const pnl = calculateMarketPnL(trade, trade.marketType || 'STOCKS')
  const pnlWithCommission = calculatePnLWithCommission(trade, settings) || 0
  
  return (
    <tr 
      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="p-3 font-medium">{trade.symbol}</td>
      <td className="p-3">
        <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
          {trade.type}
        </Badge>
      </td>
      <td className="p-3">{formatDateTime(trade.entryTime || trade.createdAt)}</td>
      <td className="p-3 text-right">{safeToFixed(trade.entry)}</td>
      <td className="p-3 text-right">{trade.exit ? safeToFixed(trade.exit) : '-'}</td>
      <td className="p-3 text-right">{trade.quantity}</td>
      <td className={`p-3 text-right font-bold ${pnlWithCommission >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(pnlWithCommission, settings)}
      </td>
      <td className="p-3">
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </td>
    </tr>
  )
}

export default function UnifiedJournalPage() {
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()
  const user = isClerkConfigured && isLoaded && clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || 'user@example.com'
  } : {
    id: 'demo-user',
    email: 'demo@example.com'
  }
  
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
  
  // Journal specific state
  const [journalEntries, setJournalEntries] = useState<Record<string, JournalEntry>>({})
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState('overview')
  
  // Calculate stats for overview
  const stats = useMemo(() => {
    if (trades.length === 0) return {
      todayPnL: 0,
      weekPnL: 0,
      monthPnL: 0,
      winRate: 0,
      totalTrades: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0
    }
    
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const todayTrades = trades.filter(t => new Date(t.createdAt) >= todayStart)
    const weekTrades = trades.filter(t => new Date(t.createdAt) >= weekStart)
    const monthTrades = trades.filter(t => new Date(t.createdAt) >= monthStart)
    
    const calculateTotalPnL = (trades: Trade[]) => 
      trades.reduce((sum, t) => sum + (calculatePnLWithCommission(t, settings) || 0), 0)
    
    const wins = trades.filter(t => (calculateMarketPnL(t, t.marketType || 'STOCKS') || 0) > 0)
    const losses = trades.filter(t => (calculateMarketPnL(t, t.marketType || 'STOCKS') || 0) < 0)
    const totalWins = wins.reduce((sum, t) => sum + (calculateMarketPnL(t, t.marketType || 'STOCKS') || 0), 0)
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (calculateMarketPnL(t, t.marketType || 'STOCKS') || 0), 0))
    
    return {
      todayPnL: calculateTotalPnL(todayTrades),
      weekPnL: calculateTotalPnL(weekTrades),
      monthPnL: calculateTotalPnL(monthTrades),
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      totalTrades: trades.length,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      avgWin: wins.length > 0 ? totalWins / wins.length : 0,
      avgLoss: losses.length > 0 ? totalLosses / losses.length : 0
    }
  }, [trades, settings])

  useEffect(() => {
    fetchTrades()
    loadJournalEntries()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterAndSortTrades()
  }, [trades, searchTerm, filterMarket, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps
  
  const fetchTrades = async () => {
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getTrades', userId: user.id })
      })
      const data = await response.json()
      if (data.trades) {
        setTrades(data.trades)
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const loadJournalEntries = () => {
    const saved = localStorage.getItem('journalEntries')
    if (saved) {
      setJournalEntries(JSON.parse(saved))
    }
  }
  
  const saveJournalEntry = (tradeId: string, notes: string, rating: number) => {
    const trade = trades.find(t => t.id === tradeId)
    if (!trade) return
    
    const newEntry = { tradeId, trade, notes, rating }
    const updated = { ...journalEntries, [tradeId]: newEntry }
    setJournalEntries(updated)
    localStorage.setItem('journalEntries', JSON.stringify(updated))
    setEditingId(null)
  }
  
  const filterAndSortTrades = () => {
    let filtered = [...trades]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Market filter
    if (filterMarket !== 'ALL') {
      filtered = filtered.filter(trade => trade.marketType === filterMarket)
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'symbol':
          return a.symbol.localeCompare(b.symbol)
        case 'pnl':
          return (calculateMarketPnL(b, b.marketType || 'STOCKS') || 0) - (calculateMarketPnL(a, a.marketType || 'STOCKS') || 0)
        default:
          return 0
      }
    })
    
    setFilteredTrades(filtered)
  }
  
  const handleTradeClick = (tradeId: string) => {
    setSelectedTradeId(tradeId)
    setCurrentTab('details')
  }
  
  const selectedTrade = selectedTradeId ? trades.find(t => t.id === selectedTradeId) : null
  const selectedJournalEntry = selectedTradeId ? journalEntries[selectedTradeId] : null
  
  // Get recent trades for overview
  const recentTrades = filteredTrades.slice(0, 10)

  return (
    <SidebarLayout currentPath="/journal">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Trading Journal
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track, analyze, and improve your trading performance
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowImport(true)}
                variant="outline"
              >
                <Import className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button 
                onClick={() => setShowAddTrade(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="trades">
                <BookOpen className="h-4 w-4 mr-2" />
                All Trades
              </TabsTrigger>
              <TabsTrigger value="details">
                <Eye className="h-4 w-4 mr-2" />
                Trade Details
                {selectedTrade && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTrade.symbol}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Today&apos;s P&L</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.todayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.todayPnL, settings)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Week P&L</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.weekPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.weekPnL, settings)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.winRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalTrades} total trades
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Target: &gt; 1.5
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                  <CardDescription>Your last 10 trades - click to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTrades.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No trades yet. Add your first trade to get started!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="p-3 font-medium">Symbol</th>
                            <th className="p-3 font-medium">Type</th>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium text-right">Entry</th>
                            <th className="p-3 font-medium text-right">Exit</th>
                            <th className="p-3 font-medium text-right">Qty</th>
                            <th className="p-3 font-medium text-right">P&L</th>
                            <th className="p-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTrades.map(trade => (
                            <TradeRow 
                              key={trade.id} 
                              trade={trade} 
                              onClick={() => handleTradeClick(trade.id)}
                              settings={settings}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {filteredTrades.length > 10 && (
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentTab('trades')}
                      >
                        View All {filteredTrades.length} Trades
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Trades Tab */}
            <TabsContent value="trades" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Trade History</CardTitle>
                      <CardDescription>All your trades with filtering and search</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search symbol..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-[200px]"
                        />
                      </div>
                      <Select value={filterMarket} onValueChange={setFilterMarket}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Market" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Markets</SelectItem>
                          <SelectItem value="STOCKS">Stocks</SelectItem>
                          <SelectItem value="FOREX">Forex</SelectItem>
                          <SelectItem value="CRYPTO">Crypto</SelectItem>
                          <SelectItem value="FUTURES">Futures</SelectItem>
                          <SelectItem value="OPTIONS">Options</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="symbol">Symbol</SelectItem>
                          <SelectItem value="pnl">P&L</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredTrades.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No trades found matching your criteria</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="p-3 font-medium">Symbol</th>
                            <th className="p-3 font-medium">Type</th>
                            <th className="p-3 font-medium">Market</th>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium text-right">Entry</th>
                            <th className="p-3 font-medium text-right">Exit</th>
                            <th className="p-3 font-medium text-right">Qty</th>
                            <th className="p-3 font-medium text-right">P&L</th>
                            <th className="p-3 font-medium">Journal</th>
                            <th className="p-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTrades.map(trade => {
                            const pnl = calculateMarketPnL(trade, trade.marketType || 'STOCKS')
                            const pnlWithCommission = calculatePnLWithCommission(trade, settings) || 0
                            const hasJournal = !!journalEntries[trade.id]
                            
                            return (
                              <tr 
                                key={trade.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => handleTradeClick(trade.id)}
                              >
                                <td className="p-3 font-medium">{trade.symbol}</td>
                                <td className="p-3">
                                  <Badge variant={trade.type === 'BUY' ? 'default' : 'secondary'}>
                                    {trade.type}
                                  </Badge>
                                </td>
                                <td className="p-3">{trade.marketType || 'STOCKS'}</td>
                                <td className="p-3">{formatDateTime(trade.entryTime || trade.createdAt)}</td>
                                <td className="p-3 text-right">{safeToFixed(trade.entry)}</td>
                                <td className="p-3 text-right">{trade.exit ? safeToFixed(trade.exit) : '-'}</td>
                                <td className="p-3 text-right">{trade.quantity}</td>
                                <td className={`p-3 text-right font-bold ${pnlWithCommission >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(pnlWithCommission, settings)}
                                </td>
                                <td className="p-3">
                                  {hasJournal ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-300" />
                                  )}
                                </td>
                                <td className="p-3">
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trade Details Tab */}
            <TabsContent value="details" className="space-y-4">
              {!selectedTrade ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Select a trade from the overview or trade list to view details</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setCurrentTab('trades')}
                    >
                      Browse Trades
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const currentIndex = trades.findIndex(t => t.id === selectedTradeId)
                        if (currentIndex > 0) {
                          setSelectedTradeId(trades[currentIndex - 1].id)
                        }
                      }}
                      disabled={trades.findIndex(t => t.id === selectedTradeId) === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Trade {trades.findIndex(t => t.id === selectedTradeId) + 1} of {trades.length}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const currentIndex = trades.findIndex(t => t.id === selectedTradeId)
                        if (currentIndex < trades.length - 1) {
                          setSelectedTradeId(trades[currentIndex + 1].id)
                        }
                      }}
                      disabled={trades.findIndex(t => t.id === selectedTradeId) === trades.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  {/* Trade Info */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">{selectedTrade.symbol}</CardTitle>
                          <CardDescription>
                            {formatDateTime(selectedTrade.entryTime || selectedTrade.createdAt)}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={selectedTrade.type === 'BUY' ? 'default' : 'secondary'}
                          className="text-lg px-4 py-2"
                        >
                          {selectedTrade.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Entry Price</Label>
                          <p className="text-xl font-bold">{safeToFixed(selectedTrade.entry)}</p>
                        </div>
                        <div>
                          <Label>Exit Price</Label>
                          <p className="text-xl font-bold">{selectedTrade.exit ? safeToFixed(selectedTrade.exit) : '-'}</p>
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <p className="text-xl font-bold">{selectedTrade.quantity}</p>
                        </div>
                        <div>
                          <Label>P&L</Label>
                          <p className={`text-xl font-bold ${(calculateMarketPnL(selectedTrade, selectedTrade.marketType || 'STOCKS') || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculatePnLWithCommission(selectedTrade, settings) || 0, settings)}
                          </p>
                        </div>
                      </div>
                      
                      {selectedTrade.marketType && (
                        <div className="mt-4">
                          <Label>Market Type</Label>
                          <Badge variant="outline" className="mt-1">
                            {selectedTrade.marketType}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Journal Entry */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Trade Journal</CardTitle>
                        {editingId !== selectedTrade.id ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingId(selectedTrade.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const entry = journalEntries[selectedTrade.id]
                                if (entry) {
                                  saveJournalEntry(selectedTrade.id, entry.notes, entry.rating)
                                }
                              }}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingId === selectedTrade.id ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Rating</Label>
                            <div className="flex gap-2 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => {
                                    const entry = journalEntries[selectedTrade.id] || { 
                                      tradeId: selectedTrade.id, 
                                      trade: selectedTrade, 
                                      notes: '', 
                                      rating: 0 
                                    }
                                    saveJournalEntry(selectedTrade.id, entry.notes, star)
                                  }}
                                  className="transition-colors"
                                >
                                  <Star 
                                    className={`h-6 w-6 ${
                                      (journalEntries[selectedTrade.id]?.rating || 0) >= star
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label>Notes & Analysis</Label>
                            <RichTextEditor
                              value={journalEntries[selectedTrade.id]?.notes || ''}
                              onChange={(value) => {
                                const entry = journalEntries[selectedTrade.id] || { 
                                  tradeId: selectedTrade.id, 
                                  trade: selectedTrade, 
                                  notes: '', 
                                  rating: 0 
                                }
                                const updated = { ...journalEntries, [selectedTrade.id]: { ...entry, notes: value } }
                                setJournalEntries(updated)
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          {selectedJournalEntry ? (
                            <div className="space-y-4">
                              <div>
                                <Label>Rating</Label>
                                <div className="flex gap-1 mt-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star}
                                      className={`h-5 w-5 ${
                                        selectedJournalEntry.rating >= star
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label>Notes & Analysis</Label>
                                <div 
                                  className="mt-2 prose dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: selectedJournalEntry.notes || '<p class="text-gray-500">No notes added</p>' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-gray-500 mb-4">No journal entry for this trade yet</p>
                              <Button 
                                variant="outline"
                                onClick={() => setEditingId(selectedTrade.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Journal Entry
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Import Modal */}
        {showImport && (
          <CSVImport 
            onClose={() => setShowImport(false)} 
            onImport={fetchTrades}
          />
        )}

        {/* Add Trade Modal */}
        {showAddTrade && (
          <TradeFormEnhanced 
            onClose={() => setShowAddTrade(false)}
            onSuccess={() => {
              setShowAddTrade(false)
              fetchTrades()
            }}
          />
        )}
      </div>
    </SidebarLayout>
  )
}