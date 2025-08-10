// Script to load comprehensive sample data into the database
// Run with: npx tsx scripts/load-sample-data.ts

import { PrismaClient } from '@prisma/client'
import { COMPREHENSIVE_SAMPLE_TRADES } from '../lib/comprehensive-sample-trades'

const prisma = new PrismaClient()

async function loadSampleData() {
  try {
    console.log('🚀 Starting to load sample data...')
    
    // You can either:
    // 1. Use a specific email/clerkId
    // 2. Create a demo user
    // 3. Use the first user in the database
    
    // Option 1: Specify your user email (CHANGE THIS TO YOUR EMAIL)
    const userEmail = 'your-email@example.com' // <-- CHANGE THIS
    
    // Find or create user
    let user = await prisma.user.findFirst({
      where: { email: userEmail }
    })
    
    if (!user) {
      // If using Clerk, you need the clerkId
      // For demo purposes, we'll create a test user
      console.log('User not found, creating demo user...')
      user = await prisma.user.create({
        data: {
          email: userEmail,
          clerkId: `demo_${Date.now()}`, // Temporary ID for demo
          isPaid: true // Give them pro features for testing
        }
      })
      console.log('✅ Created demo user:', user.email)
    } else {
      console.log('✅ Found existing user:', user.email)
    }
    
    // Clear existing trades (optional - comment out to keep existing trades)
    const deleteCount = await prisma.trade.deleteMany({
      where: { userId: user.id }
    })
    console.log(`🗑️  Cleared ${deleteCount.count} existing trades`)
    
    // Prepare trades for insertion
    const tradesToInsert = COMPREHENSIVE_SAMPLE_TRADES.map(trade => ({
      ...trade,
      userId: user!.id,
      id: undefined, // Let Prisma generate the ID
      // Convert dates to Date objects if needed
      createdAt: new Date(trade.createdAt),
      entryTime: trade.entryTime ? new Date(trade.entryTime) : null,
      exitTime: trade.exitTime ? new Date(trade.exitTime) : null,
      // Handle JSON fields
      partialExits: trade.partialExits ? JSON.stringify(trade.partialExits) : null,
      ruleCompliance: trade.ruleCompliance ? JSON.stringify(trade.ruleCompliance) : null,
      setupTags: trade.setupTags ? JSON.stringify(trade.setupTags) : null,
      marketConditions: trade.marketConditions ? JSON.stringify(trade.marketConditions) : null
    }))
    
    // Insert trades in batches to avoid timeout
    const batchSize = 10
    let inserted = 0
    
    for (let i = 0; i < tradesToInsert.length; i += batchSize) {
      const batch = tradesToInsert.slice(i, i + batchSize)
      await prisma.trade.createMany({
        data: batch as any,
        skipDuplicates: true
      })
      inserted += batch.length
      console.log(`📊 Inserted ${inserted}/${tradesToInsert.length} trades...`)
    }
    
    // Verify insertion
    const totalTrades = await prisma.trade.count({
      where: { userId: user.id }
    })
    
    console.log(`\n✨ Success! Loaded ${totalTrades} trades for ${user.email}`)
    console.log('\n📈 Sample Data Statistics:')
    
    // Calculate some stats
    const stats = await prisma.trade.groupBy({
      by: ['marketType'],
      where: { userId: user.id },
      _count: true
    })
    
    stats.forEach(stat => {
      console.log(`   ${stat.marketType || 'UNKNOWN'}: ${stat._count} trades`)
    })
    
    const openTrades = await prisma.trade.count({
      where: { 
        userId: user.id,
        exit: null 
      }
    })
    
    console.log(`   Open Positions: ${openTrades}`)
    console.log(`   Closed Trades: ${totalTrades - openTrades}`)
    
    console.log('\n🎉 Sample data loaded successfully!')
    console.log('   Visit http://localhost:3000/dashboard to see the metrics in action')
    
  } catch (error) {
    console.error('❌ Error loading sample data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
loadSampleData()