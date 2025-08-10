'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  DollarSign,
  CheckCircle,
  ArrowRight,
  Star,
  Trophy,
  Gift
} from 'lucide-react'
import { useAffiliate } from '@/components/affiliate-provider'
import { useEffect, useState } from 'react'

export default function Home() {
  const { affiliateCode } = useAffiliate()
  const [showReferralBanner, setShowReferralBanner] = useState(false)

  useEffect(() => {
    // Show referral banner if user came through an affiliate
    if (affiliateCode) {
      setShowReferralBanner(true)
    }
  }, [affiliateCode])
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Referral Banner */}
      {showReferralBanner && affiliateCode && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5" />
              <span className="font-medium">
                Special offer from <strong>{affiliateCode}</strong>! Get 20% off your first month.
              </span>
            </div>
            <button 
              onClick={() => setShowReferralBanner(false)}
              className="text-white/80 hover:text-white"
              aria-label="Close banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold">TradeVolt</h2>
          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">BETA</span>
        </div>
        <div className="flex items-center gap-6">
          <Link 
            href="/affiliate/apply" 
            className="hidden md:flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            <Trophy className="h-4 w-4" />
            <span>Affiliate Program</span>
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">50% Commission</span>
          </Link>
          <Button asChild variant="outline">
            <Link href="/sign-in">Log In</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/sign-up">Start Free Trial</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Now $29/month - Professional Trading Analytics
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Transform Your Trading with Data-Driven Insights
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Track, analyze, and improve your trading performance with professional-grade analytics. 
            Join thousands of traders making smarter decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
              <Link href="/sign-up">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/dashboard">View Demo</Link>
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No credit card required • Full access • Cancel anytime
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">16 professional metrics including win rate, profit factor, and Sharpe ratio</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Performance Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">Real-time P&L, equity curves, and detailed trade history</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
            <p className="text-gray-600 dark:text-gray-400">MAE/MFE analysis, position sizing, and risk metrics</p>
          </div>
        </div>
      </div>

      {/* Affiliate Program CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            LIMITED TIME OFFER
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Earn Up to 50% Commission as an Affiliate
          </h2>
          
          <p className="text-xl mb-8 text-white/90">
            Join our affiliate program and earn recurring commissions for 12 months on every referral. 
            Top performers earn $10,000+ monthly!
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-3xl font-bold">10-50%</p>
              <p className="text-sm text-white/80">Commission</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-white/80">Months Recurring</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-3xl font-bold">60</p>
              <p className="text-sm text-white/80">Day Cookie</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-3xl font-bold">$100</p>
              <p className="text-sm text-white/80">Min Payout</p>
            </div>
          </div>
          
          <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8">
            <Link href="/affiliate/apply">
              <Users className="mr-2 h-5 w-5" />
              Apply to Affiliate Program
            </Link>
          </Button>
        </div>
      </div>

      {/* Social Proof */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Trusted by Traders Worldwide</h2>
          <div className="flex justify-center items-center gap-8 text-gray-600 dark:text-gray-400">
            <div>
              <p className="text-3xl font-bold text-blue-600">2,847+</p>
              <p className="text-sm">Active Traders</p>
            </div>
            <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
            <div>
              <p className="text-3xl font-bold text-green-600">142,000+</p>
              <p className="text-sm">Trades Analyzed</p>
            </div>
            <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
            <div>
              <p className="text-3xl font-bold text-purple-600">4.9/5</p>
              <p className="text-sm">User Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/features" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-blue-600">Demo</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
                <li><Link href="/blog" className="hover:text-blue-600">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Partners</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/affiliate/apply" className="hover:text-blue-600 flex items-center gap-1">
                    Affiliate Program
                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">NEW</span>
                  </Link>
                </li>
                <li><Link href="/affiliate/terms" className="hover:text-blue-600">Affiliate Terms</Link></li>
                <li><Link href="/integrations" className="hover:text-blue-600">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-blue-600">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="font-semibold">TradeVolt</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">© 2025. All rights reserved.</span>
              </div>
              
              <div className="flex items-center gap-4">
                <Link 
                  href="/affiliate/apply" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Earn 50% Commission</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}