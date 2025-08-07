import MetaApi from 'metaapi.cloud-sdk';
import type { 
  MetatraderAccount, 
  MetatraderAccountApi,
  ProvisioningProfileApi,
  MetatraderAccountCredentials,
  SynchronizationListener,
  MetatraderDeal
} from 'metaapi.cloud-sdk';
import { 
  BrokerConnection, 
  MetaApiAccountInfo, 
  MetaApiPosition, 
  MetaApiDeal,
  CreateBrokerConnectionData,
  BrokerSyncResult 
} from '@/lib/types/broker';
import { Trade } from '@prisma/client';

// MetaAPI Service for handling MT4/MT5 broker connections
export class MetaAPIService {
  private api: MetaApi;
  private accountApi: MetatraderAccountApi;
  private provisioningApi: ProvisioningProfileApi;

  constructor(token: string, region: string = 'new-york') {
    this.api = new MetaApi(token, { region });
    this.accountApi = this.api.metatraderAccountApi;
    this.provisioningApi = this.api.provisioningProfileApi;
  }

  // Create or get provisioning profile for broker
  async getOrCreateProvisioningProfile(
    brokerName: string,
    platform: 'mt4' | 'mt5'
  ) {
    try {
      // For now, use a default provisioning profile ID
      // In production, you would manage these through MetaAPI dashboard
      // or implement proper profile management
      const defaultProfileId = platform === 'mt4' 
        ? 'default-mt4-profile' 
        : 'default-mt5-profile';
      
      return defaultProfileId;
    } catch (error) {
      console.error('Error with provisioning profile:', error);
      throw error;
    }
  }

  // Connect to MT4/MT5 account
  async connectAccount(
    connectionData: CreateBrokerConnectionData,
    provisioningProfileId: string
  ): Promise<{ accountId: string; connectionId: string }> {
    try {
      // Create MetaAPI account with minimal required fields
      const account = await this.accountApi.createAccount({
        name: connectionData.accountName,
        type: 'cloud' as any,
        login: connectionData.accountLogin,
        password: connectionData.password,
        server: connectionData.serverName,
        platform: connectionData.platform.toLowerCase() as 'mt4' | 'mt5',
        provisioningProfileId
      } as any);

      // Deploy account (start cloud server)
      await account.deploy();

      // Wait for deployment
      await account.waitDeployed();

      return {
        accountId: account.id,
        connectionId: account.id
      };
    } catch (error) {
      console.error('Error connecting account:', error);
      throw error;
    }
  }

  // Get account information
  async getAccountInfo(accountId: string): Promise<MetaApiAccountInfo> {
    try {
      const account = await this.accountApi.getAccount(accountId);
      const connection = account.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized();

      const accountInfo = await connection.getAccountInformation();
      
      return {
        broker: accountInfo.broker,
        currency: accountInfo.currency,
        server: accountInfo.server,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        freeMargin: accountInfo.freeMargin,
        leverage: accountInfo.leverage,
        type: accountInfo.type,
        name: accountInfo.name,
        login: accountInfo.login.toString(),
        credit: accountInfo.credit,
        platform: accountInfo.platform,
        marginLevel: accountInfo.marginLevel,
        tradeAllowed: accountInfo.tradeAllowed || false,
        investorMode: accountInfo.investorMode || false,
        accountCurrencyExchangeRate: accountInfo.accountCurrencyExchangeRate || 1
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }

  // Sync historical trades
  async syncHistoricalTrades(
    accountId: string,
    startTime: Date,
    endTime: Date = new Date()
  ): Promise<BrokerSyncResult> {
    try {
      const account = await this.accountApi.getAccount(accountId);
      const connection = account.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized();

      // Get deals (closed trades) history
      const deals = await connection.getDealsByTimeRange(
        startTime,
        endTime
      );

      const dealsArray = Array.isArray(deals) ? deals : [];
      const tradesImported = dealsArray.length;
      const errors: string[] = [];

      // Convert MetaAPI deals to TradeVolt trades
      const trades: Partial<Trade>[] = dealsArray.map((deal: any) => {
        try {
          return this.convertDealToTrade(deal);
        } catch (error) {
          errors.push(`Failed to convert deal ${deal.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return null;
        }
      }).filter(Boolean) as Partial<Trade>[];

      return {
        tradesImported,
        errors,
        lastSyncTime: new Date()
      };
    } catch (error) {
      console.error('Error syncing historical trades:', error);
      throw error;
    }
  }

  // Convert MetaAPI deal to TradeVolt trade format
  private convertDealToTrade(deal: MetaApiDeal): Partial<Trade> {
    const isBuy = deal.type === 'DEAL_TYPE_BUY';
    
    return {
      symbol: deal.symbol,
      type: isBuy ? 'BUY' : 'SELL',
      entry: deal.price,
      quantity: deal.volume,
      entryTime: new Date(deal.time),
      commission: deal.commission,
      notes: deal.comment || `Imported from MT${deal.brokerComment?.includes('MT5') ? '5' : '4'}`,
      marketType: this.detectMarketType(deal.symbol)
    };
  }

  // Detect market type from symbol
  private detectMarketType(symbol: string): string {
    // Forex pairs
    if (/^[A-Z]{6}$/.test(symbol) || symbol.includes('EUR') || symbol.includes('USD')) {
      return 'FOREX';
    }
    // Futures
    if (symbol.includes('_') || symbol.includes('.') || /ES|NQ|CL|GC|SI/.test(symbol)) {
      return 'FUTURES';
    }
    // Crypto
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('crypto')) {
      return 'CRYPTO';
    }
    // Default to stocks
    return 'STOCKS';
  }

  // Set up real-time trade synchronization
  async setupRealtimeSync(
    accountId: string,
    onNewTrade: (trade: Partial<Trade>) => void
  ): Promise<() => void> {
    try {
      const account = await this.accountApi.getAccount(accountId);
      
      // Use streaming connection for real-time updates
      const connection = account.getStreamingConnection();
      await connection.connect();
      await connection.waitSynchronized();

      // Create synchronization listener
      class TradeSyncListener implements SynchronizationListener {
        async onDealAdded(instanceIndex: string, deal: MetatraderDeal): Promise<any> {
          try {
            const trade = self.convertDealToTrade(deal);
            onNewTrade(trade);
          } catch (error) {
            console.error('Error processing new deal:', error);
          }
        }
      }

      const self = this;
      const listener = new TradeSyncListener();
      connection.addSynchronizationListener(listener);

      // Return cleanup function
      return () => {
        connection.removeSynchronizationListener(listener);
        connection.close();
      };
    } catch (error) {
      console.error('Error setting up realtime sync:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(accountId: string): Promise<boolean> {
    try {
      const account = await this.accountApi.getAccount(accountId);
      const connection = account.getRPCConnection();
      await connection.connect();
      
      const accountInfo = await connection.getAccountInformation();
      await connection.close();
      
      return !!accountInfo;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }

  // Disconnect account
  async disconnectAccount(accountId: string): Promise<void> {
    try {
      const account = await this.accountApi.getAccount(accountId);
      await account.undeploy();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw error;
    }
  }

  // Remove account
  async removeAccount(accountId: string): Promise<void> {
    try {
      const account = await this.accountApi.getAccount(accountId);
      await account.remove();
    } catch (error) {
      console.error('Error removing account:', error);
      throw error;
    }
  }
}