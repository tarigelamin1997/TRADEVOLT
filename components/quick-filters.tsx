'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  totalTrades: number
  filteredCount: number
}

export interface FilterState {
  search: string
  type: 'all' | 'profitable' | 'loss'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year'
  status: 'all' | 'open' | 'closed'
  savedFilterId?: string
}

interface SavedFilter {
  id: string
  name: string
  filters: FilterState
}

export function QuickFilters({ onFiltersChange, totalTrades, filteredCount }: QuickFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    dateRange: 'all',
    status: 'all'
  })
  
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState('')
  
  // Load saved filters
  useEffect(() => {
    const stored = localStorage.getItem('saved_filters')
    if (stored) {
      setSavedFilters(JSON.parse(stored))
    }
  }, [])
  
  // Apply filters
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])
  
  // Save current filter
  const saveFilter = () => {
    if (!filterName.trim()) return
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: { ...filters }
    }
    
    const updated = [...savedFilters, newFilter]
    setSavedFilters(updated)
    localStorage.setItem('saved_filters', JSON.stringify(updated))
    
    setShowSaveDialog(false)
    setFilterName('')
  }
  
  // Load saved filter
  const loadFilter = (filter: SavedFilter) => {
    setFilters({ ...filter.filters, savedFilterId: filter.id })
  }
  
  // Delete saved filter
  const deleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id)
    setSavedFilters(updated)
    localStorage.setItem('saved_filters', JSON.stringify(updated))
  }
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      dateRange: 'all',
      status: 'all'
    })
  }
  
  const hasActiveFilters = filters.search || 
    filters.type !== 'all' || 
    filters.dateRange !== 'all' || 
    filters.status !== 'all'

  return (
    <div className="space-y-3">
      {/* Search and Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search symbol, notes..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        {/* P&L Filter */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filters.type === 'all' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, type: 'all' })}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filters.type === 'profitable' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, type: 'profitable' })}
            className={cn(filters.type === 'profitable' && "bg-green-600 hover:bg-green-700")}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Profits
          </Button>
          <Button
            size="sm"
            variant={filters.type === 'loss' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, type: 'loss' })}
            className={cn(filters.type === 'loss' && "bg-red-600 hover:bg-red-700")}
          >
            <TrendingDown className="h-4 w-4 mr-1" />
            Losses
          </Button>
        </div>
        
        {/* Date Range */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filters.dateRange === 'today' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, dateRange: 'today' })}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={filters.dateRange === 'week' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, dateRange: 'week' })}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={filters.dateRange === 'month' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, dateRange: 'month' })}
          >
            Month
          </Button>
          <Button
            size="sm"
            variant={filters.dateRange === 'all' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, dateRange: 'all' })}
          >
            All Time
          </Button>
        </div>
        
        {/* Status Filter */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filters.status === 'open' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, status: filters.status === 'open' ? 'all' : 'open' })}
          >
            <Clock className="h-4 w-4 mr-1" />
            Open
          </Button>
          <Button
            size="sm"
            variant={filters.status === 'closed' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, status: filters.status === 'closed' ? 'all' : 'closed' })}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Closed
          </Button>
        </div>
        
        {/* Reset */}
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={resetFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>
      
      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Saved:</span>
          {savedFilters.map(filter => (
            <Badge
              key={filter.id}
              variant={filters.savedFilterId === filter.id ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => loadFilter(filter)}
            >
              {filter.name}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteFilter(filter.id)
                }}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Filter Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredCount}</span> of {totalTrades} trades
          </span>
        </div>
        
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const name = prompt('Save filter as:')
              if (name) {
                setFilterName(name)
                saveFilter()
              }
            }}
          >
            Save Filter
          </Button>
        )}
      </div>
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg space-y-4 w-80">
            <h3 className="font-semibold">Save Filter</h3>
            <Input
              placeholder="Filter name..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveFilter}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to apply filters to trades
export function applyFilters(trades: any[], filters: FilterState): any[] {
  return trades.filter(trade => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSymbol = trade.symbol?.toLowerCase().includes(searchLower)
      const matchesNotes = trade.notes?.toLowerCase().includes(searchLower)
      if (!matchesSymbol && !matchesNotes) return false
    }
    
    // Type filter (profitable/loss)
    if (filters.type !== 'all' && trade.pnl !== undefined) {
      if (filters.type === 'profitable' && trade.pnl < 0) return false
      if (filters.type === 'loss' && trade.pnl >= 0) return false
    }
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const tradeDate = new Date(trade.entryDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let startDate = new Date()
      switch (filters.dateRange) {
        case 'today':
          startDate = today
          break
        case 'week':
          startDate.setDate(today.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(today.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(today.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1)
          break
      }
      
      if (tradeDate < startDate) return false
    }
    
    // Status filter
    if (filters.status !== 'all') {
      const isOpen = !trade.exitDate
      if (filters.status === 'open' && !isOpen) return false
      if (filters.status === 'closed' && isOpen) return false
    }
    
    return true
  })
}