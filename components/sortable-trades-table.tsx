'use client'

import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/calculations'

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface SortableTradesTableProps {
  trades: any[]
  onEdit?: (trade: any) => void
  onDelete?: (trade: any) => void
  onView?: (trade: any) => void
}

export function SortableTradesTable({ 
  trades, 
  onEdit, 
  onDelete, 
  onView 
}: SortableTradesTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  
  // Sortable columns configuration
  const columns = [
    { key: 'entryDate', label: 'Date', sortable: true },
    { key: 'symbol', label: 'Symbol', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'quantity', label: 'Qty', sortable: true },
    { key: 'entryPrice', label: 'Entry', sortable: true },
    { key: 'exitPrice', label: 'Exit', sortable: true },
    { key: 'pnl', label: 'P&L', sortable: true },
    { key: 'pnlPercent', label: 'P&L %', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]
  
  // Handle sort
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
  }
  
  // Sort trades
  const sortedTrades = useMemo(() => {
    if (!sortConfig) return trades
    
    const sorted = [...trades].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      // Handle different data types
      if (sortConfig.key === 'entryDate' || sortConfig.key === 'exitDate') {
        const aDate = new Date(aValue).getTime()
        const bDate = new Date(bValue).getTime()
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      // String comparison
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()
      
      if (sortConfig.direction === 'asc') {
        return aString < bString ? -1 : aString > bString ? 1 : 0
      } else {
        return aString > bString ? -1 : aString < bString ? 1 : 0
      }
    })
    
    return sorted
  }, [trades, sortConfig])
  
  // Calculate P&L percentage
  const calculatePnLPercent = (trade: any) => {
    if (!trade.exitPrice || !trade.entryPrice) return null
    
    const percent = trade.type === 'BUY'
      ? ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100
      : ((trade.entryPrice - trade.exitPrice) / trade.entryPrice) * 100
    
    return percent
  }
  
  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />
    }
    
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3 w-3 text-blue-600" />
      : <ArrowDown className="h-3 w-3 text-blue-600" />
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900">
            {columns.map(column => (
              <TableHead 
                key={column.key}
                className={cn(
                  column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                  "select-none"
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTrades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                <p className="text-muted-foreground">No trades found</p>
              </TableCell>
            </TableRow>
          ) : (
            sortedTrades.map((trade) => {
              const pnlPercent = calculatePnLPercent(trade)
              const isOpen = !trade.exitDate
              
              return (
                <TableRow 
                  key={trade.id}
                  className={cn(
                    "transition-colors",
                    hoveredRow === trade.id && "bg-gray-50 dark:bg-gray-900"
                  )}
                  onMouseEnter={() => setHoveredRow(trade.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <TableCell className="font-medium">
                    {new Date(trade.entryDate).toLocaleDateString()}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {trade.symbol}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className={cn(
                      "flex items-center gap-1",
                      trade.type === 'BUY' ? "text-green-600" : "text-red-600"
                    )}>
                      {trade.type === 'BUY' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {trade.type}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {trade.quantity}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {formatCurrency(trade.entryPrice)}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {trade.pnl !== undefined ? (
                      <span className={cn(
                        "font-medium",
                        trade.pnl >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {pnlPercent !== null ? (
                      <Badge 
                        variant={pnlPercent >= 0 ? 'default' : 'destructive'}
                        className={cn(
                          "font-mono text-xs",
                          pnlPercent >= 0 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-red-100 text-red-700 border-red-200"
                        )}
                      >
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={isOpen ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(trade)}
                          className="h-7 w-7 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(trade)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(trade)}
                          className="h-7 w-7 p-0 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      
      {/* Table Footer with Summary */}
      {sortedTrades.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Total: <span className="font-medium text-foreground">{sortedTrades.length}</span> trades
              </span>
              <span className="text-muted-foreground">
                Open: <span className="font-medium text-foreground">
                  {sortedTrades.filter(t => !t.exitDate).length}
                </span>
              </span>
              <span className="text-muted-foreground">
                Closed: <span className="font-medium text-foreground">
                  {sortedTrades.filter(t => t.exitDate).length}
                </span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {sortConfig && (
                <Badge variant="outline" className="text-xs">
                  Sorted by {sortConfig.key} ({sortConfig.direction})
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}