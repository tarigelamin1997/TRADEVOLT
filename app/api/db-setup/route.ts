import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'DATABASE_URL not set',
        status: 'error'
      }, { status: 500 })
    }

    // Try to connect
    await prisma.$connect()
    
    // Check if tables exist by running queries
    const checks = {
      database_url: process.env.DATABASE_URL.substring(0, 30) + '...',
      connection: 'success',
      tables: {
        users: false,
        trades: false
      },
      counts: {
        users: 0,
        trades: 0
      }
    }

    // Check User table
    try {
      const userCount = await prisma.user.count()
      checks.tables.users = true
      checks.counts.users = userCount
    } catch (e) {
      console.error('User table check failed:', e)
    }

    // Check Trade table
    try {
      const tradeCount = await prisma.trade.count()
      checks.tables.trades = true
      checks.counts.trades = tradeCount
    } catch (e) {
      console.error('Trade table check failed:', e)
    }

    // If tables don't exist, provide instructions
    if (!checks.tables.users || !checks.tables.trades) {
      return NextResponse.json({
        ...checks,
        error: 'Database tables are missing',
        solution: 'Run "npx prisma db push" in your local environment or ensure the build process includes "prisma db push"',
        build_command: 'Your package.json build script should be: "prisma generate && prisma db push && next build"'
      }, { status: 200 })
    }

    return NextResponse.json({
      ...checks,
      status: 'ready'
    })

  } catch (error) {
    console.error('Database setup check error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown',
      status: 'error'
    }, { status: 500 })
  }
}