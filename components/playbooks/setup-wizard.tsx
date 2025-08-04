'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TradingSetup, SetupRule } from '@/lib/db-memory'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  GripVertical,
  BookOpen,
  Target,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SetupWizardProps {
  setup?: TradingSetup | null
  onSave: (setup: Omit<TradingSetup, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

type WizardStep = 'basic' | 'entry' | 'exit' | 'risk' | 'conditions' | 'review'

const WIZARD_STEPS: { id: WizardStep; label: string; icon: any }[] = [
  { id: 'basic', label: 'Basic Info', icon: BookOpen },
  { id: 'entry', label: 'Entry Rules', icon: Target },
  { id: 'exit', label: 'Exit Rules', icon: Target },
  { id: 'risk', label: 'Risk Rules', icon: Shield },
  { id: 'conditions', label: 'Market Conditions', icon: TrendingUp },
  { id: 'review', label: 'Review', icon: CheckCircle }
]

export function SetupWizard({ setup, onSave, onClose }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [formData, setFormData] = useState<Partial<TradingSetup>>({
    name: setup?.name || '',
    description: setup?.description || '',
    category: setup?.category || 'Trend',
    isActive: setup?.isActive ?? true,
    entryRules: setup?.entryRules || [],
    exitRules: setup?.exitRules || [],
    riskRules: setup?.riskRules || [],
    idealConditions: setup?.idealConditions || {},
    targetRiskReward: setup?.targetRiskReward || 2,
    maxLossPerTrade: setup?.maxLossPerTrade || 1
  })

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep)

  const handleNext = () => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id)
    }
  }

  const handleSave = () => {
    onSave(formData as Omit<TradingSetup, 'id' | 'createdAt' | 'updatedAt'>)
  }

  const addRule = (category: 'entryRules' | 'exitRules' | 'riskRules') => {
    const newRule: SetupRule = {
      id: Date.now().toString(),
      text: '',
      category: category === 'entryRules' ? 'Entry' : category === 'exitRules' ? 'Exit' : 'Risk',
      importance: 'Important',
      order: (formData[category]?.length || 0) + 1
    }
    
    setFormData({
      ...formData,
      [category]: [...(formData[category] || []), newRule]
    })
  }

  const updateRule = (category: 'entryRules' | 'exitRules' | 'riskRules', ruleId: string, updates: Partial<SetupRule>) => {
    setFormData({
      ...formData,
      [category]: formData[category]?.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    })
  }

  const removeRule = (category: 'entryRules' | 'exitRules' | 'riskRules', ruleId: string) => {
    setFormData({
      ...formData,
      [category]: formData[category]?.filter(rule => rule.id !== ruleId)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <Card className="border-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {setup ? 'Edit Trading Setup' : 'Create Trading Setup'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6">
              {WIZARD_STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = index < currentStepIndex
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg transition-colors",
                        isActive && "bg-primary/10",
                        isCompleted && "cursor-pointer hover:bg-muted"
                      )}
                      disabled={!isCompleted && !isActive}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                        isActive && "bg-primary text-primary-foreground",
                        isCompleted && "bg-green-600 text-white",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "text-sm font-medium hidden sm:block",
                        isActive && "text-primary",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </button>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 mx-2",
                        isCompleted ? "bg-green-600" : "bg-muted"
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardHeader>
          
          <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {currentStep === 'basic' && (
                <motion.div
                  key="basic"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Setup Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Momentum Breakout"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your trading strategy..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Trend">Trend Following</SelectItem>
                        <SelectItem value="Reversal">Reversal</SelectItem>
                        <SelectItem value="Breakout">Breakout</SelectItem>
                        <SelectItem value="Range">Range Trading</SelectItem>
                        <SelectItem value="News">News Based</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rr">Target Risk/Reward</Label>
                      <Input
                        id="rr"
                        type="number"
                        step="0.1"
                        value={formData.targetRiskReward}
                        onChange={(e) => setFormData({ ...formData, targetRiskReward: parseFloat(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="risk">Max Risk per Trade (%)</Label>
                      <Input
                        id="risk"
                        type="number"
                        step="0.1"
                        value={formData.maxLossPerTrade}
                        onChange={(e) => setFormData({ ...formData, maxLossPerTrade: parseFloat(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              {(currentStep === 'entry' || currentStep === 'exit' || currentStep === 'risk') && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {currentStep === 'entry' && 'Entry Rules'}
                      {currentStep === 'exit' && 'Exit Rules'}
                      {currentStep === 'risk' && 'Risk Management Rules'}
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => addRule(`${currentStep}Rules` as any)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData[`${currentStep}Rules` as keyof typeof formData]?.map((rule: any, index: number) => (
                      <div key={rule.id} className="flex gap-2 items-start">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={rule.text}
                            onChange={(e) => updateRule(`${currentStep}Rules` as any, rule.id, { text: e.target.value })}
                            placeholder="Enter rule description..."
                          />
                          <Select
                            value={rule.importance}
                            onValueChange={(value) => updateRule(`${currentStep}Rules` as any, rule.id, { importance: value as any })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Critical">Critical</SelectItem>
                              <SelectItem value="Important">Important</SelectItem>
                              <SelectItem value="Optional">Optional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRule(`${currentStep}Rules` as any, rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {(!formData[`${currentStep}Rules` as keyof typeof formData] || 
                    formData[`${currentStep}Rules` as keyof typeof formData]?.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No rules added yet. Click &quot;Add Rule&quot; to get started.</p>
                    </div>
                  )}
                </motion.div>
              )}
              
              {currentStep === 'conditions' && (
                <motion.div
                  key="conditions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold mb-4">Ideal Market Conditions</h3>
                  
                  <div>
                    <Label>Best Times to Trade</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {['London Open', 'NY Open', 'London Close', 'NY Close', 'Asian Session', 'Pre-Market', 'Power Hour', 'Any Time'].map(time => (
                        <Button
                          key={time}
                          variant={formData.idealConditions?.timeOfDay?.includes(time) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const times = formData.idealConditions?.timeOfDay || []
                            setFormData({
                              ...formData,
                              idealConditions: {
                                ...formData.idealConditions,
                                timeOfDay: times.includes(time) 
                                  ? times.filter(t => t !== time)
                                  : [...times, time]
                              }
                            })
                          }}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Market Volatility</Label>
                    <Select
                      value={formData.idealConditions?.volatility || ''}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        idealConditions: { ...formData.idealConditions, volatility: value }
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select volatility level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low Volatility</SelectItem>
                        <SelectItem value="Medium">Medium Volatility</SelectItem>
                        <SelectItem value="High">High Volatility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Market Trend</Label>
                    <Select
                      value={formData.idealConditions?.trend || ''}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        idealConditions: { ...formData.idealConditions, trend: value }
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select trend condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Strong Up">Strong Uptrend</SelectItem>
                        <SelectItem value="Up">Uptrend</SelectItem>
                        <SelectItem value="Sideways">Sideways/Range</SelectItem>
                        <SelectItem value="Down">Downtrend</SelectItem>
                        <SelectItem value="Strong Down">Strong Downtrend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
              
              {currentStep === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold mb-4">Review Your Setup</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{formData.name}</h4>
                      <p className="text-sm text-muted-foreground">{formData.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{formData.category}</Badge>
                        <Badge variant="outline">R:R {formData.targetRiskReward}:1</Badge>
                        <Badge variant="outline">Max Risk {formData.maxLossPerTrade}%</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Entry Rules ({formData.entryRules?.length || 0})</h5>
                        <ul className="space-y-1">
                          {formData.entryRules?.map(rule => (
                            <li key={rule.id} className="text-sm flex items-start gap-2">
                              <div className={cn(
                                "h-1.5 w-1.5 rounded-full mt-1.5",
                                rule.importance === 'Critical' ? "bg-red-600" :
                                rule.importance === 'Important' ? "bg-amber-600" :
                                "bg-gray-400"
                              )} />
                              <span>{rule.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">Exit Rules ({formData.exitRules?.length || 0})</h5>
                        <ul className="space-y-1">
                          {formData.exitRules?.map(rule => (
                            <li key={rule.id} className="text-sm flex items-start gap-2">
                              <div className={cn(
                                "h-1.5 w-1.5 rounded-full mt-1.5",
                                rule.importance === 'Critical' ? "bg-red-600" :
                                rule.importance === 'Important' ? "bg-amber-600" :
                                "bg-gray-400"
                              )} />
                              <span>{rule.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">Risk Rules ({formData.riskRules?.length || 0})</h5>
                        <ul className="space-y-1">
                          {formData.riskRules?.map(rule => (
                            <li key={rule.id} className="text-sm flex items-start gap-2">
                              <div className={cn(
                                "h-1.5 w-1.5 rounded-full mt-1.5",
                                rule.importance === 'Critical' ? "bg-red-600" :
                                rule.importance === 'Important' ? "bg-amber-600" :
                                "bg-gray-400"
                              )} />
                              <span>{rule.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {formData.idealConditions && Object.keys(formData.idealConditions).length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Ideal Conditions</h5>
                        <div className="flex flex-wrap gap-2">
                          {formData.idealConditions.timeOfDay?.map(time => (
                            <Badge key={time} variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                            </Badge>
                          ))}
                          {formData.idealConditions.volatility && (
                            <Badge variant="secondary">
                              {formData.idealConditions.volatility} Volatility
                            </Badge>
                          )}
                          {formData.idealConditions.trend && (
                            <Badge variant="secondary">
                              {formData.idealConditions.trend}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          
          <div className="border-t p-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {currentStep === 'review' ? (
                <Button onClick={handleSave}>
                  {setup ? 'Update Setup' : 'Create Setup'}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}