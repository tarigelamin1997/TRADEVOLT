'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  Edit,
  Save,
  X,
  Plus,
} from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'

// Menu items (same as other pages)
const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Trade History", url: "/history", icon: History },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "P&L Report", url: "/pnl", icon: DollarSign },
  { title: "Import Trades", url: "#import", icon: Import },
]

const toolsMenuItems = [
  { title: "Market Analysis", url: "/analysis", icon: TrendingUp },
  { title: "Performance Metrics", url: "/metrics", icon: PieChart },
  { title: "Trade Journal", url: "/journal", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
]

const settingsMenuItems = [
  { title: "Search", url: "/search", icon: Search },
  { title: "Settings", url: "/settings", icon: Settings },
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

interface JournalEntry {
  tradeId: string
  trade: Trade
  reflection: string
  lessons: string
  emotions: string
  improvements: string
  rating: number
}

export default function TradeJournalPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [journalEntries, setJournalEntries] = useState<Record<string, JournalEntry>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'journaled' | 'not-journaled'>('all')

  useEffect(() => {
    fetchTrades()
    // Load journal entries from localStorage
    const saved = localStorage.getItem('tradeJournalEntries')
    if (saved) {
      setJournalEntries(JSON.parse(saved))
    }
  }, [])

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

  const handleMenuClick = (url: string) => {
    router.push(url)
  }

  const saveJournalEntry = (tradeId: string, entry: Partial<JournalEntry>) => {
    const trade = trades.find(t => t.id === tradeId)
    if (!trade) return

    const newEntry: JournalEntry = {
      tradeId,
      trade,
      reflection: entry.reflection || journalEntries[tradeId]?.reflection || '',
      lessons: entry.lessons || journalEntries[tradeId]?.lessons || '',
      emotions: entry.emotions || journalEntries[tradeId]?.emotions || '',
      improvements: entry.improvements || journalEntries[tradeId]?.improvements || '',
      rating: entry.rating || journalEntries[tradeId]?.rating || 3,
    }

    const updated = { ...journalEntries, [tradeId]: newEntry }
    setJournalEntries(updated)
    localStorage.setItem('tradeJournalEntries', JSON.stringify(updated))
    setEditingId(null)
  }

  const filteredTrades = trades.filter(trade => {
    switch (filterType) {
      case 'journaled':
        return !!journalEntries[trade.id]
      case 'not-journaled':
        return !journalEntries[trade.id]
      default:
        return true
    }
  })

  const JournalForm = ({ trade }: { trade: Trade }) => {
    const existing = journalEntries[trade.id]
    const [form, setForm] = useState({
      reflection: existing?.reflection || '',
      lessons: existing?.lessons || '',
      emotions: existing?.emotions || '',
      improvements: existing?.improvements || '',
      rating: existing?.rating || 3,
    })

    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Trade Reflection</label>
          <textarea
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="What was your reasoning for this trade? What happened?"
            value={form.reflection}
            onChange={(e) => setForm({ ...form, reflection: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Lessons Learned</label>
          <textarea
            className="w-full p-2 border rounded-md"
            rows={2}
            placeholder="What did you learn from this trade?"
            value={form.lessons}
            onChange={(e) => setForm({ ...form, lessons: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Emotional State</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="How were you feeling? (confident, anxious, greedy, fearful, etc.)"
            value={form.emotions}
            onChange={(e) => setForm({ ...form, emotions: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Areas for Improvement</label>
          <textarea
            className="w-full p-2 border rounded-md"
            rows={2}
            placeholder="What could you have done better?"
            value={form.improvements}
            onChange={(e) => setForm({ ...form, improvements: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Trade Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => setForm({ ...form, rating })}
                className={`px-3 py-1 rounded ${
                  form.rating === rating 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            1 = Poor execution, 5 = Perfect execution
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => saveJournalEntry(trade.id, form)}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Journal Entry
          </Button>
          <Button 
            onClick={() => setEditingId(null)}
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        isActive={item.url === '/journal'}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        isActive={item.url === '/journal'}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton onClick={() => handleMenuClick(item.url)}>
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
                    <span className="text-sm font-medium">Demo User</span>
                    <span className="text-xs text-muted-foreground">demo@tradevolt.com</span>
                  </div>
                </div>
                <ChevronsUpDown className="h-5 w-5" />
              </SidebarMenuButton>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="flex h-16 items-center gap-4 border-b px-6">
              <SidebarTrigger className="h-7 w-7" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Trade Journal</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  All Trades
                </Button>
                <Button
                  variant={filterType === 'journaled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('journaled')}
                >
                  Journaled
                </Button>
                <Button
                  variant={filterType === 'not-journaled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('not-journaled')}
                >
                  Not Journaled
                </Button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Total Trades</h3>
                    <p className="text-2xl font-bold">{trades.length}</p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Journaled Trades</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {Object.keys(journalEntries).length}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="text-sm text-gray-600">Average Rating</h3>
                    <p className="text-2xl font-bold">
                      {Object.values(journalEntries).length > 0
                        ? (Object.values(journalEntries).reduce((sum, e) => sum + e.rating, 0) / 
                           Object.values(journalEntries).length).toFixed(1)
                        : '-'}
                    </p>
                  </Card>
                </div>

                {/* Trade List with Journal Entries */}
                <div className="space-y-4">
                  {filteredTrades.map(trade => {
                    const pnl = calculateMarketPnL(trade, trade.marketType || null)
                    const hasJournal = !!journalEntries[trade.id]
                    const isEditing = editingId === trade.id

                    return (
                      <Card key={trade.id} className="overflow-hidden">
                        <div className="p-4">
                          {/* Trade Info Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">{trade.symbol}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  trade.type === 'BUY' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {trade.type}
                                </span>
                                {trade.marketType && (
                                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {trade.marketType}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(trade.createdAt).toLocaleDateString()} • 
                                Entry: ${trade.entry} • 
                                {trade.exit ? `Exit: $${trade.exit}` : 'Open'} • 
                                Qty: {trade.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              {pnl !== null && (
                                <p className={`text-lg font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${pnl.toFixed(2)}
                                </p>
                              )}
                              {!hasJournal && !isEditing && (
                                <Button
                                  onClick={() => setEditingId(trade.id)}
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Journal
                                </Button>
                              )}
                              {hasJournal && !isEditing && (
                                <Button
                                  onClick={() => setEditingId(trade.id)}
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Journal
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Journal Entry Display */}
                          {hasJournal && !isEditing && (
                            <div className="space-y-3 pt-4 border-t">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700">Reflection</h4>
                                <p className="text-sm mt-1">{journalEntries[trade.id].reflection}</p>
                              </div>
                              {journalEntries[trade.id].lessons && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700">Lessons Learned</h4>
                                  <p className="text-sm mt-1">{journalEntries[trade.id].lessons}</p>
                                </div>
                              )}
                              {journalEntries[trade.id].emotions && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700">Emotional State</h4>
                                  <p className="text-sm mt-1">{journalEntries[trade.id].emotions}</p>
                                </div>
                              )}
                              {journalEntries[trade.id].improvements && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700">Areas for Improvement</h4>
                                  <p className="text-sm mt-1">{journalEntries[trade.id].improvements}</p>
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-medium text-gray-700">Trade Rating</h4>
                                <div className="flex gap-1 mt-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                      key={star}
                                      className={`text-xl ${
                                        star <= journalEntries[trade.id].rating
                                          ? 'text-yellow-500'
                                          : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Journal Entry Form */}
                          {isEditing && <JournalForm trade={trade} />}
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {filteredTrades.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500">No trades found</p>
                  </Card>
                )}
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}