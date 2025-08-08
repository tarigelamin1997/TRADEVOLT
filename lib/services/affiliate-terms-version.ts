import { prisma } from '@/lib/prisma'

export interface TermsVersion {
  version: string
  effectiveDate: Date
  changeType: 'major' | 'minor' | 'patch'
  changes: string[]
  notificationSent: boolean
  notificationDate?: Date
}

export class AffiliateTermsVersionControl {
  static readonly CURRENT_VERSION = '1.0.0'
  static readonly EFFECTIVE_DATE = new Date('2025-08-08')
  
  /**
   * Version History
   * Format: MAJOR.MINOR.PATCH
   * MAJOR: Breaking changes requiring re-acceptance
   * MINOR: Material changes requiring 30-60 day notice
   * PATCH: Clarifications and typo fixes
   */
  static readonly VERSION_HISTORY: TermsVersion[] = [
    {
      version: '1.0.0',
      effectiveDate: new Date('2025-08-08'),
      changeType: 'major',
      changes: ['Initial release of affiliate terms and conditions'],
      notificationSent: false
    }
  ]

  /**
   * Check if affiliate has accepted current version
   */
  static async hasAcceptedCurrentVersion(affiliateId: string): Promise<boolean> {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { 
        id: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!affiliate) return false

    // Get the last acceptance record (would be stored in a separate table in production)
    // For now, we check if they were created after the current version date
    return affiliate.createdAt >= this.EFFECTIVE_DATE
  }

  /**
   * Record terms acceptance
   */
  static async recordAcceptance(
    affiliateId: string, 
    version: string = this.CURRENT_VERSION
  ): Promise<void> {
    // In production, this would be stored in an AffiliateTermsAcceptance table
    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        updatedAt: new Date(),
        // Store version in customBranding JSON field temporarily
        customBranding: {
          termsVersion: version,
          acceptedAt: new Date().toISOString()
        }
      }
    })
  }

  /**
   * Get affiliates who need to accept new terms
   */
  static async getAffiliatesNeedingAcceptance(): Promise<string[]> {
    const affiliates = await prisma.affiliate.findMany({
      where: {
        status: 'active',
        createdAt: {
          lt: this.EFFECTIVE_DATE
        }
      },
      select: { id: true }
    })

    return affiliates.map(a => a.id)
  }

  /**
   * Send notification about terms update
   */
  static async notifyTermsUpdate(
    changeType: 'major' | 'minor' | 'patch',
    changes: string[],
    effectiveDate: Date
  ): Promise<void> {
    const affiliates = await prisma.affiliate.findMany({
      where: { status: 'active' },
      include: { user: true }
    })

    const noticePeriod = changeType === 'major' ? 60 : 30 // days
    const notificationDate = new Date()
    
    for (const affiliate of affiliates) {
      // Create notification record
      const notification = {
        affiliateId: affiliate.id,
        email: affiliate.user.email,
        subject: this.getNotificationSubject(changeType),
        body: this.getNotificationBody(changeType, changes, effectiveDate, noticePeriod),
        sentAt: notificationDate
      }

      // In production, this would:
      // 1. Send actual email via email service
      // 2. Create dashboard notification
      // 3. Log in AffiliateNotifications table
      console.log('Sending notification:', notification)

      // For major changes, may need to pause account if not accepted by effective date
      if (changeType === 'major') {
        // Schedule account suspension if terms not accepted by effective date
        console.log(`Schedule suspension check for ${affiliate.id} on ${effectiveDate}`)
      }
    }
  }

  /**
   * Get notification subject based on change type
   */
  private static getNotificationSubject(changeType: 'major' | 'minor' | 'patch'): string {
    switch (changeType) {
      case 'major':
        return '🚨 Action Required: TradeVolt Affiliate Terms Update - Re-acceptance Needed'
      case 'minor':
        return '📋 Important: TradeVolt Affiliate Terms Update'
      case 'patch':
        return '📝 Notice: Minor Updates to TradeVolt Affiliate Terms'
    }
  }

  /**
   * Get notification body
   */
  private static getNotificationBody(
    changeType: 'major' | 'minor' | 'patch',
    changes: string[],
    effectiveDate: Date,
    noticePeriod: number
  ): string {
    const formattedDate = effectiveDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    let body = `Dear Affiliate Partner,\n\n`

    switch (changeType) {
      case 'major':
        body += `We are updating our Affiliate Terms and Conditions with important changes that require your acceptance.\n\n`
        body += `**Action Required:** Please log into your affiliate dashboard and accept the new terms by ${formattedDate}.\n\n`
        body += `**Important:** Your account will be suspended if you do not accept the new terms by the effective date.\n\n`
        break
      case 'minor':
        body += `We are updating our Affiliate Terms and Conditions with the following changes, effective ${formattedDate}.\n\n`
        body += `These changes will take effect automatically in ${noticePeriod} days. No action is required on your part.\n\n`
        break
      case 'patch':
        body += `We have made minor clarifications to our Affiliate Terms and Conditions.\n\n`
        break
    }

    body += `**Summary of Changes:**\n`
    changes.forEach(change => {
      body += `• ${change}\n`
    })

    body += `\n**View Full Terms:**\n`
    body += `• Full Legal Terms: https://tradevolt.com/affiliate/terms\n`
    body += `• Simple Summary: https://tradevolt.com/affiliate/terms-simple\n`

    if (changeType === 'major') {
      body += `\n**How to Accept:**\n`
      body += `1. Log into your affiliate dashboard\n`
      body += `2. Review the updated terms\n`
      body += `3. Click "Accept Updated Terms"\n`
    }

    body += `\nIf you have any questions, please contact us at affiliates@tradevolt.com.\n\n`
    body += `Best regards,\nThe TradeVolt Affiliate Team`

    return body
  }

  /**
   * Check if terms update is pending for an affiliate
   */
  static async hasPendingTermsUpdate(affiliateId: string): Promise<boolean> {
    const hasAccepted = await this.hasAcceptedCurrentVersion(affiliateId)
    return !hasAccepted
  }

  /**
   * Get change summary between versions
   */
  static getChangeSummary(fromVersion: string, toVersion: string): string[] {
    const changes: string[] = []
    let foundStart = false

    for (const version of this.VERSION_HISTORY) {
      if (version.version === fromVersion) {
        foundStart = true
        continue
      }
      
      if (foundStart) {
        changes.push(...version.changes)
        
        if (version.version === toVersion) {
          break
        }
      }
    }

    return changes
  }

  /**
   * Determine if version change is major, minor, or patch
   */
  static getChangeType(fromVersion: string, toVersion: string): 'major' | 'minor' | 'patch' {
    const [fromMajor, fromMinor, fromPatch] = fromVersion.split('.').map(Number)
    const [toMajor, toMinor, toPatch] = toVersion.split('.').map(Number)

    if (toMajor > fromMajor) return 'major'
    if (toMinor > fromMinor) return 'minor'
    return 'patch'
  }

  /**
   * Schedule version update
   */
  static async scheduleVersionUpdate(
    newVersion: string,
    changes: string[],
    effectiveDate: Date
  ): Promise<void> {
    const changeType = this.getChangeType(this.CURRENT_VERSION, newVersion)
    const noticePeriod = changeType === 'major' ? 60 : 30

    // Calculate when to send notification
    const notificationDate = new Date(effectiveDate)
    notificationDate.setDate(notificationDate.getDate() - noticePeriod)

    // Add to version history
    this.VERSION_HISTORY.push({
      version: newVersion,
      effectiveDate,
      changeType,
      changes,
      notificationSent: false,
      notificationDate
    })

    console.log(`Scheduled ${changeType} update to version ${newVersion}`)
    console.log(`Notification will be sent on ${notificationDate}`)
    console.log(`Changes will be effective on ${effectiveDate}`)

    // In production, this would:
    // 1. Store in database
    // 2. Create cron job for notification
    // 3. Create cron job for enforcement
  }

  /**
   * Get terms acceptance status for all affiliates
   */
  static async getAcceptanceReport(): Promise<{
    total: number
    accepted: number
    pending: number
    percentage: number
  }> {
    const affiliates = await prisma.affiliate.findMany({
      where: { status: 'active' }
    })

    const accepted = affiliates.filter(a => a.createdAt >= this.EFFECTIVE_DATE).length
    const pending = affiliates.length - accepted

    return {
      total: affiliates.length,
      accepted,
      pending,
      percentage: affiliates.length > 0 ? (accepted / affiliates.length) * 100 : 0
    }
  }
}

// Example usage for updating terms
export async function updateAffiliateTerms() {
  // Example: Minor update for commission structure clarification
  await AffiliateTermsVersionControl.scheduleVersionUpdate(
    '1.1.0',
    [
      'Clarified commission calculation for partial months',
      'Added cryptocurrency payment options (USDT/USDC)',
      'Updated refund policy to graduated clawback system'
    ],
    new Date('2025-10-01')
  )

  // Example: Major update requiring re-acceptance
  await AffiliateTermsVersionControl.scheduleVersionUpdate(
    '2.0.0',
    [
      'Changed commission duration from lifetime to 12 months',
      'Updated tier thresholds for 2026',
      'Added new compliance requirements for EU affiliates'
    ],
    new Date('2026-01-01')
  )
}

// Cron job to check for pending notifications (run daily)
export async function checkPendingNotifications() {
  const today = new Date()
  
  for (const version of AffiliateTermsVersionControl.VERSION_HISTORY) {
    if (!version.notificationSent && version.notificationDate && version.notificationDate <= today) {
      await AffiliateTermsVersionControl.notifyTermsUpdate(
        version.changeType,
        version.changes,
        version.effectiveDate
      )
      version.notificationSent = true
    }
  }
}

// Cron job to enforce terms acceptance (run daily)
export async function enforceTermsAcceptance() {
  const today = new Date()
  
  for (const version of AffiliateTermsVersionControl.VERSION_HISTORY) {
    if (version.changeType === 'major' && version.effectiveDate <= today) {
      const needingAcceptance = await AffiliateTermsVersionControl.getAffiliatesNeedingAcceptance()
      
      for (const affiliateId of needingAcceptance) {
        // Suspend affiliate account until they accept new terms
        await prisma.affiliate.update({
          where: { id: affiliateId },
          data: { 
            status: 'suspended',
            customBranding: {
              suspensionReason: 'Terms acceptance required',
              suspendedAt: new Date().toISOString()
            }
          }
        })
        
        console.log(`Suspended affiliate ${affiliateId} for not accepting new terms`)
      }
    }
  }
}