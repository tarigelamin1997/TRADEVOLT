'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { 
  BookOpen,
  Plus,
  Search,
  BarChart3,
  Shield,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Copy
} from 'lucide-react'
import { TradingSetupService } from '@/lib/services/trading-setup-service'
import { findUserByClerkId, findTradesByUserId, type TradingSetup } from '@/lib/db-memory'
import { SetupCard } from '@/components/playbooks/setup-card'
import { SetupWizard } from '@/components/playbooks/setup-wizard'
import { SetupAnalytics } from '@/components/playbooks/setup-analytics'
import { DisciplineTracker } from '@/components/playbooks/discipline-tracker'
import { SetupEvolution } from '@/components/playbooks/setup-evolution'
import { cn } from '@/lib/utils'

export default function PlaybooksPage() {
  const [loading, setLoading] = useState(true)
  const [setups, setSetups] = useState<TradingSetup[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('my-setups')
  const [showWizard, setShowWizard] = useState(false)
  const [editingSetup, setEditingSetup] = useState<TradingSetup | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const user = await findUserByClerkId('demo-user')
      if (!user) return

      const [userSetups, userTrades] = await Promise.all([
        TradingSetupService.getSetupsByUserId(user.id),
        findTradesByUserId(user.id)
      ])

      setSetups(userSetups)
      setTrades(userTrades)
    } catch (error) {
      console.error('Failed to fetch playbooks data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSetup = async (setup: Omit<TradingSetup, 'id' | 'createdAt' | 'updatedAt'>) => {
    const user = await findUserByClerkId('demo-user')
    if (!user) return

    const newSetup = await TradingSetupService.createSetup(user.id, setup)
    setSetups([...setups, newSetup])
    setShowWizard(false)
  }

  const handleUpdateSetup = async (setupId: string, updates: Partial<TradingSetup>) => {
    const user = await findUserByClerkId('demo-user')
    if (!user) return

    const updated = await TradingSetupService.updateSetup(user.id, setupId, updates)
    if (updated) {
      setSetups(setups.map(s => s.id === setupId ? updated : s))
    }
    setEditingSetup(null)
  }

  const handleDeleteSetup = async (setupId: string) => {
    const user = await findUserByClerkId('demo-user')
    if (!user) return

    const success = await TradingSetupService.deleteSetup(user.id, setupId)
    if (success) {
      setSetups(setups.filter(s => s.id !== setupId))
    }
  }

  const filteredSetups = setups.filter(setup => 
    setup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setup.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeSetups = filteredSetups.filter(s => s.isActive)
  const inactiveSetups = filteredSetups.filter(s => !s.isActive)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <BookOpen className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trading Playbooks</h1>
            <p className="text-sm text-muted-foreground">
              Define, track, and optimize your trading strategies
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowWizard(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Setup
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active Setups</span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{activeSetups.length}</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Trades</span>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">
              {trades.filter(t => t.setupId).length}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Best Setup</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold truncate">
              {setups.length > 0 ? 
                setups.sort((a, b) => (b.stats?.winRate || 0) - (a.stats?.winRate || 0))[0].name : 
                'N/A'
              }
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Compliance</span>
              <Shield className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold">
              {TradingSetupService.calculateDisciplineScore('demo-user', trades).overallScore.toFixed(0)}%
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full lg:w-auto">
          <TabsTrigger value="my-setups">My Setups</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="discipline">Discipline</TabsTrigger>
          <TabsTrigger value="evolution">Evolution</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="my-setups" className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search setups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Active Setups */}
          {activeSetups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Active Setups
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSetups.map((setup, index) => (
                  <motion.div
                    key={setup.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <SetupCard
                      setup={setup}
                      metrics={TradingSetupService.analyzeSetupPerformance(setup, trades)}
                      onEdit={() => setEditingSetup(setup)}
                      onDelete={() => handleDeleteSetup(setup.id)}
                      onToggleActive={() => handleUpdateSetup(setup.id, { isActive: !setup.isActive })}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Setups */}
          {inactiveSetups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-5 w-5" />
                Inactive Setups
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {inactiveSetups.map((setup, index) => (
                  <motion.div
                    key={setup.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <SetupCard
                      setup={setup}
                      metrics={TradingSetupService.analyzeSetupPerformance(setup, trades)}
                      onEdit={() => setEditingSetup(setup)}
                      onDelete={() => handleDeleteSetup(setup.id)}
                      onToggleActive={() => handleUpdateSetup(setup.id, { isActive: !setup.isActive })}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredSetups.length === 0 && (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No setups found' : 'No trading setups yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm ? 
                  'Try adjusting your search terms' : 
                  'Create your first trading setup to start tracking your strategy performance'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Setup
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SetupAnalytics setups={setups} trades={trades} />
        </TabsContent>

        <TabsContent value="discipline" className="space-y-6">
          <DisciplineTracker />
        </TabsContent>

        <TabsContent value="evolution" className="space-y-6">
          <SetupEvolution />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TemplatesTab onSelectTemplate={(template) => {
            setEditingSetup(template as TradingSetup)
            setShowWizard(true)
          }} />
        </TabsContent>
      </Tabs>

      {/* Setup Wizard Modal */}
      {showWizard && (
        <SetupWizard
          setup={editingSetup}
          onSave={editingSetup ? 
            (updates) => handleUpdateSetup(editingSetup.id, updates) : 
            handleCreateSetup
          }
          onClose={() => {
            setShowWizard(false)
            setEditingSetup(null)
          }}
        />
      )}
    </div>
  )
}

// Templates Tab Component
function TemplatesTab({ onSelectTemplate }: { onSelectTemplate: (template: any) => void }) {
  const templates = TradingSetupService.getSetupTemplates()

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Setup Templates</h3>
        <p className="text-muted-foreground">
          Start with a proven template and customize it to your style
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onSelectTemplate(template)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    template.category === 'Breakout' ? "bg-blue-100 text-blue-600" :
                    template.category === 'Reversal' ? "bg-purple-100 text-purple-600" :
                    "bg-gray-100 text-gray-600"
                  )}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.category}</p>
                  </div>
                </div>
                <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Entry Rules</span>
                  <span className="font-medium">{template.entryRules?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk/Reward</span>
                  <span className="font-medium">{template.targetRiskReward}:1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max Risk</span>
                  <span className="font-medium">{template.maxLossPerTrade}%</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}