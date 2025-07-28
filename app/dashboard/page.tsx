'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TradeForm } from '@/components/trade-form'
import { CSVImport } from '@/components/csv-import'
import { useUser, UserButton } from '@clerk/nextjs'

// Check if we should use Clerk
const isClerkConfigured = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

// Hardcoded feature rotation - fight me
const WEEKLY_FEATURES: Record<number, string[]> = {
  0: ['add-trades', 'basic-pnl'],
  1: ['ai-insights', 'csv-export'],
  2: ['advanced-charts', 'risk-analysis'],
  3: ['trade-replay', 'position-sizing'],
  // ... add all 20 weeks
}

interface Trade {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  entry: number
  exit?: number | null
  quantity: number
  notes?: string | null
  createdAt: string
}

function DashboardContent({ userId }: { userId: string }) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isPaid, setIsPaid] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [showImport, setShowImport] = useState(false)
  
  // Get current week's features
  const weekNumber = Math.floor((Date.now() / 1000 / 60 / 60 / 24 / 7) % 20)
  const freeFeatures = WEEKLY_FEATURES[weekNumber] || ['add-trades', 'basic-pnl']
  
  const hasFeature = (feature: string) => isPaid || freeFeatures.includes(feature)
  
  useEffect(() => {
    // Load trades
    fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getTrades' })
    })
      .then(res => res.json())
      .then(data => {
        setTrades(data.trades || [])
        setIsPaid(data.isPaid || false)
      })
      .catch(err => console.error('Failed to load trades:', err))
  }, [])
  
  const stats = {
    totalTrades: trades.length,
    totalPnL: trades.reduce((sum, t) => {
      if (!t.exit) return sum
      const pnl = (t.exit - t.entry) * t.quantity * (t.type === 'BUY' ? 1 : -1)
      return sum + pnl
    }, 0),
    winRate: trades.length ? 
      (trades.filter(t => {
        if (!t.exit) return false
        const pnl = (t.exit - t.entry) * (t.type === 'BUY' ? 1 : -1)
        return pnl > 0
      }).length / trades.length * 100) : 0
  }
  
  const getAI = async () => {
    if (!hasFeature('ai-insights')) return
    
    const res = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'getAI',
        trades: trades 
      })
    })
    
    const data = await res.json()
    setAiInsight(data.insight)
  }
  
  const exportCSV = () => {
    if (!hasFeature('csv-export')) return
    
    const csv = [
      ['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'Quantity', 'P&L'],
      ...trades.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.symbol,
        t.type,
        t.entry,
        t.exit || '',
        t.quantity,
        t.exit ? (t.exit - t.entry) * t.quantity * (t.type === 'BUY' ? 1 : -1) : ''
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trades.csv'
    a.click()
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Trading Journal</h1>
          <p className="text-gray-600">
            {isPaid ? '✨ Ultra Member' : `Free: ${freeFeatures.join(' & ')} this week`}
          </p>
        </div>
        {isClerkConfigured && <UserButton afterSignOutUrl="/" />}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <h3 className="text-sm text-gray-600">Total P&L</h3>
          <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.totalPnL.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-gray-600">Win Rate</h3>
          <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm text-gray-600">Total Trades</h3>
          <p className="text-2xl font-bold">{stats.totalTrades}</p>
        </Card>
      </div>
      
      {/* Trade Entry */}
      {hasFeature('add-trades') ? (
        <Card className="p-4 mb-8">
          <h2 className="text-xl font-bold mb-4">Add Trade</h2>
          <TradeForm onAdd={(trade) => setTrades([...trades, trade])} />
        </Card>
      ) : (
        <Card className="p-4 mb-8 text-center text-gray-500">
          <p>Trade entry not in this week&apos;s features</p>
        </Card>
      )}
      
      {/* AI Insights */}
      <Card className="p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">AI Insights</h2>
        {hasFeature('ai-insights') ? (
          <>
            <Button onClick={getAI} className="mb-4">Get AI Analysis</Button>
            {aiInsight && (
              <p className="p-4 bg-gray-100 rounded">{aiInsight}</p>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              AI Insights not available this week
            </p>
            <Button asChild>
              <a href="https://buy.stripe.com/your-link">
                Upgrade for All Features - $25/mo
              </a>
            </Button>
          </div>
        )}
      </Card>
      
      {/* Trade List */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Trades</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowImport(true)}
              variant="outline"
            >
              Import CSV
            </Button>
            <Button
              onClick={exportCSV}
              variant="outline"
              disabled={!hasFeature('csv-export')}
            >
              Export CSV
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          {trades.slice(-10).reverse().map((trade, i) => {
            const pnl = trade.exit ?
              (trade.exit - trade.entry) * trade.quantity * (trade.type === 'BUY' ? 1 : -1) :
              null
              
            return (
              <div key={i} className="flex justify-between p-2 border rounded">
                <div>
                  <span className="font-semibold">{trade.symbol}</span>
                  <span className="ml-2 text-sm text-gray-600">{trade.type}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {new Date(trade.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  {pnl !== null && (
                    <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${pnl.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      
      {/* Upgrade CTA */}
      {!isPaid && (
        <Card className="p-8 mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Unlock Everything</h2>
          <p className="mb-6 text-gray-600">
            Get all 20 features instantly. Stop waiting for weekly rotations.
          </p>
          <Button asChild size="lg">
            <a href="https://buy.stripe.com/your-link">
              Upgrade Now - $25/mo
            </a>
          </Button>
        </Card>
      )}

      {/* Import Modal */}
      {showImport && (
        <CSVImport
          onImport={(importedTrades) => {
            // Reload trades after import
            fetch('/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'getTrades' })
            })
              .then(res => res.json())
              .then(data => {
                setTrades(data.trades || [])
              })
          }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}

function DemoMode() {
  return <DashboardContent userId="demo-user" />
}

function AuthenticatedDashboard() {
  const { user, isLoaded } = useUser()
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to continue</p>
      </div>
    )
  }
  
  return <DashboardContent userId={user.id} />
}

export default function Dashboard() {
  if (!isClerkConfigured) {
    return <DemoMode />
  }
  
  return <AuthenticatedDashboard />
}