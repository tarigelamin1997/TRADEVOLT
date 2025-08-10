// Comprehensive sample trades for testing all app functionality
import { Trade } from './db-memory'

// Helper function to generate dates
const generateDate = (daysAgo: number, hour: number = 9, minute: number = 30): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

// Generate trade ID
let tradeIdCounter = 1
const genId = () => `demo-trade-${tradeIdCounter++}`

export const COMPREHENSIVE_SAMPLE_TRADES: Trade[] = [
  // === WINNING STREAK PATTERN (5 wins in a row) ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AAPL',
    type: 'BUY',
    entry: 178.50,
    exit: 182.30,
    quantity: 100,
    marketType: 'STOCKS',
    entryTime: generateDate(30, 9, 30),
    exitTime: generateDate(30, 14, 30),
    createdAt: generateDate(30, 14, 30),
    notes: 'Strong breakout above resistance',
    setup: 'Breakout',
    setupTags: ['momentum', 'breakout', 'trending'],
    confidence: 85,
    mae: -0.50,
    mfe: 4.20,
    stopLossPrice: 177.00,
    takeProfitPrice: 183.00,
    wasTakeProfitHit: false,
    exitReason: 'MANUAL',
    commission: 2.00,
    ruleCompliance: {
      score: 90,
      checkedRules: ['entry-confirmation', 'position-size', 'stop-loss'],
      violatedRules: [],
      notes: 'Good discipline'
    }
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'MSFT',
    type: 'BUY',
    entry: 375.20,
    exit: 378.50,
    quantity: 50,
    marketType: 'STOCKS',
    entryTime: generateDate(29, 10, 0),
    exitTime: generateDate(29, 15, 30),
    createdAt: generateDate(29, 15, 30),
    notes: 'Continuation pattern after consolidation',
    setup: 'Trend Continuation',
    confidence: 75,
    mae: -0.30,
    mfe: 3.80,
    commission: 2.00
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'ES',
    type: 'BUY',
    entry: 4750,
    exit: 4762,
    quantity: 2,
    marketType: 'FUTURES',
    entryTime: generateDate(28, 9, 30),
    exitTime: generateDate(28, 11, 0),
    createdAt: generateDate(28, 11, 0),
    notes: 'Opening range breakout',
    setup: 'ORB',
    setupTags: ['opening-range', 'breakout'],
    confidence: 80,
    mae: -3,
    mfe: 15,
    commission: 4.50
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'EUR/USD',
    type: 'BUY',
    entry: 1.0850,
    exit: 1.0880,
    quantity: 100000,
    marketType: 'FOREX',
    entryTime: generateDate(27, 3, 0),
    exitTime: generateDate(27, 7, 0),
    createdAt: generateDate(27, 7, 0),
    notes: 'London session breakout',
    setup: 'Session Breakout',
    confidence: 70
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'BTC/USD',
    type: 'BUY',
    entry: 42500,
    exit: 43200,
    quantity: 0.5,
    marketType: 'CRYPTO',
    entryTime: generateDate(26, 22, 0),
    exitTime: generateDate(25, 6, 0),
    createdAt: generateDate(25, 6, 0),
    notes: 'Support bounce at 42k level',
    setup: 'Support Bounce',
    confidence: 65
  },

  // === LOSING STREAK PATTERN (4 losses for behavioral analysis) ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'TSLA',
    type: 'BUY',
    entry: 235.00,
    exit: 232.50,
    quantity: 100,
    marketType: 'STOCKS',
    entryTime: generateDate(24, 10, 0),
    exitTime: generateDate(24, 10, 30),
    createdAt: generateDate(24, 10, 30),
    notes: 'FOMO trade - chasing',
    setup: 'Breakout',
    confidence: 40,
    mae: -3.50,
    mfe: 0.50,
    wasStopLossHit: true,
    exitReason: 'STOP_LOSS',
    ruleCompliance: {
      score: 30,
      checkedRules: ['stop-loss'],
      violatedRules: ['entry-confirmation', 'position-size'],
      notes: 'FOMO entry, oversized position'
    }
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'NQ',
    type: 'SELL',
    entry: 16850,
    exit: 16870,
    quantity: 3, // Oversized position
    marketType: 'FUTURES',
    entryTime: generateDate(24, 10, 45),
    exitTime: generateDate(24, 11, 15),
    createdAt: generateDate(24, 11, 15),
    notes: 'Revenge trade after TSLA loss',
    confidence: 25,
    mae: -25,
    mfe: 5,
    wasStopLossHit: true,
    exitReason: 'STOP_LOSS',
    ruleCompliance: {
      score: 20,
      checkedRules: [],
      violatedRules: ['max-loss-per-day', 'position-size', 'setup-quality'],
      notes: 'Revenge trading, no setup'
    }
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AMZN',
    type: 'SELL',
    entry: 168.00,
    exit: 169.50,
    quantity: 200, // Another oversized position
    marketType: 'STOCKS',
    entryTime: generateDate(24, 11, 30),
    exitTime: generateDate(24, 12, 0),
    createdAt: generateDate(24, 12, 0),
    notes: 'Trying to recover losses - no setup',
    confidence: 20,
    wasStopLossHit: true,
    exitReason: 'STOP_LOSS'
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'GBP/USD',
    type: 'BUY',
    entry: 1.2650,
    exit: 1.2620,
    quantity: 150000, // Oversized forex position
    marketType: 'FOREX',
    entryTime: generateDate(24, 14, 0),
    exitTime: generateDate(24, 14, 30),
    createdAt: generateDate(24, 14, 30),
    notes: 'Desperation trade - trying to make back losses',
    confidence: 15
  },

  // === MIXED PATTERN WITH OPTIONS ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'SPY',
    type: 'BUY',
    entry: 475.25,
    exit: 478.50,
    quantity: 10, // 10 contracts = 1000 shares
    marketType: 'OPTIONS',
    entryTime: generateDate(22, 9, 45),
    exitTime: generateDate(22, 15, 30),
    createdAt: generateDate(22, 15, 30),
    notes: 'SPY calls - trend day',
    setup: 'Trend Day',
    confidence: 80,
    commission: 6.50
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'QQQ',
    type: 'SELL',
    entry: 405.00,
    exit: 403.00,
    quantity: 5,
    marketType: 'OPTIONS',
    entryTime: generateDate(21, 10, 0),
    exitTime: generateDate(21, 14, 0),
    createdAt: generateDate(21, 14, 0),
    notes: 'Put options - resistance rejection',
    setup: 'Resistance Short',
    confidence: 70
  },

  // === SCALPING PATTERN (Very short holds) ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'ES',
    type: 'BUY',
    entry: 4755,
    exit: 4757,
    quantity: 5,
    marketType: 'FUTURES',
    entryTime: generateDate(20, 9, 30),
    exitTime: generateDate(20, 9, 32),
    createdAt: generateDate(20, 9, 32),
    notes: '2-minute scalp',
    setup: 'Scalp',
    confidence: 60
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'NQ',
    type: 'SELL',
    entry: 16900,
    exit: 16895,
    quantity: 2,
    marketType: 'FUTURES',
    entryTime: generateDate(20, 9, 35),
    exitTime: generateDate(20, 9, 38),
    createdAt: generateDate(20, 9, 38),
    notes: '3-minute scalp',
    setup: 'Scalp',
    confidence: 65
  },

  // === SWING TRADES (Multi-day holds) ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'NVDA',
    type: 'BUY',
    entry: 610.50,
    exit: 635.75,
    quantity: 30,
    marketType: 'STOCKS',
    entryTime: generateDate(18, 15, 30),
    exitTime: generateDate(12, 10, 0),
    createdAt: generateDate(12, 10, 0),
    notes: 'Swing trade - earnings momentum',
    setup: 'Swing Trade',
    setupTags: ['earnings', 'momentum', 'multi-day'],
    confidence: 85,
    mae: -8.50,
    mfe: 28.00
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AMD',
    type: 'BUY',
    entry: 165.00,
    exit: 158.50,
    quantity: 50,
    marketType: 'STOCKS',
    entryTime: generateDate(15, 14, 0),
    exitTime: generateDate(10, 9, 30),
    createdAt: generateDate(10, 9, 30),
    notes: 'Failed swing - stopped out',
    setup: 'Swing Trade',
    confidence: 70,
    wasStopLossHit: true,
    exitReason: 'STOP_LOSS'
  },

  // === CRYPTO WEEKEND TRADING ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'ETH/USD',
    type: 'BUY',
    entry: 2350,
    exit: 2420,
    quantity: 2,
    marketType: 'CRYPTO',
    entryTime: generateDate(8, 10, 0), // Saturday
    exitTime: generateDate(7, 14, 0), // Sunday
    createdAt: generateDate(7, 14, 0),
    notes: 'Weekend crypto rally',
    setup: 'Trend Follow',
    confidence: 75
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'SOL/USD',
    type: 'SELL',
    entry: 98.50,
    exit: 95.00,
    quantity: 25,
    marketType: 'CRYPTO',
    entryTime: generateDate(7, 20, 0), // Sunday night
    exitTime: generateDate(6, 2, 0),
    createdAt: generateDate(6, 2, 0),
    notes: 'Sunday night dump',
    setup: 'Breakdown',
    confidence: 60
  },

  // === PARTIAL EXIT TRADES ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'GOOGL',
    type: 'BUY',
    entry: 138.50,
    exit: 142.00,
    quantity: 100,
    marketType: 'STOCKS',
    entryTime: generateDate(5, 9, 45),
    exitTime: generateDate(5, 14, 30),
    createdAt: generateDate(5, 14, 30),
    notes: 'Scaled out in thirds',
    setup: 'Breakout',
    confidence: 80,
    partialExits: [
      {
        id: 'pe-1',
        price: 140.00,
        quantity: 33,
        timestamp: generateDate(5, 11, 0),
        reason: 'SCALE_OUT'
      },
      {
        id: 'pe-2',
        price: 141.00,
        quantity: 33,
        timestamp: generateDate(5, 13, 0),
        reason: 'SCALE_OUT'
      },
      {
        id: 'pe-3',
        price: 142.00,
        quantity: 34,
        timestamp: generateDate(5, 14, 30),
        reason: 'TAKE_PROFIT'
      }
    ]
  },

  // === HIGH CONFIDENCE TRADES ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'META',
    type: 'BUY',
    entry: 485.00,
    exit: 495.50,
    quantity: 40,
    marketType: 'STOCKS',
    entryTime: generateDate(4, 10, 0),
    exitTime: generateDate(4, 15, 0),
    createdAt: generateDate(4, 15, 0),
    notes: 'A+ setup - all rules aligned',
    setup: 'Perfect Setup',
    setupTags: ['high-confidence', 'all-rules-met'],
    confidence: 95,
    mae: -0.50,
    mfe: 12.00,
    ruleCompliance: {
      score: 100,
      checkedRules: ['entry-confirmation', 'volume', 'trend', 'stop-loss', 'position-size'],
      violatedRules: [],
      notes: 'Perfect execution'
    }
  },

  // === LOW CONFIDENCE / EXPERIMENTAL ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'SHOP',
    type: 'SELL',
    entry: 68.00,
    exit: 69.50,
    quantity: 25,
    marketType: 'STOCKS',
    entryTime: generateDate(3, 11, 30),
    exitTime: generateDate(3, 13, 0),
    createdAt: generateDate(3, 13, 0),
    notes: 'Testing new pattern - small size',
    setup: 'Experimental',
    confidence: 30,
    wasStopLossHit: true,
    exitReason: 'STOP_LOSS'
  },

  // === TODAY'S TRADES (For daily P&L) ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AAPL',
    type: 'BUY',
    entry: 180.00,
    exit: 181.50,
    quantity: 100,
    marketType: 'STOCKS',
    entryTime: generateDate(0, 9, 30),
    exitTime: generateDate(0, 11, 0),
    createdAt: generateDate(0, 11, 0),
    notes: 'Morning momentum trade',
    setup: 'Gap and Go',
    confidence: 75
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'ES',
    type: 'SELL',
    entry: 4770,
    exit: 4765,
    quantity: 1,
    marketType: 'FUTURES',
    entryTime: generateDate(0, 13, 0),
    exitTime: generateDate(0, 14, 30),
    createdAt: generateDate(0, 14, 30),
    notes: 'Afternoon fade',
    setup: 'Fade',
    confidence: 60
  },

  // === OPEN POSITIONS (No exit) ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'TSLA',
    type: 'BUY',
    entry: 240.00,
    exit: null,
    quantity: 50,
    marketType: 'STOCKS',
    entryTime: generateDate(1, 15, 0),
    exitTime: null,
    createdAt: generateDate(1, 15, 0),
    notes: 'Swing position - still open',
    setup: 'Swing Trade',
    confidence: 70,
    stopLossPrice: 235.00,
    takeProfitPrice: 250.00
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'BTC/USD',
    type: 'BUY',
    entry: 43500,
    exit: null,
    quantity: 0.25,
    marketType: 'CRYPTO',
    entryTime: generateDate(0, 8, 0),
    exitTime: null,
    createdAt: generateDate(0, 8, 0),
    notes: 'Long term hold',
    setup: 'Position Trade',
    confidence: 85
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'EUR/USD',
    type: 'SELL',
    entry: 1.0920,
    exit: null,
    quantity: 50000,
    marketType: 'FOREX',
    entryTime: generateDate(0, 3, 30),
    exitTime: null,
    createdAt: generateDate(0, 3, 30),
    notes: 'London session short',
    setup: 'Session Trade',
    confidence: 65
  },

  // === DIFFERENT TIMES OF DAY ===
  // Pre-market
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'SPY',
    type: 'BUY',
    entry: 476.00,
    exit: 476.50,
    quantity: 100,
    marketType: 'STOCKS',
    entryTime: generateDate(14, 7, 0),
    exitTime: generateDate(14, 8, 30),
    createdAt: generateDate(14, 8, 30),
    notes: 'Pre-market gap trade',
    setup: 'Gap Trade',
    confidence: 55
  },
  // Lunch hour
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'QQQ',
    type: 'SELL',
    entry: 408.00,
    exit: 407.50,
    quantity: 50,
    marketType: 'STOCKS',
    entryTime: generateDate(13, 12, 0),
    exitTime: generateDate(13, 13, 0),
    createdAt: generateDate(13, 13, 0),
    notes: 'Lunch hour fade',
    setup: 'Lunch Fade',
    confidence: 60
  },
  // Power hour
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'IWM',
    type: 'BUY',
    entry: 195.00,
    exit: 196.20,
    quantity: 100,
    marketType: 'STOCKS',
    entryTime: generateDate(12, 15, 0),
    exitTime: generateDate(12, 15, 55),
    createdAt: generateDate(12, 15, 55),
    notes: 'Power hour momentum',
    setup: 'Power Hour',
    confidence: 70
  },

  // === COMMODITY FUTURES ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'CL',
    type: 'BUY',
    entry: 78.50,
    exit: 79.20,
    quantity: 2,
    marketType: 'FUTURES',
    entryTime: generateDate(16, 10, 0),
    exitTime: generateDate(16, 14, 0),
    createdAt: generateDate(16, 14, 0),
    notes: 'Crude oil long',
    setup: 'Commodity Trend',
    confidence: 65
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'GC',
    type: 'SELL',
    entry: 2050,
    exit: 2045,
    quantity: 1,
    marketType: 'FUTURES',
    entryTime: generateDate(17, 8, 0),
    exitTime: generateDate(17, 11, 0),
    createdAt: generateDate(17, 11, 0),
    notes: 'Gold short',
    setup: 'Commodity Fade',
    confidence: 55
  },

  // === MORE FOREX PAIRS ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'GBP/JPY',
    type: 'BUY',
    entry: 188.50,
    exit: 189.20,
    quantity: 50000,
    marketType: 'FOREX',
    entryTime: generateDate(19, 2, 0),
    exitTime: generateDate(19, 6, 0),
    createdAt: generateDate(19, 6, 0),
    notes: 'Asian session breakout',
    setup: 'Asian Breakout',
    confidence: 70
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AUD/USD',
    type: 'SELL',
    entry: 0.6550,
    exit: 0.6530,
    quantity: 100000,
    marketType: 'FOREX',
    entryTime: generateDate(18, 22, 0),
    exitTime: generateDate(18, 23, 30),
    createdAt: generateDate(18, 23, 30),
    notes: 'News fade after RBA',
    setup: 'News Fade',
    confidence: 60
  },

  // === BREAK EVEN TRADES ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'NFLX',
    type: 'BUY',
    entry: 450.00,
    exit: 450.00,
    quantity: 20,
    marketType: 'STOCKS',
    entryTime: generateDate(23, 10, 0),
    exitTime: generateDate(23, 14, 0),
    createdAt: generateDate(23, 14, 0),
    notes: 'Scratched at breakeven',
    setup: 'Failed Breakout',
    confidence: 50,
    commission: 2.00 // Small loss due to commission
  },

  // === LARGE WIN ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'SMCI',
    type: 'BUY',
    entry: 450.00,
    exit: 520.00,
    quantity: 20,
    marketType: 'STOCKS',
    entryTime: generateDate(25, 9, 45),
    exitTime: generateDate(23, 15, 30),
    createdAt: generateDate(23, 15, 30),
    notes: 'Earnings gap and run - biggest winner',
    setup: 'Earnings Play',
    setupTags: ['earnings', 'gap', 'home-run'],
    confidence: 90,
    mae: -5.00,
    mfe: 75.00
  },

  // === LARGE LOSS ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'RIVN',
    type: 'BUY',
    entry: 15.00,
    exit: 12.00,
    quantity: 500,
    marketType: 'STOCKS',
    entryTime: generateDate(26, 10, 0),
    exitTime: generateDate(26, 15, 0),
    createdAt: generateDate(26, 15, 0),
    notes: 'Caught in bad news - biggest loss',
    setup: 'Failed Breakout',
    confidence: 45,
    mae: -3.50,
    mfe: 0.50,
    wasStopLossHit: false, // Held too long
    exitReason: 'MANUAL',
    ruleCompliance: {
      score: 10,
      checkedRules: [],
      violatedRules: ['stop-loss', 'max-loss', 'position-size'],
      notes: 'Violated multiple rules - held losing position'
    }
  },

  // === MORE VARIED SYMBOLS FOR DISTRIBUTION ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'V',
    type: 'BUY',
    entry: 265.00,
    exit: 267.50,
    quantity: 30,
    marketType: 'STOCKS',
    entryTime: generateDate(31, 10, 0),
    exitTime: generateDate(31, 14, 0),
    createdAt: generateDate(31, 14, 0),
    notes: 'Financial sector strength',
    setup: 'Sector Rotation',
    confidence: 70
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'JPM',
    type: 'BUY',
    entry: 185.00,
    exit: 187.00,
    quantity: 50,
    marketType: 'STOCKS',
    entryTime: generateDate(32, 9, 30),
    exitTime: generateDate(32, 15, 0),
    createdAt: generateDate(32, 15, 0),
    notes: 'Bank momentum',
    setup: 'Sector Momentum',
    confidence: 65
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'XOM',
    type: 'SELL',
    entry: 105.00,
    exit: 103.50,
    quantity: 75,
    marketType: 'STOCKS',
    entryTime: generateDate(33, 11, 0),
    exitTime: generateDate(33, 14, 30),
    createdAt: generateDate(33, 14, 30),
    notes: 'Energy weakness',
    setup: 'Sector Short',
    confidence: 60
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'DIS',
    type: 'BUY',
    entry: 98.00,
    exit: 96.50,
    quantity: 100,
    marketType: 'STOCKS',
    entryTime: generateDate(34, 10, 30),
    exitTime: generateDate(34, 15, 30),
    createdAt: generateDate(34, 15, 30),
    notes: 'Failed bounce',
    setup: 'Failed Bounce',
    confidence: 55,
    wasStopLossHit: true,
    exitReason: 'STOP_LOSS'
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'BA',
    type: 'SELL',
    entry: 215.00,
    exit: 212.00,
    quantity: 40,
    marketType: 'STOCKS',
    entryTime: generateDate(35, 9, 45),
    exitTime: generateDate(35, 13, 0),
    createdAt: generateDate(35, 13, 0),
    notes: 'Breakdown short',
    setup: 'Breakdown',
    confidence: 70
  },

  // === MORE CRYPTO VARIETY ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'XRP/USD',
    type: 'BUY',
    entry: 0.55,
    exit: 0.58,
    quantity: 5000,
    marketType: 'CRYPTO',
    entryTime: generateDate(36, 14, 0),
    exitTime: generateDate(35, 18, 0),
    createdAt: generateDate(35, 18, 0),
    notes: 'Altcoin momentum',
    setup: 'Crypto Momentum',
    confidence: 65
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'DOGE/USD',
    type: 'BUY',
    entry: 0.08,
    exit: 0.075,
    quantity: 10000,
    marketType: 'CRYPTO',
    entryTime: generateDate(37, 20, 0),
    exitTime: generateDate(37, 22, 0),
    createdAt: generateDate(37, 22, 0),
    notes: 'Meme coin gamble - failed',
    setup: 'Speculation',
    confidence: 25
  },

  // === MORE OPTIONS TRADES ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'NVDA',
    type: 'BUY',
    entry: 620.00,
    exit: 630.00,
    quantity: 5, // 5 contracts
    marketType: 'OPTIONS',
    entryTime: generateDate(38, 9, 30),
    exitTime: generateDate(38, 15, 0),
    createdAt: generateDate(38, 15, 0),
    notes: '0DTE calls on trend day',
    setup: '0DTE',
    setupTags: ['options', 'day-trade', '0dte'],
    confidence: 75,
    commission: 3.25
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AMZN',
    type: 'SELL',
    entry: 170.00,
    exit: 168.00,
    quantity: 10,
    marketType: 'OPTIONS',
    entryTime: generateDate(39, 10, 0),
    exitTime: generateDate(39, 14, 0),
    createdAt: generateDate(39, 14, 0),
    notes: 'Put options - breakdown play',
    setup: 'Options Breakdown',
    confidence: 70
  },

  // === MORE FUTURES VARIETY ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'YM',
    type: 'BUY',
    entry: 37500,
    exit: 37550,
    quantity: 1,
    marketType: 'FUTURES',
    entryTime: generateDate(40, 9, 30),
    exitTime: generateDate(40, 11, 0),
    createdAt: generateDate(40, 11, 0),
    notes: 'Dow futures long',
    setup: 'Index Futures',
    confidence: 60
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'RTY',
    type: 'SELL',
    entry: 1950,
    exit: 1945,
    quantity: 2,
    marketType: 'FUTURES',
    entryTime: generateDate(41, 14, 0),
    exitTime: generateDate(41, 15, 30),
    createdAt: generateDate(41, 15, 30),
    notes: 'Russell futures short',
    setup: 'Small Cap Fade',
    confidence: 65
  },

  // === SPECIFIC TIME PATTERNS FOR ANALYSIS ===
  // Monday trades
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'SPY',
    type: 'BUY',
    entry: 477.00,
    exit: 478.50,
    quantity: 100,
    marketType: 'STOCKS',
    entryTime: generateDate(42, 9, 30), // Monday
    exitTime: generateDate(42, 15, 30),
    createdAt: generateDate(42, 15, 30),
    notes: 'Monday trend day',
    setup: 'Trend Follow',
    confidence: 75
  },
  // Friday trades
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'QQQ',
    type: 'SELL',
    entry: 410.00,
    exit: 408.50,
    quantity: 75,
    marketType: 'STOCKS',
    entryTime: generateDate(38, 14, 0), // Friday
    exitTime: generateDate(38, 15, 45),
    createdAt: generateDate(38, 15, 45),
    notes: 'Friday afternoon fade',
    setup: 'Friday Fade',
    confidence: 65
  },

  // === MORE BEHAVIORAL PATTERNS ===
  // Overtrading day (multiple small trades)
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AAPL',
    type: 'BUY',
    entry: 179.00,
    exit: 179.20,
    quantity: 50,
    marketType: 'STOCKS',
    entryTime: generateDate(45, 9, 30),
    exitTime: generateDate(45, 9, 35),
    createdAt: generateDate(45, 9, 35),
    notes: 'Overtrading - trade 1',
    confidence: 40
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AAPL',
    type: 'SELL',
    entry: 179.20,
    exit: 179.10,
    quantity: 50,
    marketType: 'STOCKS',
    entryTime: generateDate(45, 9, 40),
    exitTime: generateDate(45, 9, 45),
    createdAt: generateDate(45, 9, 45),
    notes: 'Overtrading - trade 2',
    confidence: 35
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'AAPL',
    type: 'BUY',
    entry: 179.10,
    exit: 178.90,
    quantity: 75,
    marketType: 'STOCKS',
    entryTime: generateDate(45, 9, 50),
    exitTime: generateDate(45, 10, 0),
    createdAt: generateDate(45, 10, 0),
    notes: 'Overtrading - trade 3 - churn',
    confidence: 30
  },

  // === PERFECT DISCIPLINE DAY ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'MSFT',
    type: 'BUY',
    entry: 380.00,
    exit: 383.50,
    quantity: 50,
    marketType: 'STOCKS',
    entryTime: generateDate(50, 10, 0),
    exitTime: generateDate(50, 14, 0),
    createdAt: generateDate(50, 14, 0),
    notes: 'Perfect setup, perfect execution',
    setup: 'A+ Setup',
    setupTags: ['perfect', 'textbook'],
    confidence: 95,
    mae: -0.25,
    mfe: 4.00,
    ruleCompliance: {
      score: 100,
      checkedRules: ['entry', 'exit', 'stop', 'size', 'setup'],
      violatedRules: [],
      notes: 'Textbook trade'
    }
  },

  // === EDGE RATIO TESTING ===
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'COIN',
    type: 'BUY',
    entry: 150.00,
    exit: 155.00,
    quantity: 40,
    marketType: 'STOCKS',
    entryTime: generateDate(52, 9, 45),
    exitTime: generateDate(52, 15, 0),
    createdAt: generateDate(52, 15, 0),
    notes: 'Good edge ratio trade',
    setup: 'Momentum',
    confidence: 80,
    mae: -0.50, // Small drawdown
    mfe: 6.00,  // Large upside
    edgeRatio: 12.0, // MFE/MAE ratio
    updrawPercent: 0.33
  },
  {
    id: genId(),
    userId: 'demo-user',
    symbol: 'PLTR',
    type: 'BUY',
    entry: 25.00,
    exit: 24.00,
    quantity: 200,
    marketType: 'STOCKS',
    entryTime: generateDate(53, 10, 0),
    exitTime: generateDate(53, 14, 0),
    createdAt: generateDate(53, 14, 0),
    notes: 'Poor edge ratio - large drawdown',
    setup: 'Failed Momentum',
    confidence: 50,
    mae: -2.00, // Large drawdown
    mfe: 0.50,  // Small upside
    edgeRatio: 0.25, // Poor MFE/MAE ratio
    updrawPercent: 8.0
  }
]

// Calculate some statistics for verification
export const SAMPLE_STATS = {
  totalTrades: COMPREHENSIVE_SAMPLE_TRADES.length,
  closedTrades: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.exit !== null).length,
  openTrades: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.exit === null).length,
  marketTypes: {
    STOCKS: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.marketType === 'STOCKS').length,
    FOREX: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.marketType === 'FOREX').length,
    CRYPTO: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.marketType === 'CRYPTO').length,
    FUTURES: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.marketType === 'FUTURES').length,
    OPTIONS: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.marketType === 'OPTIONS').length
  },
  uniqueSymbols: Array.from(new Set(COMPREHENSIVE_SAMPLE_TRADES.map(t => t.symbol))).length,
  tradesWithSetups: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.setup).length,
  tradesWithCompliance: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.ruleCompliance).length,
  tradesWithExcursions: COMPREHENSIVE_SAMPLE_TRADES.filter(t => t.mae || t.mfe).length
}

console.log('Sample Trade Statistics:', SAMPLE_STATS)