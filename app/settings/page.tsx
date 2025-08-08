'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarLayout } from '@/components/sidebar-layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Palette,
  Database,
  Bell,
  Save,
  RotateCcw,
  CreditCard,
  Check,
  DollarSign,
  Link2,
  Plus,
  Loader2
} from "lucide-react"
import { useSettings, DEFAULT_SETTINGS, type UserSettings } from '@/lib/settings'
import { MARKET_TYPES } from '@/lib/market-knowledge'
import { useTheme } from '@/lib/theme-provider'
import { BrokerConnectionDialog } from '@/components/broker/broker-connection-dialog'
import { BrokerConnectionCard } from '@/components/broker/broker-connection-card'
import { BrokerConnection } from '@/lib/types/broker'

export default function SettingsPage() {
  const router = useRouter()
  const { settings, updateSettings } = useSettings()
  const { setTheme } = useTheme()
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  
  // Broker connection state
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<'MT4' | 'MT5' | 'cTrader' | null>(null)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // Load broker connections
  useEffect(() => {
    loadBrokerConnections()
  }, [])

  const loadBrokerConnections = async () => {
    setIsLoadingConnections(true)
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getBrokerConnections' })
      })
      
      const data = await response.json()
      if (data.connections) {
        setBrokerConnections(data.connections)
      }
    } catch (error) {
      console.error('Failed to load broker connections:', error)
    } finally {
      setIsLoadingConnections(false)
    }
  }

  const handleBrokerSync = async (connectionId: string) => {
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncBrokerTrades',
          connectionId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // Reload connections to update lastSync time
        loadBrokerConnections()
      }
    } catch (error) {
      console.error('Failed to sync trades:', error)
    }
  }

  const handleBrokerDisconnect = async (connectionId: string) => {
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnectBroker',
          connectionId
        })
      })
      
      if (response.ok) {
        loadBrokerConnections()
      }
    } catch (error) {
      console.error('Failed to disconnect broker:', error)
    }
  }

  const handleBrokerRemove = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return
    
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeBrokerConnection',
          connectionId
        })
      })
      
      if (response.ok) {
        setBrokerConnections(prev => prev.filter(c => c.id !== connectionId))
      }
    } catch (error) {
      console.error('Failed to remove connection:', error)
    }
  }

  const handleAutoSyncToggle = async (connectionId: string, enabled: boolean) => {
    // Update local state immediately for responsiveness
    setBrokerConnections(prev => 
      prev.map(c => c.id === connectionId ? { ...c, autoSync: enabled } : c)
    )
    
    // TODO: Implement API call to update autoSync setting
  }

  const handleChange = (section: keyof UserSettings, field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
    setSaveStatus('idle')
  }

  const handleNestedChange = (section: keyof UserSettings, subsection: string, field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value
        }
      }
    }))
    setHasChanges(true)
    setSaveStatus('idle')
  }

  const handleSave = () => {
    setSaveStatus('saving')
    updateSettings(localSettings)
    // Apply theme change immediately
    setTheme(localSettings.display.theme)
    setTimeout(() => {
      setSaveStatus('saved')
      setHasChanges(false)
    }, 500)
  }

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS)
    setHasChanges(true)
    setSaveStatus('idle')
  }

  return (
    <SidebarLayout currentPath="/settings">
      <>
        <header className="flex items-center justify-between border-b px-6 py-4">
          <h1 className="text-xl font-semibold">Settings</h1>
          <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveStatus === 'saving' ? 'Saving...' : 
                 saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-4xl mx-auto">
              <Tabs defaultValue="trading" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="trading">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Trading
                  </TabsTrigger>
                  <TabsTrigger value="display">
                    <Palette className="h-4 w-4 mr-2" />
                    Display
                  </TabsTrigger>
                  <TabsTrigger value="data">
                    <Database className="h-4 w-4 mr-2" />
                    Data
                  </TabsTrigger>
                  <TabsTrigger value="alerts">
                    <Bell className="h-4 w-4 mr-2" />
                    Alerts
                  </TabsTrigger>
                  <TabsTrigger value="broker">
                    <Link2 className="h-4 w-4 mr-2" />
                    Broker Integration
                  </TabsTrigger>
                  <TabsTrigger value="subscription">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscription
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trading" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trading Defaults</CardTitle>
                      <CardDescription>
                        Set your default trading preferences to save time when entering trades
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Default Market Type</Label>
                          <select
                            value={localSettings.trading.defaultMarketType}
                            onChange={(e) => handleChange('trading', 'defaultMarketType', e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            {Object.entries(MARKET_TYPES).map(([key, market]) => (
                              <option key={key} value={key}>
                                {market.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Account Currency</Label>
                          <select
                            value={localSettings.trading.accountCurrency}
                            onChange={(e) => handleChange('trading', 'accountCurrency', e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                            <option value="AUD">AUD (A$)</option>
                            <option value="CAD">CAD (C$)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Starting Balance</Label>
                        <Input
                          type="number"
                          value={localSettings.trading.startingBalance}
                          onChange={(e) => handleChange('trading', 'startingBalance', parseFloat(e.target.value) || 0)}
                          placeholder="10000"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">Commission & Fees</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Per Trade Commission</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={localSettings.trading.commission.perTrade}
                              onChange={(e) => handleNestedChange('trading', 'commission', 'perTrade', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Per Contract/Lot Fee</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={localSettings.trading.commission.perUnit}
                              onChange={(e) => handleNestedChange('trading', 'commission', 'perUnit', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">Risk Management Defaults</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Max Risk per Trade (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={localSettings.trading.riskManagement.maxRiskPerTrade}
                              onChange={(e) => handleNestedChange('trading', 'riskManagement', 'maxRiskPerTrade', parseFloat(e.target.value) || 0)}
                              placeholder="2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Default Stop Loss (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={localSettings.trading.riskManagement.defaultStopLoss}
                              onChange={(e) => handleNestedChange('trading', 'riskManagement', 'defaultStopLoss', parseFloat(e.target.value) || 0)}
                              placeholder="1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Default Position Size</Label>
                            <Input
                              type="number"
                              value={localSettings.trading.riskManagement.defaultPositionSize}
                              onChange={(e) => handleNestedChange('trading', 'riskManagement', 'defaultPositionSize', parseFloat(e.target.value) || 0)}
                              placeholder="100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">Trading Goals</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Monthly Profit Target</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={localSettings.goals.monthlyProfitTarget}
                                onChange={(e) => handleChange('goals', 'monthlyProfitTarget', parseFloat(e.target.value) || 0)}
                                placeholder="1000"
                              />
                              <span className="text-gray-500">{localSettings.trading.accountCurrency}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Win Rate Target</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={localSettings.goals.winRateTarget}
                                onChange={(e) => handleChange('goals', 'winRateTarget', parseFloat(e.target.value) || 0)}
                                placeholder="60"
                              />
                              <span className="text-gray-500">%</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Maximum Drawdown Limit</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={localSettings.goals.maxDrawdownLimit}
                                onChange={(e) => handleChange('goals', 'maxDrawdownLimit', parseFloat(e.target.value) || 0)}
                                placeholder="10"
                              />
                              <span className="text-gray-500">%</span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Alert when drawdown exceeds this percentage of your account
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="display" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Display Preferences</CardTitle>
                      <CardDescription>
                        Customize how information is displayed throughout the app
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label>Theme</Label>
                          <div className="grid grid-cols-3 gap-3 mt-2">
                            <button
                              onClick={() => handleChange('display', 'theme', 'light')}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                localSettings.display.theme === 'light' 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="w-full h-8 bg-white rounded border border-gray-200"></div>
                                <div className="text-sm font-medium">Light</div>
                              </div>
                            </button>
                            <button
                              onClick={() => handleChange('display', 'theme', 'dark')}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                localSettings.display.theme === 'dark' 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="w-full h-8 bg-gray-900 rounded border border-gray-700"></div>
                                <div className="text-sm font-medium">Dark</div>
                              </div>
                            </button>
                            <button
                              onClick={() => handleChange('display', 'theme', 'system')}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                localSettings.display.theme === 'system' 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="w-full h-8 bg-gradient-to-r from-white to-gray-900 rounded border border-gray-400"></div>
                                <div className="text-sm font-medium">System</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <select
                            value={localSettings.display.timezone}
                            onChange={(e) => handleChange('display', 'timezone', e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value={localSettings.display.timezone}>
                              {localSettings.display.timezone}
                            </option>
                            <option value="America/New_York">New York (EST/EDT)</option>
                            <option value="America/Chicago">Chicago (CST/CDT)</option>
                            <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                            <option value="Europe/London">London (GMT/BST)</option>
                            <option value="Europe/Frankfurt">Frankfurt (CET/CEST)</option>
                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                            <option value="Asia/Singapore">Singapore (SGT)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date Format</Label>
                          <select
                            value={localSettings.display.dateFormat}
                            onChange={(e) => handleChange('display', 'dateFormat', e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Time Format</Label>
                          <select
                            value={localSettings.display.timeFormat}
                            onChange={(e) => handleChange('display', 'timeFormat', e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="12h">12-hour (AM/PM)</option>
                            <option value="24h">24-hour</option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">Number Format</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Decimal Places</Label>
                            <Input
                              type="number"
                              min="0"
                              max="6"
                              value={localSettings.display.numberFormat.decimalPlaces}
                              onChange={(e) => handleNestedChange('display', 'numberFormat', 'decimalPlaces', parseInt(e.target.value) || 2)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Use Thousand Separators</Label>
                            <Switch
                              checked={localSettings.display.numberFormat.thousandSeparator}
                              onCheckedChange={(checked) => handleNestedChange('display', 'numberFormat', 'thousandSeparator', checked)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Table Density</Label>
                        <select
                          value={localSettings.display.tableDensity}
                          onChange={(e) => handleChange('display', 'tableDensity', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="compact">Compact</option>
                          <option value="comfortable">Comfortable</option>
                          <option value="spacious">Spacious</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="data" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Management</CardTitle>
                      <CardDescription>
                        Configure how your data is imported, exported, and managed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-Save Trades</Label>
                          <p className="text-sm text-gray-500">Automatically save draft trades as you type</p>
                        </div>
                        <Switch
                          checked={localSettings.data.autoSave}
                          onCheckedChange={(checked) => handleChange('data', 'autoSave', checked)}
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">CSV Import Settings</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Default Date Format</Label>
                            <Input
                              value={localSettings.data.csvImport.defaultDateFormat}
                              onChange={(e) => handleNestedChange('data', 'csvImport', 'defaultDateFormat', e.target.value)}
                              placeholder="YYYY-MM-DD"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Skip First Row (Headers)</Label>
                            <Switch
                              checked={localSettings.data.csvImport.skipFirstRow}
                              onCheckedChange={(checked) => handleNestedChange('data', 'csvImport', 'skipFirstRow', checked)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">Export Settings</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Default Export Format</Label>
                            <select
                              value={localSettings.data.export.defaultFormat}
                              onChange={(e) => handleNestedChange('data', 'export', 'defaultFormat', e.target.value)}
                              className="w-full p-2 border rounded"
                            >
                              <option value="csv">CSV</option>
                              <option value="json">JSON</option>
                              <option value="pdf">PDF Report</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Include Open Trades</Label>
                            <Switch
                              checked={localSettings.data.export.includeOpenTrades}
                              onCheckedChange={(checked) => handleNestedChange('data', 'export', 'includeOpenTrades', checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Include Notes</Label>
                            <Switch
                              checked={localSettings.data.export.includeNotes}
                              onCheckedChange={(checked) => handleNestedChange('data', 'export', 'includeNotes', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Alerts & Notifications</CardTitle>
                      <CardDescription>
                        Set up alerts to help you stay on track with your trading
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Notifications</Label>
                          <p className="text-sm text-gray-500">Get alerts for important trading events</p>
                        </div>
                        <Switch
                          checked={localSettings.alerts.enableNotifications}
                          onCheckedChange={(checked) => handleChange('alerts', 'enableNotifications', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Daily Loss Limit Alert</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Alert me when daily losses exceed</span>
                          <Input
                            type="number"
                            className="w-24"
                            value={localSettings.alerts.dailyLossLimit}
                            onChange={(e) => handleChange('alerts', 'dailyLossLimit', parseFloat(e.target.value) || 0)}
                          />
                          <span className="text-gray-500">{localSettings.trading.accountCurrency}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">Streak Alerts</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Winning Streak Alert</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Alert after</span>
                              <Input
                                type="number"
                                className="w-16"
                                value={localSettings.alerts.streakAlerts.winning}
                                onChange={(e) => handleNestedChange('alerts', 'streakAlerts', 'winning', parseInt(e.target.value) || 0)}
                              />
                              <span className="text-gray-500">wins in a row</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Losing Streak Alert</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Alert after</span>
                              <Input
                                type="number"
                                className="w-16"
                                value={localSettings.alerts.streakAlerts.losing}
                                onChange={(e) => handleNestedChange('alerts', 'streakAlerts', 'losing', parseInt(e.target.value) || 0)}
                              />
                              <span className="text-gray-500">losses in a row</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="broker" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Broker Integration</CardTitle>
                      <CardDescription>
                        Connect your trading account to automatically sync trades
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Connected Accounts */}
                      {isLoadingConnections ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : brokerConnections.length > 0 ? (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Connected Accounts</h3>
                          {brokerConnections.map((connection) => (
                            <BrokerConnectionCard
                              key={connection.id}
                              connection={connection}
                              onSync={() => handleBrokerSync(connection.id)}
                              onDisconnect={() => handleBrokerDisconnect(connection.id)}
                              onRemove={() => handleBrokerRemove(connection.id)}
                              onToggleAutoSync={(enabled) => 
                                handleAutoSyncToggle(connection.id, enabled)
                              }
                            />
                          ))}
                        </div>
                      ) : null}

                      {/* Platform Selection Cards */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Available Platforms</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* MetaTrader 4 */}
                          <div className="border rounded-lg p-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">MT4</span>
                              </div>
                              <div>
                                <h3 className="font-semibold">MetaTrader 4</h3>
                                <p className="text-sm text-gray-500">Connect to MT4 accounts</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setSelectedPlatform('MT4')
                                setShowConnectionDialog(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Account
                            </Button>
                          </div>

                          {/* MetaTrader 5 */}
                          <div className="border rounded-lg p-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">MT5</span>
                              </div>
                              <div>
                                <h3 className="font-semibold">MetaTrader 5</h3>
                                <p className="text-sm text-gray-500">Connect to MT5 accounts</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setSelectedPlatform('MT5')
                                setShowConnectionDialog(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Account
                            </Button>
                          </div>

                          {/* cTrader */}
                          <div className="border rounded-lg p-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-semibold">cTrader</h3>
                                <p className="text-sm text-gray-500">OAuth secure connection</p>
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setSelectedPlatform('cTrader')
                                setShowConnectionDialog(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Account
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Coming Soon */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Coming Soon</h4>
                        <div className="grid gap-3">
                          <div className="border rounded-lg p-4 opacity-50">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-400">TD</span>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">TD Ameritrade / ThinkOrSwim</h4>
                                <p className="text-xs text-gray-500">Schwab API integration</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-4 opacity-50">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-400">IB</span>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Interactive Brokers</h4>
                                <p className="text-xs text-gray-500">TWS API integration</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-4 opacity-50">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-400">TV</span>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">TradingView</h4>
                                <p className="text-xs text-gray-500">Webhook integration</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-500">
                          Broker integrations allow automatic trade synchronization. Your credentials are encrypted and never stored on our servers.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Manage Your Subscription</CardTitle>
                      <CardDescription>
                        View and manage your Trading Journal Pro subscription
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">Current Plan</h3>
                            <p className="text-gray-600">Free Plan</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">$0</p>
                            <p className="text-sm text-gray-500">per month</p>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Free Plan Features:</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>Track unlimited trades</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>Basic P&L tracking</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>Essential metrics (7 metrics)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>CSV import/export</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="border rounded-lg p-6 space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">Pro Plan</h3>
                            <p className="text-gray-600">Everything in Free, plus:</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">$15</p>
                            <p className="text-sm text-gray-500">per month</p>
                          </div>
                        </div>
                        
                        <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                              <span>All 16 professional metrics</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                              <span>Risk management metrics</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                              <span>Advanced risk-adjusted metrics</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                              <span>Priority support</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-blue-600 mt-0.5" />
                              <span>Advanced charts & visualizations</span>
                            </li>
                          </ul>
                        </div>
                        
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/subscribe')}>
                          Upgrade to Pro
                        </Button>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Billing Information</h4>
                        <p className="text-sm text-gray-600">No payment method on file</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
          
          {/* Apply Changes Button */}
          <div className="fixed bottom-6 right-6 z-50">
            {hasChanges && (
              <Button
                size="lg"
                onClick={handleSave}
                className="shadow-lg"
              >
                <Check className="h-5 w-5 mr-2" />
                Apply Changes
              </Button>
            )}
          </div>

          {/* Broker Connection Dialog */}
          <BrokerConnectionDialog
            open={showConnectionDialog}
            onOpenChange={(open) => {
              setShowConnectionDialog(open)
              if (!open) setSelectedPlatform(null)
            }}
            initialPlatform={selectedPlatform || undefined}
            onSuccess={() => {
              loadBrokerConnections()
              setSelectedPlatform(null)
            }}
          />
      </>
    </SidebarLayout>
  )
}