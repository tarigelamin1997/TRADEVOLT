// Comprehensive broker platform types and configurations

export type BrokerPlatform = 
  // MetaTrader Family
  | 'MT4' 
  | 'MT5'
  | 'cTrader'
  
  // Professional Trading Platforms
  | 'NinjaTrader'
  | 'TradingView'
  | 'ThinkorSwim'
  | 'TradeStation'
  | 'SierraChart'
  | 'MultiCharts'
  
  // Retail Broker Platforms
  | 'InteractiveBrokers'
  | 'TastyTrade'
  | 'Webull'
  | 'Robinhood'
  | 'ETRADE'
  | 'CharlesSchwab'
  | 'Fidelity'
  | 'TDAmeritrade'
  
  // Crypto Platforms
  | 'Binance'
  | 'Coinbase'
  | 'Kraken'
  | 'Bybit'
  | 'BitMEX'
  | 'FTX' // For historical data
  
  // Prop Trading Platforms
  | 'Rithmic'
  | 'CQG'
  | 'TT' // Trading Technologies
  
  // European Platforms
  | 'IG'
  | 'Plus500'
  | 'eToro'
  | 'OANDA';

export interface BrokerPlatformConfig {
  id: BrokerPlatform;
  name: string;
  category: 'metatrader' | 'professional' | 'retail' | 'crypto' | 'prop' | 'european';
  apiProvider: string;
  requiresApiKey: boolean;
  requiresOAuth: boolean;
  requiresWebhook: boolean;
  supportedMarkets: MarketType[];
  features: BrokerFeature[];
  connectionMethod: ConnectionMethod;
  apiCost: ApiCostStructure;
  documentation: string;
  status: 'available' | 'coming-soon' | 'planned' | 'beta';
  setupComplexity: 'easy' | 'medium' | 'complex';
}

export type MarketType = 
  | 'STOCKS' 
  | 'OPTIONS' 
  | 'FUTURES' 
  | 'FOREX' 
  | 'CRYPTO' 
  | 'BONDS' 
  | 'CFD';

export type BrokerFeature = 
  | 'real-time-sync'
  | 'historical-import'
  | 'position-tracking'
  | 'order-management'
  | 'account-info'
  | 'market-data'
  | 'alerts'
  | 'webhooks'
  | 'paper-trading'
  | 'multi-account';

export type ConnectionMethod = 
  | 'rest-api'
  | 'websocket'
  | 'fix-protocol'
  | 'oauth2'
  | 'api-key'
  | 'csv-import'
  | 'webhook'
  | 'screen-scraping';

export interface ApiCostStructure {
  model: 'free' | 'freemium' | 'paid' | 'enterprise' | 'per-request';
  baseCost?: number; // Monthly cost in USD
  additionalCosts?: {
    perAccount?: number;
    perRequest?: number;
    dataFeed?: number;
  };
  freeLimit?: {
    accounts?: number;
    requests?: number;
    historical?: number; // days of history
  };
  notes?: string;
}

// Platform Registry - All supported platforms
export const BROKER_PLATFORMS: Record<BrokerPlatform, BrokerPlatformConfig> = {
  // MetaTrader Family
  MT4: {
    id: 'MT4',
    name: 'MetaTrader 4',
    category: 'metatrader',
    apiProvider: 'MetaAPI',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FOREX', 'CFD'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info', 'multi-account'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'freemium',
      baseCost: 0,
      additionalCosts: { perAccount: 7 },
      freeLimit: { accounts: 1, historical: 30 },
      notes: 'First account free, $7/month per additional account'
    },
    documentation: 'https://metaapi.cloud/docs',
    status: 'available',
    setupComplexity: 'easy'
  },
  
  MT5: {
    id: 'MT5',
    name: 'MetaTrader 5',
    category: 'metatrader',
    apiProvider: 'MetaAPI',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FOREX', 'STOCKS', 'FUTURES', 'CFD'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info', 'multi-account'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'freemium',
      baseCost: 0,
      additionalCosts: { perAccount: 7 },
      freeLimit: { accounts: 1, historical: 30 },
      notes: 'First account free, $7/month per additional account'
    },
    documentation: 'https://metaapi.cloud/docs',
    status: 'available',
    setupComplexity: 'easy'
  },

  cTrader: {
    id: 'cTrader',
    name: 'cTrader',
    category: 'metatrader',
    apiProvider: 'cTrader Open API',
    requiresApiKey: true,
    requiresOAuth: true,
    requiresWebhook: false,
    supportedMarkets: ['FOREX', 'CFD'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'oauth2',
    apiCost: {
      model: 'free',
      notes: 'Free API, broker may charge for access'
    },
    documentation: 'https://help.ctrader.com/open-api',
    status: 'planned',
    setupComplexity: 'medium'
  },

  // Professional Platforms
  NinjaTrader: {
    id: 'NinjaTrader',
    name: 'NinjaTrader',
    category: 'professional',
    apiProvider: 'NinjaTrader API',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FUTURES', 'FOREX', 'STOCKS'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'free',
      notes: 'API included with platform license'
    },
    documentation: 'https://ninjatrader.com/support/helpguides',
    status: 'planned',
    setupComplexity: 'medium'
  },

  TradingView: {
    id: 'TradingView',
    name: 'TradingView',
    category: 'professional',
    apiProvider: 'TradingView Webhooks',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: true,
    supportedMarkets: ['STOCKS', 'FUTURES', 'FOREX', 'CRYPTO'],
    features: ['alerts', 'webhooks', 'market-data'],
    connectionMethod: 'webhook',
    apiCost: {
      model: 'paid',
      baseCost: 14.95,
      notes: 'Requires Pro+ plan for webhooks'
    },
    documentation: 'https://www.tradingview.com/support/solutions/43000529348',
    status: 'coming-soon',
    setupComplexity: 'easy'
  },

  ThinkorSwim: {
    id: 'ThinkorSwim',
    name: 'thinkorswim',
    category: 'professional',
    apiProvider: 'TD Ameritrade API',
    requiresApiKey: true,
    requiresOAuth: true,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS', 'FUTURES', 'FOREX'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'oauth2',
    apiCost: {
      model: 'free',
      notes: 'Free with TD Ameritrade account'
    },
    documentation: 'https://developer.tdameritrade.com',
    status: 'coming-soon',
    setupComplexity: 'medium'
  },

  TradeStation: {
    id: 'TradeStation',
    name: 'TradeStation',
    category: 'professional',
    apiProvider: 'TradeStation API',
    requiresApiKey: true,
    requiresOAuth: true,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS', 'FUTURES', 'CRYPTO'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'oauth2',
    apiCost: {
      model: 'free',
      notes: 'Free with TradeStation account'
    },
    documentation: 'https://api.tradestation.com/docs',
    status: 'planned',
    setupComplexity: 'complex'
  },

  // Retail Brokers
  InteractiveBrokers: {
    id: 'InteractiveBrokers',
    name: 'Interactive Brokers',
    category: 'retail',
    apiProvider: 'IB Gateway/TWS API',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS', 'FUTURES', 'FOREX', 'BONDS'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management', 'multi-account'],
    connectionMethod: 'fix-protocol',
    apiCost: {
      model: 'free',
      notes: 'Free with IB account, may have market data fees'
    },
    documentation: 'https://interactivebrokers.github.io',
    status: 'coming-soon',
    setupComplexity: 'complex'
  },

  TastyTrade: {
    id: 'TastyTrade',
    name: 'tastytrade',
    category: 'retail',
    apiProvider: 'tastytrade API',
    requiresApiKey: true,
    requiresOAuth: true,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS', 'FUTURES', 'CRYPTO'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'oauth2',
    apiCost: {
      model: 'free',
      notes: 'Free with tastytrade account'
    },
    documentation: 'https://api.tastyworks.com/documentation',
    status: 'planned',
    setupComplexity: 'medium'
  },

  Webull: {
    id: 'Webull',
    name: 'Webull',
    category: 'retail',
    apiProvider: 'Webull OpenAPI',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS', 'CRYPTO'],
    features: ['historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'paid',
      baseCost: 1.99,
      notes: 'Requires Webull subscription for API access'
    },
    documentation: 'https://www.webull.com/openapi',
    status: 'planned',
    setupComplexity: 'medium'
  },

  Robinhood: {
    id: 'Robinhood',
    name: 'Robinhood',
    category: 'retail',
    apiProvider: 'Unofficial API',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS', 'CRYPTO'],
    features: ['historical-import', 'csv-import'],
    connectionMethod: 'csv-import',
    apiCost: {
      model: 'free',
      notes: 'CSV export only, no official API'
    },
    documentation: 'CSV export from app',
    status: 'coming-soon',
    setupComplexity: 'easy'
  },

  // Crypto Platforms
  Binance: {
    id: 'Binance',
    name: 'Binance',
    category: 'crypto',
    apiProvider: 'Binance API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['CRYPTO'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'free',
      notes: 'Free API with rate limits'
    },
    documentation: 'https://binance-docs.github.io/apidocs',
    status: 'coming-soon',
    setupComplexity: 'easy'
  },

  Coinbase: {
    id: 'Coinbase',
    name: 'Coinbase',
    category: 'crypto',
    apiProvider: 'Coinbase API',
    requiresApiKey: true,
    requiresOAuth: true,
    requiresWebhook: false,
    supportedMarkets: ['CRYPTO'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'oauth2',
    apiCost: {
      model: 'free',
      notes: 'Free API access'
    },
    documentation: 'https://docs.cloud.coinbase.com',
    status: 'planned',
    setupComplexity: 'medium'
  },

  Kraken: {
    id: 'Kraken',
    name: 'Kraken',
    category: 'crypto',
    apiProvider: 'Kraken API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['CRYPTO'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'free',
      notes: 'Free API with rate limits'
    },
    documentation: 'https://docs.kraken.com/rest',
    status: 'planned',
    setupComplexity: 'easy'
  },

  // Prop Trading
  Rithmic: {
    id: 'Rithmic',
    name: 'Rithmic',
    category: 'prop',
    apiProvider: 'Rithmic API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FUTURES'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'fix-protocol',
    apiCost: {
      model: 'enterprise',
      notes: 'Contact for pricing, typically for prop firms'
    },
    documentation: 'https://yyy.rithmic.com/',
    status: 'planned',
    setupComplexity: 'complex'
  },

  CQG: {
    id: 'CQG',
    name: 'CQG',
    category: 'prop',
    apiProvider: 'CQG API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FUTURES', 'OPTIONS'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'market-data'],
    connectionMethod: 'fix-protocol',
    apiCost: {
      model: 'enterprise',
      notes: 'Enterprise pricing, contact sales'
    },
    documentation: 'https://www.cqg.com/api',
    status: 'planned',
    setupComplexity: 'complex'
  },

  TT: {
    id: 'TT',
    name: 'Trading Technologies',
    category: 'prop',
    apiProvider: 'TT REST API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FUTURES', 'OPTIONS'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'enterprise',
      notes: 'Professional platform, enterprise pricing'
    },
    documentation: 'https://library.tradingtechnologies.com',
    status: 'planned',
    setupComplexity: 'complex'
  },

  // European Platforms
  IG: {
    id: 'IG',
    name: 'IG Trading',
    category: 'european',
    apiProvider: 'IG REST Trading API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FOREX', 'STOCKS', 'CFD'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'free',
      notes: 'Free with IG account'
    },
    documentation: 'https://labs.ig.com/rest-trading-api-reference',
    status: 'planned',
    setupComplexity: 'medium'
  },

  Plus500: {
    id: 'Plus500',
    name: 'Plus500',
    category: 'european',
    apiProvider: 'No Official API',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['CFD', 'FOREX'],
    features: ['csv-import'],
    connectionMethod: 'csv-import',
    apiCost: {
      model: 'free',
      notes: 'CSV export only'
    },
    documentation: 'Manual CSV export',
    status: 'planned',
    setupComplexity: 'easy'
  },

  eToro: {
    id: 'eToro',
    name: 'eToro',
    category: 'european',
    apiProvider: 'No Official API',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'CRYPTO', 'CFD'],
    features: ['csv-import'],
    connectionMethod: 'csv-import',
    apiCost: {
      model: 'free',
      notes: 'CSV export from platform'
    },
    documentation: 'Manual CSV export',
    status: 'planned',
    setupComplexity: 'easy'
  },

  OANDA: {
    id: 'OANDA',
    name: 'OANDA',
    category: 'european',
    apiProvider: 'OANDA v20 API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FOREX', 'CFD'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'free',
      notes: 'Free with OANDA account'
    },
    documentation: 'https://developer.oanda.com/rest-live-v20',
    status: 'planned',
    setupComplexity: 'easy'
  },

  ETRADE: {
    id: 'ETRADE',
    name: 'E*TRADE',
    category: 'retail',
    apiProvider: 'E*TRADE API',
    requiresApiKey: true,
    requiresOAuth: true,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'oauth2',
    apiCost: {
      model: 'free',
      notes: 'Free with E*TRADE account'
    },
    documentation: 'https://developer.etrade.com/home',
    status: 'planned',
    setupComplexity: 'medium'
  },

  CharlesSchwab: {
    id: 'CharlesSchwab',
    name: 'Charles Schwab',
    category: 'retail',
    apiProvider: 'Schwab API (via TD integration)',
    requiresApiKey: true,
    requiresOAuth: true,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS', 'FUTURES'],
    features: ['historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'oauth2',
    apiCost: {
      model: 'free',
      notes: 'Free with Schwab account'
    },
    documentation: 'https://developer.schwab.com',
    status: 'planned',
    setupComplexity: 'medium'
  },

  Fidelity: {
    id: 'Fidelity',
    name: 'Fidelity',
    category: 'retail',
    apiProvider: 'No Official API',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS'],
    features: ['csv-import'],
    connectionMethod: 'csv-import',
    apiCost: {
      model: 'free',
      notes: 'CSV export only'
    },
    documentation: 'Manual CSV export',
    status: 'planned',
    setupComplexity: 'easy'
  },

  TDAmeritrade: {
    id: 'TDAmeritrade',
    name: 'TD Ameritrade',
    category: 'retail',
    apiProvider: 'TD Ameritrade API',
    requiresApiKey: true,
    requiresOAuth: true,
    requiresWebhook: false,
    supportedMarkets: ['STOCKS', 'OPTIONS', 'FUTURES', 'FOREX'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'account-info'],
    connectionMethod: 'oauth2',
    apiCost: {
      model: 'free',
      notes: 'Free with TD account (merging with Schwab)'
    },
    documentation: 'https://developer.tdameritrade.com',
    status: 'coming-soon',
    setupComplexity: 'medium'
  },

  Bybit: {
    id: 'Bybit',
    name: 'Bybit',
    category: 'crypto',
    apiProvider: 'Bybit API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['CRYPTO'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'free',
      notes: 'Free API with rate limits'
    },
    documentation: 'https://bybit-exchange.github.io/docs',
    status: 'planned',
    setupComplexity: 'easy'
  },

  BitMEX: {
    id: 'BitMEX',
    name: 'BitMEX',
    category: 'crypto',
    apiProvider: 'BitMEX API',
    requiresApiKey: true,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['CRYPTO'],
    features: ['real-time-sync', 'historical-import', 'position-tracking', 'order-management'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'free',
      notes: 'Free API access'
    },
    documentation: 'https://www.bitmex.com/app/apiOverview',
    status: 'planned',
    setupComplexity: 'easy'
  },

  FTX: {
    id: 'FTX',
    name: 'FTX (Historical)',
    category: 'crypto',
    apiProvider: 'Historical Data Only',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['CRYPTO'],
    features: ['csv-import'],
    connectionMethod: 'csv-import',
    apiCost: {
      model: 'free',
      notes: 'Historical data import only (exchange closed)'
    },
    documentation: 'CSV import for historical trades',
    status: 'planned',
    setupComplexity: 'easy'
  },

  SierraChart: {
    id: 'SierraChart',
    name: 'Sierra Chart',
    category: 'professional',
    apiProvider: 'DTC Protocol',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FUTURES', 'STOCKS', 'FOREX'],
    features: ['real-time-sync', 'historical-import', 'position-tracking'],
    connectionMethod: 'fix-protocol',
    apiCost: {
      model: 'paid',
      baseCost: 36,
      notes: 'Requires Sierra Chart subscription'
    },
    documentation: 'https://www.sierrachart.com/index.php?page=doc/DTCProtocol.php',
    status: 'planned',
    setupComplexity: 'complex'
  },

  MultiCharts: {
    id: 'MultiCharts',
    name: 'MultiCharts',
    category: 'professional',
    apiProvider: 'MultiCharts API',
    requiresApiKey: false,
    requiresOAuth: false,
    requiresWebhook: false,
    supportedMarkets: ['FUTURES', 'STOCKS', 'FOREX'],
    features: ['historical-import', 'position-tracking'],
    connectionMethod: 'rest-api',
    apiCost: {
      model: 'paid',
      baseCost: 97,
      notes: 'Requires MultiCharts license'
    },
    documentation: 'https://www.multicharts.com/trading-software/api',
    status: 'planned',
    setupComplexity: 'medium'
  }
};

// Helper functions
export function getPlatformsByCategory(category: BrokerPlatformConfig['category']): BrokerPlatformConfig[] {
  return Object.values(BROKER_PLATFORMS).filter(p => p.category === category);
}

export function getAvailablePlatforms(): BrokerPlatformConfig[] {
  return Object.values(BROKER_PLATFORMS).filter(p => p.status === 'available');
}

export function getComingSoonPlatforms(): BrokerPlatformConfig[] {
  return Object.values(BROKER_PLATFORMS).filter(p => p.status === 'coming-soon');
}

export function getPlatformsByMarket(market: MarketType): BrokerPlatformConfig[] {
  return Object.values(BROKER_PLATFORMS).filter(p => p.supportedMarkets.includes(market));
}

export function getFreePlatforms(): BrokerPlatformConfig[] {
  return Object.values(BROKER_PLATFORMS).filter(p => 
    p.apiCost.model === 'free' || 
    (p.apiCost.model === 'freemium' && p.apiCost.baseCost === 0)
  );
}