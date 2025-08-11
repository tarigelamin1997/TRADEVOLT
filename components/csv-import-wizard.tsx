'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { quickToast } from '@/lib/toast-utils'

interface CSVImportWizardProps {
  isOpen: boolean
  onClose: () => void
  onImport: (trades: any[]) => void
}

interface ColumnMapping {
  csvColumn: string
  systemField: string
  preview: string
}

// Required fields for trade import
const REQUIRED_FIELDS = [
  { field: 'symbol', label: 'Symbol/Ticker', patterns: ['symbol', 'ticker', 'stock', 'asset'] },
  { field: 'type', label: 'Buy/Sell', patterns: ['type', 'side', 'action', 'buysell', 'direction'] },
  { field: 'quantity', label: 'Quantity', patterns: ['quantity', 'qty', 'shares', 'size', 'amount', 'units'] },
  { field: 'entryPrice', label: 'Entry Price', patterns: ['price', 'entry', 'entryprice', 'cost', 'fillprice'] },
  { field: 'entryDate', label: 'Entry Date', patterns: ['date', 'time', 'entrydate', 'tradedate', 'executed'] }
]

// Optional fields
const OPTIONAL_FIELDS = [
  { field: 'exitPrice', label: 'Exit Price', patterns: ['exit', 'exitprice', 'close', 'closeprice'] },
  { field: 'exitDate', label: 'Exit Date', patterns: ['exitdate', 'closedate', 'exittime'] },
  { field: 'commission', label: 'Commission', patterns: ['commission', 'fee', 'cost', 'charges'] },
  { field: 'notes', label: 'Notes', patterns: ['notes', 'comment', 'description', 'remarks'] },
  { field: 'setup', label: 'Setup/Strategy', patterns: ['setup', 'strategy', 'playbook', 'system'] }
]

export function CSVImportWizard({ isOpen, onClose, onImport }: CSVImportWizardProps) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [skipBadRows, setSkipBadRows] = useState(true)
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, skipped: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Auto-detect column mappings
  const autoDetectMappings = useCallback((headers: string[]) => {
    const mappings: Record<string, string> = {}
    
    [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach(({ field, patterns }) => {
      for (const header of headers) {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '')
        for (const pattern of patterns) {
          if (normalizedHeader.includes(pattern) || pattern.includes(normalizedHeader)) {
            mappings[field] = header
            break
          }
        }
        if (mappings[field]) break
      }
    })
    
    setColumnMappings(mappings)
  }, [])

  // Parse CSV file
  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        quickToast.error('CSV file is empty or invalid')
        return
      }
      
      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      setHeaders(headers)
      
      // Parse data rows
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      }).filter(row => Object.values(row).some(v => v)) // Filter empty rows
      
      setCsvData(data)
      autoDetectMappings(headers)
      setStep(2)
    }
    
    reader.readAsText(file)
  }

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].name.endsWith('.csv')) {
      setFile(files[0])
      parseCSV(files[0])
    }
  }, [])

  // Process and import trades
  const processImport = async () => {
    setStep(3)
    setImportProgress(0)
    const stats = { success: 0, failed: 0, skipped: 0 }
    const trades: any[] = []
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      setImportProgress(((i + 1) / csvData.length) * 100)
      
      try {
        // Map CSV columns to trade fields
        const trade: any = {}
        let hasRequiredFields = true
        
        // Check required fields
        for (const { field } of REQUIRED_FIELDS) {
          const csvColumn = columnMappings[field]
          if (!csvColumn || !row[csvColumn]) {
            hasRequiredFields = false
            break
          }
          trade[field] = row[csvColumn]
        }
        
        if (!hasRequiredFields) {
          if (skipBadRows) {
            stats.skipped++
            continue
          } else {
            stats.failed++
            continue
          }
        }
        
        // Add optional fields
        for (const { field } of OPTIONAL_FIELDS) {
          const csvColumn = columnMappings[field]
          if (csvColumn && row[csvColumn]) {
            trade[field] = row[csvColumn]
          }
        }
        
        // Process trade type
        trade.type = trade.type.toUpperCase() === 'BUY' || 
                     trade.type.toUpperCase() === 'LONG' ? 'BUY' : 'SELL'
        
        // Process dates
        trade.entryDate = new Date(trade.entryDate)
        if (trade.exitDate) {
          trade.exitDate = new Date(trade.exitDate)
        }
        
        // Process numbers
        trade.quantity = parseFloat(trade.quantity)
        trade.entryPrice = parseFloat(trade.entryPrice)
        if (trade.exitPrice) {
          trade.exitPrice = parseFloat(trade.exitPrice)
        }
        if (trade.commission) {
          trade.commission = parseFloat(trade.commission)
        }
        
        trades.push(trade)
        stats.success++
      } catch (error) {
        stats.failed++
      }
    }
    
    setImportStats(stats)
    
    // Wait a bit to show completion
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (trades.length > 0) {
      onImport(trades)
      quickToast.importSuccess(trades.length)
      onClose()
    } else {
      quickToast.error('No valid trades found in CSV')
    }
  }

  // Download template
  const downloadTemplate = (broker: string) => {
    const templates: Record<string, string> = {
      generic: 'Symbol,Type,Quantity,Entry Price,Entry Date,Exit Price,Exit Date,Commission,Notes\nAAPL,BUY,100,150.50,2024-01-15,155.25,2024-01-20,1.00,Breakout trade\nMSFT,SELL,50,380.00,2024-01-16,375.50,2024-01-18,1.00,Short on resistance',
      td_ameritrade: 'Symbol,Side,Qty,Price,Time,Commission\nAAPL,BOT,100,150.50,01/15/2024 09:30:00,0.65\nAAPL,SOLD,100,155.25,01/20/2024 14:30:00,0.65',
      interactive_brokers: 'Symbol,Action,Quantity,T. Price,Date/Time,Comm/Fee\nAAPL,BUY,100,150.50,2024-01-15 09:30:00,1.00\nAAPL,SELL,100,155.25,2024-01-20 14:30:00,1.00',
      etrade: 'Symbol,Transaction Type,Quantity,Price,Trade Date\nAAPL,Bought,100,150.50,01/15/2024\nAAPL,Sold,100,155.25,01/20/2024'
    }
    
    const content = templates[broker] || templates.generic
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tradevolt_template_${broker}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    quickToast.success('Template downloaded')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Trades from CSV</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className={cn("h-2 w-2 rounded-full", step >= 1 ? "bg-blue-600" : "bg-gray-300")} />
            <div className={cn("h-0.5 flex-1", step >= 2 ? "bg-blue-600" : "bg-gray-300")} />
            <div className={cn("h-2 w-2 rounded-full", step >= 2 ? "bg-blue-600" : "bg-gray-300")} />
            <div className={cn("h-0.5 flex-1", step >= 3 ? "bg-blue-600" : "bg-gray-300")} />
            <div className={cn("h-2 w-2 rounded-full", step >= 3 ? "bg-blue-600" : "bg-gray-300")} />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4 p-1">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="templates">Download Templates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-300",
                      "cursor-pointer hover:border-blue-400"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('csv-file-input')?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">
                      Drop your CSV file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports files from all major brokers
                    </p>
                    <input
                      id="csv-file-input"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFile(file)
                          parseCSV(file)
                        }
                      }}
                    />
                  </div>
                  
                  {file && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                
                <TabsContent value="templates" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Download a template CSV file for your broker or use our generic format
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => downloadTemplate('generic')}
                      className="justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generic Template
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadTemplate('td_ameritrade')}
                      className="justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      TD Ameritrade
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadTemplate('interactive_brokers')}
                      className="justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Interactive Brokers
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadTemplate('etrade')}
                      className="justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      E*TRADE
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 2: Map Columns */}
          {step === 2 && (
            <div className="space-y-4 p-1">
              <Card>
                <CardHeader>
                  <CardTitle>Column Mapping</CardTitle>
                  <CardDescription>
                    Map your CSV columns to TradeVolt fields. We've auto-detected some mappings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Required Fields */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Required Fields</Label>
                    <div className="space-y-2">
                      {REQUIRED_FIELDS.map(({ field, label }) => (
                        <div key={field} className="flex items-center gap-2">
                          <Label className="w-32 text-sm">{label}:</Label>
                          <Select
                            value={columnMappings[field] || ''}
                            onValueChange={(value) => setColumnMappings({ ...columnMappings, [field]: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {headers.map(header => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {columnMappings[field] && (
                            <Badge variant="outline" className="min-w-[100px]">
                              {csvData[0]?.[columnMappings[field]] || 'Empty'}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Optional Fields</Label>
                    <div className="space-y-2">
                      {OPTIONAL_FIELDS.map(({ field, label }) => (
                        <div key={field} className="flex items-center gap-2">
                          <Label className="w-32 text-sm">{label}:</Label>
                          <Select
                            value={columnMappings[field] || ''}
                            onValueChange={(value) => setColumnMappings({ ...columnMappings, [field]: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {headers.map(header => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {columnMappings[field] && (
                            <Badge variant="outline" className="min-w-[100px]">
                              {csvData[0]?.[columnMappings[field]] || 'Empty'}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Preview ({csvData.length} rows)
                    </Label>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {headers.slice(0, 5).map(header => (
                              <TableHead key={header} className="text-xs">
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvData.slice(0, 3).map((row, i) => (
                            <TableRow key={i}>
                              {headers.slice(0, 5).map(header => (
                                <TableCell key={header} className="text-xs">
                                  {row[header]}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="skip-bad-rows"
                      checked={skipBadRows}
                      onChange={(e) => setSkipBadRows(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="skip-bad-rows" className="text-sm">
                      Skip rows with missing required fields
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Import Progress */}
          {step === 3 && (
            <div className="space-y-4 p-1">
              <Card>
                <CardHeader>
                  <CardTitle>Importing Trades</CardTitle>
                  <CardDescription>
                    Processing your CSV file...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    {Math.round(importProgress)}% Complete
                  </p>
                  
                  {importProgress === 100 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Successful
                        </span>
                        <Badge variant="outline">{importStats.success}</Badge>
                      </div>
                      
                      {importStats.failed > 0 && (
                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <span className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Failed
                          </span>
                          <Badge variant="outline">{importStats.failed}</Badge>
                        </div>
                      )}
                      
                      {importStats.skipped > 0 && (
                        <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            Skipped
                          </span>
                          <Badge variant="outline">{importStats.skipped}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 3 && importProgress > 0 && importProgress < 100}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {step === 2 && (
              <Button 
                onClick={processImport}
                disabled={!Object.keys(columnMappings).some(k => REQUIRED_FIELDS.some(f => f.field === k))}
              >
                Import Trades
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}