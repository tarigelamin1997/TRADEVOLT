'use client'

import { 
  Line, 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid
} from 'recharts'
import { format } from 'date-fns'
import type { RunningPnL } from '@/lib/types/excursion'

interface RunningPnLChartProps {
  data: RunningPnL[]
}

export function RunningPnLChart({ data }: RunningPnLChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  // Format data for the chart
  const chartData = data.map((point, index) => {
    // Show fewer labels for better readability
    const showTime = index === 0 || index === data.length - 1 || index % Math.floor(data.length / 10) === 0
    
    return {
      time: showTime ? format(point.timestamp, 'HH:mm') : '',
      fullTime: format(point.timestamp, 'MMM dd HH:mm'),
      pnl: parseFloat(point.pnlPercent.toFixed(2)),
      mae: -Math.abs(point.maeAtTime),
      mfe: point.mfeAtTime,
      price: point.price
    }
  })

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
        <p className="font-medium text-sm">{data.fullTime}</p>
        <div className="space-y-1 text-xs">
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Price:</span>
            <span className="font-medium">${data.price.toFixed(2)}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">P&L:</span>
            <span className={`font-medium ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.pnl >= 0 ? '+' : ''}{data.pnl}%
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">MFE:</span>
            <span className="font-medium text-green-600">+{data.mfe.toFixed(2)}%</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">MAE:</span>
            <span className="font-medium text-red-600">{data.mae.toFixed(2)}%</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          
          <YAxis 
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            domain={['dataMin - 1', 'dataMax + 1']}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* MAE/MFE Range - Shaded area showing max drawdown and profit */}
          <Area
            type="monotone"
            dataKey="mfe"
            stackId="1"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="mae"
            stackId="1"
            stroke="none"
            fill="#ef4444"
            fillOpacity={0.1}
          />
          
          {/* P&L Line - The actual journey */}
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          
          {/* Zero line */}
          <ReferenceLine 
            y={0} 
            stroke="#666" 
            strokeDasharray="3 3" 
            label={{ value: "Break Even", position: "left", className: "fill-muted-foreground text-xs" }}
          />
          
          {/* Entry marker */}
          {chartData.length > 0 && (
            <ReferenceLine
              x={chartData[0].time}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{ value: "Entry", position: "top", className: "fill-green-600 text-xs" }}
            />
          )}
          
          {/* Exit marker (if trade is closed) */}
          {chartData.length > 0 && chartData[chartData.length - 1].pnl !== 0 && (
            <ReferenceLine
              x={chartData[chartData.length - 1].time}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: "Exit", position: "top", className: "fill-red-600 text-xs" }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}