/**
 * Simple Affiliate Tracking System
 * Tracks referral sources via URL parameters and persists them
 */

const AFFILIATE_COOKIE_NAME = 'tradevolt_ref'
const AFFILIATE_STORAGE_KEY = 'tradevolt_referral'
const COOKIE_DURATION_DAYS = 30

/**
 * Get affiliate code from URL parameters
 */
export function getAffiliateFromURL(): string | null {
  if (typeof window === 'undefined') return null
  
  const params = new URLSearchParams(window.location.search)
  return params.get('ref') || params.get('affiliate') || params.get('r')
}

/**
 * Save affiliate code to multiple storage methods for redundancy
 */
export function saveAffiliateCode(code: string): void {
  if (typeof window === 'undefined' || !code) return
  
  // Save to localStorage
  try {
    localStorage.setItem(AFFILIATE_STORAGE_KEY, code)
    localStorage.setItem(`${AFFILIATE_STORAGE_KEY}_date`, new Date().toISOString())
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
  
  // Save to cookie
  try {
    const expires = new Date()
    expires.setDate(expires.getDate() + COOKIE_DURATION_DAYS)
    document.cookie = `${AFFILIATE_COOKIE_NAME}=${code}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  } catch (e) {
    console.error('Failed to save cookie:', e)
  }
  
  // Save to sessionStorage as backup
  try {
    sessionStorage.setItem(AFFILIATE_STORAGE_KEY, code)
  } catch (e) {
    console.error('Failed to save to sessionStorage:', e)
  }
}

/**
 * Get saved affiliate code from storage
 */
export function getSavedAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null
  
  // Try localStorage first
  try {
    const code = localStorage.getItem(AFFILIATE_STORAGE_KEY)
    if (code) return code
  } catch (e) {
    // localStorage might be blocked
  }
  
  // Try cookie
  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === AFFILIATE_COOKIE_NAME) {
        return value
      }
    }
  } catch (e) {
    // Cookie access might be blocked
  }
  
  // Try sessionStorage as fallback
  try {
    const code = sessionStorage.getItem(AFFILIATE_STORAGE_KEY)
    if (code) return code
  } catch (e) {
    // sessionStorage might be blocked
  }
  
  return null
}

/**
 * Initialize affiliate tracking on page load
 */
export function initAffiliateTracking(): string | null {
  if (typeof window === 'undefined') return null
  
  // Check URL for affiliate code
  const urlCode = getAffiliateFromURL()
  
  if (urlCode) {
    // New affiliate code in URL, save it
    saveAffiliateCode(urlCode)
    return urlCode
  }
  
  // No code in URL, check for existing saved code
  return getSavedAffiliateCode()
}

/**
 * Clear affiliate tracking (useful after successful signup)
 */
export function clearAffiliateTracking(): void {
  if (typeof window === 'undefined') return
  
  // Clear localStorage
  try {
    localStorage.removeItem(AFFILIATE_STORAGE_KEY)
    localStorage.removeItem(`${AFFILIATE_STORAGE_KEY}_date`)
  } catch (e) {
    // Ignore errors
  }
  
  // Clear cookie
  try {
    document.cookie = `${AFFILIATE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  } catch (e) {
    // Ignore errors
  }
  
  // Clear sessionStorage
  try {
    sessionStorage.removeItem(AFFILIATE_STORAGE_KEY)
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Get affiliate attribution data for analytics
 */
export function getAffiliateAttribution() {
  const code = getSavedAffiliateCode()
  const dateStr = typeof window !== 'undefined' 
    ? localStorage.getItem(`${AFFILIATE_STORAGE_KEY}_date`) 
    : null
  
  return {
    affiliateCode: code,
    firstSeen: dateStr ? new Date(dateStr) : null,
    currentUrl: typeof window !== 'undefined' ? window.location.href : null,
    referrer: typeof document !== 'undefined' ? document.referrer : null
  }
}