'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarLayout, SidebarTrigger } from '@/components/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  ArrowRight, 
  Trophy,
  DollarSign,
  Users,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react'

export default function AffiliateApplyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    website: '',
    socialMedia: '',
    audienceSize: '',
    monthlyTraffic: '',
    promotionStrategy: '',
    experience: '',
    whyJoin: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)
  const [complianceAgreed, setComplianceAgreed] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate acceptance checkboxes
    if (!termsAccepted || !ageVerified || !complianceAgreed) {
      alert('Please accept all required agreements to continue.')
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call with acceptance data
    const applicationData = {
      ...formData,
      termsAccepted,
      ageVerified,
      complianceAgreed,
      termsVersion: '1.0',
      acceptedAt: new Date().toISOString()
    }
    
    console.log('Submitting application:', applicationData)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Redirect to affiliate dashboard
    router.push('/affiliate')
  }

  const benefits = [
    {
      icon: Trophy,
      title: 'Up to 50% Commission',
      description: 'Earn industry-leading commissions up to 50% on every sale'
    },
    {
      icon: DollarSign,
      title: 'Recurring Revenue',
      description: 'Get paid monthly for the lifetime of each customer'
    },
    {
      icon: Users,
      title: 'Dedicated Support',
      description: 'Personal affiliate manager for top performers'
    },
    {
      icon: TrendingUp,
      title: 'Performance Bonuses',
      description: 'Extra rewards for hitting monthly milestones'
    },
    {
      icon: Zap,
      title: 'Real-time Tracking',
      description: 'Advanced dashboard with live conversion data'
    },
    {
      icon: Clock,
      title: '60-Day Cookie',
      description: 'Long attribution window for maximum earnings'
    }
  ]

  const tiers = [
    { name: 'Bronze', sales: '< $2,000/mo', commission: '10%', color: 'from-orange-400 to-orange-600' },
    { name: 'Silver', sales: '$2K-$5K/mo', commission: '25%', color: 'from-gray-400 to-gray-600' },
    { name: 'Gold', sales: '$5K-$10K/mo', commission: '35%', color: 'from-yellow-400 to-yellow-600' },
    { name: 'Diamond', sales: '$10K+/mo', commission: '50%', color: 'from-blue-400 to-purple-600' }
  ]

  return (
    <SidebarLayout currentPath="/affiliate/apply">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 p-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Join TradeVolt Affiliate Program
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Partner with us and earn up to 50% recurring commissions
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <Card className="border-2 border-gradient bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-4xl font-bold mb-4">
                Earn <span className="text-blue-600">$1,000+</span> Per Month
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                Join hundreds of successful affiliates earning passive income by promoting TradeVolt
              </p>
              <div className="flex justify-center gap-8 mb-6">
                <div>
                  <p className="text-3xl font-bold text-green-600">$29</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Per Sale</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">Lifetime</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Commissions</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">90 Days</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Money Back</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Tiers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Commission Structure</CardTitle>
              <CardDescription>Earn more as you grow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {tiers.map((tier, index) => (
                  <div 
                    key={tier.name}
                    className="relative overflow-hidden rounded-lg p-6 text-center"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-10`} />
                    <div className="relative z-10">
                      <p className="font-bold text-lg mb-2">{tier.name}</p>
                      <p className="text-3xl font-bold mb-2">{tier.commission}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{tier.sales}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <benefit.icon className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Apply to Become an Affiliate</CardTitle>
              <CardDescription>
                Tell us about yourself and how you plan to promote TradeVolt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website/Blog</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://yoursite.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialMedia">Primary Social Media</Label>
                    <Input
                      id="socialMedia"
                      value={formData.socialMedia}
                      onChange={(e) => setFormData({...formData, socialMedia: e.target.value})}
                      placeholder="@yourusername or channel URL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="audienceSize">Audience Size *</Label>
                    <select
                      id="audienceSize"
                      required
                      className="w-full p-2 border rounded-md"
                      value={formData.audienceSize}
                      onChange={(e) => setFormData({...formData, audienceSize: e.target.value})}
                    >
                      <option value="">Select audience size</option>
                      <option value="0-1k">0 - 1,000</option>
                      <option value="1k-5k">1,000 - 5,000</option>
                      <option value="5k-10k">5,000 - 10,000</option>
                      <option value="10k-50k">10,000 - 50,000</option>
                      <option value="50k-100k">50,000 - 100,000</option>
                      <option value="100k+">100,000+</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyTraffic">Monthly Traffic/Views</Label>
                    <select
                      id="monthlyTraffic"
                      className="w-full p-2 border rounded-md"
                      value={formData.monthlyTraffic}
                      onChange={(e) => setFormData({...formData, monthlyTraffic: e.target.value})}
                    >
                      <option value="">Select monthly traffic</option>
                      <option value="0-10k">0 - 10,000</option>
                      <option value="10k-50k">10,000 - 50,000</option>
                      <option value="50k-100k">50,000 - 100,000</option>
                      <option value="100k-500k">100,000 - 500,000</option>
                      <option value="500k-1m">500,000 - 1M</option>
                      <option value="1m+">1M+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promotionStrategy">How do you plan to promote TradeVolt? *</Label>
                  <Textarea
                    id="promotionStrategy"
                    required
                    rows={4}
                    value={formData.promotionStrategy}
                    onChange={(e) => setFormData({...formData, promotionStrategy: e.target.value})}
                    placeholder="Describe your promotion strategy (e.g., blog reviews, YouTube videos, email marketing, social media posts, etc.)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Previous Affiliate Experience</Label>
                  <Textarea
                    id="experience"
                    rows={3}
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    placeholder="Tell us about any previous affiliate marketing experience or trading-related content you've created"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whyJoin">Why do you want to join our affiliate program? *</Label>
                  <Textarea
                    id="whyJoin"
                    required
                    rows={3}
                    value={formData.whyJoin}
                    onChange={(e) => setFormData({...formData, whyJoin: e.target.value})}
                    placeholder="What makes you excited about promoting TradeVolt?"
                  />
                </div>

                <Separator />

                {/* Terms Acceptance Section */}
                <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg mb-4">Legal Agreements & Compliance</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <div className="flex-1">
                        <span className="font-medium">I accept the Affiliate Terms and Conditions *</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          I have read and agree to the{' '}
                          <button
                            type="button"
                            onClick={() => window.open('/affiliate/terms', '_blank')}
                            className="text-blue-600 hover:underline"
                          >
                            Affiliate Terms and Conditions
                          </button>
                          {' '}and the{' '}
                          <button
                            type="button"
                            onClick={() => window.open('/affiliate/terms-simple', '_blank')}
                            className="text-blue-600 hover:underline"
                          >
                            Simple Summary
                          </button>
                          . I understand the commission structure, payment terms, and prohibited activities.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={ageVerified}
                        onChange={(e) => setAgeVerified(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <div className="flex-1">
                        <span className="font-medium">I confirm that I am 18 years or older *</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          I am of legal age to enter into this agreement and operate as an independent contractor.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={complianceAgreed}
                        onChange={(e) => setComplianceAgreed(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <div className="flex-1">
                        <span className="font-medium">I agree to compliance requirements *</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          I will comply with FTC disclosure requirements, not engage in spam or misleading marketing, 
                          properly disclose my affiliate relationship, and follow all applicable laws and regulations.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Important:</strong> False information or violation of terms will result in immediate termination 
                      and forfeiture of pending commissions. We monitor for compliance and quality.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What happens next?</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>We&apos;ll review your application within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Once approved, you&apos;ll get instant access to your dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Start earning commissions from your first sale</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-4">
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={isSubmitting || !termsAccepted || !ageVerified || !complianceAgreed}
                    className={`${
                      !termsAccepted || !ageVerified || !complianceAgreed 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <div className="flex-1">
                    {(!termsAccepted || !ageVerified || !complianceAgreed) ? (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Please accept all agreements to continue
                      </p>
                    ) : (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ All agreements accepted - Ready to submit
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">What are the requirements to join?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We accept affiliates with an engaged audience interested in trading. You should have at least 1,000 followers or monthly visitors.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">How much can I earn?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Earnings are unlimited! Top affiliates earn $10,000+ per month. With our 50% commission tier, just 20 sales can earn you $290/month recurring.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">When do I get paid?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Payouts are processed monthly on the 10th for the previous month&apos;s commissions. Minimum payout is $100.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Do you provide marketing materials?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes! You&apos;ll get access to professional banners, email templates, social media content, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}