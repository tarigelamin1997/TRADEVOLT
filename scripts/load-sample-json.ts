// Simple script to load sample data via the API
// Run with: npx tsx scripts/load-sample-json.ts

import { COMPREHENSIVE_SAMPLE_TRADES } from '../lib/comprehensive-sample-trades'

const API_URL = 'http://localhost:3000/api'

async function loadSampleDataViaAPI() {
  try {
    console.log('🚀 Loading sample data via API...')
    
    // First, clear existing trades (optional)
    console.log('Note: This will ADD to existing trades, not replace them')
    
    let successCount = 0
    let errorCount = 0
    
    // Add trades one by one via API
    for (const trade of COMPREHENSIVE_SAMPLE_TRADES) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'addTrade',
            ...trade,
            // Remove the demo ID, let the API generate it
            id: undefined
          })
        })
        
        if (response.ok) {
          successCount++
          console.log(`✅ Added trade ${successCount}/${COMPREHENSIVE_SAMPLE_TRADES.length}: ${trade.symbol}`)
        } else {
          errorCount++
          console.log(`❌ Failed to add trade: ${trade.symbol}`)
        }
      } catch (error) {
        errorCount++
        console.log(`❌ Error adding trade: ${trade.symbol}`, error)
      }
    }
    
    console.log(`\n📊 Results:`)
    console.log(`   ✅ Successfully added: ${successCount} trades`)
    console.log(`   ❌ Failed: ${errorCount} trades`)
    console.log(`\n🎉 Visit http://localhost:3000/dashboard to see the metrics!`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'testConnection' })
    })
    return response.ok
  } catch {
    return false
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if server is running...')
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Server is not running!')
    console.log('   Please start the server first with: npm run dev')
    process.exit(1)
  }
  
  console.log('✅ Server is running')
  await loadSampleDataViaAPI()
}

main()