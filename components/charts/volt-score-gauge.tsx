'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VoltScoreComponents } from '@/lib/services/behavioral-analysis-service'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { safeToFixed } from '@/lib/utils/safe-format'

interface VoltScoreGaugeProps {
  score: number
  components: VoltScoreComponents
}

export function VoltScoreGauge({ score, components }: VoltScoreGaugeProps) {
  // Calculate rotation for needle (-90 to 90 degrees)
  const rotation = (score / 100) * 180 - 90

  // Get color based on score
  const getScoreColor = () => {
    if (score >= 80) return '#10b981' // green
    if (score >= 60) return '#f59e0b' // amber
    if (score >= 40) return '#fb923c' // orange
    return '#ef4444' // red
  }

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Average'
    return 'Needs Improvement'
  }

  const getComponentColor = (value: number) => {
    if (value >= 80) return 'text-green-600'
    if (value >= 60) return 'text-amber-600'
    if (value >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Volt Score™</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>The Volt Score™ measures your trading &quot;voltage&quot; (0-100) by combining win rate, profit factor, risk/reward, consistency, recovery, and discipline metrics. Higher voltage = better performance!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Gauge */}
          <div className="relative w-full max-w-sm mx-auto">
            <svg viewBox="0 0 200 120" className="w-full">
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="16"
                strokeLinecap="round"
              />
              
              {/* Score zones */}
              <path
                d="M 20 100 A 80 80 0 0 1 60 40"
                fill="none"
                stroke="#ef4444"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 60 40 A 80 80 0 0 1 100 20"
                fill="none"
                stroke="#fb923c"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 100 20 A 80 80 0 0 1 140 40"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 140 40 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeLinecap="round"
              />
              
              {/* Needle */}
              <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: rotation }}
                transition={{ duration: 1, ease: "easeInOut" }}
                style={{ transformOrigin: '100px 100px' }}
              >
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke={getScoreColor()}
                  strokeWidth="3"
                />
                <circle cx="100" cy="100" r="6" fill={getScoreColor()} />
              </motion.g>
              
              {/* Score labels */}
              <text x="20" y="115" className="text-xs fill-current text-muted-foreground">0</text>
              <text x="92" y="15" className="text-xs fill-current text-muted-foreground">50</text>
              <text x="170" y="115" className="text-xs fill-current text-muted-foreground">100</text>
            </svg>
            
            {/* Score display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl font-bold" style={{ color: getScoreColor() }}>
                  {score}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getScoreLabel()}
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Component breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Score Components</h4>
            
            <div className="space-y-2">
              {[
                { label: 'Win Rate', value: components.winRate, weight: 20 },
                { label: 'Profit Factor', value: components.profitFactor, weight: 20 },
                { label: 'Risk/Reward', value: components.riskReward, weight: 15 },
                { label: 'Consistency', value: components.consistency, weight: 20 },
                { label: 'Recovery', value: components.recovery, weight: 15 },
                { label: 'Discipline', value: components.discipline, weight: 10 }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.label}</span>
                    <span className="text-xs text-muted-foreground">({item.weight}%)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className={`h-2 rounded-full ${
                          item.value >= 80 ? 'bg-green-600' :
                          item.value >= 60 ? 'bg-amber-600' :
                          item.value >= 40 ? 'bg-orange-600' :
                          'bg-red-600'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium min-w-[3ch] text-right ${getComponentColor(item.value)}`}>
                      {safeToFixed(item.value, 0)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Insights */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {score >= 80 ? (
                "⚡ High Voltage Trading! Your performance is fully charged with excellent discipline and consistency. Keep the current flowing!"
              ) : score >= 60 ? (
                "🔌 Good Power Output! Your trading is well-connected. Boost your weakest circuits to reach maximum voltage."
              ) : score >= 40 ? (
                "🔋 Running on Low Power. Recharge your strategy by improving consistency and risk management circuits."
              ) : (
                "⚠️ Power Outage Alert! Your trading system needs a complete rewire. Focus on discipline, risk management, and consistency."
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}