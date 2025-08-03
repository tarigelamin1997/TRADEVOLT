// In-memory database for Vercel deployment
// This is a temporary solution that stores data in memory
// Data will be lost when the serverless function cold starts

interface User {
  id: string
  email: string
  clerkId: string
  isPaid: boolean
  createdAt: string
}

export interface Trade {
  id: string
  userId: string
  symbol: string
  type: 'BUY' | 'SELL'
  entry: number
  exit?: number | null
  quantity: number
  notes?: string | null
  marketType?: string | null
  createdAt: string
  entryTime?: string | null
  exitTime?: string | null
  // Excursion metrics
  mae?: number | null
  mfe?: number | null
  edgeRatio?: number | null
  updrawPercent?: number | null
  takeProfitPrice?: number | null
  stopLossPrice?: number | null
  // Execution quality fields
  intendedEntry?: number | null
  intendedExit?: number | null
  commission?: number | null
  wasStopLossHit?: boolean | null
  wasTakeProfitHit?: boolean | null
  exitReason?: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL' | 'OTHER' | null
  partialExits?: PartialExit[] | null
  // Setup/Strategy fields
  setup?: string | null
  setupTags?: string[] | null
  confidence?: number | null
}

export interface PartialExit {
  id: string
  price: number
  quantity: number
  timestamp: string
  commission?: number
  reason?: 'SCALE_OUT' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL'
}

// In-memory storage
const memoryDB = {
  users: new Map<string, User>(),
  trades: new Map<string, Trade[]>()
}

// Generate ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// User operations
export async function findUserByClerkId(clerkId: string): Promise<User | null> {
  const users = Array.from(memoryDB.users.values())
  for (const user of users) {
    if (user.clerkId === clerkId) {
      return user
    }
  }
  return null
}

export async function createUser(data: { clerkId: string; email: string }): Promise<User> {
  const user: User = {
    id: generateId(),
    email: data.email,
    clerkId: data.clerkId,
    isPaid: false,
    createdAt: new Date().toISOString()
  }
  memoryDB.users.set(user.id, user)
  return user
}

export async function upsertUser(clerkId: string, email: string): Promise<User> {
  let user = await findUserByClerkId(clerkId)
  if (!user) {
    user = await createUser({ clerkId, email })
  }
  return user
}

// Trade operations
export async function createManyTrades(trades: Omit<Trade, 'id'>[]): Promise<{ count: number }> {
  const newTrades = trades.map(trade => ({
    ...trade,
    id: generateId()
  }))
  
  for (const trade of newTrades) {
    const userTrades = memoryDB.trades.get(trade.userId) || []
    userTrades.push(trade)
    memoryDB.trades.set(trade.userId, userTrades)
  }
  
  return { count: newTrades.length }
}

export async function createTrade(trade: Omit<Trade, 'id'>): Promise<Trade> {
  const newTrade: Trade = {
    ...trade,
    id: generateId()
  }
  
  const userTrades = memoryDB.trades.get(trade.userId) || []
  userTrades.push(newTrade)
  memoryDB.trades.set(trade.userId, userTrades)
  
  return newTrade
}

export async function findTradesByUserId(userId: string): Promise<Trade[]> {
  const trades = memoryDB.trades.get(userId) || []
  return trades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getUserWithTrades(clerkId: string): Promise<{ user: User | null; trades: Trade[] }> {
  const user = await findUserByClerkId(clerkId)
  if (!user) {
    return { user: null, trades: [] }
  }
  const trades = await findTradesByUserId(user.id)
  return { user, trades }
}

// Add some demo trades for testing
const demoUserId = 'demo-user'
const demoUser: User = {
  id: demoUserId,
  email: 'demo@tradevolt.com',
  clerkId: demoUserId,
  isPaid: false,
  createdAt: new Date().toISOString()
}
memoryDB.users.set(demoUserId, demoUser)

// Add a few demo trades
const demoTrades: Trade[] = [
  {
    id: '1',
    userId: demoUserId,
    symbol: 'ES',
    type: 'BUY',
    entry: 4500,
    exit: 4510,
    quantity: 1,
    marketType: 'FUTURES',
    createdAt: new Date('2024-01-15').toISOString(),
    entryTime: new Date('2024-01-15T09:30:00').toISOString(),
    exitTime: new Date('2024-01-15T10:30:00').toISOString(),
    notes: 'Demo trade - Long ES futures'
  },
  {
    id: '2',
    userId: demoUserId,
    symbol: 'NQ',
    type: 'SELL',
    entry: 15500,
    exit: 15480,
    quantity: 1,
    marketType: 'FUTURES',
    createdAt: new Date('2024-01-16').toISOString(),
    entryTime: new Date('2024-01-16T14:00:00').toISOString(),
    exitTime: new Date('2024-01-16T15:30:00').toISOString(),
    notes: 'Demo trade - Short NQ futures'
  }
]
memoryDB.trades.set(demoUserId, demoTrades)

// Find all trades across all users
export async function findAllTrades(): Promise<Trade[]> {
  const allTrades: Trade[] = []
  const tradeArrays = Array.from(memoryDB.trades.values())
  for (const trades of tradeArrays) {
    allTrades.push(...trades)
  }
  return allTrades
}

// Update a trade
export async function updateTrade(tradeId: string, updates: Partial<Trade>): Promise<Trade | null> {
  for (const [userId, trades] of Array.from(memoryDB.trades.entries())) {
    const tradeIndex = trades.findIndex(t => t.id === tradeId)
    if (tradeIndex !== -1) {
      trades[tradeIndex] = { ...trades[tradeIndex], ...updates }
      return trades[tradeIndex]
    }
  }
  return null
}