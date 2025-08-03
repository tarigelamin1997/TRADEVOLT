'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevengeAnalysis, RevengeIndicators } from '@/lib/services/behavioral-analysis-service'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { safeToFixed } from '@/lib/utils/safe-format'
import { AlertTriangle, ShieldAlert, CheckCircle, TrendingUp, Clock, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevengeAlertProps {
  revenge: RevengeAnalysis
}

export function RevengeAlert({ revenge }: RevengeAlertProps) {
  const { settings } = useSettings()
  
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200'
      case 'low': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
    }
  }
  
  const getIndicatorIcon = (indicator: keyof RevengeIndicators) => {
    switch (indicator) {
      case 'positionSizeIncrease': return <DollarSign className="h-4 w-4" />
      case 'reducedTimeBetweenTrades': return <Clock className="h-4 w-4" />
      case 'winRateDegradation': return <TrendingUp className="h-4 w-4" />
      case 'volumeSpike': return <BarChart3 className="h-4 w-4" />
      case 'aggressiveRecovery': return <ShieldAlert className="h-4 w-4" />
    }
  }
  
  const getIndicatorLabel = (indicator: keyof RevengeIndicators) => {
    switch (indicator) {
      case 'positionSizeIncrease': return 'Increased Position Size'
      case 'reducedTimeBetweenTrades': return 'Quick Re-entry'
      case 'winRateDegradation': return 'Lower Win Rate'
      case 'volumeSpike': return 'Volume Spike'
      case 'aggressiveRecovery': return 'Aggressive Recovery'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Revenge Trading Detection
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Alert Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "rounded-lg border-2 p-4",
              revenge.detected
                ? "bg-red-50 dark:bg-red-900/20 border-red-200"
                : "bg-green-50 dark:bg-green-900/20 border-green-200"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-lg mb-1">
                  {revenge.detected ? 'Revenge Trading Detected' : 'No Revenge Trading Detected'}
                </h4>
                <p className={cn(
                  "text-sm",
                  revenge.detected ? "text-red-600" : "text-green-600"
                )}>
                  {revenge.detected 
                    ? `${revenge.totalIncidents} incident${revenge.totalIncidents > 1 ? 's' : ''} detected`
                    : 'Your trading shows good emotional control'
                  }
                </p>
                {revenge.detected && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Discipline Score: {100 - revenge.score}/100
                  </p>
                )}
              </div>
              <div>
                {revenge.detected ? (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Revenge Trading Metrics */}
          {revenge.detected && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  <div className="text-sm text-muted-foreground">Total Incidents</div>
                  <div className="text-2xl font-bold text-red-600">
                    {revenge.totalIncidents}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  <div className="text-sm text-muted-foreground">Severity Score</div>
                  <div className="text-2xl font-bold text-amber-600">
                    {revenge.score}
                  </div>
                  <div className="text-xs text-muted-foreground">out of 100</div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  <div className="text-sm text-muted-foreground">Avg Recovery Attempt</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(revenge.averageRecoveryAttempt, settings)}
                  </div>
                </motion.div>
              </div>
              
              {/* Recent Incidents */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Recent Incidents</h4>
                
                <div className="space-y-3">
                  {revenge.incidents.slice(0, 3).map((incident, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={cn(
                        "rounded-lg border p-3",
                        getSeverityColor(incident.severity)
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {new Date(incident.triggerTrade.exitTime || incident.triggerTrade.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Trigger: {incident.triggerTrade.symbol} (Loss: {formatCurrency(
                              calculateMarketPnL(incident.triggerTrade, incident.triggerTrade.marketType) || 0,
                              settings
                            )})
                          </p>
                        </div>
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          incident.severity === 'high' ? "bg-red-600 text-white" :
                          incident.severity === 'medium' ? "bg-amber-600 text-white" :
                          "bg-yellow-600 text-white"
                        )}>
                          {incident.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Indicators */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(incident.indicators).map(([key, value]) => 
                          value && (
                            <span
                              key={key}
                              className="flex items-center gap-1 text-xs bg-white dark:bg-gray-900 rounded px-2 py-1"
                            >
                              {getIndicatorIcon(key as keyof RevengeIndicators)}
                              {getIndicatorLabel(key as keyof RevengeIndicators)}
                            </span>
                          )
                        )}
                      </div>
                      
                      <p className="text-xs mt-2">
                        {incident.revengeTrades.length} revenge trade{incident.revengeTrades.length > 1 ? 's' : ''} attempted
                      </p>
                    </motion.div>
                  ))}
                </div>
                
                {revenge.incidents.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{revenge.incidents.length - 3} more incidents
                  </p>
                )}
              </div>
            </>
          )}
          
          {/* Insights and Recommendations */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Emotional Trading Insights</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {revenge.detected ? (
                <>
                  {revenge.score >= 50 && (
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-red-600">High Risk:</strong> Your revenge trading score of {revenge.score} indicates serious emotional control issues that are likely impacting your profitability.
                      </p>
                    </div>
                  )}
                  
                  {revenge.incidents.some(i => i.indicators.positionSizeIncrease) && (
                    <div className="flex gap-2">
                      <DollarSign className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-amber-600">Position Sizing:</strong> You tend to increase position sizes after losses. This is a dangerous pattern that can lead to large drawdowns.
                      </p>
                    </div>
                  )}
                  
                  {revenge.incidents.some(i => i.indicators.reducedTimeBetweenTrades) && (
                    <div className="flex gap-2">
                      <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-amber-600">Quick Re-entries:</strong> You often enter new trades quickly after losses. Take time to reset emotionally before the next trade.
                      </p>
                    </div>
                  )}
                  
                  <p className="pt-2">
                    💡 <strong>Prevention Tips:</strong>
                  </p>
                  <ul className="ml-6 space-y-1">
                    <li>• Implement a &quot;cooling-off&quot; period after any loss</li>
                    <li>• Reduce position size by 50% after consecutive losses</li>
                    <li>• Set daily loss limits and stick to them</li>
                    <li>• Keep a trading journal to track emotional state</li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-green-600">Excellent Discipline:</strong> You show great emotional control with no signs of revenge trading. This is a key factor in long-term trading success.
                    </p>
                  </div>
                  
                  <p className="pt-2">
                    💪 <strong>Keep it up!</strong> Continue maintaining your disciplined approach and emotional control.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Add missing import
import { BarChart3 } from 'lucide-react'
import { calculateMarketPnL } from '@/lib/market-knowledge'