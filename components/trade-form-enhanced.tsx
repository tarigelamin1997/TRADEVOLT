'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Checkbox } from './ui/checkbox'
import { MARKET_TYPES } from '@/lib/market-knowledge'
import { useSettings } from '@/lib/settings'
import { TradingSetupService, type TradingSetup, type SetupRule } from '@/lib/services/trading-setup-service'
import { findUserByClerkId } from '@/lib/db-memory'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Camera,
  TrendingUp,
  Shield,
  Target,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedTrade {
  symbol: string
  type: 'BUY' | 'SELL'
  entry: string
  exit: string
  quantity: string
  entryDate: string
  entryTime: string
  exitDate: string
  exitTime: string
  marketType: string
  notes: string
  setup: string
  setupId: string
  setupTags: string
  confidence: string
  // New fields
  marketConditions: {
    volatility?: 'Low' | 'Medium' | 'High'
    trend?: 'Strong Up' | 'Up' | 'Sideways' | 'Down' | 'Strong Down'
    volume?: 'Low' | 'Average' | 'High'
  }
  ruleChecklist: Record<string, boolean>
  screenshots?: string[]
}

interface TradeFormEnhancedProps {
  onAdd: (trade: any) => void
  isExitTrade?: boolean
}

export function TradeFormEnhanced({ onAdd, isExitTrade = false }: TradeFormEnhancedProps) {
  const { settings } = useSettings()
  const [setups, setSetups] = useState<TradingSetup[]>([])
  const [selectedSetup, setSelectedSetup] = useState<TradingSetup | null>(null)
  const [showRuleChecklist, setShowRuleChecklist] = useState(false)
  const [ruleCompliance, setRuleCompliance] = useState<Record<string, boolean>>({})
  
  // Get last used market type from localStorage or use settings default
  const getLastMarketType = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastMarketType') || settings.trading.defaultMarketType
    }
    return settings.trading.defaultMarketType
  }

  const [trade, setTrade] = useState<EnhancedTrade>({
    symbol: '',
    type: 'BUY',
    entry: '',
    exit: '',
    quantity: settings.trading.riskManagement.defaultPositionSize.toString(),
    entryDate: new Date().toISOString().split('T')[0],
    entryTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    exitDate: '',
    exitTime: '',
    marketType: getLastMarketType(),
    notes: '',
    setup: '',
    setupId: '',
    setupTags: '',
    confidence: '3',
    marketConditions: {},
    ruleChecklist: {},
    screenshots: []
  })

  // Load active setups
  useEffect(() => {
    loadSetups()
  }, [])

  const loadSetups = async () => {
    const user = await findUserByClerkId('demo-user')
    if (!user) return

    const userSetups = await TradingSetupService.getSetupsByUserId(user.id)
    const activeSetups = userSetups.filter(s => s.isActive)
    setSetups(activeSetups)
  }

  // When setup is selected, update form and prepare checklist
  const handleSetupChange = (setupId: string) => {
    const setup = setups.find(s => s.id === setupId)
    if (!setup) return

    setSelectedSetup(setup)
    setTrade({
      ...trade,
      setupId,
      setup: setup.name
    })

    // Initialize rule checklist
    const checklist: Record<string, boolean> = {}
    const allRules = [...setup.entryRules, ...setup.exitRules, ...setup.riskRules]
    allRules.forEach(rule => {
      checklist[rule.id] = false
    })
    setRuleCompliance(checklist)
    
    // Show checklist if not exit trade
    if (!isExitTrade) {
      setShowRuleChecklist(true)
    }
  }

  // Save market type to localStorage when it changes
  useEffect(() => {
    if (trade.marketType && typeof window !== 'undefined') {
      localStorage.setItem('lastMarketType', trade.marketType)
    }
  }, [trade.marketType])

  const calculateComplianceScore = () => {
    if (!selectedSetup) return 100

    const allRules = [...selectedSetup.entryRules, ...selectedSetup.exitRules, ...selectedSetup.riskRules]
    const criticalRules = allRules.filter(r => r.importance === 'Critical')
    const importantRules = allRules.filter(r => r.importance === 'Important')
    
    let score = 100
    
    // Critical rules: -20 points each if not followed
    criticalRules.forEach(rule => {
      if (!ruleCompliance[rule.id]) score -= 20
    })
    
    // Important rules: -10 points each if not followed
    importantRules.forEach(rule => {
      if (!ruleCompliance[rule.id]) score -= 10
    })
    
    return Math.max(0, score)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Calculate compliance score
      const complianceScore = calculateComplianceScore()
      const checkedRules = Object.entries(ruleCompliance)
        .filter(([_, checked]) => checked)
        .map(([ruleId]) => ruleId)
      const violatedRules = Object.entries(ruleCompliance)
        .filter(([_, checked]) => !checked)
        .map(([ruleId]) => ruleId)

      // Combine date and time for entry
      const entryDateTime = trade.entryTime 
        ? new Date(`${trade.entryDate}T${trade.entryTime}`)
        : new Date(trade.entryDate)
      
      // Combine date and time for exit (if provided)
      let exitDateTime = null
      if (trade.exit && trade.exitDate) {
        exitDateTime = trade.exitTime
          ? new Date(`${trade.exitDate}T${trade.exitTime}`)
          : new Date(trade.exitDate)
      }
      
      const res = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addTrade',
          trade: {
            symbol: trade.symbol,
            type: trade.type,
            entry: parseFloat(trade.entry),
            exit: trade.exit ? parseFloat(trade.exit) : null,
            quantity: parseFloat(trade.quantity),
            entryTime: entryDateTime.toISOString(),
            exitTime: exitDateTime ? exitDateTime.toISOString() : null,
            marketType: trade.marketType,
            notes: trade.notes || null,
            setup: trade.setup || null,
            setupId: trade.setupId || null,
            setupTags: trade.setupTags ? trade.setupTags.split(',').map(tag => tag.trim()).filter(tag => tag) : null,
            confidence: trade.confidence ? parseInt(trade.confidence) : null,
            marketConditions: Object.keys(trade.marketConditions).length > 0 ? trade.marketConditions : null,
            ruleCompliance: selectedSetup ? {
              score: complianceScore,
              checkedRules,
              violatedRules,
              notes: trade.notes
            } : null
          },
          email: 'user@example.com'
        })
      })
      
      if (!res.ok) {
        const errorData = await res.text()
        console.error('API Error Response:', errorData)
        throw new Error(`Failed to add trade: ${errorData}`)
      }
      
      const data = await res.json()
      
      // Save rule checklist if setup was used
      if (selectedSetup && trade.setupId) {
        await TradingSetupService.saveRuleChecklist(
          data.trade.id,
          trade.setupId,
          Object.entries(ruleCompliance).map(([ruleId, checked]) => ({
            ruleId,
            checked,
            tradeId: data.trade.id,
            setupId: trade.setupId
          }))
        )
      }
      
      onAdd(data.trade)
      
      // Reset form but keep market type and setup
      setTrade({ 
        symbol: '', 
        type: 'BUY', 
        entry: '', 
        exit: '', 
        quantity: settings.trading.riskManagement.defaultPositionSize.toString(), 
        entryDate: new Date().toISOString().split('T')[0],
        entryTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        exitDate: '',
        exitTime: '',
        marketType: trade.marketType,
        notes: '',
        setup: '',
        setupId: '',
        setupTags: '',
        confidence: '3',
        marketConditions: {},
        ruleChecklist: {},
        screenshots: []
      })
      setSelectedSetup(null)
      setRuleCompliance({})
      setShowRuleChecklist(false)
    } catch (error) {
      console.error('Error adding trade:', error)
      alert('Failed to add trade. Please try again.')
    }
  }

  const RuleChecklistModal = () => {
    if (!selectedSetup || !showRuleChecklist) return null

    const complianceScore = calculateComplianceScore()
    const getScoreColor = () => {
      if (complianceScore >= 90) return 'text-green-600'
      if (complianceScore >= 70) return 'text-amber-600'
      return 'text-red-600'
    }

    const renderRules = (rules: SetupRule[], title: string, icon: any) => {
      const Icon = icon
      return rules.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </h4>
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-start gap-3">
                <Checkbox
                  id={rule.id}
                  checked={ruleCompliance[rule.id] || false}
                  onCheckedChange={(checked) => 
                    setRuleCompliance({ ...ruleCompliance, [rule.id]: !!checked })
                  }
                  className="mt-0.5"
                />
                <label 
                  htmlFor={rule.id} 
                  className="text-sm cursor-pointer flex-1"
                >
                  <span className={cn(
                    "block",
                    ruleCompliance[rule.id] && "line-through opacity-70"
                  )}>
                    {rule.text}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs mt-1",
                      rule.importance === 'Critical' && "border-red-600 text-red-600",
                      rule.importance === 'Important' && "border-amber-600 text-amber-600",
                      rule.importance === 'Optional' && "border-gray-600 text-gray-600"
                    )}
                  >
                    {rule.importance}
                  </Badge>
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-background rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          <Card className="border-0">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <div>
                    <CardTitle>{selectedSetup.name} Checklist</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check off the rules you're following for this trade
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Compliance</p>
                    <p className={cn("text-2xl font-bold", getScoreColor())}>
                      {complianceScore}%
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowRuleChecklist(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {renderRules(selectedSetup.entryRules, 'Entry Rules', Target)}
              {renderRules(selectedSetup.exitRules, 'Exit Rules', Target)}
              {renderRules(selectedSetup.riskRules, 'Risk Management', Shield)}
              
              <div className="pt-4 border-t">
                <Button 
                  className="w-full" 
                  onClick={() => setShowRuleChecklist(false)}
                  disabled={complianceScore < 50}
                >
                  {complianceScore < 50 ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Compliance Too Low ({complianceScore}%)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Continue with {complianceScore}% Compliance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Setup Selection (New) */}
        {setups.length > 0 && (
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Trading Setup
            </Label>
            <Select
              value={trade.setupId}
              onValueChange={handleSetupChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a trading setup (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Setup</SelectItem>
                {setups.map(setup => (
                  <SelectItem key={setup.id} value={setup.id}>
                    <div className="flex items-center gap-2">
                      <span>{setup.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {setup.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSetup && (
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRuleChecklist(true)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Checklist
                </Button>
                <Badge variant="secondary">
                  Target R:R {selectedSetup.targetRiskReward}:1
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Market Type and Symbol Row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Market Type
            </label>
            <select
              value={trade.marketType}
              onChange={(e) => setTrade({ ...trade, marketType: e.target.value })}
              className="w-full p-2 border rounded bg-gray-50"
            >
              {Object.entries(MARKET_TYPES).map(([key, market]) => (
                <option key={key} value={key}>
                  {market.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input
              placeholder={trade.marketType === 'FOREX' ? 'EUR/USD' : 'Symbol'}
              value={trade.symbol}
              onChange={(e) => setTrade({ ...trade, symbol: e.target.value.toUpperCase() })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={trade.type}
              onChange={(e) => setTrade({ ...trade, type: e.target.value as 'BUY' | 'SELL' })}
              className="w-full p-2 border rounded"
            >
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </div>
        </div>

        {/* Market Conditions (New) */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm">Market Volatility</Label>
            <Select
              value={trade.marketConditions.volatility || ''}
              onValueChange={(value: any) => setTrade({
                ...trade,
                marketConditions: { ...trade.marketConditions, volatility: value }
              })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Market Trend</Label>
            <Select
              value={trade.marketConditions.trend || ''}
              onValueChange={(value: any) => setTrade({
                ...trade,
                marketConditions: { ...trade.marketConditions, trend: value }
              })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Strong Up">Strong Up</SelectItem>
                <SelectItem value="Up">Up</SelectItem>
                <SelectItem value="Sideways">Sideways</SelectItem>
                <SelectItem value="Down">Down</SelectItem>
                <SelectItem value="Strong Down">Strong Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Volume</Label>
            <Select
              value={trade.marketConditions.volume || ''}
              onValueChange={(value: any) => setTrade({
                ...trade,
                marketConditions: { ...trade.marketConditions, volume: value }
              })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rest of the existing form fields... */}
        {/* Entry Date/Time Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Date
            </label>
            <input
              type="date"
              value={trade.entryDate}
              onChange={(e) => setTrade({ ...trade, entryDate: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Time
            </label>
            <input
              type="time"
              value={trade.entryTime}
              onChange={(e) => setTrade({ ...trade, entryTime: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        {/* Exit Date/Time Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Date (Optional)
            </label>
            <input
              type="date"
              value={trade.exitDate}
              onChange={(e) => setTrade({ ...trade, exitDate: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Time (Optional)
            </label>
            <input
              type="time"
              value={trade.exitTime}
              onChange={(e) => setTrade({ ...trade, exitTime: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        {/* Price and Quantity Row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Price
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={trade.entry}
              onChange={(e) => setTrade({ ...trade, entry: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Price (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={trade.exit}
              onChange={(e) => setTrade({ ...trade, exit: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {trade.marketType === 'FOREX' ? 'Lots' : 
               trade.marketType === 'FUTURES' ? 'Contracts' :
               trade.marketType === 'OPTIONS' ? 'Contracts' :
               'Quantity'}
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0"
              value={trade.quantity}
              onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        {/* Confidence Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confidence Level
          </label>
          <select
            value={trade.confidence}
            onChange={(e) => setTrade({ ...trade, confidence: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="1">1 - Very Low</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Very High</option>
          </select>
        </div>

        {/* Setup Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Setup Tags (Optional)
          </label>
          <input
            placeholder="e.g., momentum, reversal, news-driven (comma separated)"
            value={trade.setupTags}
            onChange={(e) => setTrade({ ...trade, setupTags: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            placeholder="Trade notes, strategy, reason for entry/exit..."
            value={trade.notes}
            onChange={(e) => setTrade({ ...trade, notes: e.target.value })}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
        
        <Button type="submit" className="w-full">
          Add Trade
        </Button>
      </form>

      {/* Rule Checklist Modal */}
      <RuleChecklistModal />
    </>
  )
}