import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AffiliateService } from '@/lib/services/affiliate-service'

export const dynamic = 'force-dynamic'

// Dynamic import for auth to avoid build issues
async function getAuth() {
  try {
    const { auth } = await import('@clerk/nextjs/server')
    return auth
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const authFunc = await getAuth()
    const authResult = authFunc ? await authFunc() : null
    const userId = authResult?.userId || 'demo-user'
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'apply': {
        // Check if user already has an affiliate account
        const existing = await prisma.affiliate.findUnique({
          where: { userId }
        })

        if (existing) {
          return NextResponse.json({ 
            error: 'You already have an affiliate account' 
          }, { status: 400 })
        }

        // Create new affiliate account
        const affiliate = await AffiliateService.createAffiliate(userId)
        
        // Update user record
        await prisma.user.update({
          where: { clerkId: userId },
          data: { isAffiliate: true }
        })

        return NextResponse.json({ 
          success: true, 
          affiliate 
        })
      }

      case 'getStats': {
        const affiliate = await prisma.affiliate.findUnique({
          where: { userId }
        })

        if (!affiliate) {
          return NextResponse.json({ 
            error: 'Affiliate account not found' 
          }, { status: 404 })
        }

        const stats = await AffiliateService.getAffiliateStats(affiliate.id)
        
        return NextResponse.json({ 
          success: true, 
          stats 
        })
      }

      case 'getReferrals': {
        const affiliate = await prisma.affiliate.findUnique({
          where: { userId }
        })

        if (!affiliate) {
          return NextResponse.json({ 
            error: 'Affiliate account not found' 
          }, { status: 404 })
        }

        const referrals = await prisma.affiliateReferral.findMany({
          where: { affiliateId: affiliate.id },
          orderBy: { createdAt: 'desc' },
          take: 100
        })

        return NextResponse.json({ 
          success: true, 
          referrals 
        })
      }

      case 'getCommissions': {
        const affiliate = await prisma.affiliate.findUnique({
          where: { userId }
        })

        if (!affiliate) {
          return NextResponse.json({ 
            error: 'Affiliate account not found' 
          }, { status: 404 })
        }

        const commissions = await prisma.affiliateCommission.findMany({
          where: { affiliateId: affiliate.id },
          orderBy: { createdAt: 'desc' },
          take: 100
        })

        return NextResponse.json({ 
          success: true, 
          commissions 
        })
      }

      case 'getPayouts': {
        const affiliate = await prisma.affiliate.findUnique({
          where: { userId }
        })

        if (!affiliate) {
          return NextResponse.json({ 
            error: 'Affiliate account not found' 
          }, { status: 404 })
        }

        const payouts = await prisma.affiliatePayout.findMany({
          where: { affiliateId: affiliate.id },
          orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ 
          success: true, 
          payouts 
        })
      }

      case 'updateSettings': {
        const { paymentMethod, paymentDetails, notifications } = body

        const affiliate = await prisma.affiliate.findUnique({
          where: { userId }
        })

        if (!affiliate) {
          return NextResponse.json({ 
            error: 'Affiliate account not found' 
          }, { status: 404 })
        }

        const updated = await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: {
            paymentMethod,
            paymentDetails,
            emailNewReferral: notifications?.emailNewReferral,
            emailMonthlyReport: notifications?.emailMonthlyReport,
            emailPayouts: notifications?.emailPayouts
          }
        })

        return NextResponse.json({ 
          success: true, 
          affiliate: updated 
        })
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Affiliate API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Public endpoint for tracking clicks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const referralCode = searchParams.get('ref')
    const action = searchParams.get('action')

    if (action === 'track' && referralCode) {
      // Track referral click
      const clickData = {
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent') || undefined,
        referrerUrl: request.headers.get('referer') || undefined,
        landingPage: searchParams.get('landing') || undefined,
        utmSource: searchParams.get('utm_source') || undefined,
        utmMedium: searchParams.get('utm_medium') || undefined,
        utmCampaign: searchParams.get('utm_campaign') || undefined
      }

      const referral = await AffiliateService.trackReferralClick(
        referralCode,
        clickData
      )

      if (referral) {
        // Set cookie for tracking
        const response = NextResponse.json({ 
          success: true,
          clickId: referral.clickId 
        })

        response.cookies.set('tradevolt_ref', referralCode, {
          maxAge: 60 * 60 * 24 * 60, // 60 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })

        response.cookies.set('tradevolt_click', referral.clickId!, {
          maxAge: 60 * 60 * 24 * 60, // 60 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })

        return response
      }
    }

    // Get affiliate info by code (public)
    if (referralCode && !action) {
      const affiliate = await AffiliateService.getAffiliateByCode(referralCode)
      
      if (affiliate) {
        return NextResponse.json({
          success: true,
          referralCode: affiliate.referralCode,
          discount: '20%' // Default discount for all affiliates
        })
      }
    }

    return NextResponse.json({ 
      error: 'Invalid request' 
    }, { status: 400 })
  } catch (error) {
    console.error('Affiliate tracking error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}