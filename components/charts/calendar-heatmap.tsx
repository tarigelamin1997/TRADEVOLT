'use client'

import { useMemo } from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { motion } from 'framer-motion'
import { Tooltip } from '@/components/ui/tooltip'
import type { Trade } from '@/lib/db-memory'
import { calculateMarketPnL } from '@/lib/market-knowledge'
import 'react-calendar-heatmap/dist/styles.css'

interface CalendarHeatmapProps {
  trades: Trade[]
  year?: number
}

export function TradingCalendarHeatmap({ trades, year = new Date().getFullYear() }: CalendarHeatmapProps) {
  const dailyPnL = useMemo(() => {
    const pnlByDate: Record<string, number> = {}
    
    trades
      .filter(t => t.exit !== null && t.exit !== undefined)
      .forEach(trade => {
        const date = new Date(trade.createdAt).toISOString().split('T')[0]
        const pnl = calculateMarketPnL(trade, trade.marketType || null) || 0
        pnlByDate[date] = (pnlByDate[date] || 0) + pnl
      })
    
    return Object.entries(pnlByDate).map(([date, value]) => ({
      date,
      count: value
    }))
  }, [trades])

  const maxPnL = Math.max(...dailyPnL.map(d => Math.abs(d.count)), 1)

  const getClassForValue = (value: any) => {
    if (!value || value.count === 0) return 'fill-gray-100 dark:fill-gray-800'
    
    const normalized = value.count / maxPnL
    
    if (value.count > 0) {
      // Profit - shades of green
      if (normalized > 0.75) return 'fill-green-600'
      if (normalized > 0.5) return 'fill-green-500'
      if (normalized > 0.25) return 'fill-green-400'
      return 'fill-green-300'
    } else {
      // Loss - shades of red
      const absNormalized = Math.abs(normalized)
      if (absNormalized > 0.75) return 'fill-red-600'
      if (absNormalized > 0.5) return 'fill-red-500'
      if (absNormalized > 0.25) return 'fill-red-400'
      return 'fill-red-300'
    }
  }

  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Trading Calendar</h3>
        <p className="text-sm text-muted-foreground">Daily P&L heatmap for {year}</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={dailyPnL}
            classForValue={getClassForValue}
            tooltipDataAttrs={(value: any) => {
              if (!value || !value.date) return null
              return {
                'data-tooltip': `${value.date}: ${value.count >= 0 ? '+' : ''}$${value.count.toFixed(2)}`
              }
            }}
            showWeekdayLabels
          />
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Loss</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-300 rounded-sm" />
            <div className="w-3 h-3 bg-red-400 rounded-sm" />
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <div className="w-3 h-3 bg-red-600 rounded-sm" />
          </div>
        </div>
        <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm" />
        <div className="flex items-center gap-2 text-sm">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-green-300 rounded-sm" />
            <div className="w-3 h-3 bg-green-400 rounded-sm" />
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <div className="w-3 h-3 bg-green-600 rounded-sm" />
          </div>
          <span className="text-muted-foreground">Profit</span>
        </div>
      </div>
    </motion.div>
  )
}

// Custom styles to override default calendar styles
export const calendarStyles = `
  .react-calendar-heatmap {
    font-family: inherit;
  }
  
  .react-calendar-heatmap rect {
    rx: 2;
    ry: 2;
  }
  
  .react-calendar-heatmap rect:hover {
    stroke: #000;
    stroke-width: 1px;
  }
  
  .react-calendar-heatmap-weekday-label {
    fill: #94a3b8;
    font-size: 12px;
  }
  
  .react-calendar-heatmap-month-label {
    fill: #64748b;
    font-size: 14px;
    font-weight: 500;
  }
`