'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TradingSetupService, type TradingSetup } from '@/lib/services/trading-setup-service'
import { findUserByClerkId, findTradesByUserId, type Trade } from '@/lib/db-memory'
import { formatCurrency } from '@/lib/calculations'
import { useSettings } from '@/lib/settings'
import { motion } from 'framer-motion'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  GitBranch,
  Circle,
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'

interface SetupEvent {
  id: string
  setupId: string
  setupName: string
  type: 'created' | 'modified' | 'deactivated' | 'reactivated' | 'performance_milestone'
  date: Date
  description: string
  metrics?: {
    winRate?: number
    profitFactor?: number
    totalTrades?: number
    totalPnL?: number
  }
  changes?: {
    field: string
    from: any
    to: any
  }[]
}

export function SetupEvolution() {
  const { settings } = useSettings()
  const [loading, setLoading] = useState(true)
  const [setups, setSetups] = useState<TradingSetup[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [events, setEvents] = useState<SetupEvent[]>([])
  const [selectedSetup, setSelectedSetup] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const user = await findUserByClerkId('demo-user')
      if (!user) return

      const [userSetups, userTrades] = await Promise.all([
        TradingSetupService.getSetupsByUserId(user.id),
        findTradesByUserId(user.id)
      ])

      setSetups(userSetups)
      setTrades(userTrades)

      // Generate timeline events
      const timelineEvents = generateTimelineEvents(userSetups, userTrades)
      setEvents(timelineEvents)
    } catch (error) {
      console.error('Failed to fetch evolution data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTimelineEvents = (setups: TradingSetup[], trades: Trade[]): SetupEvent[] => {
    const events: SetupEvent[] = []

    setups.forEach(setup => {
      // Creation event
      events.push({
        id: `${setup.id}-created`,
        setupId: setup.id,
        setupName: setup.name,
        type: 'created',
        date: setup.createdAt,
        description: `Setup "${setup.name}" created`
      })

      // Calculate performance at different milestones
      const setupTrades = trades.filter(t => t.setupId === setup.id)
      const milestones = [10, 25, 50, 100]
      
      milestones.forEach(milestone => {
        if (setupTrades.length >= milestone) {
          const milestoneTrades = setupTrades.slice(0, milestone)
          const metrics = TradingSetupService.analyzeSetupPerformance(setup, milestoneTrades)
          
          events.push({
            id: `${setup.id}-milestone-${milestone}`,
            setupId: setup.id,
            setupName: setup.name,
            type: 'performance_milestone',
            date: milestoneTrades[milestone - 1].createdAt,
            description: `Reached ${milestone} trades`,
            metrics: {
              winRate: metrics.winRate,
              profitFactor: metrics.profitFactor,
              totalTrades: milestone,
              totalPnL: metrics.totalPnL
            }
          })
        }
      })

      // Deactivation event
      if (!setup.isActive) {
        events.push({
          id: `${setup.id}-deactivated`,
          setupId: setup.id,
          setupName: setup.name,
          type: 'deactivated',
          date: setup.updatedAt,
          description: `Setup deactivated`
        })
      }
    })

    // Sort events by date
    return events.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const getEventIcon = (type: SetupEvent['type']) => {
    switch (type) {
      case 'created':
        return <Circle className="h-4 w-4" />
      case 'modified':
        return <Edit3 className="h-4 w-4" />
      case 'deactivated':
        return <XCircle className="h-4 w-4" />
      case 'reactivated':
        return <CheckCircle2 className="h-4 w-4" />
      case 'performance_milestone':
        return <Target className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getEventColor = (type: SetupEvent['type']) => {
    switch (type) {
      case 'created':
        return 'text-blue-600 bg-blue-100'
      case 'modified':
        return 'text-purple-600 bg-purple-100'
      case 'deactivated':
        return 'text-red-600 bg-red-100'
      case 'reactivated':
        return 'text-green-600 bg-green-100'
      case 'performance_milestone':
        return 'text-amber-600 bg-amber-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  const filteredEvents = selectedSetup 
    ? events.filter(e => e.setupId === selectedSetup)
    : events

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Setup Evolution Timeline
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedSetup === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSetup(null)}
              >
                All Setups
              </Button>
              {setups.map(setup => (
                <Button
                  key={setup.id}
                  variant={selectedSetup === setup.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSetup(setup.id)}
                >
                  {setup.name}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Events */}
        <div className="space-y-4">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex items-start gap-4"
            >
              {/* Event marker */}
              <div className={cn(
                "relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background",
                getEventColor(event.type)
              )}>
                {getEventIcon(event.type)}
              </div>

              {/* Event content */}
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{event.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{event.setupName}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(event.date, 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({formatDistanceToNow(event.date, { addSuffix: true })})
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Performance metrics for milestones */}
                {event.type === 'performance_milestone' && event.metrics && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Win Rate</p>
                        <p className={cn(
                          "font-medium",
                          event.metrics.winRate >= 50 ? "text-green-600" : "text-red-600"
                        )}>
                          {event.metrics.winRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Profit Factor</p>
                        <p className={cn(
                          "font-medium",
                          event.metrics.profitFactor >= 1 ? "text-green-600" : "text-red-600"
                        )}>
                          {event.metrics.profitFactor.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total P&L</p>
                        <p className={cn(
                          "font-medium",
                          event.metrics.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(event.metrics.totalPnL, settings)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Trades</p>
                        <p className="font-medium">{event.metrics.totalTrades}</p>
                      </div>
                    </div>
                  </CardContent>
                )}

                {/* Changes for modifications */}
                {event.changes && event.changes.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      {event.changes.map((change, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-muted-foreground">{change.field}:</span>
                          <span className="line-through mx-2">{change.from}</span>
                          <span className="font-medium">{change.to}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Evolution History</h3>
            <p className="text-muted-foreground">
              Start creating and using setups to see their evolution over time.
            </p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {filteredEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolution Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Events</p>
                <p className="text-lg font-semibold">{filteredEvents.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Setups</p>
                <p className="text-lg font-semibold">
                  {setups.filter(s => s.isActive).length} / {setups.length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Milestones Reached</p>
                <p className="text-lg font-semibold">
                  {filteredEvents.filter(e => e.type === 'performance_milestone').length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Evolution Period</p>
                <p className="text-lg font-semibold">
                  {filteredEvents.length > 0 
                    ? formatDistanceToNow(filteredEvents[filteredEvents.length - 1].date)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}