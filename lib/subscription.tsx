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
  // During beta, everyone has pro access
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ plan: 'pro' })
  const [isLoading, setIsLoading] = useState(false)
  
  const upgradeToProUrl = '/subscribe' // Beta information page
  
  const checkSubscription = async () => {
    // During beta, everyone is pro
    setSubscription({ plan: 'pro' })
    setIsLoading(false)
  }
  
  useEffect(() => {
    // No need to check during beta
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