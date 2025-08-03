'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { SymbolMetrics } from '@/lib/services/market-analysis-service'
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown,
  Download,
  Search,
  ArrowUpDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SymbolPerformanceTableProps {
  symbols: SymbolMetrics[]
}

type SortField = 'symbol' | 'totalTrades' | 'winRate' | 'totalPnL' | 'profitFactor' | 'sharpeRatio'
type SortDirection = 'asc' | 'desc'

export function SymbolPerformanceTable({ symbols }: SymbolPerformanceTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('totalPnL')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const toggleRow = (symbol: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol)
    } else {
      newExpanded.add(symbol)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredAndSortedSymbols = symbols
    .filter(s => s.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1
      switch (sortField) {
        case 'symbol':
          return multiplier * a.symbol.localeCompare(b.symbol)
        case 'totalTrades':
          return multiplier * (b.totalTrades - a.totalTrades)
        case 'winRate':
          return multiplier * (b.winRate - a.winRate)
        case 'totalPnL':
          return multiplier * (b.totalPnL - a.totalPnL)
        case 'profitFactor':
          return multiplier * (b.profitFactor - a.profitFactor)
        case 'sharpeRatio':
          return multiplier * (b.sharpeRatio - a.sharpeRatio)
        default:
          return 0
      }
    })

  const exportToCSV = () => {
    const headers = ['Symbol', 'Trades', 'Win Rate', 'Total P&L', 'Avg Win', 'Avg Loss', 'Profit Factor', 'Sharpe Ratio', 'Max Drawdown']
    const rows = filteredAndSortedSymbols.map(s => [
      s.symbol,
      s.totalTrades,
      s.winRate.toFixed(2),
      s.totalPnL.toFixed(2),
      s.avgWin.toFixed(2),
      s.avgLoss.toFixed(2),
      s.profitFactor.toFixed(2),
      s.sharpeRatio.toFixed(2),
      s.maxDrawdown.toFixed(2)
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `symbol-performance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortDirection === 'desc' ? 
      <ChevronDown className="h-4 w-4" /> : 
      <ChevronUp className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Symbol Performance Details</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Button size="sm" variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol
                    <SortIcon field="symbol" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('totalTrades')}
                  >
                    Trades
                    <SortIcon field="totalTrades" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('winRate')}
                  >
                    Win Rate
                    <SortIcon field="winRate" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('totalPnL')}
                  >
                    Total P&L
                    <SortIcon field="totalPnL" />
                  </Button>
                </TableHead>
                <TableHead>Avg Win/Loss</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('profitFactor')}
                  >
                    Profit Factor
                    <SortIcon field="profitFactor" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('sharpeRatio')}
                  >
                    Sharpe
                    <SortIcon field="sharpeRatio" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSymbols.map((symbol, index) => (
                <Collapsible key={symbol.symbol} asChild>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {expandedRows.has(symbol.symbol) ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-medium">{symbol.symbol}</TableCell>
                      <TableCell>{symbol.totalTrades}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-medium",
                          symbol.winRate >= 50 ? "text-green-600" : "text-red-600"
                        )}>
                          {symbol.winRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {symbol.totalPnL >= 0 ? 
                            <TrendingUp className="h-4 w-4 text-green-600" /> : 
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          }
                          <span className={cn(
                            "font-medium",
                            symbol.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            ${Math.abs(symbol.totalPnL).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-green-600">+${symbol.avgWin.toFixed(2)}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-red-600">${symbol.avgLoss.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          symbol.profitFactor >= 1.5 ? "text-green-600" : 
                          symbol.profitFactor >= 1 ? "text-amber-600" : 
                          "text-red-600"
                        )}>
                          {symbol.profitFactor === Infinity ? '∞' : symbol.profitFactor.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          symbol.sharpeRatio >= 1 ? "text-green-600" : 
                          symbol.sharpeRatio >= 0 ? "text-amber-600" : 
                          "text-red-600"
                        )}>
                          {symbol.sharpeRatio.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-muted/30 p-4 border-y"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Long vs Short Performance */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Directional Performance</h4>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Long</span>
                                    <span>
                                      {symbol.longPerformance.trades} trades • 
                                      <span className={cn(
                                        "ml-1",
                                        symbol.longPerformance.winRate >= 50 ? "text-green-600" : "text-red-600"
                                      )}>
                                        {symbol.longPerformance.winRate.toFixed(1)}%
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Short</span>
                                    <span>
                                      {symbol.shortPerformance.trades} trades • 
                                      <span className={cn(
                                        "ml-1",
                                        symbol.shortPerformance.winRate >= 50 ? "text-green-600" : "text-red-600"
                                      )}>
                                        {symbol.shortPerformance.winRate.toFixed(1)}%
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Risk Metrics */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Risk Metrics</h4>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Max Drawdown</span>
                                    <span className="text-red-600">-${symbol.maxDrawdown.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Avg Hold Time</span>
                                    <span>{symbol.avgHoldTime.toFixed(1)}h</span>
                                  </div>
                                </div>
                              </div>

                              {/* Best/Worst Trade */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Trade Extremes</h4>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Best Trade</span>
                                    <span className="text-green-600">
                                      {symbol.bestTrade ? 
                                        `+$${((symbol.bestTrade.exit! - symbol.bestTrade.entry) * symbol.bestTrade.quantity).toFixed(2)}` : 
                                        'N/A'
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Worst Trade</span>
                                    <span className="text-red-600">
                                      {symbol.worstTrade ? 
                                        `-$${Math.abs((symbol.worstTrade.exit! - symbol.worstTrade.entry) * symbol.worstTrade.quantity).toFixed(2)}` : 
                                        'N/A'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredAndSortedSymbols.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No symbols match your search' : 'No symbol data available'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}