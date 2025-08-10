'use client'

import { useEffect, createContext, useContext, useState, ReactNode } from 'react'
import { initAffiliateTracking, getAffiliateAttribution } from '@/lib/affiliate-tracker'

interface AffiliateContextType {
  affiliateCode: string | null
  attribution: ReturnType<typeof getAffiliateAttribution>
}

const AffiliateContext = createContext<AffiliateContextType>({
  affiliateCode: null,
  attribution: {
    affiliateCode: null,
    firstSeen: null,
    currentUrl: null,
    referrer: null
  }
})

export function useAffiliate() {
  return useContext(AffiliateContext)
}

interface AffiliateProviderProps {
  children: ReactNode
}

export function AffiliateProvider({ children }: AffiliateProviderProps) {
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null)
  const [attribution, setAttribution] = useState<ReturnType<typeof getAffiliateAttribution>>({
    affiliateCode: null,
    firstSeen: null,
    currentUrl: null,
    referrer: null
  })

  useEffect(() => {
    // Initialize tracking on mount
    const code = initAffiliateTracking()
    setAffiliateCode(code)
    
    // Get full attribution data
    const attr = getAffiliateAttribution()
    setAttribution(attr)
    
    // Log for debugging (remove in production)
    if (code) {
      console.log('Affiliate tracking initialized:', code)
    }
  }, [])

  return (
    <AffiliateContext.Provider value={{ affiliateCode, attribution }}>
      {children}
    </AffiliateContext.Provider>
  )
}