'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RichTextEditor } from '@/components/rich-text-editor'
import { 
  Edit,
  Save,
  X,
  Plus,
  Star,
} from "lucide-react"
import { calculateMarketPnL } from '@/lib/market-knowledge'


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
      <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-2">Trade Reflection</label>
          <RichTextEditor
            content={form.reflection}
            onChange={(content) => setForm({ ...form, reflection: content })}
            placeholder="What was your reasoning for this trade? What happened? Add images, charts, or any relevant content..."
            minHeight="250px"
            className="bg-white dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lessons Learned</label>
          <RichTextEditor
            content={form.lessons}
            onChange={(content) => setForm({ ...form, lessons: content })}
            placeholder="What did you learn from this trade? What patterns did you notice?"
            minHeight="200px"
            className="bg-white dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Emotional State</label>
          <RichTextEditor
            content={form.emotions}
            onChange={(content) => setForm({ ...form, emotions: content })}
            placeholder="How were you feeling? (confident, anxious, greedy, fearful, etc.) What influenced your emotions?"
            minHeight="150px"
            className="bg-white dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Areas for Improvement</label>
          <RichTextEditor
            content={form.improvements}
            onChange={(content) => setForm({ ...form, improvements: content })}
            placeholder="What could you have done better? What would you do differently next time?"
            minHeight="150px"
            className="bg-white dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Trade Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setForm({ ...form, rating })}
                className={`p-2 rounded-lg transition-colors ${
                  form.rating >= rating 
                    ? 'text-yellow-500 hover:text-yellow-600' 
                    : 'text-gray-300 hover:text-gray-400'
                }`}
                title={`${rating} star${rating > 1 ? 's' : ''}`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {form.rating === 1 && 'Poor Trade'}
              {form.rating === 2 && 'Below Average'}
              {form.rating === 3 && 'Average Trade'}
              {form.rating === 4 && 'Good Trade'}
              {form.rating === 5 && 'Excellent Trade'}
            </span>
          </div>
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
    <SidebarLayout currentPath="/journal">
      <>
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
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b px-6">
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
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reflection</h4>
                                <div 
                                  className="prose prose-sm max-w-none dark:prose-invert"
                                  dangerouslySetInnerHTML={{ __html: journalEntries[trade.id].reflection }}
                                />
                              </div>
                              {journalEntries[trade.id].lessons && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lessons Learned</h4>
                                  <div 
                                    className="prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: journalEntries[trade.id].lessons }}
                                  />
                                </div>
                              )}
                              {journalEntries[trade.id].emotions && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emotional State</h4>
                                  <div 
                                    className="prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: journalEntries[trade.id].emotions }}
                                  />
                                </div>
                              )}
                              {journalEntries[trade.id].improvements && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Areas for Improvement</h4>
                                  <div 
                                    className="prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: journalEntries[trade.id].improvements }}
                                  />
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trade Rating</h4>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                      key={star}
                                      className={`h-5 w-5 ${
                                        star <= journalEntries[trade.id].rating
                                          ? 'text-yellow-500 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    {journalEntries[trade.id].rating === 1 && 'Poor Trade'}
                                    {journalEntries[trade.id].rating === 2 && 'Below Average'}
                                    {journalEntries[trade.id].rating === 3 && 'Average Trade'}
                                    {journalEntries[trade.id].rating === 4 && 'Good Trade'}
                                    {journalEntries[trade.id].rating === 5 && 'Excellent Trade'}
                                  </span>
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
      </>
    </SidebarLayout>
  )
}