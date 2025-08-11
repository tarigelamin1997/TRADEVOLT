'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// RadioGroup will be implemented with native HTML
import { Card, CardContent } from '@/components/ui/card'
import { Download, FileText, FileSpreadsheet, Calendar, Filter } from 'lucide-react'
import { quickToast } from '@/lib/toast-utils'
import { formatCurrency } from '@/lib/calculations'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface ExportTradesProps {
  trades: any[]
  isOpen: boolean
  onClose: () => void
}

export function ExportTrades({ trades, isOpen, onClose }: ExportTradesProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf')
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })
  const [includeOptions, setIncludeOptions] = useState({
    openTrades: true,
    closedTrades: true,
    profitableTrades: true,
    losingTrades: true
  })
  
  // Date range presets
  const applyDatePreset = (preset: string) => {
    const today = new Date()
    const from = new Date()
    
    switch (preset) {
      case 'today':
        from.setHours(0, 0, 0, 0)
        break
      case 'week':
        from.setDate(today.getDate() - 7)
        break
      case 'month':
        from.setMonth(today.getMonth() - 1)
        break
      case 'quarter':
        from.setMonth(today.getMonth() - 3)
        break
      case 'year':
        from.setFullYear(today.getFullYear() - 1)
        break
      case 'all':
        setDateRange({ from: '', to: '' })
        return
    }
    
    setDateRange({
      from: from.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    })
  }
  
  // Filter trades based on criteria
  const getFilteredTrades = () => {
    return trades.filter(trade => {
      // Date filter
      if (dateRange.from) {
        const tradeDate = new Date(trade.entryDate)
        const fromDate = new Date(dateRange.from)
        if (tradeDate < fromDate) return false
      }
      
      if (dateRange.to) {
        const tradeDate = new Date(trade.entryDate)
        const toDate = new Date(dateRange.to)
        if (tradeDate > toDate) return false
      }
      
      // Status filter
      const isOpen = !trade.exitDate
      if (isOpen && !includeOptions.openTrades) return false
      if (!isOpen && !includeOptions.closedTrades) return false
      
      // P&L filter
      if (trade.pnl !== undefined) {
        const isProfitable = trade.pnl >= 0
        if (isProfitable && !includeOptions.profitableTrades) return false
        if (!isProfitable && !includeOptions.losingTrades) return false
      }
      
      return true
    })
  }
  
  // Export as PDF
  const exportPDF = () => {
    const filteredTrades = getFilteredTrades()
    
    if (filteredTrades.length === 0) {
      quickToast.error('No trades to export')
      return
    }
    
    const pdf = new jsPDF()
    
    // Title
    pdf.setFontSize(20)
    pdf.text('Trading Journal Report', 14, 20)
    
    // Date range
    pdf.setFontSize(10)
    const dateText = dateRange.from && dateRange.to 
      ? `Period: ${dateRange.from} to ${dateRange.to}`
      : 'Period: All Time'
    pdf.text(dateText, 14, 30)
    
    // Summary stats
    const totalTrades = filteredTrades.length
    const closedTrades = filteredTrades.filter(t => t.exitDate)
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const winRate = closedTrades.length > 0 
      ? (closedTrades.filter(t => t.pnl >= 0).length / closedTrades.length * 100).toFixed(1)
      : 0
    
    pdf.setFontSize(12)
    pdf.text('Summary Statistics', 14, 40)
    pdf.setFontSize(10)
    pdf.text(`Total Trades: ${totalTrades}`, 14, 48)
    pdf.text(`Closed Trades: ${closedTrades.length}`, 14, 54)
    pdf.text(`Total P&L: ${formatCurrency(totalPnL)}`, 14, 60)
    pdf.text(`Win Rate: ${winRate}%`, 14, 66)
    
    // Trades table
    const tableData = filteredTrades.map(trade => [
      trade.symbol,
      trade.type,
      trade.quantity.toString(),
      formatCurrency(trade.entryPrice),
      new Date(trade.entryDate).toLocaleDateString(),
      trade.exitPrice ? formatCurrency(trade.exitPrice) : '-',
      trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : '-',
      trade.pnl ? formatCurrency(trade.pnl) : '-'
    ])
    
    pdf.autoTable({
      head: [['Symbol', 'Type', 'Qty', 'Entry', 'Entry Date', 'Exit', 'Exit Date', 'P&L']],
      body: tableData,
      startY: 75,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    })
    
    // Footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
        pdf.internal.pageSize.width / 2,
        pdf.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }
    
    // Save
    const filename = `trades_${dateRange.from || 'all'}_${dateRange.to || 'time'}.pdf`
    pdf.save(filename)
    quickToast.exportSuccess()
    onClose()
  }
  
  // Export as CSV
  const exportCSV = () => {
    const filteredTrades = getFilteredTrades()
    
    if (filteredTrades.length === 0) {
      quickToast.error('No trades to export')
      return
    }
    
    const headers = ['Symbol', 'Type', 'Quantity', 'Entry Price', 'Entry Date', 'Exit Price', 'Exit Date', 'Commission', 'P&L', 'Notes']
    const rows = filteredTrades.map(trade => [
      trade.symbol,
      trade.type,
      trade.quantity,
      trade.entryPrice,
      new Date(trade.entryDate).toISOString().split('T')[0],
      trade.exitPrice || '',
      trade.exitDate ? new Date(trade.exitDate).toISOString().split('T')[0] : '',
      trade.commission || 0,
      trade.pnl || '',
      trade.notes || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trades_${dateRange.from || 'all'}_${dateRange.to || 'time'}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    quickToast.exportSuccess()
    onClose()
  }
  
  // Export as JSON
  const exportJSON = () => {
    const filteredTrades = getFilteredTrades()
    
    if (filteredTrades.length === 0) {
      quickToast.error('No trades to export')
      return
    }
    
    const jsonContent = JSON.stringify(filteredTrades, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trades_${dateRange.from || 'all'}_${dateRange.to || 'time'}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    quickToast.exportSuccess()
    onClose()
  }
  
  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        exportPDF()
        break
      case 'csv':
        exportCSV()
        break
      case 'json':
        exportJSON()
        break
    }
  }
  
  const filteredCount = getFilteredTrades().length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Trades</DialogTitle>
          <DialogDescription>
            Export your trading data in various formats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <Label>Export Format</Label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="rounded-full"
                />
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-red-600" />
                  PDF Report (with statistics)
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="rounded-full"
                />
                <span className="flex items-center">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                  CSV (Excel compatible)
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="rounded-full"
                />
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  JSON (for developers)
                </span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyDatePreset('today')}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyDatePreset('week')}
              >
                Last 7 Days
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyDatePreset('month')}
              >
                Last Month
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyDatePreset('quarter')}
              >
                Last Quarter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyDatePreset('year')}
              >
                Last Year
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyDatePreset('all')}
              >
                All Time
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label htmlFor="from-date" className="text-xs">From</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="to-date" className="text-xs">To</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div>
            <Label>Include</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="open-trades"
                  checked={includeOptions.openTrades}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, openTrades: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="open-trades" className="text-sm cursor-pointer">
                  Open Trades
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="closed-trades"
                  checked={includeOptions.closedTrades}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, closedTrades: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="closed-trades" className="text-sm cursor-pointer">
                  Closed Trades
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="profitable-trades"
                  checked={includeOptions.profitableTrades}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, profitableTrades: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="profitable-trades" className="text-sm cursor-pointer">
                  Profitable Trades
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="losing-trades"
                  checked={includeOptions.losingTrades}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, losingTrades: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="losing-trades" className="text-sm cursor-pointer">
                  Losing Trades
                </Label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Trades to export:
                </span>
                <span className="font-semibold">{filteredCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={filteredCount === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {filteredCount} Trades
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}