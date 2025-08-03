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
  Target,
  Save,
  RotateCcw,
  CreditCard,
  Check,
  DollarSign
} from "lucide-react"
import { useSettings, DEFAULT_SETTINGS, type UserSettings } from '@/lib/settings'
import { MARKET_TYPES } from '@/lib/market-knowledge'
import { useTheme } from '@/lib/theme-provider'

export default function SettingsPage() {
  const router = useRouter()
  const { settings, updateSettings } = useSettings()
  const { setTheme } = useTheme()
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

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
                  <TabsTrigger value="goals">
                    <Target className="h-4 w-4 mr-2" />
                    Goals
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

                <TabsContent value="goals" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trading Goals</CardTitle>
                      <CardDescription>
                        Set targets to track your progress and stay motivated
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
      </>
    </SidebarLayout>
  )
}