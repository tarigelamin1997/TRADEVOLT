'use client'

import { useState } from 'react'
import { SidebarLayout, SidebarTrigger } from '@/components/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  HelpCircle, 
  Search, 
  Book, 
  Video,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Mail,
  FileText,
  Keyboard,
  Download,
  Upload,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I add my first trade?',
    answer: 'Click the blue "+" button in the bottom-right corner or press Ctrl+N. Fill in the trade details and click "Add Trade". You can also import trades from a CSV file using the Import button in the Journal page.'
  },
  {
    category: 'Getting Started',
    question: 'Can I import trades from my broker?',
    answer: 'Yes! Go to the Journal page and click "Import CSV". We support formats from TD Ameritrade, Interactive Brokers, E*TRADE, and more. Download a template if you need to see the correct format.'
  },
  {
    category: 'Getting Started',
    question: 'Is my data secure?',
    answer: 'Yes, your data is encrypted and stored securely. We use industry-standard encryption for data in transit and at rest. You can also export your data anytime.'
  },
  
  // Trading Features
  {
    category: 'Trading Features',
    question: 'What markets are supported?',
    answer: 'TradeVolt supports Stocks, Options, Futures, Forex, and Crypto. Each market type has specific P&L calculations built-in for accurate tracking.'
  },
  {
    category: 'Trading Features',
    question: 'How are P&L calculations done?',
    answer: 'P&L is calculated based on your market type. For stocks: (Exit - Entry) × Quantity. For options: 100 shares per contract. For futures: using contract multipliers (ES=$50, NQ=$20, etc.). Commissions are automatically subtracted.'
  },
  {
    category: 'Trading Features',
    question: 'What are Playbooks?',
    answer: 'Playbooks are your trading strategies with defined entry/exit rules. Create playbooks to track which strategies work best, monitor rule compliance, and improve discipline.'
  },
  
  // Analytics
  {
    category: 'Analytics',
    question: 'What metrics are tracked?',
    answer: 'We track 16+ professional metrics including Win Rate, Profit Factor, Sharpe Ratio, Average Win/Loss, Maximum Drawdown, R-Multiple, and more. View them in the Analytics page.'
  },
  {
    category: 'Analytics',
    question: 'How do I track my progress?',
    answer: 'Set goals in Settings > Goals for monthly P&L, win rate, or trade count. Track daily streaks on the dashboard. View performance over time with equity curves and calendars.'
  },
  {
    category: 'Analytics',
    question: 'What is MAE/MFE?',
    answer: 'MAE (Maximum Adverse Excursion) shows how much a trade went against you. MFE (Maximum Favorable Excursion) shows the best unrealized profit. These help optimize entries and exits.'
  },
  
  // Import/Export
  {
    category: 'Import/Export',
    question: 'How do I export my trades?',
    answer: 'Click the Export button in the Journal page. Choose PDF for reports with statistics, CSV for Excel, or JSON for developers. Select date ranges and filters as needed.'
  },
  {
    category: 'Import/Export',
    question: 'What CSV format should I use?',
    answer: 'Download a template from the Import dialog. Basic format: Symbol, Type (BUY/SELL), Quantity, Entry Price, Entry Date. Optional: Exit Price, Exit Date, Commission, Notes.'
  },
  {
    category: 'Import/Export',
    question: 'Can I backup my data?',
    answer: 'Yes! Export your data regularly as JSON for complete backups. You can also use CSV exports. We recommend weekly backups for active traders.'
  },
  
  // Troubleshooting
  {
    category: 'Troubleshooting',
    question: 'Why is my P&L showing incorrectly?',
    answer: 'Check: 1) Market type is set correctly, 2) Quantity is accurate, 3) Commission is included, 4) For futures, verify the contract multiplier. Edit the trade to fix any issues.'
  },
  {
    category: 'Troubleshooting',
    question: 'Charts not loading?',
    answer: 'Try refreshing the page (Ctrl+R). Clear browser cache if issues persist. Ensure you have trades with exit dates for most analytics to show.'
  },
  {
    category: 'Troubleshooting',
    question: 'Import failed?',
    answer: 'Verify CSV format matches our templates. Check for: missing required fields, incorrect date formats, or non-numeric values in price/quantity fields. Use "Skip bad rows" option.'
  }
]

const SHORTCUTS = [
  { keys: 'Ctrl + N', description: 'Add new trade' },
  { keys: 'Ctrl + /', description: 'Search trades' },
  { keys: 'Ctrl + E', description: 'Export trades' },
  { keys: 'Ctrl + I', description: 'Import CSV' },
  { keys: 'Esc', description: 'Close dialogs' }
]

const VIDEO_TUTORIALS = [
  { title: 'Getting Started Guide', duration: '5 min', url: '#' },
  { title: 'Importing Trades', duration: '3 min', url: '#' },
  { title: 'Understanding Analytics', duration: '8 min', url: '#' },
  { title: 'Creating Playbooks', duration: '6 min', url: '#' },
  { title: 'Setting Goals', duration: '4 min', url: '#' }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Getting Started'])
  const [selectedTab, setSelectedTab] = useState('faq')
  
  // Group FAQ items by category
  const groupedFAQ = FAQ_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, FAQItem[]>)
  
  // Filter FAQ based on search
  const filteredFAQ = searchQuery
    ? FAQ_ITEMS.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <SidebarLayout currentPath="/help">
      <div className="min-h-screen">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b lg:hidden">
          <div className="flex items-center gap-4 p-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Help & Support</h1>
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <HelpCircle className="h-8 w-8 text-blue-600" />
              Help Center
            </h1>
            <p className="text-muted-foreground">
              Get answers to common questions and learn how to use TradeVolt effectively
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="faq">
                <Book className="h-4 w-4 mr-2" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="shortcuts">
                <Keyboard className="h-4 w-4 mr-2" />
                Shortcuts
              </TabsTrigger>
              <TabsTrigger value="contact">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact
              </TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4">
              {filteredFAQ ? (
                // Show search results
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Search Results ({filteredFAQ.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {filteredFAQ.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No results found for &quot;{searchQuery}&quot;
                      </p>
                    ) : (
                      filteredFAQ.map((item, index) => (
                        <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                          <h3 className="font-medium">{item.question}</h3>
                          <p className="text-sm text-muted-foreground">{item.answer}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ) : (
                // Show categorized FAQ
                Object.entries(groupedFAQ).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleCategory(category)}
                    >
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{category}</span>
                        {expandedCategories.includes(category) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    {expandedCategories.includes(category) && (
                      <CardContent className="space-y-4">
                        {items.map((item, index) => (
                          <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                            <h3 className="font-medium">{item.question}</h3>
                            <p className="text-sm text-muted-foreground">{item.answer}</p>
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <Card>
                <CardHeader>
                  <CardTitle>Video Tutorials</CardTitle>
                  <CardDescription>
                    Learn TradeVolt with step-by-step video guides
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {VIDEO_TUTORIALS.map((video, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <Video className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{video.title}</p>
                            <p className="text-sm text-muted-foreground">{video.duration}</p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shortcuts Tab */}
            <TabsContent value="shortcuts">
              <Card>
                <CardHeader>
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                  <CardDescription>
                    Speed up your workflow with these shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SHORTCUTS.map((shortcut, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get help from our support team within 24 hours
                    </p>
                    <Button className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      support@tradevolt.com
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Live Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Chat with our team during business hours
                    </p>
                    <Button className="w-full" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detailed guides and API documentation
                    </p>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Docs
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Feature Request
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Suggest new features or improvements
                    </p>
                    <Button className="w-full" variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Submit Idea
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarLayout>
  )
}