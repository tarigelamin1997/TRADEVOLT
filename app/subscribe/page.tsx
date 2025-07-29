'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X, Crown } from "lucide-react"

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Essential trading metrics',
      'Trade history tracking',
      'Basic P&L reports',
      'CSV import/export',
      'Trade journal',
      'Up to 100 trades/month'
    ],
    limitations: [
      'No risk management metrics',
      'No advanced analytics',
      'No priority support'
    ],
    cta: 'Current Plan',
    disabled: true
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    popular: true,
    features: [
      'Everything in Free',
      'Risk management metrics',
      'Advanced analytics (Sharpe, Sortino, etc.)',
      'Unlimited trades',
      'Detailed performance insights',
      'Priority email support',
      'Export to multiple formats',
      'Custom market analysis'
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    disabled: false
  }
]

export default function SubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const handleSubscribe = async (plan: string) => {
    if (plan === 'Free') return
    
    setLoading(true)
    // In production, this would create a Stripe checkout session
    // For now, just simulate
    setTimeout(() => {
      alert('Stripe checkout would open here. Integration coming soon!')
      setLoading(false)
    }, 1000)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Trading Journey
          </h1>
          <p className="text-xl text-gray-600">
            Unlock professional trading analytics and take your performance to the next level
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative p-8 ${
                plan.popular 
                  ? 'border-blue-500 border-2 shadow-xl' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    MOST POPULAR
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-gray-900">Features:</h3>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.limitations.length > 0 && (
                  <>
                    <h3 className="font-semibold text-gray-900 pt-4">Limitations:</h3>
                    <ul className="space-y-3">
                      {plan.limitations.map((limitation, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              
              <Button
                className={`w-full ${
                  plan.popular 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : ''
                }`}
                variant={plan.popular ? 'default' : 'outline'}
                disabled={plan.disabled || loading}
                onClick={() => handleSubscribe(plan.name)}
              >
                {loading ? 'Processing...' : plan.cta}
              </Button>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="max-w-3xl mx-auto space-y-4 text-left">
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-600">Yes! You can cancel your Pro subscription anytime. You&apos;ll continue to have access until the end of your billing period.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600">We accept all major credit cards, debit cards, and support international payments through Stripe.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="font-semibold mb-2">Do I need a credit card for the free plan?</h4>
              <p className="text-gray-600">No! The free plan is completely free forever with no credit card required.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
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