'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  User,
  ChevronsUpDown,
  Calendar,
  Home,
  TrendingUp,
  Search,
  Settings,
  Import,
  BarChart3,
  History,
  DollarSign,
  PieChart,
  FileText,
  Shield,
  Bell,
  Download,
  Trash2,
  Save,
  AlertCircle,
  Crown,
} from "lucide-react"
import { useSubscription } from '@/lib/subscription'

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Trade History", url: "/history", icon: History },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "P&L Report", url: "/pnl", icon: DollarSign },
  { title: "Import Trades", url: "#import", icon: Import },
]

const toolsMenuItems = [
  { title: "Market Analysis", url: "/analysis", icon: TrendingUp },
  { title: "Performance Metrics", url: "/metrics", icon: PieChart },
  { title: "Trade Journal", url: "/journal", icon: FileText },
  { title: "Calendar", url: "/calendar", icon: Calendar },
]

const settingsMenuItems = [
  { title: "Search", url: "/search", icon: Search },
  { title: "Settings", url: "/settings", icon: Settings },
]

export default function SettingsPage() {
  const router = useRouter()
  const { subscription } = useSubscription()
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      winStreakAlerts: true,
      lossLimitAlerts: true,
      weeklyReport: false,
    },
    trading: {
      defaultMarketType: 'FUTURES',
      defaultQuantity: 1,
      showConfirmation: true,
      autoSaveJournal: true,
    },
    display: {
      theme: 'light',
      currency: 'USD',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
    }
  })
  const [saved, setSaved] = useState(false)

  const handleMenuClick = (url: string) => {
    router.push(url)
  }

  const handleSave = () => {
    // In production, save to backend
    localStorage.setItem('userSettings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleExportData = () => {
    // In production, generate full data export
    alert('Data export would download all your trades, journal entries, and settings')
  }

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion would be processed here')
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        isActive={item.url === '/settings'}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {toolsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        isActive={item.url === '/settings'}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleMenuClick(item.url)}
                        isActive={item.url === '/settings'}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarGroup>
              <SidebarMenuButton className="w-full justify-between gap-3 h-12">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 rounded-md" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Demo User</span>
                    <span className="text-xs text-muted-foreground">demo@tradevolt.com</span>
                  </div>
                </div>
                <ChevronsUpDown className="h-5 w-5" />
              </SidebarMenuButton>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex h-full flex-col">
            <header className="flex h-16 items-center gap-4 border-b px-6">
              <SidebarTrigger className="h-7 w-7" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Settings</h1>
              </div>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </header>

            <main className="flex-1 overflow-y-auto">
              <div className="p-6 max-w-4xl mx-auto space-y-6">
                {saved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">Settings saved successfully!</span>
                  </div>
                )}

                {/* Account & Subscription */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Account & Subscription
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Current Plan</p>
                        <p className="text-sm text-gray-600">
                          {subscription.plan === 'pro' ? 'Professional' : 'Free'} Plan
                        </p>
                      </div>
                      {subscription.plan === 'free' && (
                        <Button 
                          variant="outline"
                          onClick={() => router.push('/subscribe')}
                        >
                          Upgrade to Pro
                        </Button>
                      )}
                    </div>
                    {subscription.plan === 'pro' && (
                      <div className="pt-2 border-t">
                        <Button variant="outline" size="sm">
                          Manage Subscription
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Notifications */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </h2>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Alerts</p>
                        <p className="text-sm text-gray-600">Receive trading alerts via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            emailAlerts: e.target.checked
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Win Streak Alerts</p>
                        <p className="text-sm text-gray-600">Get notified on winning streaks</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.winStreakAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            winStreakAlerts: e.target.checked
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Loss Limit Alerts</p>
                        <p className="text-sm text-gray-600">Alert when daily loss limit is reached</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.lossLimitAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            lossLimitAlerts: e.target.checked
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Performance Report</p>
                        <p className="text-sm text-gray-600">
                          Receive weekly summary via email
                          {subscription.plan === 'free' && (
                            <span className="text-blue-600 ml-1">(Pro only)</span>
                          )}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.weeklyReport}
                        disabled={subscription.plan === 'free'}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            weeklyReport: e.target.checked
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </label>
                  </div>
                </Card>

                {/* Trading Preferences */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Trading Preferences
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2">
                        <p className="font-medium mb-1">Default Market Type</p>
                        <select
                          value={settings.trading.defaultMarketType}
                          onChange={(e) => setSettings({
                            ...settings,
                            trading: {
                              ...settings.trading,
                              defaultMarketType: e.target.value
                            }
                          })}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="FUTURES">Futures</option>
                          <option value="STOCKS">Stocks</option>
                          <option value="OPTIONS">Options</option>
                          <option value="FOREX">Forex</option>
                          <option value="CRYPTO">Crypto</option>
                        </select>
                      </label>
                    </div>
                    <div>
                      <label className="block mb-2">
                        <p className="font-medium mb-1">Default Quantity</p>
                        <input
                          type="number"
                          value={settings.trading.defaultQuantity}
                          onChange={(e) => setSettings({
                            ...settings,
                            trading: {
                              ...settings.trading,
                              defaultQuantity: parseInt(e.target.value) || 1
                            }
                          })}
                          className="w-full p-2 border rounded-md"
                          min="1"
                        />
                      </label>
                    </div>
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show Trade Confirmation</p>
                        <p className="text-sm text-gray-600">Confirm before adding trades</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.trading.showConfirmation}
                        onChange={(e) => setSettings({
                          ...settings,
                          trading: {
                            ...settings.trading,
                            showConfirmation: e.target.checked
                          }
                        })}
                        className="h-4 w-4"
                      />
                    </label>
                  </div>
                </Card>

                {/* Data & Privacy */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Data & Privacy
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Export Your Data</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Download all your trades, journal entries, and settings
                      </p>
                      <Button variant="outline" onClick={handleExportData} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export All Data
                      </Button>
                    </div>
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-2 text-red-600">Danger Zone</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Once you delete your account, there is no going back
                      </p>
                      <Button 
                        variant="outline" 
                        className="gap-2 text-red-600 hover:text-red-700"
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}