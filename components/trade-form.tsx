'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { MARKET_TYPES } from '@/lib/market-knowledge'

interface Trade {
  symbol: string
  type: 'BUY' | 'SELL'
  entry: string
  exit: string
  quantity: string
  date: string
  marketType: string
}

interface TradeFormProps {
  onAdd: (trade: any) => void
}

export function TradeForm({ onAdd }: TradeFormProps) {
  // Get last used market type from localStorage
  const getLastMarketType = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastMarketType') || 'STOCKS'
    }
    return 'STOCKS'
  }

  const [trade, setTrade] = useState<Trade>({
    symbol: '',
    type: 'BUY',
    entry: '',
    exit: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    marketType: getLastMarketType()
  })

  // Save market type to localStorage when it changes
  useEffect(() => {
    if (trade.marketType && typeof window !== 'undefined') {
      localStorage.setItem('lastMarketType', trade.marketType)
    }
  }, [trade.marketType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addTrade',
        trade: {
          ...trade,
          entry: parseFloat(trade.entry),
          exit: trade.exit ? parseFloat(trade.exit) : null,
          quantity: parseFloat(trade.quantity),
          createdAt: new Date(trade.date).toISOString(),
          marketType: trade.marketType
        },
        email: 'user@example.com' // This will be replaced by actual user email from dashboard
      })
    })
    
    const data = await res.json()
    onAdd(data.trade)
    
    // Reset form but keep market type
    setTrade({ 
      symbol: '', 
      type: 'BUY', 
      entry: '', 
      exit: '', 
      quantity: '', 
      date: new Date().toISOString().split('T')[0],
      marketType: trade.marketType // Keep the same market type
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Market Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Market Type
        </label>
        <select
          value={trade.marketType}
          onChange={(e) => setTrade({ ...trade, marketType: e.target.value })}
          className="w-full p-2 border rounded bg-gray-50"
        >
          {Object.entries(MARKET_TYPES).map(([key, market]) => (
            <option key={key} value={key}>
              {market.name} - {market.notes}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <input
            placeholder={trade.marketType === 'FOREX' ? 'Pair (e.g., EUR/USD)' : 'Symbol'}
            value={trade.symbol}
            onChange={(e) => setTrade({ ...trade, symbol: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          {trade.marketType && MARKET_TYPES[trade.marketType] && (
            <p className="text-xs text-gray-500 mt-1">
              {trade.marketType === 'FUTURES' && 'e.g., ES, NQ, CL, GC'}
              {trade.marketType === 'FOREX' && 'e.g., EUR/USD, GBP/JPY'}
              {trade.marketType === 'CRYPTO' && 'e.g., BTC, ETH, BTC/USDT'}
              {trade.marketType === 'OPTIONS' && 'e.g., AAPL 240119C150'}
              {trade.marketType === 'STOCKS' && 'e.g., AAPL, MSFT, GOOGL'}
            </p>
          )}
        </div>
        <select
          value={trade.type}
          onChange={(e) => setTrade({ ...trade, type: e.target.value as 'BUY' | 'SELL' })}
          className="p-2 border rounded"
        >
          <option>BUY</option>
          <option>SELL</option>
        </select>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <input
          type="number"
          step="0.01"
          placeholder="Entry Price"
          value={trade.entry}
          onChange={(e) => setTrade({ ...trade, entry: e.target.value })}
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Exit Price"
          value={trade.exit}
          onChange={(e) => setTrade({ ...trade, exit: e.target.value })}
          className="p-2 border rounded"
        />
        <input
          type="number"
          step="0.01"
          placeholder={
            trade.marketType === 'FOREX' ? 'Lots' : 
            trade.marketType === 'FUTURES' ? 'Contracts' :
            trade.marketType === 'OPTIONS' ? 'Contracts' :
            'Quantity'
          }
          value={trade.quantity}
          onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
          className="p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trade Date
        </label>
        <input
          type="date"
          value={trade.date}
          onChange={(e) => setTrade({ ...trade, date: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <Button type="submit" className="w-full">Add Trade</Button>
    </form>
  )
}