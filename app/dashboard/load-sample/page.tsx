'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SidebarLayout } from '@/components/sidebar-layout'
import { COMPREHENSIVE_SAMPLE_TRADES, SAMPLE_STATS } from '@/lib/comprehensive-sample-trades'
import { ArrowLeft, Database, Loader2, CheckCircle, AlertCircle, TrendingUp, DollarSign, Activity, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoadSampleDataPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)

  const loadSampleData = async () => {
    setLoading(true)
    setStatus('loading')
    setMessage('Loading sample trades...')
    setProgress(0)

    let successCount = 0
    let errorCount = 0

    try {
      // Load trades in batches
      const batchSize = 5
      const totalTrades = COMPREHENSIVE_SAMPLE_TRADES.length

      for (let i = 0; i < totalTrades; i += batchSize) {
        const batch = COMPREHENSIVE_SAMPLE_TRADES.slice(i, Math.min(i + batchSize, totalTrades))
        
        // Process batch in parallel
        const promises = batch.map(async (trade) => {
          try {
            const response = await fetch('/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'addTrade',
                ...trade,
                id: undefined // Let API generate ID
              })
            })

            if (response.ok) {
              successCount++
              return true
            } else {
              errorCount++
              return false
            }
          } catch (error) {
            errorCount++
            return false
          }
        })

        await Promise.all(promises)
        
        // Update progress
        const currentProgress = Math.round(((i + batch.length) / totalTrades) * 100)
        setProgress(currentProgress)
        setMessage(`Loading trades... ${successCount} completed`)
      }

      if (successCount > 0) {
        setStatus('success')
        setMessage(`Successfully loaded ${successCount} trades! ${errorCount > 0 ? `(${errorCount} failed)` : ''}`)
      } else {
        setStatus('error')
        setMessage('Failed to load sample data')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred while loading sample data')
      console.error('Error loading sample data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Load Sample Data
            </CardTitle>
            <CardDescription>
              Load comprehensive sample trading data to explore all features and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Trades</span>
                </div>
                <p className="text-2xl font-bold mt-1">{SAMPLE_STATS.totalTrades}</p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Market Types</span>
                </div>
                <p className="text-2xl font-bold mt-1">5</p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Symbols</span>
                </div>
                <p className="text-2xl font-bold mt-1">{SAMPLE_STATS.uniqueSymbols}</p>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">With Setups</span>
                </div>
                <p className="text-2xl font-bold mt-1">{SAMPLE_STATS.tradesWithSetups}</p>
              </div>
            </div>

            {/* What's Included */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">What's Included:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Diverse trades across Stocks, Forex, Crypto, Futures, and Options</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Winning and losing streaks for behavioral analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Various trading patterns: scalps, day trades, swing trades</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Advanced metrics: MAE/MFE, stop losses, partial exits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Rule compliance scoring and setup tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Open positions for portfolio testing</span>
                </li>
              </ul>
            </div>

            {/* Progress Bar */}
            {status === 'loading' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{message}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status Messages */}
            {status === 'success' && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">{message}</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    You can now view all metrics and analytics in the dashboard
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">{message}</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Please try again or check the console for errors
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={loadSampleData}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Sample Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Load Sample Data
                  </>
                )}
              </Button>

              {status === 'success' && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  View Dashboard
                </Button>
              )}
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This will add sample trades to your account. The trades are marked with descriptive notes to identify them as samples.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}