// Settings configuration and types
export interface UserSettings {
  // Trading Defaults
  trading: {
    defaultMarketType: 'FUTURES' | 'OPTIONS' | 'FOREX' | 'CRYPTO' | 'STOCKS'
    accountCurrency: string
    startingBalance: number
    commission: {
      perTrade: number
      perUnit: number // per contract/lot/share
    }
    riskManagement: {
      maxRiskPerTrade: number // percentage
      defaultStopLoss: number // percentage
      defaultPositionSize: number
    }
  }
  
  // Display Preferences
  display: {
    theme: 'light' | 'dark' | 'system'
    timezone: string
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    timeFormat: '12h' | '24h'
    numberFormat: {
      decimalPlaces: number
      thousandSeparator: boolean
    }
    tableDensity: 'compact' | 'comfortable' | 'spacious'
  }
  
  // Data Management
  data: {
    autoSave: boolean
    csvImport: {
      defaultDateFormat: string
      skipFirstRow: boolean
      defaultMapping: Record<string, string>
    }
    export: {
      defaultFormat: 'csv' | 'json' | 'pdf'
      includeOpenTrades: boolean
      includeNotes: boolean
    }
  }
  
  // Alerts & Goals
  alerts: {
    enableNotifications: boolean
    dailyLossLimit: number
    streakAlerts: {
      winning: number
      losing: number
    }
  }
  goals: {
    monthlyProfitTarget: number
    winRateTarget: number
    maxDrawdownLimit: number
  }
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  trading: {
    defaultMarketType: 'STOCKS',
    accountCurrency: 'USD',
    startingBalance: 10000,
    commission: {
      perTrade: 0,
      perUnit: 0
    },
    riskManagement: {
      maxRiskPerTrade: 2, // 2%
      defaultStopLoss: 1, // 1%
      defaultPositionSize: 100
    }
  },
  display: {
    theme: 'system',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: {
      decimalPlaces: 2,
      thousandSeparator: true
    },
    tableDensity: 'comfortable'
  },
  data: {
    autoSave: true,
    csvImport: {
      defaultDateFormat: 'YYYY-MM-DD',
      skipFirstRow: true,
      defaultMapping: {}
    },
    export: {
      defaultFormat: 'csv',
      includeOpenTrades: true,
      includeNotes: true
    }
  },
  alerts: {
    enableNotifications: true,
    dailyLossLimit: 500,
    streakAlerts: {
      winning: 5,
      losing: 3
    }
  },
  goals: {
    monthlyProfitTarget: 1000,
    winRateTarget: 60,
    maxDrawdownLimit: 10
  }
}

// Settings storage functions
export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  
  const stored = localStorage.getItem('userSettings')
  if (!stored) return DEFAULT_SETTINGS
  
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Partial<UserSettings>) {
  if (typeof window === 'undefined') return
  
  const current = loadSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem('userSettings', JSON.stringify(updated))
  
  // Emit event for other components to react
  window.dispatchEvent(new CustomEvent('settingsChanged', { detail: updated }))
}

// Hook for using settings in components
import { useState, useEffect } from 'react'

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings())
  
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      setSettings(e.detail)
    }
    
    window.addEventListener('settingsChanged', handleSettingsChange as any)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange as any)
  }, [])
  
  const updateSettings = (updates: Partial<UserSettings>) => {
    saveSettings(updates)
    setSettings(prev => ({ ...prev, ...updates }))
  }
  
  return { settings, updateSettings }
}

// Format helpers based on settings
export function formatCurrency(amount: number, settings: UserSettings): string {
  const symbol = getCurrencySymbol(settings.trading.accountCurrency)
  const formatted = amount.toFixed(settings.display.numberFormat.decimalPlaces)
  
  if (settings.display.numberFormat.thousandSeparator) {
    const parts = formatted.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `${symbol}${parts.join('.')}`
  }
  
  return `${symbol}${formatted}`
}

export function formatDate(date: Date | string, settings: UserSettings): string {
  const d = new Date(date)
  const format = settings.display.dateFormat
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    default: // MM/DD/YYYY
      return `${month}/${day}/${year}`
  }
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'Fr'
  }
  return symbols[currency] || currency + ' '
}