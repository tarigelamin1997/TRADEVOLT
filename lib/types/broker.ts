// Broker connection types for MetaTrader integration

export interface BrokerConnection {
  id: string;
  userId: string;
  platform: 'MT4' | 'MT5';
  accountName: string;
  accountId: string;
  accountLogin: string;
  serverName: string;
  metaApiAccountId?: string;
  provisioningProfileId?: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
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
  tradesImported: number;
  errors: string[];
  lastSyncTime: Date;
}