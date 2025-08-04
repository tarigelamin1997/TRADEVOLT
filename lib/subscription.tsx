'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SubscriptionStatus } from '@/lib/types/metrics'

interface SubscriptionContextType {
  subscription: SubscriptionStatus
  upgradeToProUrl: string
  checkSubscription: () => Promise<void>
  isLoading: boolean
  isPro: boolean
  subscribe: () => void
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // During beta, everyone has pro access
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ plan: 'pro' })
  const [isLoading, setIsLoading] = useState(false)
  
  const upgradeToProUrl = '/subscribe' // Beta information page
  const isPro = subscription.plan === 'pro'
  
  const checkSubscription = async () => {
    // During beta, everyone is pro
    setSubscription({ plan: 'pro' })
    setIsLoading(false)
  }
  
  const subscribe = () => {
    // During beta, redirect to subscribe page for information
    if (typeof window !== 'undefined') {
      window.location.href = upgradeToProUrl
    }
  }
  
  useEffect(() => {
    // No need to check during beta
  }, [])
  
  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      upgradeToProUrl, 
      checkSubscription, 
      isLoading, 
      isPro, 
      subscribe 
    }}>
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