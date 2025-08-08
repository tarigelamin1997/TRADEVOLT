'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import Link from 'next/link'

export default function AffiliateTermsPage() {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // In production, this would download a PDF version
    window.open('/api/affiliate/terms/download', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href="/affiliate/apply">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Application
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">TradeVolt Affiliate Program Terms and Conditions</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Effective Date: August 8, 2025 | Version: 1.0.0
            </p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <p className="text-sm">
                <strong>Looking for a simpler version?</strong> Check out our{' '}
                <Link href="/affiliate/terms-simple" className="text-blue-600 hover:underline">
                  Plain-English Summary
                </Link>
                {' '}for an easy-to-understand overview of these terms.
              </p>
            </div>

            {/* Include the full terms content */}
            <div dangerouslySetInnerHTML={{ __html: getTermsContent() }} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getTermsContent() {
  // This would normally fetch from a database or markdown file
  // For now, returning a formatted version of key sections
  return `
    <h2>1. Agreement Overview</h2>
    <p>These Affiliate Program Terms and Conditions ("Agreement") constitute a legal agreement between TradeVolt ("Company," "we," "us," or "our") and you ("Affiliate," "you," or "your"), collectively referred to as the "Parties."</p>
    <p>By applying to or participating in the TradeVolt Affiliate Program ("Program"), you acknowledge that you have read, understood, and agree to be bound by this Agreement.</p>

    <h2>2. Commission Structure</h2>
    <p>Your commission rate is determined by your monthly sales volume (rolling 30-day window):</p>
    <table class="w-full border-collapse border border-gray-300 dark:border-gray-700">
      <thead>
        <tr class="bg-gray-100 dark:bg-gray-800">
          <th class="border border-gray-300 dark:border-gray-700 p-2">Tier</th>
          <th class="border border-gray-300 dark:border-gray-700 p-2">Monthly Sales</th>
          <th class="border border-gray-300 dark:border-gray-700 p-2">Commission Rate</th>
          <th class="border border-gray-300 dark:border-gray-700 p-2">Per Sale ($29)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-gray-300 dark:border-gray-700 p-2">Bronze</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">&lt; $2,000</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">10%</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">$2.90</td>
        </tr>
        <tr>
          <td class="border border-gray-300 dark:border-gray-700 p-2">Silver</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">$2,000 - $4,999</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">25%</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">$7.25</td>
        </tr>
        <tr>
          <td class="border border-gray-300 dark:border-gray-700 p-2">Gold</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">$5,000 - $9,999</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">35%</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">$10.15</td>
        </tr>
        <tr>
          <td class="border border-gray-300 dark:border-gray-700 p-2">Diamond</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">$10,000+</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">50%</td>
          <td class="border border-gray-300 dark:border-gray-700 p-2">$14.50</td>
        </tr>
      </tbody>
    </table>
    <p>Commissions are paid for <strong>12 consecutive months</strong> from the initial sale.</p>

    <h2>3. Payment Terms</h2>
    <ul>
      <li>Payments processed monthly on the <strong>10th of each month</strong></li>
      <li>Minimum payout threshold: <strong>$100 USD</strong></li>
      <li>Payment methods: PayPal, Wise, Bank Transfer, Cryptocurrency (USDT/USDC)</li>
      <li>All payments in USD</li>
    </ul>

    <h2>4. Prohibited Activities</h2>
    <p>The following activities will result in immediate termination:</p>
    <ul>
      <li>Fraud, fake accounts, or stolen credit cards</li>
      <li>Spam or unsolicited communications</li>
      <li>Bidding on TradeVolt trademark terms in PPC</li>
      <li>Self-referrals or circular referrals</li>
      <li>Misleading claims about TradeVolt or trading profits</li>
      <li>Cookie stuffing or forced cookie placement</li>
      <li>Incentivized traffic (cashback, rewards)</li>
      <li>Bot traffic or automated registrations</li>
    </ul>

    <h2>5. Compliance Requirements</h2>
    <p><strong>FTC Disclosure:</strong> You must clearly disclose your affiliate relationship with language such as "I may earn a commission if you purchase through my link"</p>
    <p><strong>Risk Disclosure:</strong> Include appropriate trading risk warnings when promoting TradeVolt</p>
    <p><strong>Data Protection:</strong> Comply with GDPR, CCPA, and applicable privacy laws</p>

    <h2>6. Refund Policy</h2>
    <p>Commission adjustments for refunds/chargebacks:</p>
    <ul>
      <li>Days 1-7: 100% commission clawback</li>
      <li>Days 8-30: 50% commission clawback</li>
      <li>Days 31+: No clawback (you keep commission)</li>
    </ul>

    <h2>7. Termination</h2>
    <p>Either party may terminate with 30 days written notice. We may terminate immediately for violation of prohibited activities or material breach.</p>

    <h2>8. Contact Information</h2>
    <p>Email: <a href="mailto:affiliates@tradevolt.com">affiliates@tradevolt.com</a></p>

    <div class="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
      <p class="text-sm text-center">
        For the complete legal terms, please refer to the full 
        <a href="/AFFILIATE_TERMS_AND_CONDITIONS.md" class="text-blue-600 hover:underline"> Affiliate Terms and Conditions document</a>.
      </p>
    </div>
  `
}