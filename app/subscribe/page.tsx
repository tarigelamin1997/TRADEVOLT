'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Star, Zap, TrendingUp, BarChart3, Shield, Users } from "lucide-react"

export default function SubscribePage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold mb-4">
            🎉 BETA ACCESS
          </span>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to TradeVolt Beta!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            You&apos;re among the first traders to experience our professional-grade analytics platform. 
            Enjoy <span className="font-semibold text-purple-600">unlimited access to all features</span> during our beta period!
          </p>
        </div>
        
        <Card className="max-w-4xl mx-auto p-8 shadow-xl border-purple-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Everything Unlocked for Beta Users 🚀</h2>
            <p className="text-gray-600">No credit card required • No time limits • Full feature access</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Essential Analytics
              </h3>
              <ul className="space-y-2">
                {[
                  'Net P&L tracking',
                  'Win rate analysis',
                  'Profit factor calculations',
                  'Trade expectancy',
                  'Average win/loss metrics',
                  'Comprehensive trade history'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Professional Features
              </h3>
              <ul className="space-y-2">
                {[
                  'Risk management metrics',
                  'Maximum drawdown analysis',
                  'Risk of ruin calculations',
                  'Sharpe & Sortino ratios',
                  'Advanced performance metrics',
                  'AI-powered insights'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Beta User Benefits
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium">Early Access</h4>
                <p className="text-sm text-gray-600">Be first to try new features</p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium">Shape the Product</h4>
                <p className="text-sm text-gray-600">Your feedback drives development</p>
              </div>
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium">Exclusive Insights</h4>
                <p className="text-sm text-gray-600">Advanced analytics at no cost</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
              onClick={() => router.push('/dashboard')}
            >
              Start Using TradeVolt Beta →
            </Button>
            <p className="text-sm text-gray-600 mt-4">
              No signup required if you&apos;re already logged in
            </p>
          </div>
        </Card>
        
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">What Beta Users Are Saying</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-3">&quot;The risk metrics alone have transformed how I manage my positions. Can&apos;t imagine trading without this now.&quot;</p>
              <p className="text-sm font-medium">- Active Day Trader</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-3">&quot;Finally, professional-grade analytics that don&apos;t cost a fortune. The insights have helped me identify weak spots in my strategy.&quot;</p>
              <p className="text-sm font-medium">- Swing Trader</p>
            </Card>
            
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-3">&quot;The Sharpe ratio tracking alone is worth it. This platform gives me institutional-level metrics for my personal trading.&quot;</p>
              <p className="text-sm font-medium">- Options Trader</p>
            </Card>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Questions about the beta? Reach out to us at{' '}
            <a href="mailto:beta@tradevolt.com" className="text-purple-600 hover:underline">
              beta@tradevolt.com
            </a>
          </p>
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
          >
            ← Back to app
          </Button>
        </div>
      </div>
    </div>
  )
}