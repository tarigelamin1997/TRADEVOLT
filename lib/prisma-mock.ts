// Mock Prisma client that uses in-memory database
// This allows excursion services to work with the current in-memory setup

import * as dbMemory from './db-memory'

// Mock Prisma types
export interface Trade {
  id: string
  userId: string
  symbol: string
  type: string
  entry: number
  exit?: number | null
  quantity: number
  notes?: string | null
  marketType?: string | null
  createdAt: Date
  entryTime?: Date | null
  exitTime?: Date | null
  mae?: number | null
  mfe?: number | null
  edgeRatio?: number | null
  updrawPercent?: number | null
  takeProfitPrice?: number | null
  stopLossPrice?: number | null
}

export interface TradePriceData {
  id: string
  tradeId: string
  timestamp: Date
  price: number
  volume?: number | null
  createdAt: Date
}

export interface TradeExcursion {
  id: string
  tradeId: string
  timestamp: Date
  price: number
  runningPnl: number
  runningPnlPercent: number
  maeAtTime: number
  mfeAtTime: number
}

export interface User {
  id: string
  email: string
  clerkId: string
  isPaid: boolean
  createdAt: Date
}

// In-memory storage for price data and excursions
const priceDataStore = new Map<string, TradePriceData[]>()
const excursionStore = new Map<string, TradeExcursion[]>()

// Mock Prisma client
export const prisma = {
  user: {
    findUnique: async ({ where }: { where: { clerkId?: string; id?: string } }) => {
      if (where.clerkId) {
        const user = await dbMemory.findUserByClerkId(where.clerkId)
        return user ? { ...user, createdAt: new Date(user.createdAt) } : null
      }
      // For ID lookup, would need to implement in db-memory
      return null
    }
  },

  trade: {
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const trades = await dbMemory.findAllTrades()
      const trade = trades.find(t => t.id === where.id)
      
      if (!trade) return null
      
      const result: any = {
        ...trade,
        createdAt: new Date(trade.createdAt),
        entryTime: trade.entryTime ? new Date(trade.entryTime) : null,
        exitTime: trade.exitTime ? new Date(trade.exitTime) : null
      }
      
      if (include?.priceData) {
        result.priceData = priceDataStore.get(trade.id) || []
      }
      
      if (include?.excursions) {
        result.excursions = excursionStore.get(trade.id) || []
      }
      
      return result
    },

    findFirst: async ({ where }: { where: any }) => {
      const trades = await dbMemory.findAllTrades()
      const trade = trades.find(t => {
        if (where.id && t.id !== where.id) return false
        if (where.userId && t.userId !== where.userId) return false
        return true
      })
      
      return trade ? {
        ...trade,
        createdAt: new Date(trade.createdAt),
        entryTime: trade.entryTime ? new Date(trade.entryTime) : null,
        exitTime: trade.exitTime ? new Date(trade.exitTime) : null
      } : null
    },

    findMany: async ({ where, orderBy, include }: { where?: any; orderBy?: any; include?: any }) => {
      let trades = await dbMemory.findAllTrades()
      
      // Apply filters
      if (where) {
        trades = trades.filter(t => {
          if (where.userId && t.userId !== where.userId) return false
          if (where.mae !== undefined) {
            if (where.mae === null && t.mae !== null) return false
            if (where.mae?.not === null && t.mae === null) return false
          }
          if (where.entryTime?.not === null && t.entryTime === null) return false
          return true
        })
      }
      
      // Apply sorting
      if (orderBy?.createdAt === 'desc') {
        trades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
      
      return trades.map(trade => ({
        ...trade,
        createdAt: new Date(trade.createdAt),
        entryTime: trade.entryTime ? new Date(trade.entryTime) : null,
        exitTime: trade.exitTime ? new Date(trade.exitTime) : null
      }))
    },

    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const trades = await dbMemory.findAllTrades()
      const index = trades.findIndex(t => t.id === where.id)
      
      if (index === -1) throw new Error('Trade not found')
      
      const updatedTrade = {
        ...trades[index],
        ...data,
        createdAt: trades[index].createdAt
      }
      
      // Update in memory (Note: db-memory doesn't have update method, so this is mock)
      trades[index] = updatedTrade
      
      return {
        ...updatedTrade,
        createdAt: new Date(updatedTrade.createdAt),
        entryTime: updatedTrade.entryTime ? new Date(updatedTrade.entryTime) : null,
        exitTime: updatedTrade.exitTime ? new Date(updatedTrade.exitTime) : null
      }
    },

    aggregate: async ({ where, _avg, _count }: { where: any; _avg?: any; _count?: boolean }) => {
      const trades = await dbMemory.findAllTrades()
      const filtered = trades.filter(t => {
        if (where.userId && t.userId !== where.userId) return false
        if (where.mae?.not === null && t.mae === null) return false
        if (where.mfe?.not === null && t.mfe === null) return false
        return true
      })
      
      const result: any = {}
      
      if (_count) {
        result._count = filtered.length
      }
      
      if (_avg) {
        result._avg = {}
        if (_avg.mae) {
          const validMAE = filtered.filter(t => t.mae !== null && t.mae !== undefined)
          result._avg.mae = validMAE.length > 0 
            ? validMAE.reduce((sum, t) => sum + (t.mae || 0), 0) / validMAE.length
            : null
        }
        if (_avg.mfe) {
          const validMFE = filtered.filter(t => t.mfe !== null && t.mfe !== undefined)
          result._avg.mfe = validMFE.length > 0
            ? validMFE.reduce((sum, t) => sum + (t.mfe || 0), 0) / validMFE.length
            : null
        }
        if (_avg.edgeRatio) {
          const validEdge = filtered.filter(t => t.edgeRatio !== null && t.edgeRatio !== undefined)
          result._avg.edgeRatio = validEdge.length > 0
            ? validEdge.reduce((sum, t) => sum + (t.edgeRatio || 0), 0) / validEdge.length
            : null
        }
      }
      
      return result
    }
  },

  tradePriceData: {
    findMany: async ({ where, orderBy }: { where: { tradeId: string }; orderBy?: any }) => {
      const data = priceDataStore.get(where.tradeId) || []
      if (orderBy?.timestamp === 'asc') {
        return [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      }
      return data
    },

    createMany: async ({ data }: { data: any[]; skipDuplicates?: boolean }) => {
      data.forEach(item => {
        const tradeData = priceDataStore.get(item.tradeId) || []
        tradeData.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          ...item,
          timestamp: new Date(item.timestamp),
          createdAt: new Date()
        })
        priceDataStore.set(item.tradeId, tradeData)
      })
    }
  },

  tradeExcursion: {
    createMany: async ({ data, skipDuplicates }: { data: any[]; skipDuplicates?: boolean }) => {
      data.forEach(item => {
        const excursions = excursionStore.get(item.tradeId) || []
        
        if (skipDuplicates) {
          const exists = excursions.some(e => 
            e.timestamp.getTime() === new Date(item.timestamp).getTime()
          )
          if (exists) return
        }
        
        excursions.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          ...item,
          timestamp: new Date(item.timestamp)
        })
        excursionStore.set(item.tradeId, excursions)
      })
    }
  },

  $transaction: async (operations: any[]) => {
    // Simple mock transaction - just execute all operations
    const results = []
    for (const op of operations) {
      // This is a simplified mock - in reality would need to handle all operation types
      results.push(await op)
    }
    return results
  }
}