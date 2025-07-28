// Market Knowledge Base - Understanding different trading markets and their characteristics

export interface MarketCharacteristics {
  name: string
  identifiers: string[] // Keywords that identify this market type
  typicalSymbols: RegExp[] // Patterns for symbols in this market
  contractMultipliers?: Record<string, number>
  typicalColumns: string[] // Common column names for this market
  priceFormat: 'decimal' | 'fractional' | 'tick'
  hasExpiration: boolean
  hasStrike: boolean
  hasMultiplier: boolean
  notes: string
}

export const MARKET_TYPES: Record<string, MarketCharacteristics> = {
  FUTURES: {
    name: 'Futures',
    identifiers: ['futures', 'future', 'contract', 'futs', 'fut'],
    typicalSymbols: [
      /^[A-Z]{1,2}$/,  // ES, NQ, CL, GC
      /^[A-Z]{2,3}[0-9]{2}$/, // ESZ24, CLK25
      /^[A-Z]{2,3}\s[A-Z]{3}\s[0-9]{2}$/, // ES DEC 24
      /^(ES|NQ|RTY|YM|ZB|ZN|ZF|ZT|CL|GC|SI|HG|NG|6E|6J|6B|6C|6A|6S)/ // Common futures
    ],
    typicalColumns: ['contract', 'expiry', 'month', 'year', 'tick_value', 'multiplier'],
    contractMultipliers: {
      'ES': 50,    // E-mini S&P 500
      'NQ': 20,    // E-mini Nasdaq
      'RTY': 50,   // E-mini Russell
      'YM': 5,     // E-mini Dow
      'CL': 1000,  // Crude Oil (per barrel)
      'GC': 100,   // Gold
      'ZB': 1000,  // 30-Year T-Bond
      'ZN': 1000,  // 10-Year T-Note
      'ZF': 1000,  // 5-Year T-Note
      'ZT': 2000,  // 2-Year T-Note
      '6E': 125000, // Euro FX
      '6J': 12500000, // Japanese Yen
      'NG': 10000  // Natural Gas
    },
    priceFormat: 'decimal',
    hasExpiration: true,
    hasStrike: false,
    hasMultiplier: true,
    notes: 'Futures use contract codes like ESZ24 (ES December 2024)'
  },
  
  OPTIONS: {
    name: 'Options',
    identifiers: ['option', 'options', 'opt', 'call', 'put', 'strike', 'expiry'],
    typicalSymbols: [
      /^[A-Z]{1,5}\s\d{6}[CP]\d+$/, // AAPL 240119C150
      /^[A-Z]{1,5}_\d{6}[CP]\d+$/,  // AAPL_240119C150
      /^[A-Z]{1,5}\s[A-Z]{3}\s\d{1,2}\s\d{4}\s\d+\s[CP]/, // AAPL JAN 19 2024 150 C
    ],
    typicalColumns: ['strike', 'expiry', 'type', 'right', 'call_put', 'option_type', 'underlying', 'contract_size'],
    priceFormat: 'decimal',
    hasExpiration: true,
    hasStrike: true,
    hasMultiplier: true,
    contractMultipliers: {
      'DEFAULT': 100 // Most stock options are 100 shares per contract
    },
    notes: 'Options include strike price, expiration date, and type (Call/Put)'
  },
  
  FOREX: {
    name: 'Forex',
    identifiers: ['forex', 'fx', 'currency', 'currencies', 'spot', 'pair', 'eurusd', 'gbpusd', 'usdjpy', 'audusd', 'usdcad', 'usdchf', 'nzdusd'],
    typicalSymbols: [
      /^[A-Z]{3}[A-Z]{3}$/,    // EURUSD
      /^[A-Z]{3}\/[A-Z]{3}$/,  // EUR/USD
      /^[A-Z]{3}-[A-Z]{3}$/,   // EUR-USD
      /^[A-Z]{3}\s[A-Z]{3}$/,  // EUR USD
      /^[A-Z]{6}$/,            // EURUSD (6 chars)
    ],
    typicalColumns: ['pair', 'base', 'quote', 'pip', 'lot_size', 'margin', 'volume', 'lots', 'size', 'units'],
    priceFormat: 'decimal',
    hasExpiration: false,
    hasStrike: false,
    hasMultiplier: true,
    contractMultipliers: {
      'STANDARD': 100000,  // Standard lot
      'MINI': 10000,       // Mini lot
      'MICRO': 1000,       // Micro lot
      'NANO': 100,         // Nano lot
    },
    notes: 'Forex pairs like EUR/USD, typically traded in lots (100,000 units)'
  },
  
  CRYPTO: {
    name: 'Cryptocurrency',
    identifiers: ['crypto', 'cryptocurrency', 'coin', 'token', 'btc', 'eth', 'usdt', 'perpetual', 'perp'],
    typicalSymbols: [
      /^[A-Z]{3,5}$/,           // BTC, ETH, DOGE
      /^[A-Z]{3,5}USDT?$/,      // BTCUSDT, ETHUSDT
      /^[A-Z]{3,5}-USDT?$/,     // BTC-USDT
      /^[A-Z]{3,5}\/USDT?$/,    // BTC/USDT
      /^[A-Z]{3,5}PERP$/,       // BTCPERP
    ],
    typicalColumns: ['coin', 'token', 'base', 'quote', 'size', 'notional'],
    priceFormat: 'decimal',
    hasExpiration: false,
    hasStrike: false,
    hasMultiplier: false,
    notes: 'Cryptocurrency pairs like BTC/USDT, can be spot or perpetual futures'
  },
  
  STOCKS: {
    name: 'Stocks',
    identifiers: ['stock', 'stocks', 'equity', 'equities', 'share', 'shares'],
    typicalSymbols: [
      /^[A-Z]{1,5}$/,  // AAPL, MSFT, GOOGL
      /^[A-Z]{1,5}\.[A-Z]$/, // BRK.B
    ],
    typicalColumns: ['shares', 'ticker', 'company', 'exchange'],
    priceFormat: 'decimal',
    hasExpiration: false,
    hasStrike: false,
    hasMultiplier: false,
    notes: 'Stock symbols are typically 1-5 uppercase letters'
  }
}

// Detect market type from symbol
export function detectMarketFromSymbol(symbol: string): string | null {
  if (!symbol) return null
  
  const upperSymbol = symbol.toUpperCase().trim()
  
  for (const [marketType, characteristics] of Object.entries(MARKET_TYPES)) {
    for (const pattern of characteristics.typicalSymbols) {
      if (pattern.test(upperSymbol)) {
        return marketType
      }
    }
  }
  
  return null
}

// Detect market type from column headers
export function detectMarketFromHeaders(headers: string[]): string | null {
  const lowerHeaders = headers.map(h => h.toLowerCase())
  
  // Count matches for each market type
  const scores: Record<string, number> = {}
  
  for (const [marketType, characteristics] of Object.entries(MARKET_TYPES)) {
    scores[marketType] = 0
    
    // Check for market identifiers in headers
    for (const identifier of characteristics.identifiers) {
      if (lowerHeaders.some(h => h.includes(identifier))) {
        scores[marketType] += 5
      }
    }
    
    // Check for typical columns
    for (const typicalCol of characteristics.typicalColumns) {
      if (lowerHeaders.some(h => h.includes(typicalCol))) {
        scores[marketType] += 2
      }
    }
  }
  
  // Return market with highest score
  let maxScore = 0
  let detectedMarket = null
  
  for (const [market, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      detectedMarket = market
    }
  }
  
  return maxScore > 0 ? detectedMarket : null
}

// Detect market from data patterns
export function detectMarketFromData(trades: any[]): string | null {
  const marketVotes: Record<string, number> = {}
  
  for (const trade of trades.slice(0, 10)) { // Sample first 10 trades
    const symbol = trade.symbol || trade.ticker || trade.instrument
    if (symbol) {
      const market = detectMarketFromSymbol(symbol)
      if (market) {
        marketVotes[market] = (marketVotes[market] || 0) + 1
      }
    }
  }
  
  // Return most voted market
  let maxVotes = 0
  let detectedMarket = null
  
  for (const [market, votes] of Object.entries(marketVotes)) {
    if (votes > maxVotes) {
      maxVotes = votes
      detectedMarket = market
    }
  }
  
  return detectedMarket
}

// Get intelligent column mappings based on market type
export function getMarketSpecificMappings(marketType: string | null) {
  const basePatterns = {
    symbol: ['symbol', 'ticker', 'stock', 'instrument', 'asset', 'contract', 'underlying', 'name', 'security', 'pair', 'code'],
    type: ['side', 'direction', 'type', 'action', 'buysell', 'buy/sell', 'order_side', 'trade_side', 'position', 'long/short'],
    entry: ['entry', 'entry_price', 'entryprice', 'open', 'open_price', 'openprice', 'fill_price', 'fillprice', 'price', 'executed_price', 'exec_price', 'average_price', 'avg_price'],
    exit: ['exit', 'exit_price', 'exitprice', 'close', 'close_price', 'closeprice', 'closing_price', 'closed_at', 'sell_price', 'realized_price'],
    quantity: ['quantity', 'qty', 'size', 'shares', 'units', 'contracts', 'lots', 'volume', 'position_size', 'amount', 'filled_qty', 'executed_qty'],
    date: ['date', 'time', 'datetime', 'entry_time', 'entrytime', 'open_time', 'opentime', 'trade_date', 'trade_time', 'executed_at', 'filled_at', 'timestamp', 'created_at', 'opened_at'],
    pnl: ['pnl', 'profit', 'loss', 'profit_loss', 'profit/loss', 'pl', 'p&l', 'realized_pnl', 'realized', 'gain', 'return', 'result_amount'],
  }
  
  // Add market-specific patterns
  if (marketType === 'FUTURES') {
    basePatterns.symbol.push('futures_symbol', 'contract_code', 'futures_contract')
    basePatterns.quantity.push('num_contracts', 'contract_count')
  } else if (marketType === 'OPTIONS') {
    basePatterns.symbol.push('option_symbol', 'option_code')
    basePatterns.quantity.push('option_contracts', 'num_options')
  } else if (marketType === 'FOREX') {
    basePatterns.symbol.push('currency_pair', 'fx_pair', 'pair_name')
    basePatterns.quantity.push('lot_size', 'lots', 'position')
  } else if (marketType === 'CRYPTO') {
    basePatterns.symbol.push('coin', 'token', 'crypto_pair')
    basePatterns.quantity.push('coin_amount', 'token_amount', 'crypto_size')
  }
  
  return basePatterns
}

// Calculate proper P&L based on market type
export function calculateMarketPnL(trade: any, marketType: string | null): number | null {
  if (!trade.exit || !trade.entry) return null
  
  const priceDiff = trade.exit - trade.entry
  const direction = trade.type === 'BUY' ? 1 : -1
  const quantity = Math.abs(trade.quantity || 0)
  
  if (marketType === 'FUTURES') {
    // For futures, we need to consider the contract multiplier
    const symbol = trade.symbol?.toUpperCase()
    const multiplier = MARKET_TYPES.FUTURES.contractMultipliers?.[symbol] || 1
    return priceDiff * direction * quantity * multiplier
  } else if (marketType === 'OPTIONS') {
    // Options are typically 100 shares per contract
    const multiplier = 100
    return priceDiff * direction * quantity * multiplier
  } else if (marketType === 'FOREX') {
    // Forex P&L calculation
    // Quantity in forex typically represents lots
    const lotSize = detectForexLotSize(quantity)
    return priceDiff * direction * quantity * lotSize
  } else {
    // Default calculation for stocks and crypto
    return priceDiff * direction * quantity
  }
}

// Detect forex lot size based on quantity
export function detectForexLotSize(quantity: number): number {
  // If quantity is very small (< 1), it's likely already in units
  if (quantity < 0.01) {
    return 100000000 // Assume nano lots expressed as 0.001
  } else if (quantity < 1) {
    return 100000 // Standard lot for fractional quantities
  } else if (quantity >= 1000) {
    return 1 // Quantity is already in units
  } else {
    return 100000 // Default to standard lot
  }
}

// Get pip value for forex pairs
export function getForexPipValue(pair: string, lotSize: number = 100000): number {
  const upperPair = pair.toUpperCase().replace(/[^A-Z]/g, '')
  
  // For XXX/USD pairs, pip value is always $10 per standard lot
  if (upperPair.endsWith('USD')) {
    return 10 * (lotSize / 100000)
  }
  
  // For USD/XXX pairs, pip value depends on the exchange rate
  // This is a simplified calculation - in reality, you'd need the current rate
  const commonPipValues: Record<string, number> = {
    'USDJPY': 9.2,  // Approximate for USD/JPY around 108
    'USDCHF': 10.5, // Approximate for USD/CHF around 0.95
    'USDCAD': 7.7,  // Approximate for USD/CAD around 1.30
  }
  
  return commonPipValues[upperPair] || 10

}

// Common forex pairs for validation
export const MAJOR_FOREX_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'
]

export const MINOR_FOREX_PAIRS = [
  'EURGBP', 'EURJPY', 'GBPJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'GBPCHF',
  'GBPAUD', 'GBPCAD', 'AUDJPY', 'CADJPY', 'CHFJPY', 'AUDCAD', 'AUDCHF'
]