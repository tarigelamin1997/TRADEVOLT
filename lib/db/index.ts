// Export the appropriate database implementation
// For now, using the in-memory database directly

// Re-export types from db-memory
export type { Trade } from '../db-memory'

// Note: prisma is not exported as we're using db-memory functions directly