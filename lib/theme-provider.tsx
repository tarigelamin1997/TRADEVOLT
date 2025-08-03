'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSettings } from './settings'

type Theme = 'light' | 'dark' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
}

interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  effectiveTheme: 'light',
  setTheme: () => {}
})

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings } = useSettings()
  const [theme, setTheme] = useState<Theme>(settings.display.theme)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setTheme(settings.display.theme)
  }, [settings.display.theme])

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove both classes first
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      setEffectiveTheme(systemTheme)
    } else {
      root.classList.add(theme)
      setEffectiveTheme(theme as 'light' | 'dark')
    }
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      const newTheme = e.matches ? 'dark' : 'light'
      root.classList.add(newTheme)
      setEffectiveTheme(newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}