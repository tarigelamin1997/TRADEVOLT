import { MetricDefinition, MetricGroup } from '@/lib/types/metrics'

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  // Essential Metrics
  netPnL: {
    id: 'netPnL',
    name: 'Net P&L',
    description: 'Total profit and loss across all trades',
    category: 'essential',
    requiresPro: false,
    format: 'currency',
    tooltipContent: 'Your total profit or loss after all trades'
  },
  winRate: {
    id: 'winRate',
    name: 'Win Rate',
    description: 'Percentage of profitable trades',
    category: 'essential',
    requiresPro: false,
    benchmark: 50,
    format: 'percentage',
    tooltipContent: 'The percentage of your trades that were profitable'
  },
  profitFactor: {
    id: 'profitFactor',
    name: 'Profit Factor',
    description: 'Ratio of gross profits to gross losses',
    category: 'essential',
    requiresPro: false,
    benchmark: 1.5,
    format: 'decimal',
    tooltipContent: 'Total wins divided by total losses. Above 1.0 means profitable'
  },
  expectancy: {
    id: 'expectancy',
    name: 'Expectancy',
    description: 'Average expected profit per trade',
    category: 'essential',
    requiresPro: false,
    format: 'currency',
    tooltipContent: 'The average amount you can expect to win or lose per trade'
  },
  averageWin: {
    id: 'averageWin',
    name: 'Average Win',
    description: 'Average profit on winning trades',
    category: 'essential',
    requiresPro: false,
    format: 'currency',
    tooltipContent: 'Your average profit when you have a winning trade'
  },
  averageLoss: {
    id: 'averageLoss',
    name: 'Average Loss',
    description: 'Average loss on losing trades',
    category: 'essential',
    requiresPro: false,
    format: 'currency',
    tooltipContent: 'Your average loss when you have a losing trade'
  },
  totalTrades: {
    id: 'totalTrades',
    name: 'Total Trades',
    description: 'Total number of trades executed',
    category: 'essential',
    requiresPro: false,
    format: 'number',
    tooltipContent: 'The total number of trades in the selected period'
  },
  
  // Risk Management Metrics
  maxDrawdown: {
    id: 'maxDrawdown',
    name: 'Maximum Drawdown',
    description: 'Largest peak-to-trough decline',
    category: 'risk',
    requiresPro: false,
    benchmark: 20,
    format: 'percentage',
    tooltipContent: 'The largest percentage drop from a peak to a trough in your account'
  },
  avgDrawdown: {
    id: 'avgDrawdown',
    name: 'Average Drawdown',
    description: 'Mean of all drawdown periods',
    category: 'risk',
    requiresPro: false,
    benchmark: 10,
    format: 'percentage',
    tooltipContent: 'The average of all drawdown periods in your trading'
  },
  recoveryFactor: {
    id: 'recoveryFactor',
    name: 'Recovery Factor',
    description: 'Net profit divided by max drawdown',
    category: 'risk',
    requiresPro: false,
    benchmark: 3,
    format: 'decimal',
    tooltipContent: 'How well you recover from drawdowns. Higher is better'
  },
  riskOfRuin: {
    id: 'riskOfRuin',
    name: 'Risk of Ruin',
    description: 'Probability of account blow-up',
    category: 'risk',
    requiresPro: false,
    benchmark: 5,
    format: 'percentage',
    tooltipContent: 'The probability of losing your entire trading capital'
  },
  rMultiple: {
    id: 'rMultiple',
    name: 'R-Multiple',
    description: 'Average profit/loss in risk units',
    category: 'risk',
    requiresPro: false,
    benchmark: 2,
    format: 'decimal',
    tooltipContent: 'Your average profit/loss expressed as a multiple of your risk'
  },
  
  // Advanced Risk-Adjusted Metrics
  sharpeRatio: {
    id: 'sharpeRatio',
    name: 'Sharpe Ratio',
    description: 'Risk-adjusted returns',
    category: 'advanced',
    requiresPro: false,
    benchmark: 1.0,
    format: 'decimal',
    tooltipContent: 'Return per unit of risk. Above 1.0 is good, above 2.0 is excellent'
  },
  sortinoRatio: {
    id: 'sortinoRatio',
    name: 'Sortino Ratio',
    description: 'Downside risk-adjusted returns',
    category: 'advanced',
    requiresPro: false,
    benchmark: 1.5,
    format: 'decimal',
    tooltipContent: 'Like Sharpe but only penalizes downside volatility'
  },
  calmarRatio: {
    id: 'calmarRatio',
    name: 'Calmar Ratio',
    description: 'Annual return over max drawdown',
    category: 'advanced',
    requiresPro: false,
    benchmark: 1.0,
    format: 'decimal',
    tooltipContent: 'Annual return divided by maximum drawdown'
  },
  treynorRatio: {
    id: 'treynorRatio',
    name: 'Treynor Ratio',
    description: 'Excess return per unit of systematic risk',
    category: 'advanced',
    requiresPro: false,
    benchmark: 0.1,
    format: 'decimal',
    tooltipContent: 'Measures returns earned in excess of risk-free rate per unit of market risk'
  },
  jensensAlpha: {
    id: 'jensensAlpha',
    name: "Jensen's Alpha",
    description: 'Excess returns vs market',
    category: 'advanced',
    requiresPro: false,
    benchmark: 0,
    format: 'percentage',
    tooltipContent: 'Your excess returns compared to expected market returns'
  }
}

export const METRIC_GROUPS: Record<string, MetricGroup> = {
  overview: {
    title: 'Overview',
    description: 'Essential trading performance metrics',
    metrics: ['netPnL', 'winRate', 'profitFactor', 'expectancy', 'averageWin', 'averageLoss', 'totalTrades']
  },
  risk: {
    title: 'Risk Management',
    description: 'Risk exposure and drawdown analysis',
    metrics: ['maxDrawdown', 'avgDrawdown', 'recoveryFactor', 'riskOfRuin', 'rMultiple']
  },
  advanced: {
    title: 'Advanced Analytics',
    description: 'Risk-adjusted performance metrics',
    metrics: ['sharpeRatio', 'sortinoRatio', 'calmarRatio', 'treynorRatio', 'jensensAlpha']
  }
}

// Benchmark thresholds for status determination
export const METRIC_THRESHOLDS = {
  winRate: { good: 55, warning: 45, danger: 40 },
  profitFactor: { good: 1.5, warning: 1.2, danger: 1.0 },
  maxDrawdown: { good: 10, warning: 20, danger: 30 }, // Lower is better
  sharpeRatio: { good: 1.5, warning: 1.0, danger: 0.5 },
  sortinoRatio: { good: 2.0, warning: 1.5, danger: 1.0 },
  riskOfRuin: { good: 1, warning: 5, danger: 10 }, // Lower is better
}

// Risk-free rate and market return assumptions
export const MARKET_ASSUMPTIONS = {
  riskFreeRate: 0.04, // 4% annual
  marketReturn: 0.10, // 10% annual
  marketBeta: 1.2, // Assumed beta for Treynor
  tradingDaysPerYear: 252
}