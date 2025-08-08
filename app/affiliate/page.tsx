'use client'

import { useState } from 'react'
import { SidebarLayout, SidebarTrigger } from '@/components/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Copy, 
  ExternalLink,
  Download,
  Calendar,
  ArrowUpRight,
  Award,
  Target,
  Gem,
  Crown,
  Shield,
  ChevronRight,
  Info,
  Check,
  AlertCircle
} from 'lucide-react'

export default function AffiliatePage() {
  const [copiedCode, setCopiedCode] = useState(false)
  const [referralCode] = useState('TRADE2025')
  const [currentTier, setCurrentTier] = useState<'bronze' | 'silver' | 'gold' | 'diamond'>('bronze')
  
  // Mock data - will be replaced with real data from database
  const stats = {
    totalEarnings: 2847.50,
    pendingPayout: 847.50,
    monthlyEarnings: 1247.50,
    totalReferrals: 42,
    activeCustomers: 38,
    conversionRate: 12.5,
    lifetimeValue: 4250.00,
    nextPayoutDate: '2025-09-10',
    currentMonthSales: 1850.00, // For tier calculation
  }

  const tiers = [
    { 
      name: 'Bronze', 
      icon: Shield, 
      range: '< $2,000', 
      commission: '10%',
      color: 'from-orange-400 to-orange-600',
      min: 0,
      max: 2000
    },
    { 
      name: 'Silver', 
      icon: Gem, 
      range: '$2,000 - $4,999', 
      commission: '25%',
      color: 'from-gray-400 to-gray-600',
      min: 2000,
      max: 5000
    },
    { 
      name: 'Gold', 
      icon: Crown, 
      range: '$5,000 - $9,999', 
      commission: '35%',
      color: 'from-yellow-400 to-yellow-600',
      min: 5000,
      max: 10000
    },
    { 
      name: 'Diamond', 
      icon: Trophy, 
      range: '$10,000+', 
      commission: '50%',
      color: 'from-blue-400 to-purple-600',
      min: 10000,
      max: Infinity
    }
  ]

  // Calculate current tier based on monthly sales
  const getCurrentTier = () => {
    const sales = stats.currentMonthSales
    if (sales >= 10000) return 'diamond'
    if (sales >= 5000) return 'gold'
    if (sales >= 2000) return 'silver'
    return 'bronze'
  }

  const currentTierData = tiers.find(t => t.name.toLowerCase() === getCurrentTier())
  const nextTierData = tiers[Math.min(tiers.findIndex(t => t.name.toLowerCase() === getCurrentTier()) + 1, tiers.length - 1)]
  const progressToNextTier = currentTierData && nextTierData && nextTierData !== currentTierData
    ? ((stats.currentMonthSales - currentTierData.min) / (nextTierData.min - currentTierData.min)) * 100
    : 100

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const recentReferrals = [
    { date: '2025-08-07', customer: 'John D.', plan: 'Pro', commission: 24.50, status: 'active' },
    { date: '2025-08-06', customer: 'Sarah M.', plan: 'Pro', commission: 24.50, status: 'active' },
    { date: '2025-08-05', customer: 'Mike R.', plan: 'Pro', commission: 24.50, status: 'trial' },
    { date: '2025-08-04', customer: 'Emma L.', plan: 'Pro', commission: 24.50, status: 'active' },
    { date: '2025-08-03', customer: 'David K.', plan: 'Pro', commission: 24.50, status: 'churned' },
  ]

  return (
    <SidebarLayout currentPath="/affiliate">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 p-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Affiliate Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Earn up to 50% recurring commission on every referral
              </p>
            </div>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Download className="h-4 w-4 mr-2" />
              Download Materials
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tier Progress Card */}
          <Card className="border-2 border-gradient bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Your Commission Tier</CardTitle>
                  <CardDescription>Based on monthly sales volume</CardDescription>
                </div>
                <div className={`p-4 rounded-full bg-gradient-to-br ${currentTierData?.color} text-white`}>
                  {currentTierData && <currentTierData.icon className="h-8 w-8" />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{currentTierData?.name}</p>
                  <p className="text-xl text-blue-600 dark:text-blue-400">{currentTierData?.commission} Commission</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Month Sales</p>
                  <p className="text-2xl font-bold">${stats.currentMonthSales.toFixed(2)}</p>
                </div>
              </div>

              {nextTierData && nextTierData !== currentTierData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress to {nextTierData.name}</span>
                    <span className="font-bold">${(nextTierData.min - stats.currentMonthSales).toFixed(2)} more needed</span>
                  </div>
                  <Progress value={progressToNextTier} className="h-3" />
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                {tiers.map((tier, index) => (
                  <div 
                    key={tier.name}
                    className={`p-4 rounded-lg text-center transition-all ${
                      tier.name.toLowerCase() === getCurrentTier()
                        ? 'bg-gradient-to-br ' + tier.color + ' text-white scale-105 shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <tier.icon className={`h-6 w-6 mx-auto mb-2 ${
                      tier.name.toLowerCase() === getCurrentTier() ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <p className="font-bold text-sm">{tier.name}</p>
                    <p className="text-xs mt-1">{tier.commission}</p>
                    <p className="text-xs opacity-75">{tier.range}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 12%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.pendingPayout.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Next payout: {stats.nextPayoutDate}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalReferrals} total referrals
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg LTV: ${stats.lifetimeValue.toFixed(0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Referral Link Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Referral Link</CardTitle>
                    <CardDescription>Share this link to earn commissions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        value={`https://tradevolt.com/ref/${referralCode}`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" onClick={copyReferralCode}>
                        {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Referral Code</Label>
                        <div className="flex gap-2 mt-1">
                          <Input value={referralCode} readOnly className="font-mono font-bold" />
                          <Button variant="outline" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label>Discount for Users</Label>
                        <Input value="20% OFF" readOnly className="font-bold text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Tools and resources</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-between">
                      Generate Custom Link
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      View Analytics Dashboard
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      Download Marketing Kit
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      Request Custom Materials
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Referrals Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                  <CardDescription>Your latest customer acquisitions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Plan</th>
                          <th className="text-left p-2">Commission</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentReferrals.map((referral, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{referral.date}</td>
                            <td className="p-2 font-medium">{referral.customer}</td>
                            <td className="p-2">{referral.plan}</td>
                            <td className="p-2 font-bold text-green-600">${referral.commission}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                referral.status === 'active' ? 'bg-green-100 text-green-700' :
                                referral.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {referral.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Management</CardTitle>
                  <CardDescription>Track and manage all your referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    Detailed referral tracking coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Materials</CardTitle>
                  <CardDescription>Professional assets to boost your conversions</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Email Templates', count: 12, icon: '📧' },
                    { name: 'Social Media Posts', count: 25, icon: '📱' },
                    { name: 'Banner Ads', count: 8, icon: '🖼️' },
                    { name: 'Video Scripts', count: 5, icon: '🎥' },
                    { name: 'Landing Pages', count: 3, icon: '🌐' },
                    { name: 'Case Studies', count: 4, icon: '📊' },
                  ].map((material) => (
                    <Card key={material.name} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="text-2xl mb-2">{material.icon}</div>
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{material.count} templates</p>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>Your commission payment history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Next Payout</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        ${stats.pendingPayout.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Processing on {stats.nextPayoutDate}
                      </p>
                    </div>
                    <Separator />
                    <p className="text-gray-600 dark:text-gray-400">
                      Detailed payout history coming soon...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Affiliate Settings</CardTitle>
                  <CardDescription>Manage your affiliate account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Input placeholder="Bank Transfer (ACH)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Information</Label>
                    <Input placeholder="W-9 Form Status: Pending" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Preferences</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span>Email me for new referrals</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span>Monthly performance reports</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span>Payout notifications</span>
                      </label>
                    </div>
                  </div>
                  <Button className="w-full">Save Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarLayout>
  )
}