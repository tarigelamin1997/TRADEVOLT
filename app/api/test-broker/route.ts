import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      hasDatabase: !!process.env.DATABASE_URL,
      hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      hasMetaApiToken: !!process.env.METAAPI_TOKEN,
      hasMetaApiRegion: !!process.env.METAAPI_REGION,
    }

    // Try to query BrokerConnection table
    let tableExists = false
    let error = null
    
    try {
      await prisma.brokerConnection.count()
      tableExists = true
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }

    return NextResponse.json({
      status: 'Test endpoint',
      environment: {
        ...envCheck,
        nodeEnv: process.env.NODE_ENV
      },
      database: {
        brokerConnectionTableExists: tableExists,
        error: error
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}