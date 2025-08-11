// Pre-built trading playbook templates
export interface PlaybookTemplate {
  id: string
  name: string
  description: string
  category: 'momentum' | 'reversal' | 'breakout' | 'scalping' | 'swing'
  icon: string
  rules: {
    entry: string[]
    exit: string[]
    risk: string[]
  }
  markets: string[]
  timeframe: string
  riskReward: string
  winRateTarget: number
}

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  {
    id: 'momentum-gap',
    name: 'Gap & Go Momentum',
    description: 'Trade stocks that gap up on high volume at market open',
    category: 'momentum',
    icon: '🚀',
    rules: {
      entry: [
        'Stock gaps up at least 4% from previous close',
        'Pre-market volume > 100k shares',
        'Price above VWAP',
        'First 5-minute candle closes green',
        'Enter on break of first 5-min high'
      ],
      exit: [
        'Stop loss below first 5-min low',
        'Trail stop at VWAP once profitable',
        'Take 50% profit at 2R',
        'Let remainder run with trailing stop'
      ],
      risk: [
        'Max risk 1% of account per trade',
        'Max 3 trades per day',
        'No trades after 10:30 AM',
        'Skip if overall market is red'
      ]
    },
    markets: ['Stocks'],
    timeframe: '5-minute',
    riskReward: '1:3',
    winRateTarget: 65
  },
  
  {
    id: 'reversal-oversold',
    name: 'Oversold Bounce',
    description: 'Buy oversold conditions in strong uptrending stocks',
    category: 'reversal',
    icon: '📈',
    rules: {
      entry: [
        'Stock in established uptrend (above 50 MA)',
        'RSI < 30 on daily chart',
        'Near key support level',
        'Bullish divergence on RSI',
        'Enter on first green candle'
      ],
      exit: [
        'Stop loss below support level',
        'Target previous resistance',
        'Exit if RSI > 70',
        'Trail stop at 20 MA'
      ],
      risk: [
        'Max risk 2% of account',
        'Position size based on support distance',
        'No more than 5 positions at once',
        'Avoid earnings week'
      ]
    },
    markets: ['Stocks', 'ETFs'],
    timeframe: 'Daily',
    riskReward: '1:2',
    winRateTarget: 70
  },
  
  {
    id: 'breakout-flag',
    name: 'Bull Flag Breakout',
    description: 'Trade continuation patterns after strong moves',
    category: 'breakout',
    icon: '🏁',
    rules: {
      entry: [
        'Strong initial move up (flag pole)',
        'Consolidation for 3-5 candles',
        'Decreasing volume during consolidation',
        'Enter on break above flag resistance',
        'Volume spike on breakout'
      ],
      exit: [
        'Stop loss below flag low',
        'Target = flag pole height',
        'Take partial profits at 50% of target',
        'Trail remainder with 10 EMA'
      ],
      risk: [
        'Max risk 1.5% per trade',
        'Skip if flag is too wide (>50% retracement)',
        'Avoid in choppy markets',
        'Best in first 2 hours of trading'
      ]
    },
    markets: ['Stocks', 'Futures', 'Crypto'],
    timeframe: '15-minute',
    riskReward: '1:2.5',
    winRateTarget: 60
  },
  
  {
    id: 'scalping-range',
    name: 'Range Scalping',
    description: 'Quick trades within established trading ranges',
    category: 'scalping',
    icon: '⚡',
    rules: {
      entry: [
        'Clear range established (3+ touches)',
        'Enter at range support/resistance',
        'RSI confirms oversold/overbought',
        'Volume declining at extremes',
        'Quick entry on reversal candle'
      ],
      exit: [
        'Target opposite side of range',
        'Stop loss outside range',
        'Exit if range breaks',
        'Max hold time 30 minutes'
      ],
      risk: [
        'Max risk 0.5% per trade',
        'Max 10 trades per day',
        'Stop trading after 3 losses',
        'Avoid news events'
      ]
    },
    markets: ['Forex', 'Futures'],
    timeframe: '1-minute',
    riskReward: '1:1.5',
    winRateTarget: 75
  },
  
  {
    id: 'swing-trend',
    name: 'Trend Following Swing',
    description: 'Multi-day positions following the primary trend',
    category: 'swing',
    icon: '📊',
    rules: {
      entry: [
        'Stock above 200 MA',
        '50 MA > 200 MA',
        'Pullback to 20 or 50 MA',
        'Bullish candle pattern at MA',
        'Volume confirms reversal'
      ],
      exit: [
        'Stop loss below recent swing low',
        'Target next major resistance',
        'Exit on close below 20 MA',
        'Hold maximum 10 days'
      ],
      risk: [
        'Max risk 3% per position',
        'Max 3 swing positions',
        'Scale in over 2 days',
        'Reduce size in volatile markets'
      ]
    },
    markets: ['Stocks', 'ETFs', 'Crypto'],
    timeframe: 'Daily',
    riskReward: '1:4',
    winRateTarget: 55
  }
]

// Helper function to apply template to user's setup
export function applyTemplate(template: PlaybookTemplate) {
  return {
    name: template.name,
    description: template.description,
    entryRules: template.rules.entry.join('\n'),
    exitRules: template.rules.exit.join('\n'),
    riskRules: template.rules.risk.join('\n'),
    markets: template.markets,
    timeframe: template.timeframe,
    targetWinRate: template.winRateTarget,
    riskRewardRatio: template.riskReward
  }
}