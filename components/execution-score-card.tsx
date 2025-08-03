'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, TrendingUp, Zap, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExecutionScoreCardProps {
  score: number
  insights: string[]
}

export function ExecutionScoreCard({ score, insights }: ExecutionScoreCardProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent Execution'
    if (score >= 60) return 'Good Execution'
    if (score >= 40) return 'Average Execution'
    return 'Poor Execution'
  }

  const getProgressColor = () => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 60) return 'bg-amber-600'
    if (score >= 40) return 'bg-orange-600'
    return 'bg-red-600'
  }

  const getIcon = () => {
    if (score >= 80) return <CheckCircle className="h-8 w-8 text-green-600" />
    if (score >= 60) return <TrendingUp className="h-8 w-8 text-amber-600" />
    return <AlertCircle className="h-8 w-8 text-red-600" />
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Execution Score
          </div>
          {getIcon()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className={cn("text-6xl font-bold mb-2", getScoreColor())}
          >
            {score}
          </motion.div>
          <p className={cn("text-lg font-medium", getScoreColor())}>
            {getScoreLabel()}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Execution Quality</span>
            <span>{score}/100</span>
          </div>
          <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn("h-full rounded-full", getProgressColor())}
            />
          </div>
        </div>
        
        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Key Insights</h4>
            <div className="space-y-2">
              {insights.slice(0, 3).map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{insight}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Performance Breakdown */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {score >= 80 ? (
              "⚡ Outstanding execution quality! Your order management and timing are excellent."
            ) : score >= 60 ? (
              "💪 Good execution with room for improvement. Focus on reducing slippage and optimizing exits."
            ) : score >= 40 ? (
              "📊 Average execution quality. Review your order types and consider market conditions."
            ) : (
              "⚠️ Significant execution issues detected. Analyze your trading process and consider improvements."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}