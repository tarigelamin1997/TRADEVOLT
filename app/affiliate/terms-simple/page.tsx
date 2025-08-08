import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

export default function AffiliateTermsSimplePage() {
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
          <Link href="/affiliate/terms">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Full Legal Terms
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              TradeVolt Affiliate Program - Plain English Summary 🚀
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              This is a simple summary to help you understand. The full legal terms still apply.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* The Basics */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-blue-600">🎯 The Basics</h2>
              <div className="space-y-2">
                <p><strong>What is this?</strong> You promote TradeVolt, we pay you commissions when people sign up.</p>
                <p><strong>How much?</strong> Up to 50% commission ($14.50 per $29 sale) for 12 months per customer.</p>
                <p><strong>When paid?</strong> Monthly on the 10th. Need $100 minimum to get paid.</p>
              </div>
            </div>

            {/* Commission Tiers */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-green-600">💰 How Much You Earn</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="border p-2 text-left">Your Monthly Sales</th>
                      <th className="border p-2 text-left">Your Rate</th>
                      <th className="border p-2 text-left">You Earn Per Sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">Under $2,000</td>
                      <td className="border p-2">10%</td>
                      <td className="border p-2 font-bold">$2.90</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <td className="border p-2">$2,000 - $4,999</td>
                      <td className="border p-2">25%</td>
                      <td className="border p-2 font-bold">$7.25</td>
                    </tr>
                    <tr>
                      <td className="border p-2">$5,000 - $9,999</td>
                      <td className="border p-2">35%</td>
                      <td className="border p-2 font-bold">$10.15</td>
                    </tr>
                    <tr className="bg-blue-50 dark:bg-blue-900/20">
                      <td className="border p-2">$10,000+</td>
                      <td className="border p-2">50%</td>
                      <td className="border p-2 font-bold text-blue-600">$14.50 🎉</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                <strong>Example:</strong> 100 customers × $14.50 × 12 months = $17,400 total! 🤑
              </p>
            </div>

            {/* What You Can Do */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-green-600">✅ What You CAN Do</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                  <strong>Promote Anywhere:</strong>
                  <ul className="text-sm mt-1">
                    <li>• Your website/blog</li>
                    <li>• YouTube videos</li>
                    <li>• Social media</li>
                    <li>• Email newsletters</li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <strong>We Provide:</strong>
                  <ul className="text-sm mt-1">
                    <li>• Marketing materials</li>
                    <li>• Tracking dashboard</li>
                    <li>• Monthly payments</li>
                    <li>• Crypto payment option</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* What You Can't Do */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-red-600">❌ What You CAN&apos;T Do</h2>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
                <p className="font-bold mb-2">These will get you banned instantly:</p>
                <ul className="space-y-1 text-sm">
                  <li>🚫 Use fake accounts or stolen cards</li>
                  <li>🚫 Send spam emails</li>
                  <li>🚫 Bid on "TradeVolt" in Google Ads</li>
                  <li>🚫 Buy through your own link</li>
                  <li>🚫 Promise unrealistic profits</li>
                  <li>🚫 Give financial advice</li>
                  <li>🚫 Use bots or automation</li>
                  <li>🚫 Lie about TradeVolt features</li>
                </ul>
              </div>
            </div>

            {/* Important Disclosures */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-purple-600">💡 Important Rules</h2>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                  <strong>Always disclose you&apos;re an affiliate:</strong>
                  <p className="text-sm mt-1 italic">"I may earn a commission if you sign up through my link"</p>
                </div>
                <div className="p-3 border-l-4 border-orange-600 bg-orange-50 dark:bg-orange-900/20">
                  <strong>Refunds affect you:</strong>
                  <ul className="text-sm mt-1">
                    <li>• Days 1-7: We take back 100%</li>
                    <li>• Days 8-30: We take back 50%</li>
                    <li>• After 30 days: You keep it all</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick FAQ */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-indigo-600">⚡ Quick FAQ</h2>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong>Q: How long does the cookie last?</strong>
                  <p className="text-sm">A: 60 days - plenty of time for people to decide!</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong>Q: Can I run Facebook/Google ads?</strong>
                  <p className="text-sm">A: Yes! Just don&apos;t bid on "TradeVolt" keywords.</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong>Q: What payment methods?</strong>
                  <p className="text-sm">A: PayPal, Bank Transfer, Wise, or Crypto (USDT/USDC)</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <strong>Q: Can I promote competitors too?</strong>
                  <p className="text-sm">A: Yes! Just don&apos;t trash-talk us. 😊</p>
                </div>
              </div>
            </div>

            {/* Common Mistakes */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-yellow-600">🚨 Common Mistakes to Avoid</h2>
              <ol className="space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold text-yellow-600">1.</span>
                  <span>Forgetting to disclose you&apos;re an affiliate</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-yellow-600">2.</span>
                  <span>Using "TradeVolt" in your domain name</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-yellow-600">3.</span>
                  <span>Promising guaranteed trading profits</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-yellow-600">4.</span>
                  <span>Buying through your own link</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-yellow-600">5.</span>
                  <span>Sending spam emails</span>
                </li>
              </ol>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">📞 Need Help?</h2>
              <p className="mb-2">Email: <a href="mailto:affiliates@tradevolt.com" className="text-blue-600 hover:underline">affiliates@tradevolt.com</a></p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Response in 24-48 hours (faster for Gold/Diamond affiliates)</p>
            </div>

            {/* Legal Note */}
            <div className="border-t pt-6">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                <p className="text-sm text-center">
                  ⚖️ <strong>Remember:</strong> This is just a friendly summary. The{' '}
                  <Link href="/affiliate/terms" className="text-blue-600 hover:underline">
                    full legal terms
                  </Link>
                  {' '}are what actually count. By joining, you agree to follow all the rules.
                </p>
              </div>
              <p className="text-center mt-4 text-lg font-bold">
                Bottom Line: Promote honestly, follow the rules, and let&apos;s both succeed! 🚀
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}