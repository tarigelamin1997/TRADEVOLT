'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react'

export default function AffiliateStatsPage() {
  const searchParams = useSearchParams()
  const affiliateCode = searchParams?.get('code') || 'demo'
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Mock stats for demo - in production, fetch from API
  const stats = {
    clicks: 127,
    signups: 12,
    conversions: 5,
    earnings: 245.00,
    conversionRate: 41.67,
    lifetimeValue: 1225.00
  }
  
  const affiliateLink = `https://tradevolt.com?ref=${affiliateCode}`
  const shortLink = `tradevolt.com/r/${affiliateCode}`
  
  const copyCode = () => {
    navigator.clipboard.writeText(affiliateCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your referrals and earnings in real-time
          </p>
        </div>
        
        {/* Affiliate Link Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Your Affiliate Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Code */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Your Referral Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-lg">
                  {affiliateCode}
                </div>
                <Button onClick={copyCode} variant="outline" className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            
            {/* Full Link */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Full Referral Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm break-all">
                  {affiliateLink}
                </div>
                <Button onClick={copyLink} variant="outline" className="gap-2">
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share this link to earn commissions on referrals
              </p>
            </div>
            
            {/* Short Link */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Short Link (Coming Soon)
                  </p>
                  <p className="font-mono text-blue-700 dark:text-blue-300">
                    {shortLink}
                  </p>
                </div>
                <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Clicks
                </span>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">{stats.clicks}</div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Signups
                </span>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">{stats.signups}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.conversionRate.toFixed(1)}% conversion
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monthly Earnings
                </span>
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">${stats.earnings.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">
                ${stats.lifetimeValue.toFixed(0)} lifetime
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Clicks → Signups</span>
                  <span className="text-sm text-gray-600">{stats.signups} / {stats.clicks}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(stats.signups / stats.clicks) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Signups → Customers</span>
                  <span className="text-sm text-gray-600">{stats.conversions} / {stats.signups}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(stats.conversions / stats.signups) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notice */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> These are demo statistics. In production, real-time data will be displayed based on actual referrals and conversions.
          </p>
        </div>
      </div>
    </div>
  )
}