'use client'

import { useState } from 'react'
import { Button } from './ui/button'

interface Trade {
  symbol: string
  type: 'BUY' | 'SELL'
  entry: string
  exit: string
  quantity: string
  date: string
}

interface TradeFormProps {
  onAdd: (trade: any) => void
}

export function TradeForm({ onAdd }: TradeFormProps) {
  const [trade, setTrade] = useState<Trade>({
    symbol: '',
    type: 'BUY',
    entry: '',
    exit: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0] // Default to today
  })

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
          createdAt: new Date(trade.date).toISOString()
        },
        email: 'user@example.com' // This will be replaced by actual user email from dashboard
      })
    })
    
    const data = await res.json()
    onAdd(data.trade)
    
    // Reset form
    setTrade({ symbol: '', type: 'BUY', entry: '', exit: '', quantity: '', date: new Date().toISOString().split('T')[0] })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          placeholder="Symbol"
          value={trade.symbol}
          onChange={(e) => setTrade({ ...trade, symbol: e.target.value })}
          className="p-2 border rounded"
          required
        />
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
          placeholder="Quantity"
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