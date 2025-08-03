// Export the appropriate database implementation
// For now, using the mock Prisma client with in-memory database

export { prisma } from '../prisma-mock'

// Re-export types
export type { Trade, User, TradePriceData, TradeExcursion } from '../prisma-mock'