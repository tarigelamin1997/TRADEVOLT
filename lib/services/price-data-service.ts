import type { Trade } from '@prisma/client'
import type { PriceData, PriceDataProvider } from '@/lib/types/excursion'
import { ExcursionCalculator } from './excursion-calculator'

/**
 * Mock implementation of price data provider
 * In production, this would connect to real APIs
 */
class MockPriceProvider implements PriceDataProvider {
  async fetchHistoricalData(
    symbol: string,
    startTime: Date,
    endTime: Date,
    interval: '1m' | '5m' | '15m' | '1h'
  ): Promise<PriceData[]> {
    // For demo purposes, generate realistic price data
    const intervalMinutes = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60
    }[interval]
    
    const data: PriceData[] = []
    const currentTime = new Date(startTime)
    const basePrice = 100 // Normalized base price
    
    // Generate price movement with realistic volatility
    let price = basePrice
    const volatility = 0.002 // 0.2% per interval
    const trend = Math.random() > 0.5 ? 1 : -1 // Random trend direction
    
    while (currentTime <= endTime) {
      // Add random walk with slight trend
      const change = (Math.random() - 0.5) * volatility * basePrice
      const trendComponent = trend * volatility * basePrice * 0.1
      price = Math.max(price + change + trendComponent, basePrice * 0.9)
      price = Math.min(price, basePrice * 1.1)
      
      data.push({
        timestamp: new Date(currentTime),
        price: price,
        volume: Math.floor(Math.random() * 10000) + 1000
      })
      
      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes)
    }
    
    return data
  }
}

/**
 * Service for fetching historical price data
 * Manages different data providers based on market type
 */
export class PriceDataService {
  private providers: Map<string, PriceDataProvider>
  
  constructor() {
    // Initialize with mock provider for all markets
    // In production, use real providers:
    // - AlphaVantageProvider for stocks
    // - BinanceProvider for crypto
    // - TwelveDataProvider for forex
    // - IBKRProvider for futures
    const mockProvider = new MockPriceProvider()
    
    this.providers = new Map([
      ['STOCKS', mockProvider],
      ['CRYPTO', mockProvider],
      ['FOREX', mockProvider],
      ['FUTURES', mockProvider],
      ['OPTIONS', mockProvider]
    ])
  }
  
  /**
   * Fetch historical price data for a trade
   */
  async fetchTradeData(trade: Trade): Promise<PriceData[]> {
    if (!trade.entryTime) {
      throw new Error('Trade must have entry time to fetch price data')
    }
    
    const provider = this.providers.get(trade.marketType || 'STOCKS')
    if (!provider) {
      throw new Error(`No price data provider for market type: ${trade.marketType}`)
    }
    
    const interval = ExcursionCalculator.determineInterval(trade)
    const endTime = trade.exitTime || new Date()
    
    try {
      const priceData = await provider.fetchHistoricalData(
        trade.symbol,
        trade.entryTime,
        endTime,
        interval
      )
      
      // Scale prices to match trade entry price
      const scaleFactor = trade.entry / 100 // Our mock data uses base price of 100
      return priceData.map(data => ({
        ...data,
        price: data.price * scaleFactor
      }))
    } catch (error) {
      console.error(`Failed to fetch price data for ${trade.symbol}:`, error)
      throw error
    }
  }
  
  /**
   * Check if price data is available for a symbol
   */
  async isDataAvailable(symbol: string, marketType: string): Promise<boolean> {
    const provider = this.providers.get(marketType)
    if (!provider) return false
    
    try {
      // Try to fetch 1 day of data as a test
      const endTime = new Date()
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000)
      const data = await provider.fetchHistoricalData(symbol, startTime, endTime, '1h')
      return data.length > 0
    } catch {
      return false
    }
  }
  
  /**
   * Get supported market types
   */
  getSupportedMarkets(): string[] {
    return Array.from(this.providers.keys())
  }
}

// Singleton instance
export const priceDataService = new PriceDataService()