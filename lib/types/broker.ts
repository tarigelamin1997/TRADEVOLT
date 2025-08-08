// Broker connection types for MetaTrader integration

export interface BrokerConnection {
  id: string;
  userId: string;
  platform: 'MT4' | 'MT5' | 'cTrader' | string; // Extended for all platforms
  accountName: string;
  accountId: string;
  accountLogin?: string; // Optional for OAuth platforms
  serverName?: string; // Optional for non-MT platforms
  metaApiAccountId?: string;
  provisioningProfileId?: string;
  externalAccountId?: string; // Platform's native account ID
  brokerName?: string; // Actual broker name
  accountType?: 'live' | 'demo' | 'paper';
  accountCurrency?: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionMethod?: 'rest-api' | 'websocket' | 'oauth2' | 'webhook' | 'csv-import';
  lastSync?: Date;
  autoSync: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetaApiAccountInfo {
  broker: string;
  currency: string;
  server: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  type: string;
  name: string;
  login: string;
  credit: number;
  platform: string;
  marginLevel?: number;
  tradeAllowed: boolean;
  investorMode: boolean;
  accountCurrencyExchangeRate: number;
}

export interface MetaApiPosition {
  id: string;
  type: 'POSITION_TYPE_BUY' | 'POSITION_TYPE_SELL';
  symbol: string;
  magic: number;
  time: Date;
  brokerTime: string;
  openPrice: number;
  volume: number;
  swap: number;
  commission: number;
  clientId?: string;
  profit: number;
  comment?: string;
  originalComment?: string;
  stopLoss?: number;
  takeProfit?: number;
  currentPrice: number;
  currentTickValue: number;
  unrealizedProfit: number;
  realizedProfit: number;
}

export interface MetaApiOrder {
  id: string;
  type: string;
  state: string;
  symbol: string;
  magic: number;
  time: Date;
  brokerTime: string;
  openPrice: number;
  currentPrice: number;
  volume: number;
  currentVolume: number;
  comment?: string;
  clientId?: string;
  stopLoss?: number;
  takeProfit?: number;
  expiration?: Date;
}

export interface MetaApiDeal {
  id: string;
  type: string;
  entryType: string;
  symbol: string;
  magic: number;
  time: Date;
  brokerTime: string;
  volume: number;
  price: number;
  commission: number;
  swap: number;
  profit: number;
  positionId?: string;
  orderId?: string;
  comment?: string;
  brokerComment?: string;
  clientId?: string;
}

export interface CreateBrokerConnectionData {
  platform: 'MT4' | 'MT5';
  accountName: string;
  accountLogin: string;
  password: string;
  serverName: string;
  autoSync?: boolean;
}

export interface BrokerSyncResult {
  success: boolean;
  tradesImported: number;
  errors: string[];
  lastSyncTime: Date;
  nextSyncAvailable?: Date;
}