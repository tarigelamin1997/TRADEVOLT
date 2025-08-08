'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Shield } from "lucide-react"
import { CreateBrokerConnectionData } from '@/lib/types/broker'

interface BrokerConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (connectionId: string) => void
  initialPlatform?: 'MT4' | 'MT5' | 'cTrader'
}

// Popular MT4/5 servers for autocomplete
const POPULAR_SERVERS = {
  MT4: [
    'ICMarketsSC-Demo',
    'ICMarketsSC-Live',
    'Pepperstone-Demo',
    'Pepperstone-Live',
    'XMGlobal-Demo',
    'XMGlobal-Real',
    'FxPro-Demo',
    'FxPro-Live',
    'Exness-Demo',
    'Exness-Real'
  ],
  MT5: [
    'ICMarkets-MT5',
    'Pepperstone-MT5',
    'XMGlobal-MT5',
    'FxPro-MT5',
    'Exness-MT5',
    'RoboForex-ECN',
    'Tickmill-Demo',
    'Tickmill-Live'
  ],
  cTrader: [] // cTrader uses OAuth, no server list needed
}

export function BrokerConnectionDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  initialPlatform 
}: BrokerConnectionDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form fields
  const [platform, setPlatform] = useState<'MT4' | 'MT5' | 'cTrader'>(initialPlatform || 'MT4')
  const [accountName, setAccountName] = useState('')
  const [accountLogin, setAccountLogin] = useState('')
  const [password, setPassword] = useState('')
  const [serverName, setServerName] = useState('')
  const [autoSync, setAutoSync] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Reset platform when dialog opens with new initialPlatform
  useEffect(() => {
    if (open && initialPlatform) {
      setPlatform(initialPlatform)
    }
  }, [open, initialPlatform])

  const handleConnect = async () => {
    setError(null)
    setIsConnecting(true)

    try {
      // For cTrader, redirect to OAuth flow
      if (platform === 'cTrader') {
        window.location.href = '/api/auth/ctrader/connect';
        return;
      }

      const connectionData: CreateBrokerConnectionData = {
        platform: platform as 'MT4' | 'MT5',
        accountName: accountName || `${platform} Account`,
        accountLogin,
        password,
        serverName,
        autoSync
      }

      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connectBroker',
          connectionData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect')
      }

      setSuccess(true)
      
      // Reset form
      setTimeout(() => {
        setAccountName('')
        setAccountLogin('')
        setPassword('')
        setServerName('')
        setAutoSync(false)
        setSuccess(false)
        onOpenChange(false)
        
        if (onSuccess && data.connection?.id) {
          onSuccess(data.connection.id)
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const isFormValid = platform === 'cTrader' ? true : (accountLogin && password && serverName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect {platform} Account</DialogTitle>
          <DialogDescription>
            {platform === 'cTrader' 
              ? 'Connect your cTrader account using secure OAuth authentication'
              : `Enter your ${platform} account credentials to automatically sync trades`
            }
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Successfully Connected!</h3>
            <p className="text-gray-600">Your {platform} account has been connected.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {platform === 'cTrader' ? (
                <>
                  {/* cTrader OAuth Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Secure OAuth Connection</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      You&apos;ll be redirected to cTrader to authorize TradeVolt to access your trading data.
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✓ No password stored on our servers</li>
                      <li>✓ Read-only access to your trades</li>
                      <li>✓ Revoke access anytime from cTrader</li>
                    </ul>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your cTrader credentials are never shared with TradeVolt. 
                      Authentication is handled securely by cTrader.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <>
                  {/* MT4/MT5 Form Fields */}
                  {/* Account Name (Optional) */}
                  <div className="space-y-2">
                    <Label>Account Name (Optional)</Label>
                    <Input
                      placeholder={`My ${platform} Account`}
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      A friendly name to identify this account
                    </p>
                  </div>

                  {/* Account Login */}
                  <div className="space-y-2">
                    <Label>Account Login</Label>
                    <Input
                      placeholder="12345678"
                      value={accountLogin}
                      onChange={(e) => setAccountLogin(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Your MT{platform === 'MT4' ? '4' : '5'} account number
                    </p>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Your MT{platform === 'MT4' ? '4' : '5'} password (investor password for read-only)
                    </p>
                  </div>

                  {/* Server Name */}
                  <div className="space-y-2">
                    <Label>Server Name</Label>
                    <Input
                      placeholder="e.g., ICMarketsSC-Demo"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      list="server-suggestions"
                      required
                    />
                    <datalist id="server-suggestions">
                      {POPULAR_SERVERS[platform].map(server => (
                        <option key={server} value={server} />
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-500">
                      Your broker&apos;s server name (check MT{platform === 'MT4' ? '4' : '5'} terminal)
                    </p>
                  </div>

                  {/* Auto Sync */}
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label>Auto-sync trades</Label>
                      <p className="text-xs text-gray-500">
                        Automatically import new trades in real-time
                      </p>
                    </div>
                    <Switch
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
                  </div>

                  {/* Security Notice */}
                  <Alert className="bg-blue-50 dark:bg-blue-950">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Your credentials are encrypted and never stored on our servers. 
                      We recommend using an investor (read-only) password for added security.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* Error Display */}
              {error && (
                <Alert className="bg-red-50 dark:bg-red-950">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isConnecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConnect}
                disabled={!isFormValid || isConnecting}
              >
                {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isConnecting ? 'Connecting...' : 'Connect Account'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}