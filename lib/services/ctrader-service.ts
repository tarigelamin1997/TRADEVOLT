// cTrader Open API integration service
import { BrokerServiceBase, BrokerCredentials, BrokerConnectionOptions, BrokerAccountInfo, BrokerPosition, BrokerOrder } from './broker-service-base';
import { BrokerSyncResult } from '@/lib/types/broker';
import { Trade } from '@prisma/client';

// cTrader API types
interface CTraderTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface CTraderAccount {
  ctidTraderAccountId: number;
  brokerName: string;
  deposit: number;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  isLive: boolean;
  registrationTimestamp: number;
}

interface CTraderPosition {
  positionId: string;
  entryTimestamp: number;
  utcLastUpdateTimestamp: number;
  symbolId: number;
  symbolName: string;
  tradeSide: 'BUY' | 'SELL';
  volume: number;
  entryPrice: number;
  profit: number;
  profitInPips: number;
  commission: number;
  marginRate: number;
  mirroringCommission: number;
  guaranteedStopLoss: boolean;
  usedMargin: number;
}

interface CTraderDeal {
  dealId: string;
  positionId: string;
  orderId: string;
  tradeSide: 'BUY' | 'SELL';
  volume: number;
  filledVolume: number;
  symbolName: string;
  commission: number;
  executionPrice: number;
  baseToUsdConversionRate: number;
  marginRate: number;
  channel: string;
  dealStatus: string;
  createTimestamp: number;
  executionTimestamp: number;
  utcLastUpdateTimestamp: number;
  closePositionDetail?: {
    entryPrice: number;
    profit: number;
    profitInPips: number;
    commission: number;
    swap: number;
    balance: number;
    balanceVersion: number;
  };
}

export class CTraderService extends BrokerServiceBase {
  private baseUrl = 'https://api.spotware.com/connect';
  private accountsUrl = 'https://api.spotware.com/connect/tradingaccounts';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken?: string;
  private refreshToken?: string;
  private accountId?: number;

  constructor(credentials: BrokerCredentials, options?: BrokerConnectionOptions) {
    super('cTrader', credentials, options);
    
    // Get OAuth credentials from environment or credentials object
    this.clientId = process.env.CTRADER_CLIENT_ID || credentials.apiKey || '';
    this.clientSecret = process.env.CTRADER_CLIENT_SECRET || credentials.apiSecret || '';
    this.redirectUri = process.env.CTRADER_REDIRECT_URI || 'http://localhost:3000/api/auth/ctrader/callback';
    
    // If we have tokens from a previous auth, use them
    this.accessToken = credentials.accessToken;
    this.refreshToken = credentials.refreshToken;
    this.accountId = credentials.accountId ? parseInt(credentials.accountId) : undefined;
  }

  // Generate OAuth2 authorization URL
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'trading accounts',
      ...(state && { state })
    });
    
    return `${this.baseUrl}/apps/auth?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<CTraderTokenResponse> {
    const response = await fetch(`${this.baseUrl}/apps/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const data = await response.json() as CTraderTokenResponse;
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    
    return data;
  }

  // Refresh access token
  async refreshAccessToken(): Promise<CTraderTokenResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/apps/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json() as CTraderTokenResponse;
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    
    return data;
  }

  // Make authenticated API request
  private async makeRequest<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please connect first.');
    }

    const response = await fetch(`${this.accountsUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (response.status === 401) {
      // Try to refresh token
      await this.refreshAccessToken();
      // Retry request
      return this.makeRequest<T>(endpoint, method, body);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`cTrader API error: ${error}`);
    }

    return response.json();
  }

  async connect(): Promise<boolean> {
    try {
      // If we don't have an access token, we need OAuth flow
      if (!this.accessToken) {
        throw new Error('Please complete OAuth authentication first. Use getAuthorizationUrl() to start the flow.');
      }

      // Test connection by getting accounts
      const accounts = await this.getAccounts();
      
      // Use the first account if not specified
      if (!this.accountId && accounts.length > 0) {
        this.accountId = accounts[0].ctidTraderAccountId;
      }

      return true;
    } catch (error) {
      console.error('cTrader connection error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // cTrader uses OAuth, so we just clear the local tokens
    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.accountId = undefined;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.accessToken) return false;
      
      // Try to get accounts as a connection test
      await this.getAccounts();
      return true;
    } catch (error) {
      console.error('cTrader connection test failed:', error);
      return false;
    }
  }

  // Get all trading accounts
  async getAccounts(): Promise<CTraderAccount[]> {
    return this.makeRequest<CTraderAccount[]>('/');
  }

  async getAccountInfo(): Promise<BrokerAccountInfo> {
    if (!this.accountId) {
      throw new Error('No account selected');
    }

    const account = await this.makeRequest<CTraderAccount>(`/${this.accountId}`);
    
    return {
      accountId: account.ctidTraderAccountId.toString(),
      accountName: `${account.brokerName} Account`,
      balance: account.balance / 100, // cTrader uses cents
      equity: account.equity / 100,
      currency: account.currency,
      leverage: account.leverage,
      marginUsed: account.margin / 100,
      marginAvailable: account.freeMargin / 100,
      broker: account.brokerName,
      accountType: account.isLive ? 'live' : 'demo',
    };
  }

  async getPositions(): Promise<BrokerPosition[]> {
    if (!this.accountId) {
      throw new Error('No account selected');
    }

    const positions = await this.makeRequest<CTraderPosition[]>(`/${this.accountId}/positions`);
    
    return positions.map(pos => ({
      id: pos.positionId,
      symbol: pos.symbolName,
      side: pos.tradeSide,
      quantity: pos.volume / 100000000, // Convert from cTrader volume
      entryPrice: pos.entryPrice,
      unrealizedPnL: pos.profit / 100,
      openTime: new Date(pos.entryTimestamp),
      commission: pos.commission / 100,
    }));
  }

  async syncTrades(startDate?: Date, endDate?: Date): Promise<BrokerSyncResult> {
    try {
      if (!this.accountId) {
        throw new Error('No account selected');
      }

      const start = startDate || new Date(Date.now() - this.options.historicalDays! * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      // Get historical deals (closed trades)
      const params = new URLSearchParams({
        from: start.getTime().toString(),
        to: end.getTime().toString(),
      });

      const deals = await this.makeRequest<CTraderDeal[]>(
        `/${this.accountId}/deals?${params.toString()}`
      );

      const trades: Partial<Trade>[] = [];
      const errors: string[] = [];

      // Process deals to extract closed positions
      const closedPositions = deals.filter(deal => deal.closePositionDetail);
      
      for (const deal of closedPositions) {
        try {
          const trade = this.convertCTraderDealToTrade(deal);
          trades.push(trade);
        } catch (error) {
          errors.push(`Failed to convert deal ${deal.dealId}: ${error}`);
        }
      }

      return {
        success: true,
        tradesImported: trades.length,
        errors,
        lastSyncTime: new Date(),
      };
    } catch (error) {
      console.error('cTrader sync error:', error);
      return {
        success: false,
        tradesImported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date(),
      };
    }
  }

  private convertCTraderDealToTrade(deal: CTraderDeal): Partial<Trade> {
    const closeDetail = deal.closePositionDetail!;
    const isBuy = deal.tradeSide === 'BUY';
    
    // Calculate exit price (entry + profit in pips)
    const pipMultiplier = deal.symbolName.includes('JPY') ? 0.01 : 0.0001;
    const exitPrice = closeDetail.entryPrice + (closeDetail.profitInPips * pipMultiplier * (isBuy ? 1 : -1));
    
    return {
      symbol: deal.symbolName,
      type: deal.tradeSide,
      entry: closeDetail.entryPrice,
      exit: exitPrice,
      quantity: deal.volume / 100000000, // Convert from cTrader volume
      entryTime: new Date(deal.createTimestamp),
      exitTime: new Date(deal.executionTimestamp),
      commission: (closeDetail.commission + closeDetail.swap) / 100,
      notes: `cTrader Deal #${deal.dealId} | P&L: ${(closeDetail.profit / 100).toFixed(2)}`,
      marketType: this.detectMarketType(deal.symbolName),
    };
  }

  // Subscribe to real-time updates (WebSocket)
  async subscribeToRealTimeUpdates(
    onTrade?: (trade: Partial<Trade>) => void,
    onPosition?: (position: BrokerPosition) => void,
    onOrder?: (order: BrokerOrder) => void
  ): Promise<() => void> {
    // cTrader WebSocket implementation would go here
    // For now, return a no-op cleanup function
    console.log('cTrader real-time updates not yet implemented');
    return () => {
      console.log('Cleanup cTrader WebSocket connection');
    };
  }

  // Helper to detect if symbol is forex
  protected detectMarketType(symbol: string): string {
    // cTrader is primarily forex and CFDs
    if (symbol.match(/^[A-Z]{6}$/)) {
      return 'FOREX';
    }
    if (symbol.includes('_')) {
      return 'CFD';
    }
    return 'FOREX'; // Default for cTrader
  }
}