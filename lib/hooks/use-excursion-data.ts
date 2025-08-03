'use client'

import { useState, useEffect } from 'react'
import type { ExcursionData, ExcursionStats } from '@/lib/types/excursion'

export function useExcursionData(tradeId: string | null) {
  const [data, setData] = useState<ExcursionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExcursionData = async () => {
    if (!tradeId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/excursions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getTradeExcursion',
          tradeId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch excursion data')
      }

      setData(result.data)
    } catch (err) {
      console.error('Error fetching excursion data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateExcursions = async () => {
    if (!tradeId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/excursions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'processTrade',
          tradeId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to calculate excursions')
      }

      setData(result.data)
    } catch (err) {
      console.error('Error calculating excursions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (tradeId) {
      fetchExcursionData()
    }
  }, [tradeId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    isLoading,
    error,
    refetch: fetchExcursionData,
    calculate: calculateExcursions
  }
}

export function useExcursionStats() {
  const [data, setData] = useState<ExcursionStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/excursions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getStats'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch excursion stats')
      }

      setData(result.data)
    } catch (err) {
      console.error('Error fetching excursion stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const processHistorical = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/excursions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'processHistorical'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start historical processing')
      }

      // Refresh stats after a delay to show some progress
      setTimeout(() => fetchStats(), 5000)
    } catch (err) {
      console.error('Error processing historical trades:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats,
    processHistorical
  }
}