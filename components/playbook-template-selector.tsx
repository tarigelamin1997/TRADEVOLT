'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  BarChart3, 
  Clock,
  Copy,
  CheckCircle,
  Info,
  Target,
  Shield,
  DollarSign
} from 'lucide-react'
import { PLAYBOOK_TEMPLATES, PlaybookTemplate, applyTemplate } from '@/lib/playbook-templates'
import { quickToast } from '@/lib/toast-utils'
import { cn } from '@/lib/utils'

interface PlaybookTemplateSelectorProps {
  onSelectTemplate: (template: any) => void
}

export function PlaybookTemplateSelector({ onSelectTemplate }: PlaybookTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PlaybookTemplate | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  
  const categories = [
    { id: 'all', label: 'All Templates', icon: BarChart3 },
    { id: 'momentum', label: 'Momentum', icon: Zap },
    { id: 'reversal', label: 'Reversal', icon: RefreshCw },
    { id: 'breakout', label: 'Breakout', icon: TrendingUp },
    { id: 'scalping', label: 'Scalping', icon: Clock },
    { id: 'swing', label: 'Swing', icon: BarChart3 }
  ]
  
  const filteredTemplates = activeCategory === 'all' 
    ? PLAYBOOK_TEMPLATES 
    : PLAYBOOK_TEMPLATES.filter(t => t.category === activeCategory)
  
  const handleSelectTemplate = (template: PlaybookTemplate) => {
    setSelectedTemplate(template)
  }
  
  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      const templateData = applyTemplate(selectedTemplate)
      onSelectTemplate(templateData)
      quickToast.success(`Applied "${selectedTemplate.name}" template`)
      setIsOpen(false)
      setSelectedTemplate(null)
    }
  }
  
  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category)
    return cat ? <cat.icon className="h-3 w-3" /> : null
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Copy className="h-4 w-4" />
        Use Template
      </Button>

      {/* Template Selector Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Playbook Templates</DialogTitle>
            <DialogDescription>
              Start with a proven strategy template and customize it to your style
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-6 w-full">
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                  <cat.icon className="h-3 w-3 mr-1" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="flex-1 overflow-y-auto">
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTemplates.map(template => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedTemplate?.id === template.id && "ring-2 ring-blue-500"
                    )}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-start justify-between">
                        <span className="flex items-center gap-2">
                          <span className="text-2xl">{template.icon}</span>
                          {template.name}
                        </span>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Key Metrics */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryIcon(template.category)}
                          <span className="ml-1">{template.category}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {template.timeframe}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          {template.winRateTarget}% WR
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {template.riskReward} R:R
                        </Badge>
                      </div>

                      {/* Markets */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Markets:</span>
                        <div className="flex flex-wrap gap-1">
                          {template.markets.map(market => (
                            <Badge key={market} variant="secondary" className="text-xs">
                              {market}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Preview Rules */}
                      {selectedTemplate?.id === template.id && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div>
                            <p className="text-xs font-medium mb-1">Entry Rules:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {template.rules.entry.slice(0, 3).map((rule, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span className="line-clamp-1">{rule}</span>
                                </li>
                              ))}
                              {template.rules.entry.length > 3 && (
                                <li className="text-blue-500">
                                  +{template.rules.entry.length - 3} more...
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Select a template to preview, then apply to create your playbook
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate}
              >
                Apply Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}