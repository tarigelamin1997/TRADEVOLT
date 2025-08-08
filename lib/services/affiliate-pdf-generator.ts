import jsPDF from 'jspdf'

export class AffiliatePDFGenerator {
  private doc: jsPDF
  private pageHeight = 297 // A4 height in mm
  private pageWidth = 210 // A4 width in mm
  private margin = 20
  private currentY = 20
  private primaryColor = '#2563EB' // Blue-600
  private secondaryColor = '#7C3AED' // Purple-600
  private textColor = '#1F2937' // Gray-800
  private lightGray = '#9CA3AF' // Gray-400

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
  }

  private addNewPageIfNeeded(requiredSpace: number = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin
      this.addPageNumber()
    }
  }

  private addPageNumber() {
    const pageCount = this.doc.getNumberOfPages()
    this.doc.setFontSize(9)
    this.doc.setTextColor(150, 150, 150)
    this.doc.text(
      `Page ${pageCount}`,
      this.pageWidth - this.margin,
      this.pageHeight - 10,
      { align: 'right' }
    )
  }

  private drawGradientRect(x: number, y: number, width: number, height: number) {
    // Simulate gradient with multiple rectangles
    const steps = 20
    const stepHeight = height / steps
    
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const r = Math.round(37 + (124 - 37) * ratio) // Blue to Purple gradient
      const g = Math.round(99 + (58 - 99) * ratio)
      const b = Math.round(235 + (237 - 235) * ratio)
      
      this.doc.setFillColor(r, g, b)
      this.doc.rect(x, y + (i * stepHeight), width, stepHeight, 'F')
    }
  }

  private addHeader(referralCode: string) {
    // Add gradient background header
    this.drawGradientRect(0, 0, this.pageWidth, 50)
    
    // Add logo/brand text
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(32)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('TradeVolt', this.margin, 25)
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Affiliate Marketing Materials', this.margin, 35)
    
    // Add referral code badge
    this.doc.setFillColor(255, 255, 255)
    this.doc.roundedRect(this.pageWidth - 70, 15, 50, 20, 3, 3, 'F')
    this.doc.setTextColor(37, 99, 235)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(referralCode, this.pageWidth - 45, 27, { align: 'center' })
    
    this.currentY = 60
  }

  private addSection(title: string, content: string[], highlight: boolean = false) {
    this.addNewPageIfNeeded(40)
    
    // Section header
    if (highlight) {
      this.doc.setFillColor(37, 99, 235, 0.1)
      this.doc.rect(this.margin - 5, this.currentY - 5, this.pageWidth - (2 * this.margin) + 10, 12, 'F')
    }
    
    this.doc.setTextColor(37, 99, 235)
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 10
    
    // Section content
    this.doc.setTextColor(31, 41, 55)
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    
    content.forEach(line => {
      this.addNewPageIfNeeded(10)
      
      if (line.startsWith('•')) {
        // Bullet point
        this.doc.setFillColor(37, 99, 235)
        this.doc.circle(this.margin + 2, this.currentY - 2, 1, 'F')
        const text = this.doc.splitTextToSize(line.substring(1).trim(), this.pageWidth - (2 * this.margin) - 10)
        this.doc.text(text, this.margin + 8, this.currentY)
        this.currentY += text.length * 5
      } else if (line.startsWith('✓')) {
        // Checkmark item
        this.doc.setTextColor(34, 197, 94) // Green
        this.doc.text('✓', this.margin, this.currentY)
        this.doc.setTextColor(31, 41, 55)
        const text = this.doc.splitTextToSize(line.substring(1).trim(), this.pageWidth - (2 * this.margin) - 10)
        this.doc.text(text, this.margin + 8, this.currentY)
        this.currentY += text.length * 5
      } else if (line.startsWith('#')) {
        // Subheading
        this.doc.setFont('helvetica', 'bold')
        this.doc.setTextColor(75, 85, 99)
        this.doc.text(line.substring(1).trim(), this.margin, this.currentY)
        this.doc.setFont('helvetica', 'normal')
        this.currentY += 6
      } else if (line === '---') {
        // Separator
        this.doc.setDrawColor(200, 200, 200)
        this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
        this.currentY += 5
      } else {
        // Regular text
        const text = this.doc.splitTextToSize(line, this.pageWidth - (2 * this.margin))
        this.doc.text(text, this.margin, this.currentY)
        this.currentY += text.length * 5
      }
    })
    
    this.currentY += 8
  }

  private addCommissionTable() {
    this.addNewPageIfNeeded(60)
    
    this.doc.setTextColor(37, 99, 235)
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Commission Structure', this.margin, this.currentY)
    this.currentY += 10
    
    // Table header
    this.doc.setFillColor(37, 99, 235)
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 10, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(11)
    const colWidth = (this.pageWidth - (2 * this.margin)) / 4
    this.doc.text('Tier', this.margin + 5, this.currentY + 7)
    this.doc.text('Monthly Sales', this.margin + colWidth + 5, this.currentY + 7)
    this.doc.text('Commission', this.margin + (colWidth * 2) + 5, this.currentY + 7)
    this.doc.text('Per Sale ($29)', this.margin + (colWidth * 3) + 5, this.currentY + 7)
    
    this.currentY += 10
    
    // Table rows
    const tiers = [
      { name: 'Bronze', sales: '< $2,000', rate: '10%', amount: '$2.90' },
      { name: 'Silver', sales: '$2,000 - $4,999', rate: '25%', amount: '$7.25' },
      { name: 'Gold', sales: '$5,000 - $9,999', rate: '35%', amount: '$10.15' },
      { name: 'Diamond', sales: '$10,000+', rate: '50%', amount: '$14.50' }
    ]
    
    tiers.forEach((tier, index) => {
      // Alternating row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(245, 247, 250)
        this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 10, 'F')
      }
      
      this.doc.setTextColor(31, 41, 55)
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', index === 3 ? 'bold' : 'normal')
      
      this.doc.text(tier.name, this.margin + 5, this.currentY + 7)
      this.doc.text(tier.sales, this.margin + colWidth + 5, this.currentY + 7)
      this.doc.text(tier.rate, this.margin + (colWidth * 2) + 5, this.currentY + 7)
      this.doc.text(tier.amount, this.margin + (colWidth * 3) + 5, this.currentY + 7)
      
      this.currentY += 10
    })
    
    // Add border
    this.doc.setDrawColor(200, 200, 200)
    this.doc.rect(this.margin, this.currentY - 50, this.pageWidth - (2 * this.margin), 50)
    
    this.currentY += 8
  }

  private addFooter() {
    // Add footer to last page
    const pageCount = this.doc.getNumberOfPages()
    this.doc.setPage(pageCount)
    
    // Footer background
    this.doc.setFillColor(245, 247, 250)
    this.doc.rect(0, this.pageHeight - 30, this.pageWidth, 30, 'F')
    
    // Footer text
    this.doc.setTextColor(107, 114, 128)
    this.doc.setFontSize(9)
    this.doc.text('© 2025 TradeVolt - Professional Trading Analytics', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' })
    this.doc.text('affiliates@tradevolt.com | tradevolt.com', this.pageWidth / 2, this.pageHeight - 15, { align: 'center' })
  }

  public generate(referralCode: string): Blob {
    // Cover page
    this.addHeader(referralCode)
    
    // Welcome section
    this.addSection('Welcome to TradeVolt Affiliate Program', [
      'Thank you for joining our elite affiliate program! As a TradeVolt affiliate partner, you're positioned to earn industry-leading commissions while helping traders transform their performance with professional analytics.',
      '',
      'This comprehensive guide contains everything you need to successfully promote TradeVolt and maximize your earnings potential.'
    ], true)
    
    // Quick Start
    this.addSection('Quick Start Guide', [
      '#Your Unique Assets',
      `• Referral Link: https://tradevolt.com/ref/${referralCode}`,
      `• Referral Code: ${referralCode}`,
      '• Commission: Up to 50% recurring for 12 months',
      '• Cookie Duration: 60 days',
      '• Minimum Payout: $100',
      '',
      '#3 Steps to Your First Commission',
      '• Share your unique referral link',
      '• Customer signs up for 14-day free trial',
      '• Earn commission when they subscribe'
    ])
    
    // Key Selling Points
    this.addSection('Key Selling Points', [
      '#Why Traders Choose TradeVolt',
      '✓ 16+ Professional Trading Metrics',
      '✓ Real-Time P&L Tracking & Analytics',
      '✓ Advanced Risk Management Tools',
      '✓ Trading Playbooks & Strategy Management',
      '✓ Behavioral Analysis & Tilt Detection',
      '✓ MAE/MFE Excursion Analysis',
      '✓ Multi-Asset Support (Stocks, Forex, Futures, Crypto)',
      '✓ Broker Integration (MT4/5, cTrader)',
      '✓ 14-Day Free Trial (No Credit Card)',
      '✓ Only $29/Month (Competitors: $49-99)'
    ])
    
    // Commission table
    this.addCommissionTable()
    
    // Email Templates
    this.doc.addPage()
    this.currentY = this.margin
    this.addPageNumber()
    
    this.addSection('Email Templates', [
      '#Subject Line Examples',
      '• "The $29 Tool That Transformed My Trading Results"',
      '• "How I Improved My Win Rate by 23% in 30 Days"',
      '• "Stop Guessing, Start Tracking: My Secret Trading Weapon"',
      '• "Why I Switched from [Competitor] to TradeVolt"',
      '',
      '#Email Template 1: Personal Success Story',
      'Subject: How I Went from Break-Even to Profitable in 60 Days',
      '',
      'Hi [Name],',
      '',
      'Three months ago, I was stuck in a frustrating cycle - winning trades, losing trades, but never really knowing WHY. My account was treading water, and I had no idea which strategies actually worked.',
      '',
      'Then I discovered TradeVolt, and everything changed.',
      '',
      'Within 60 days of tracking my trades properly, I discovered:',
      '• My morning trades had a 68% win rate (vs 42% in afternoons)',
      '• I was cutting winners too early (average winner: 0.8R, could have been 1.5R)',
      '• My "gut feeling" trades were costing me $500/month',
      '',
      `Start your 14-day free trial: https://tradevolt.com/ref/${referralCode}`,
      '',
      'To your trading success,',
      '[Your name]',
      '',
      `P.S. Use code ${referralCode} for 20% off your first month.`
    ])
    
    // Social Media Templates
    this.addSection('Social Media Templates', [
      '#Twitter/X Thread Starter',
      'How I improved my trading win rate from 45% to 67% in 90 days (thread) 🧵',
      '',
      '#LinkedIn Post',
      'After 5 years of trading, I finally found the tool that changed everything...',
      '',
      'TradeVolt showed me patterns I never knew existed in my trading:',
      '• Best performance on Tuesdays & Thursdays',
      '• Optimal position size: 2% risk (not 1% like I thought)',
      '• My setup actually works better on 15-min timeframe',
      '',
      `If you're serious about trading, you need this: tradevolt.com/ref/${referralCode}`,
      '',
      '#Instagram Caption',
      '📊 From amateur to professional trader in 3 months',
      '',
      'The difference? Data.',
      '',
      'While others guess, I know:',
      '✅ My exact win rate',
      '✅ My profit factor',
      '✅ My best trading hours',
      '✅ My most profitable setups',
      '',
      `Link in bio for 14-day free trial (code: ${referralCode} for 20% off)`
    ])
    
    // Banner Specifications
    this.addSection('Banner Ad Specifications', [
      '#Available Sizes',
      '• Leaderboard: 728x90px',
      '• Medium Rectangle: 300x250px',
      '• Wide Skyscraper: 160x600px',
      '• Mobile Banner: 320x50px',
      '• Half Page: 300x600px',
      '',
      '#Download Links',
      'Access all banner designs at:',
      'tradevolt.com/affiliates/banners',
      '',
      '#Custom Banners',
      'Gold and Diamond tier affiliates can request custom designs'
    ])
    
    // Compliance Guidelines
    this.doc.addPage()
    this.currentY = this.margin
    this.addPageNumber()
    
    this.addSection('Important Compliance Guidelines', [
      '#Required Disclosures',
      '• Always include: "I may earn a commission if you purchase through my link"',
      '• Place disclosure BEFORE affiliate links',
      '• Make disclosure clear and conspicuous',
      '',
      '#Prohibited Activities',
      '• Do NOT bid on "TradeVolt" keywords in PPC',
      '• Do NOT make unrealistic income claims',
      '• Do NOT guarantee trading profits',
      '• Do NOT send unsolicited emails (spam)',
      '• Do NOT use misleading advertising',
      '• Do NOT create fake reviews',
      '',
      '#Best Practices',
      '✓ Share genuine experiences and results',
      '✓ Focus on the value TradeVolt provides',
      '✓ Be transparent about your affiliate relationship',
      '✓ Provide helpful content alongside promotions',
      '✓ Respect your audience's trust'
    ], true)
    
    // Support section
    this.addSection('Support & Resources', [
      '#Need Help?',
      '• Email: affiliates@tradevolt.com',
      '• Response Time: 24-48 hours',
      '• Priority Support: Gold & Diamond tiers',
      '',
      '#Additional Resources',
      '• Affiliate Dashboard: tradevolt.com/affiliate',
      '• Knowledge Base: tradevolt.com/affiliate/help',
      '• Marketing Materials: tradevolt.com/affiliate/materials',
      '',
      '#Join Our Community',
      '• Private Discord for affiliates',
      '• Monthly webinars and training',
      '• Success story sharing'
    ])
    
    // Success tips
    this.addSection('Tips for Success', [
      '• Focus on value, not just features',
      '• Share your personal trading transformation',
      '• Create comparison content (TradeVolt vs competitors)',
      '• Offer exclusive bonuses for your referrals',
      '• Build an email list of traders',
      '• Create tutorial videos showing TradeVolt in action',
      '• Engage with trading communities genuinely',
      '• Track your conversion rates and optimize'
    ])
    
    // Add footer
    this.addFooter()
    
    // Add page numbers to all pages
    const totalPages = this.doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(9)
      this.doc.setTextColor(150, 150, 150)
      this.doc.text(
        `${i} / ${totalPages}`,
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      )
    }
    
    return this.doc.output('blob')
  }
}

export function generateAffiliatePDF(referralCode: string): Blob {
  const generator = new AffiliatePDFGenerator()
  return generator.generate(referralCode)
}