// Abstract base class for all broker integrations
import { Trade } from '@prisma/client';
import { BrokerPlatform, BrokerPlatformConfig, BROKER_PLATFORMS } from '@/lib/types/broker-platforms';
import { BrokerSyncResult } from '@/lib/types/broker';

export interface BrokerCredentials {
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  accountLogin?: string;
  password?: string;
  serverName?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookUrl?: string;
  [key: string]: any; // For platform-specific fields
}

export interface BrokerAccountInfo {
  accountId: string;
  accountName: string;
  balance: number;
  equity?: number;
  currency: string;
  leverage?: number;
  marginUsed?: number;
  marginAvailable?: number;
  openPositions?: number;
  broker?: string;
  accountType?: 'live' | 'demo' | 'paper';
  [key: string]: any; // Platform-specific fields
}

export interface BrokerPosition {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice?: number;
  unrealizedPnL?: number;
  realizedPnL?: number;
  openTime: Date;
  commission?: number;
  swap?: number;
  [key: string]: any;
}

export interface BrokerOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  filledQuantity?: number;
  averagePrice?: number;
  createdAt: Date;
  [key: string]: any;
}

export interface BrokerConnectionOptions {
  autoSync?: boolean;
  syncInterval?: number; // minutes
  includeOpenPositions?: boolean;
  includePendingOrders?: boolean;
  historicalDays?: number;
  webhookSecret?: string;
}

// Abstract base class that all broker services will extend
export abstract class BrokerServiceBase {
  protected platform: BrokerPlatform;
  protected config: BrokerPlatformConfig;
  protected credentials: BrokerCredentials;
  protected options: BrokerConnectionOptions;
  
  constructor(
    platform: BrokerPlatform,
    credentials: BrokerCredentials,
    options: BrokerConnectionOptions = {}
  ) {
    this.platform = platform;
    this.config = BROKER_PLATFORMS[platform];
    this.credentials = credentials;
    this.options = {
      autoSync: false,
      syncInterval: 60,
      includeOpenPositions: true,
      includePendingOrders: false,
      historicalDays: 30,
      ...options
    };
  }

  // Abstract methods that each broker service must implement
  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract getAccountInfo(): Promise<BrokerAccountInfo>;
  abstract syncTrades(startDate?: Date, endDate?: Date): Promise<BrokerSyncResult>;
  
  // Optional methods - override if platform supports
  async getPositions(): Promise<BrokerPosition[]> {
    throw new Error(`${this.platform} does not support position tracking`);
  }
  
  async getOrders(): Promise<BrokerOrder[]> {
    throw new Error(`${this.platform} does not support order tracking`);
  }
  
  async subscribeToRealTimeUpdates(
    onTrade?: (trade: Partial<Trade>) => void,
    onPosition?: (position: BrokerPosition) => void,
    onOrder?: (order: BrokerOrder) => void
  ): Promise<() => void> {
    throw new Error(`${this.platform} does not support real-time updates`);
  }
  
  async handleWebhook(payload: any, signature?: string): Promise<BrokerSyncResult> {
    throw new Error(`${this.platform} does not support webhooks`);
  }

  // Common utility methods used by all services
  protected convertToTrade(brokerData: any): Partial<Trade> {
    // Override in specific implementations
    // This is a base implementation that can be customized
    const trade: Partial<Trade> = {
      symbol: brokerData.symbol,
      type: this.normalizeSide(brokerData.side),
      entry: brokerData.price || brokerData.entryPrice,
      quantity: Math.abs(brokerData.quantity || brokerData.volume),
      entryTime: new Date(brokerData.time || brokerData.openTime),
      exitTime: brokerData.closeTime ? new Date(brokerData.closeTime) : undefined,
      exit: brokerData.closePrice,
      commission: brokerData.commission || 0,
      notes: `Imported from ${this.platform}`,
      marketType: this.detectMarketType(brokerData.symbol)
    };
    
    // Store P&L data in notes if available (will be calculated from entry/exit)
    if (brokerData.profit || brokerData.pnl) {
      const pnl = brokerData.profit || brokerData.pnl;
      trade.notes = `${trade.notes} | Broker P&L: ${pnl}`;
    }
    
    return trade;
  }
  
  protected normalizeSide(side: any): 'BUY' | 'SELL' {
    const sideStr = String(side).toUpperCase();
    if (sideStr.includes('BUY') || sideStr.includes('LONG')) return 'BUY';
    if (sideStr.includes('SELL') || sideStr.includes('SHORT')) return 'SELL';
    return 'BUY'; // Default
  }
  
  protected detectMarketType(symbol: string): string {
    // Common market type detection logic
    symbol = symbol.toUpperCase();
    
    // Forex pairs
    if (/^[A-Z]{6}$/.test(symbol) || 
        ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'].some(currency => 
          symbol.includes(currency))) {
      return 'FOREX';
    }
    
    // Futures
    if (['ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI', 'ZB', 'ZN', 'ZC', 'ZS', 'ZW'].some(future => 
        symbol.startsWith(future))) {
      return 'FUTURES';
    }
    
    // Crypto
    if (['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'USDT', 'USDC'].some(crypto => 
        symbol.includes(crypto))) {
      return 'CRYPTO';
    }
    
    // Options (contains expiry info or option indicators)
    if (/\d{6}/.test(symbol) || symbol.includes('C') || symbol.includes('P')) {
      return 'OPTIONS';
    }
    
    // CFDs
    if (symbol.includes('CFD') || symbol.includes('.')) {
      return 'CFD';
    }
    
    // Default to stocks
    return 'STOCKS';
  }
  
  // Rate limiting helper
  protected async rateLimit(requestsPerSecond: number = 10): Promise<void> {
    const delay = 1000 / requestsPerSecond;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // Error handling wrapper
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`${this.platform} Error: ${errorMessage}`, error);
      throw new Error(`${this.platform}: ${errorMessage}`);
    }
  }
  
  // Batch processing helper
  protected async processBatch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      await this.rateLimit(); // Rate limit between batches
    }
    return results;
  }
  
  // Validate required credentials
  protected validateCredentials(required: (keyof BrokerCredentials)[]): void {
    const missing = required.filter(key => !this.credentials[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required credentials for ${this.platform}: ${missing.join(', ')}`);
    }
  }
  
  // Get platform configuration
  getPlatformInfo(): BrokerPlatformConfig {
    return this.config;
  }
  
  // Check if feature is supported
  supportsFeature(feature: string): boolean {
    return this.config.features.includes(feature as any);
  }
}