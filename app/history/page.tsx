'use client'

import { 
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"

import { 
  User,
  ChevronsUpDown,
  Calendar,
  Home,
  TrendingUp,
  Search,
  Settings,
  Import,
  BarChart3,
  History,
  DollarSign,
  PieChart,
  FileText,
  LogOut,
} from "lucide-react"

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CSVImport } from '@/components/csv-import'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import { useUser, UserButton } from '@clerk/nextjs'

// Menu items
const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Trade History",
    url: "/history",
    icon: History,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "P&L Report",
    url: "/pnl",
    icon: DollarSign,
  },
  {
    title: "Import Trades",
    url: "#import",
    icon: Import,
  },
]

const toolsMenuItems = [
  {
    title: "Market Analysis",
    url: "/analysis",
    icon: TrendingUp,
  },
  {
    title: "Performance Metrics",
    url: "/metrics",
    icon: PieChart,
  },
  {
    title: "Trade Journal",
    url: "/journal",
    icon: FileText,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
]

const settingsMenuItems = [
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

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
}

// Check if Clerk is configured
const isClerkConfigured = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

function TradeHistoryContent({ user }: { user: any }) {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([])
  const [showImport, setShowImport] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMarket, setFilterMarket] = useState('ALL')
  const [sortBy, setSortBy] = useState('date')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTrades()
  }, [])

  useEffect(() => {
    filterAndSortTrades()
  }, [trades, searchTerm, filterMarket, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const headers = ['Entry Time', 'Exit Time', 'Symbol', 'Type', 'Entry Price', 'Exit Price', 'Quantity', 'Market', 'Result', 'P&L', 'Notes']
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

  // Calculate stats
  const stats = {
    totalTrades: filteredTrades.length,
    totalPnL: filteredTrades.reduce((sum, trade) => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return sum + pnl
    }, 0),
    winningTrades: filteredTrades.filter(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return pnl > 0
    }).length,
    losingTrades: filteredTrades.filter(trade => {
      const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
      return pnl < 0
    }).length,
  }

  const winRate = stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades * 100) : 0

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        isActive={item.url === '/history'}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Tools */}
            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Settings */}
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarGroup>
              <SidebarMenuButton className="w-full justify-between gap-3 h-12">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 rounded-md" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user?.firstName || 'Demo User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress || 'demo@tradevolt.com'}
                    </span>
                  </div>
                </div>
                <ChevronsUpDown className="h-5 w-5" />
              </SidebarMenuButton>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex h-16 items-center gap-4 border-b px-6">
              <SidebarTrigger className="h-7 w-7" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Trade History</h1>
              </div>
              {isClerkConfigured && <UserButton afterSignOutUrl="/" />}
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Total Trades</h3>
                    <p className="text-2xl font-bold">{stats.totalTrades}</p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Total P&L</h3>
                    <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${stats.totalPnL.toFixed(2)}
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
                  </div>
                </Card>

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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTrades.map((trade) => {
                          const pnl = calculateMarketPnL(trade, trade.marketType || null)
                          const result = pnl !== null ? (pnl >= 0 ? 'WIN' : 'LOSS') : '-'
                          return (
                            <tr key={trade.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.entryTime ? new Date(trade.entryTime).toLocaleString() : new Date(trade.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.exitTime ? new Date(trade.exitTime).toLocaleString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {trade.symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  trade.type === 'BUY' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {trade.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${trade.entry.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.exit ? `$${trade.exit.toFixed(2)}` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {trade.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {trade.marketType || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {pnl !== null ? (
                                  <span className={pnl >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    ${pnl.toFixed(2)}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
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
          </div>
        </SidebarInset>
      </div>

      {/* Import Modal */}
      {showImport && (
        <CSVImport
          onImport={(importedTrades) => {
            fetchTrades()
          }}
          onClose={() => setShowImport(false)}
        />
      )}
    </SidebarProvider>
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