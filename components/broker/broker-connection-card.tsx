'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  MoreVertical, 
  RefreshCw, 
  Trash2, 
  Download,
  Link2,
  LinkOff,
  Clock,
  AlertCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BrokerConnection } from '@/lib/types/broker'
import { formatDistanceToNow } from 'date-fns'

interface BrokerConnectionCardProps {
  connection: BrokerConnection
  onSync?: () => void
  onDisconnect?: () => void
  onRemove?: () => void
  onToggleAutoSync?: (enabled: boolean) => void
}

export function BrokerConnectionCard({
  connection,
  onSync,
  onDisconnect,
  onRemove,
  onToggleAutoSync
}: BrokerConnectionCardProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await onSync?.()
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      await onDisconnect?.()
    } finally {
      setIsDisconnecting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 dark:bg-green-950'
      case 'connecting':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
      case 'disconnected':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-950'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Link2 className="h-3 w-3" />
      case 'connecting':
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case 'disconnected':
        return <LinkOff className="h-3 w-3" />
      case 'error':
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Platform Icon */}
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {connection.platform}
              </span>
            </div>

            {/* Account Info */}
            <div className="space-y-1">
              <h3 className="font-semibold">{connection.accountName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Login: {connection.accountLogin}</span>
                <span>•</span>
                <span>{connection.serverName}</span>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="secondary" 
                  className={`gap-1 ${getStatusColor(connection.connectionStatus)}`}
                >
                  {getStatusIcon(connection.connectionStatus)}
                  {connection.connectionStatus}
                </Badge>
                
                {connection.lastSync && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last sync: {formatDistanceToNow(new Date(connection.lastSync), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Auto-sync Toggle */}
            <div className="flex items-center gap-2 mr-2">
              <label className="text-sm text-gray-600">Auto-sync</label>
              <Switch
                checked={connection.autoSync}
                onCheckedChange={onToggleAutoSync}
                disabled={connection.connectionStatus !== 'connected'}
              />
            </div>

            {/* Sync Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={connection.connectionStatus !== 'connected' || isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Sync
                </>
              )}
            </Button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleSync}
                  disabled={connection.connectionStatus !== 'connected'}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={handleDisconnect}
                  disabled={
                    connection.connectionStatus === 'disconnected' || 
                    isDisconnecting
                  }
                >
                  <LinkOff className="h-4 w-4 mr-2" />
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={onRemove}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Connection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}