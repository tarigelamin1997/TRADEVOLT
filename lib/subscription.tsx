'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SubscriptionStatus } from '@/lib/types/metrics'

interface SubscriptionContextType {
  subscription: SubscriptionStatus
  upgradeToProUrl: string
  checkSubscription: () => Promise<void>
  isLoading: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ plan: 'free' })
  const [isLoading, setIsLoading] = useState(true)
  
  const upgradeToProUrl = '/subscribe' // This will be the Stripe checkout URL
  
  const checkSubscription = async () => {
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSubscription' })
      })
      
      if (res.ok) {
        const data = await res.json()
        setSubscription(data.subscription || { plan: 'free' })
      }
    } catch (error) {
      console.error('Failed to check subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    checkSubscription()
  }, [])
  
  return (
    <SubscriptionContext.Provider value={{ subscription, upgradeToProUrl, checkSubscription, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}