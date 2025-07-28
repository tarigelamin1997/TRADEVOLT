// Simple JSON-based database for Vercel deployment
// This is a temporary solution - in production, you should use a real database like PostgreSQL

import fs from 'fs/promises'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'trades.json')

interface User {
  id: string
  email: string
  clerkId: string
  isPaid: boolean
  createdAt: string
}

interface Trade {
  id: string
  userId: string
  symbol: string
  type: string
  entry: number
  exit?: number | null
  quantity: number
  notes?: string | null
  marketType?: string | null
  createdAt: string
}

interface Database {
  users: User[]
  trades: Trade[]
}

// Initialize database
async function initDB(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    // Create initial database structure
    const initialDB: Database = {
      users: [],
      trades: []
    }
    
    // Ensure directory exists
    try {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
    } catch {}
    
    await fs.writeFile(DB_PATH, JSON.stringify(initialDB, null, 2))
    return initialDB
  }
}

// Save database
async function saveDB(db: Database): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
}

// Generate ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// User operations
export async function findUserByClerkId(clerkId: string): Promise<User | null> {
  const db = await initDB()
  return db.users.find(u => u.clerkId === clerkId) || null
}

export async function createUser(data: { clerkId: string; email: string }): Promise<User> {
  const db = await initDB()
  const user: User = {
    id: generateId(),
    email: data.email,
    clerkId: data.clerkId,
    isPaid: false,
    createdAt: new Date().toISOString()
  }
  db.users.push(user)
  await saveDB(db)
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
  const db = await initDB()
  const newTrades = trades.map(trade => ({
    ...trade,
    id: generateId()
  }))
  db.trades.push(...newTrades)
  await saveDB(db)
  return { count: newTrades.length }
}

export async function createTrade(trade: Omit<Trade, 'id'>): Promise<Trade> {
  const db = await initDB()
  const newTrade: Trade = {
    ...trade,
    id: generateId()
  }
  db.trades.push(newTrade)
  await saveDB(db)
  return newTrade
}

export async function findTradesByUserId(userId: string): Promise<Trade[]> {
  const db = await initDB()
  return db.trades
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getUserWithTrades(clerkId: string): Promise<{ user: User | null; trades: Trade[] }> {
  const user = await findUserByClerkId(clerkId)
  if (!user) {
    return { user: null, trades: [] }
  }
  const trades = await findTradesByUserId(user.id)
  return { user, trades }
}