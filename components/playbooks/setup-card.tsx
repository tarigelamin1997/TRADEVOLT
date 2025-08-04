'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TradingSetup } from '@/lib/db-memory'
import { SetupPerformanceMetrics } from '@/lib/services/trading-setup-service'
import { 
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface SetupCardProps {
  setup: TradingSetup
  metrics: SetupPerformanceMetrics
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}

export function SetupCard({ setup, metrics, onEdit, onDelete, onToggleActive }: SetupCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Trend':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'Reversal':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
      case 'Breakout':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case 'Range':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
      case 'News':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const totalRules = setup.entryRules.length + setup.exitRules.length + setup.riskRules.length

  return (
    <Card className={cn(
      "relative transition-all hover:shadow-lg",
      !setup.isActive && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{setup.name}</h3>
              {setup.isActive ? (
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
            <Badge variant="outline" className={cn("text-xs", getCategoryColor(setup.category))}>
              {setup.category}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Setup
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {setup.isActive ? (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {setup.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Performance Stats */}
        {metrics.totalTrades > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className={cn(
                  "text-lg font-semibold",
                  metrics.winRate >= 50 ? "text-green-600" : "text-red-600"
                )}>
                  {metrics.winRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trades</p>
                <p className="text-lg font-semibold">{metrics.totalTrades}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Expectancy</p>
                <p className={cn(
                  "text-sm font-medium",
                  metrics.expectancy >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  ${metrics.expectancy.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Profit Factor</p>
                <p className={cn(
                  "text-sm font-medium",
                  metrics.profitFactor >= 1.5 ? "text-green-600" :
                  metrics.profitFactor >= 1 ? "text-amber-600" :
                  "text-red-600"
                )}>
                  {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Compliance Score */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Rule Compliance</span>
                <span className={cn(
                  "text-sm font-medium",
                  metrics.avgComplianceScore >= 90 ? "text-green-600" :
                  metrics.avgComplianceScore >= 70 ? "text-amber-600" :
                  "text-red-600"
                )}>
                  {metrics.avgComplianceScore.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all",
                    metrics.avgComplianceScore >= 90 ? "bg-green-600" :
                    metrics.avgComplianceScore >= 70 ? "bg-amber-600" :
                    "bg-red-600"
                  )}
                  style={{ width: `${metrics.avgComplianceScore}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No trades yet</p>
          </div>
        )}
        
        {/* Setup Info */}
        <div className="space-y-2 pt-3 border-t text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rules</span>
            <span className="font-medium">{totalRules} total</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Target R:R</span>
            <span className="font-medium">{setup.targetRiskReward}:1</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Max Risk</span>
            <span className="font-medium">{setup.maxLossPerTrade}%</span>
          </div>
        </div>
        
        {/* Last Used */}
        {metrics.lastUsed && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last used {formatDistanceToNow(metrics.lastUsed, { addSuffix: true })}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}