'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { MARKET_TYPES } from '@/lib/market-knowledge'
import { useSettings } from '@/lib/settings'

interface Trade {
  symbol: string
  type: 'BUY' | 'SELL'
  entry: string
  exit: string
  quantity: string
  entryDate: string
  entryTime: string
  exitDate: string
  exitTime: string
  marketType: string
  notes: string
}

interface TradeFormProps {
  onAdd: (trade: any) => void
}

export function TradeForm({ onAdd }: TradeFormProps) {
  const { settings } = useSettings()
  
  // Get last used market type from localStorage or use settings default
  const getLastMarketType = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastMarketType') || settings.trading.defaultMarketType
    }
    return settings.trading.defaultMarketType
  }

  const [trade, setTrade] = useState<Trade>({
    symbol: '',
    type: 'BUY',
    entry: '',
    exit: '',
    quantity: settings.trading.riskManagement.defaultPositionSize.toString(),
    entryDate: new Date().toISOString().split('T')[0], // Default to today
    entryTime: new Date().toTimeString().split(' ')[0].substring(0, 5), // HH:MM format
    exitDate: '',
    exitTime: '',
    marketType: getLastMarketType(),
    notes: ''
  })

  // Save market type to localStorage when it changes
  useEffect(() => {
    if (trade.marketType && typeof window !== 'undefined') {
      localStorage.setItem('lastMarketType', trade.marketType)
    }
  }, [trade.marketType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Combine date and time for entry
      const entryDateTime = trade.entryTime 
        ? new Date(`${trade.entryDate}T${trade.entryTime}`)
        : new Date(trade.entryDate)
      
      // Combine date and time for exit (if provided)
      let exitDateTime = null
      if (trade.exit && trade.exitDate) {
        exitDateTime = trade.exitTime
          ? new Date(`${trade.exitDate}T${trade.exitTime}`)
          : new Date(trade.exitDate)
      }
      
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addTrade',
          trade: {
            symbol: trade.symbol,
            type: trade.type,
            entry: parseFloat(trade.entry),
            exit: trade.exit ? parseFloat(trade.exit) : null,
            quantity: parseFloat(trade.quantity),
            entryTime: entryDateTime.toISOString(),
            exitTime: exitDateTime ? exitDateTime.toISOString() : null,
            marketType: trade.marketType,
            notes: trade.notes || null
          },
          email: 'user@example.com' // This will be replaced by actual user email from dashboard
        })
      })
      
      if (!res.ok) {
        const errorData = await res.text()
        console.error('API Error Response:', errorData)
        throw new Error(`Failed to add trade: ${errorData}`)
      }
      
      const data = await res.json()
      onAdd(data.trade)
      
      // Reset form but keep market type
      setTrade({ 
        symbol: '', 
        type: 'BUY', 
        entry: '', 
        exit: '', 
        quantity: '', 
        entryDate: new Date().toISOString().split('T')[0],
        entryTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        exitDate: '',
        exitTime: '',
        marketType: trade.marketType, // Keep the same market type
        notes: ''
      })
    } catch (error) {
      console.error('Error adding trade:', error)
      alert('Failed to add trade. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Market Type and Symbol Row */}
      <div className="grid grid-cols-3 gap-4">
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
                {market.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symbol
          </label>
          <input
            placeholder={trade.marketType === 'FOREX' ? 'EUR/USD' : 'Symbol'}
            value={trade.symbol}
            onChange={(e) => setTrade({ ...trade, symbol: e.target.value.toUpperCase() })}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={trade.type}
            onChange={(e) => setTrade({ ...trade, type: e.target.value as 'BUY' | 'SELL' })}
            className="w-full p-2 border rounded"
          >
            <option>BUY</option>
            <option>SELL</option>
          </select>
        </div>
      </div>

      {/* Entry Date/Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entry Date
          </label>
          <input
            type="date"
            value={trade.entryDate}
            onChange={(e) => setTrade({ ...trade, entryDate: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entry Time
          </label>
          <input
            type="time"
            value={trade.entryTime}
            onChange={(e) => setTrade({ ...trade, entryTime: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      {/* Exit Date/Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exit Date (Optional)
          </label>
          <input
            type="date"
            value={trade.exitDate}
            onChange={(e) => setTrade({ ...trade, exitDate: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exit Time (Optional)
          </label>
          <input
            type="time"
            value={trade.exitTime}
            onChange={(e) => setTrade({ ...trade, exitTime: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      {/* Price and Quantity Row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entry Price
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={trade.entry}
            onChange={(e) => setTrade({ ...trade, entry: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exit Price (Optional)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={trade.exit}
            onChange={(e) => setTrade({ ...trade, exit: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {trade.marketType === 'FOREX' ? 'Lots' : 
             trade.marketType === 'FUTURES' ? 'Contracts' :
             trade.marketType === 'OPTIONS' ? 'Contracts' :
             'Quantity'}
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0"
            value={trade.quantity}
            onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          placeholder="Trade notes, strategy, reason for entry/exit..."
          value={trade.notes}
          onChange={(e) => setTrade({ ...trade, notes: e.target.value })}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>
      
      <Button type="submit" className="w-full">Add Trade</Button>
    </form>
  )
}