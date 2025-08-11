'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, TrendingUp, TrendingDown, X, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
import { quickToast } from '@/lib/toast-utils'
import { formatCurrency } from '@/lib/calculations'

interface QuickAddTradeProps {
  onAdd: (trade: any) => void
}

export function QuickAddTrade({ onAdd }: QuickAddTradeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tradeData, setTradeData] = useState({
    symbol: '',
    type: 'BUY',
    quantity: '',
    entryPrice: '',
    exitPrice: '',
    entryDate: new Date().toISOString().split('T')[0],
    exitDate: '',
    commission: '0',
    notes: ''
  })
  
  // Auto-calculate P&L
  const [calculatedPnL, setCalculatedPnL] = useState<number | null>(null)
  
  // Recent symbols for quick selection
  const [recentSymbols, setRecentSymbols] = useState<string[]>([])
  
  useEffect(() => {
    // Load recent symbols from localStorage
    const stored = localStorage.getItem('recent_symbols')
    if (stored) {
      setRecentSymbols(JSON.parse(stored).slice(0, 5))
    }
  }, [])
  
  // Calculate P&L when prices change
  useEffect(() => {
    const qty = parseFloat(tradeData.quantity) || 0
    const entry = parseFloat(tradeData.entryPrice) || 0
    const exit = parseFloat(tradeData.exitPrice) || 0
    const commission = parseFloat(tradeData.commission) || 0
    
    if (qty && entry && exit) {
      const grossPnL = tradeData.type === 'BUY' 
        ? (exit - entry) * qty
        : (entry - exit) * qty
      setCalculatedPnL(grossPnL - commission)
    } else {
      setCalculatedPnL(null)
    }
  }, [tradeData])
  
  const handleSubmit = () => {
    // Validate required fields
    if (!tradeData.symbol || !tradeData.quantity || !tradeData.entryPrice) {
      quickToast.error('Please fill in all required fields')
      return
    }
    
    // Update recent symbols
    const updatedSymbols = [
      tradeData.symbol.toUpperCase(),
      ...recentSymbols.filter(s => s !== tradeData.symbol.toUpperCase())
    ].slice(0, 5)
    setRecentSymbols(updatedSymbols)
    localStorage.setItem('recent_symbols', JSON.stringify(updatedSymbols))
    
    // Submit trade
    const trade = {
      ...tradeData,
      symbol: tradeData.symbol.toUpperCase(),
      quantity: parseFloat(tradeData.quantity),
      entryPrice: parseFloat(tradeData.entryPrice),
      exitPrice: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : null,
      commission: parseFloat(tradeData.commission) || 0,
      entryDate: new Date(tradeData.entryDate),
      exitDate: tradeData.exitDate ? new Date(tradeData.exitDate) : null
    }
    
    onAdd(trade)
    quickToast.tradeSaved()
    
    // Reset form but keep recent settings
    const lastType = tradeData.type
    const lastCommission = tradeData.commission
    setTradeData({
      symbol: '',
      type: lastType,
      quantity: '',
      entryPrice: '',
      exitPrice: '',
      entryDate: new Date().toISOString().split('T')[0],
      exitDate: '',
      commission: lastCommission,
      notes: ''
    })
    
    setIsOpen(false)
  }
  
  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Duplicate last trade
  const duplicateLastTrade = () => {
    const lastTrade = localStorage.getItem('last_trade')
    if (lastTrade) {
      const parsed = JSON.parse(lastTrade)
      setTradeData({
        ...parsed,
        entryDate: new Date().toISOString().split('T')[0],
        exitDate: '',
        notes: ''
      })
      quickToast.info('Duplicated last trade')
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 z-30",
          "bg-blue-600 hover:bg-blue-700 text-white",
          "rounded-full p-4 shadow-lg hover:shadow-xl",
          "transition-all duration-300 hover:scale-110",
          "group"
        )}
        data-tour="add-trade"
        aria-label="Add Trade"
      >
        <Plus className="h-6 w-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Add Trade (Ctrl+N)
        </span>
      </button>

      {/* Quick Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add Trade</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Symbol with recent suggestions */}
            <div>
              <Label htmlFor="symbol">Symbol *</Label>
              <div className="flex gap-2">
                <Input
                  id="symbol"
                  value={tradeData.symbol}
                  onChange={(e) => setTradeData({ ...tradeData, symbol: e.target.value.toUpperCase() })}
                  placeholder="AAPL"
                  className="flex-1"
                  autoFocus
                />
                {recentSymbols.length > 0 && (
                  <Select
                    value=""
                    onValueChange={(value) => setTradeData({ ...tradeData, symbol: value })}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Recent" />
                    </SelectTrigger>
                    <SelectContent>
                      {recentSymbols.map(symbol => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Type */}
            <div>
              <Label>Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={tradeData.type === 'BUY' ? 'default' : 'outline'}
                  onClick={() => setTradeData({ ...tradeData, type: 'BUY' })}
                  className={cn(tradeData.type === 'BUY' && "bg-green-600 hover:bg-green-700")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Buy/Long
                </Button>
                <Button
                  type="button"
                  variant={tradeData.type === 'SELL' ? 'default' : 'outline'}
                  onClick={() => setTradeData({ ...tradeData, type: 'SELL' })}
                  className={cn(tradeData.type === 'SELL' && "bg-red-600 hover:bg-red-700")}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Sell/Short
                </Button>
              </div>
            </div>

            {/* Quantity and Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={tradeData.quantity}
                  onChange={(e) => setTradeData({ ...tradeData, quantity: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="entryPrice">Entry Price *</Label>
                <Input
                  id="entryPrice"
                  type="number"
                  step="0.01"
                  value={tradeData.entryPrice}
                  onChange={(e) => setTradeData({ ...tradeData, entryPrice: e.target.value })}
                  placeholder="150.50"
                />
              </div>
            </div>

            {/* Exit Price with P&L calculation */}
            <div>
              <Label htmlFor="exitPrice">Exit Price (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="exitPrice"
                  type="number"
                  step="0.01"
                  value={tradeData.exitPrice}
                  onChange={(e) => setTradeData({ ...tradeData, exitPrice: e.target.value })}
                  placeholder="155.25"
                  className="flex-1"
                />
                {calculatedPnL !== null && (
                  <div className={cn(
                    "flex items-center px-3 rounded-md border",
                    calculatedPnL >= 0 
                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800" 
                      : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800"
                  )}>
                    <Calculator className="h-4 w-4 mr-1" />
                    {formatCurrency(calculatedPnL)}
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entryDate">Entry Date *</Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={tradeData.entryDate}
                  onChange={(e) => setTradeData({ ...tradeData, entryDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="exitDate">Exit Date</Label>
                <Input
                  id="exitDate"
                  type="date"
                  value={tradeData.exitDate}
                  onChange={(e) => setTradeData({ ...tradeData, exitDate: e.target.value })}
                />
              </div>
            </div>

            {/* Commission */}
            <div>
              <Label htmlFor="commission">Commission</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                value={tradeData.commission}
                onChange={(e) => setTradeData({ ...tradeData, commission: e.target.value })}
                placeholder="0"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={tradeData.notes}
                onChange={(e) => setTradeData({ ...tradeData, notes: e.target.value })}
                placeholder="Trade notes..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={duplicateLastTrade}
                size="sm"
              >
                Duplicate Last
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Trade
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}