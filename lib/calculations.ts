import { UserSettings } from './settings'
import { calculateMarketPnL } from './market-knowledge'
import { safeToFixed } from './utils/safe-format'

interface Trade {
  id: string
  symbol: string
  type: string
  entry: number
  exit?: number | null
  quantity: number
  marketType?: string | null
  entryTime?: string | null
  exitTime?: string | null
  createdAt: string
  notes?: string | null
}

// Calculate P&L with commission deduction
export function calculatePnLWithCommission(
  trade: Trade,
  settings: UserSettings
): number | null {
  const basePnL = calculateMarketPnL(trade, trade.marketType || null)
  if (basePnL === null) return null
  
  // Calculate total commission
  const perTradeCommission = settings.trading.commission.perTrade
  const perUnitCommission = settings.trading.commission.perUnit * Math.abs(trade.quantity)
  
  // For closed trades, commission is charged on both entry and exit
  const totalCommission = trade.exit 
    ? (perTradeCommission * 2) + (perUnitCommission * 2)
    : perTradeCommission + perUnitCommission
  
  return basePnL - totalCommission
}

// Format currency based on user settings
export function formatCurrency(amount: number, settings: UserSettings): string {
  const symbol = getCurrencySymbol(settings.trading.accountCurrency)
  const formatted = safeToFixed(amount, settings.display.numberFormat.decimalPlaces)
  
  if (settings.display.numberFormat.thousandSeparator) {
    const parts = formatted.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `${symbol}${parts.join('.')}`
  }
  
  return `${symbol}${formatted}`
}

// Format date based on user settings
export function formatDate(date: Date | string, settings: UserSettings): string {
  const d = new Date(date)
  const format = settings.display.dateFormat
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    default: // MM/DD/YYYY
      return `${month}/${day}/${year}`
  }
}

// Format time based on user settings
export function formatTime(date: Date | string, settings: UserSettings): string {
  const d = new Date(date)
  
  if (settings.display.timeFormat === '24h') {
    return d.toTimeString().slice(0, 5) // HH:MM
  } else {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

// Format datetime based on user settings
export function formatDateTime(date: Date | string, settings: UserSettings): string {
  return `${formatDate(date, settings)} ${formatTime(date, settings)}`
}

// Get currency symbol
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'Fr',
    NZD: 'NZ$',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    SGD: 'S$',
    HKD: 'HK$',
    MXN: '$',
    ZAR: 'R',
    INR: '₹',
    BRL: 'R$',
    CNY: '¥',
    RUB: '₽'
  }
  return symbols[currency] || currency + ' '
}

// Check if daily loss limit is exceeded
export function checkDailyLossLimit(
  todaysTrades: Trade[],
  settings: UserSettings
): { exceeded: boolean; totalLoss: number } {
  const todaysClosedTrades = todaysTrades.filter(t => t.exit !== null)
  
  const totalLoss = todaysClosedTrades.reduce((sum, trade) => {
    const pnl = calculatePnLWithCommission(trade, settings) || 0
    return pnl < 0 ? sum + Math.abs(pnl) : sum
  }, 0)
  
  return {
    exceeded: totalLoss >= settings.alerts.dailyLossLimit,
    totalLoss
  }
}

// Check for streaks
export function checkStreaks(
  recentTrades: Trade[],
  settings: UserSettings
): { winningStreak: number; losingStreak: number; alert: string | null } {
  const closedTrades = recentTrades
    .filter(t => t.exit !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  let currentWinStreak = 0
  let currentLoseStreak = 0
  
  for (const trade of closedTrades) {
    const pnl = calculatePnLWithCommission(trade, settings) || 0
    
    if (pnl > 0) {
      currentWinStreak++
      currentLoseStreak = 0
    } else if (pnl < 0) {
      currentLoseStreak++
      currentWinStreak = 0
    }
    
    // Only count the current streak
    if (currentWinStreak === 0 && currentLoseStreak === 0) break
  }
  
  let alert = null
  if (currentWinStreak >= settings.alerts.streakAlerts.winning) {
    alert = `You're on a ${currentWinStreak} trade winning streak! 🔥`
  } else if (currentLoseStreak >= settings.alerts.streakAlerts.losing) {
    alert = `Warning: ${currentLoseStreak} losing trades in a row. Consider taking a break.`
  }
  
  return { winningStreak: currentWinStreak, losingStreak: currentLoseStreak, alert }
}

// Apply table density to className
export function getTableDensityClass(density: string): string {
  switch (density) {
    case 'compact':
      return 'py-1 px-2 text-xs'
    case 'spacious':
      return 'py-4 px-6 text-base'
    default: // comfortable
      return 'py-2 px-4 text-sm'
  }
}