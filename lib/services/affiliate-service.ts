import { prisma } from '@/lib/prisma'

export interface AffiliateStats {
  totalEarnings: number
  pendingPayout: number
  monthlyEarnings: number
  totalReferrals: number
  activeCustomers: number
  conversionRate: number
  lifetimeValue: number
  currentMonthSales: number
  currentTier: 'bronze' | 'silver' | 'gold' | 'diamond'
  nextPayoutDate: Date
}

export interface CommissionTier {
  name: string
  minSales: number
  maxSales: number
  commissionRate: number
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { name: 'bronze', minSales: 0, maxSales: 2000, commissionRate: 0.10 },
  { name: 'silver', minSales: 2000, maxSales: 5000, commissionRate: 0.25 },
  { name: 'gold', minSales: 5000, maxSales: 10000, commissionRate: 0.35 },
  { name: 'diamond', minSales: 10000, maxSales: Infinity, commissionRate: 0.50 }
]

export const SUBSCRIPTION_PRICE = 29 // $29/month as per the financial analysis

export class AffiliateService {
  /**
   * Generate a unique referral code
   */
  static generateReferralCode(userId: string): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `TRD${timestamp}${random}`.substring(0, 10)
  }

  /**
   * Create a new affiliate account
   */
  static async createAffiliate(userId: string) {
    const referralCode = this.generateReferralCode(userId)
    
    return prisma.affiliate.create({
      data: {
        userId,
        referralCode,
        status: 'pending',
        currentTier: 'bronze'
      }
    })
  }

  /**
   * Get affiliate by referral code
   */
  static async getAffiliateByCode(referralCode: string) {
    return prisma.affiliate.findUnique({
      where: { referralCode },
      include: {
        user: true
      }
    })
  }

  /**
   * Track a referral click
   */
  static async trackReferralClick(
    referralCode: string,
    clickData: {
      ipAddress?: string
      userAgent?: string
      referrerUrl?: string
      landingPage?: string
      utmSource?: string
      utmMedium?: string
      utmCampaign?: string
    }
  ) {
    const affiliate = await this.getAffiliateByCode(referralCode)
    if (!affiliate) return null

    const clickId = this.generateClickId()
    
    return prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        clickId,
        customerId: clickId, // Temporary until user signs up
        customerEmail: 'pending@temp.com', // Temporary
        ...clickData,
        status: 'clicked'
      }
    })
  }

  /**
   * Convert a click to a signup
   */
  static async convertClickToSignup(
    clickId: string,
    customerId: string,
    customerEmail: string,
    customerName?: string
  ) {
    return prisma.affiliateReferral.update({
      where: { clickId },
      data: {
        customerId,
        customerEmail,
        customerName,
        status: 'trial',
        signedUpAt: new Date()
      }
    })
  }

  /**
   * Convert a trial to a paid subscription
   */
  static async convertToPaidCustomer(
    customerId: string,
    subscriptionPlan: string,
    discountCode?: string,
    discountAmount?: number
  ) {
    const referral = await prisma.affiliateReferral.findFirst({
      where: { customerId }
    })

    if (!referral) return null

    // Update referral status
    await prisma.affiliateReferral.update({
      where: { id: referral.id },
      data: {
        status: 'active',
        subscribedAt: new Date(),
        subscriptionPlan,
        discountCode,
        discountAmount,
        monthlyValue: SUBSCRIPTION_PRICE - (discountAmount || 0)
      }
    })

    // Create commission record
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: referral.affiliateId }
    })

    if (!affiliate) return null

    const commission = await this.calculateCommission(
      affiliate.id,
      SUBSCRIPTION_PRICE - (discountAmount || 0)
    )

    await prisma.affiliateCommission.create({
      data: {
        affiliateId: affiliate.id,
        referralId: referral.id,
        amount: commission.amount,
        percentage: commission.percentage,
        tier: commission.tier,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        customerEmail: referral.customerEmail,
        subscriptionPlan
      }
    })

    // Update affiliate metrics
    await this.updateAffiliateMetrics(affiliate.id)

    return referral
  }

  /**
   * Calculate commission based on current tier
   */
  static async calculateCommission(affiliateId: string, saleAmount: number) {
    const currentMonthSales = await this.getCurrentMonthSales(affiliateId)
    const tier = this.getTierForSales(currentMonthSales)
    
    return {
      amount: saleAmount * tier.commissionRate,
      percentage: tier.commissionRate * 100,
      tier: tier.name
    }
  }

  /**
   * Get current month sales for an affiliate
   */
  static async getCurrentMonthSales(affiliateId: string): Promise<number> {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const commissions = await prisma.affiliateCommission.aggregate({
      where: {
        affiliateId,
        month: currentMonth,
        year: currentYear,
        status: { in: ['pending', 'approved', 'paid'] }
      },
      _sum: {
        amount: true
      }
    })

    // Calculate based on commission amount / rate to get sales
    // This is a simplified version - in production, track actual sales separately
    const avgRate = 0.275 // Average commission rate
    return (commissions._sum.amount || 0) / avgRate
  }

  /**
   * Get tier for sales amount
   */
  static getTierForSales(salesAmount: number): CommissionTier {
    for (const tier of COMMISSION_TIERS) {
      if (salesAmount >= tier.minSales && salesAmount < tier.maxSales) {
        return tier
      }
    }
    return COMMISSION_TIERS[0] // Default to bronze
  }

  /**
   * Update affiliate metrics
   */
  static async updateAffiliateMetrics(affiliateId: string) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId }
    })

    if (!affiliate) return

    // Calculate total earnings
    const earnings = await prisma.affiliateCommission.aggregate({
      where: {
        affiliateId,
        status: { in: ['approved', 'paid'] }
      },
      _sum: {
        amount: true
      }
    })

    // Calculate pending payout
    const pending = await prisma.affiliateCommission.aggregate({
      where: {
        affiliateId,
        status: 'approved'
      },
      _sum: {
        amount: true
      }
    })

    // Count referrals
    const referralCounts = await prisma.affiliateReferral.groupBy({
      by: ['status'],
      where: { affiliateId },
      _count: true
    })

    const totalReferrals = referralCounts.reduce((sum, r) => sum + r._count, 0)
    const activeCustomers = referralCounts
      .filter(r => r.status === 'active')
      .reduce((sum, r) => sum + r._count, 0)

    // Calculate conversion rate
    const clicks = referralCounts
      .filter(r => r.status === 'clicked')
      .reduce((sum, r) => sum + r._count, 0)
    
    const conversionRate = clicks > 0 ? (activeCustomers / clicks) * 100 : 0

    // Update current tier based on monthly sales
    const currentMonthSales = await this.getCurrentMonthSales(affiliateId)
    const currentTier = this.getTierForSales(currentMonthSales).name

    // Update affiliate record
    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        totalEarnings: earnings._sum.amount || 0,
        pendingPayout: pending._sum.amount || 0,
        totalReferrals,
        activeCustomers,
        conversionRate,
        currentTier,
        lastActiveAt: new Date()
      }
    })

    // Check if tier changed and record it
    if (affiliate.currentTier !== currentTier) {
      await prisma.affiliateTierHistory.create({
        data: {
          affiliateId,
          previousTier: affiliate.currentTier,
          newTier: currentTier,
          monthlySales: currentMonthSales,
          monthlyReferrals: activeCustomers,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }
      })
    }
  }

  /**
   * Get affiliate statistics
   */
  static async getAffiliateStats(affiliateId: string): Promise<AffiliateStats | null> {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId }
    })

    if (!affiliate) return null

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Get monthly earnings
    const monthlyEarnings = await prisma.affiliateCommission.aggregate({
      where: {
        affiliateId,
        month: currentMonth,
        year: currentYear,
        status: { in: ['pending', 'approved', 'paid'] }
      },
      _sum: {
        amount: true
      }
    })

    // Calculate lifetime value
    const lifetimeValue = await prisma.affiliateReferral.aggregate({
      where: {
        affiliateId,
        status: 'active'
      },
      _sum: {
        lifetimeValue: true
      }
    })

    const currentMonthSales = await this.getCurrentMonthSales(affiliateId)

    // Calculate next payout date (10th of next month)
    const nextPayoutDate = new Date()
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1)
    nextPayoutDate.setDate(10)

    return {
      totalEarnings: affiliate.totalEarnings,
      pendingPayout: affiliate.pendingPayout,
      monthlyEarnings: monthlyEarnings._sum.amount || 0,
      totalReferrals: affiliate.totalReferrals,
      activeCustomers: affiliate.activeCustomers,
      conversionRate: affiliate.conversionRate,
      lifetimeValue: lifetimeValue._sum.lifetimeValue || 0,
      currentMonthSales,
      currentTier: affiliate.currentTier as 'bronze' | 'silver' | 'gold' | 'diamond',
      nextPayoutDate
    }
  }

  /**
   * Process monthly payouts
   */
  static async processMonthlyPayouts() {
    const eligibleAffiliates = await prisma.affiliate.findMany({
      where: {
        pendingPayout: { gte: 100 }, // Minimum payout threshold
        status: 'active'
      }
    })

    for (const affiliate of eligibleAffiliates) {
      // Get all unpaid approved commissions
      const unpaidCommissions = await prisma.affiliateCommission.findMany({
        where: {
          affiliateId: affiliate.id,
          status: 'approved',
          payoutId: null
        }
      })

      if (unpaidCommissions.length === 0) continue

      const totalAmount = unpaidCommissions.reduce((sum, c) => sum + c.amount, 0)

      // Create payout record
      const payout = await prisma.affiliatePayout.create({
        data: {
          affiliateId: affiliate.id,
          amount: totalAmount,
          method: affiliate.paymentMethod || 'bank_transfer',
          status: 'pending',
          periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
          scheduledDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10)
        }
      })

      // Link commissions to payout
      await prisma.affiliateCommission.updateMany({
        where: {
          id: { in: unpaidCommissions.map(c => c.id) }
        },
        data: {
          payoutId: payout.id,
          status: 'paid'
        }
      })

      // Update affiliate pending payout
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          pendingPayout: 0
        }
      })
    }
  }

  /**
   * Generate a unique click ID
   */
  private static generateClickId(): string {
    return `CLK${Date.now()}${Math.random().toString(36).substring(2, 9)}`.toUpperCase()
  }
}