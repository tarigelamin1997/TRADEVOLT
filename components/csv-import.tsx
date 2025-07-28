'use client'

import { useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { 
  detectMarketFromHeaders, 
  detectMarketFromData, 
  getMarketSpecificMappings,
  calculateMarketPnL,
  MARKET_TYPES
} from '@/lib/market-knowledge'

interface CSVImportProps {
  onImport: (trades: any[]) => void
  onClose: () => void
}

// Type mapping patterns
const TYPE_MAPPINGS: Record<string, 'BUY' | 'SELL'> = {
  // Buy variants
  'buy': 'BUY', 'long': 'BUY', 'b': 'BUY', '1': 'BUY', 'bought': 'BUY',
  'purchase': 'BUY', 'bid': 'BUY', 'call': 'BUY', 'bullish': 'BUY',
  
  // Sell variants
  'sell': 'SELL', 'short': 'SELL', 's': 'SELL', '-1': 'SELL', 'sold': 'SELL',
  'sale': 'SELL', 'ask': 'SELL', 'put': 'SELL', 'bearish': 'SELL', 'close': 'SELL'
}

export function CSVImport({ onImport, onClose }: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedColumns, setDetectedColumns] = useState<Record<string, string>>({})
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  const [detectedMarket, setDetectedMarket] = useState<string | null>(null)
  const [csvDebugInfo, setCsvDebugInfo] = useState<any>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    setError('')
    setMissingColumns([])
    setDetectedMarket(null)
    setCsvDebugInfo(null)
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setFile(file)
    parseCSV(file)
  }

  // Intelligent column detection
  const detectColumn = (headers: string[], patterns: string[]): string | null => {
    for (const header of headers) {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '')
      for (const pattern of patterns) {
        const normalizedPattern = pattern.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (normalized.includes(normalizedPattern) || normalizedPattern.includes(normalized)) {
          return header
        }
      }
    }
    return null
  }

  // Parse various date formats
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date()
    
    // Try multiple date formats
    const formats = [
      // ISO formats
      (d: string) => new Date(d),
      // US format MM/DD/YYYY
      (d: string) => {
        const parts = d.split('/')
        if (parts.length === 3) {
          return new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`)
        }
        return null
      },
      // EU format DD/MM/YYYY
      (d: string) => {
        const parts = d.split('/')
        if (parts.length === 3) {
          return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
        }
        return null
      },
      // Timestamp
      (d: string) => {
        const timestamp = parseInt(d)
        if (!isNaN(timestamp)) {
          return new Date(timestamp > 1e10 ? timestamp : timestamp * 1000)
        }
        return null
      }
    ]

    for (const format of formats) {
      try {
        const date = format(dateString)
        if (date && !isNaN(date.getTime())) {
          return date
        }
      } catch (e) {
        continue
      }
    }

    return new Date()
  }

  // Normalize trade type
  const normalizeType = (type: string): 'BUY' | 'SELL' => {
    if (!type) return 'BUY'
    const normalized = type.toLowerCase().trim()
    return TYPE_MAPPINGS[normalized] || 'BUY'
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          setError('CSV file is empty or invalid')
          return
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim())
        
        // Step 1: Detect market type from headers
        let marketType = detectMarketFromHeaders(headers)
        
        // Step 2: Parse initial data for better market detection
        const sampleData = []
        for (let i = 1; i < Math.min(lines.length, 11); i++) {
          const values = lines[i].split(',').map(v => v.trim())
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index]
          })
          sampleData.push(row)
        }
        
        // Step 3: If market not detected from headers, try from data
        if (!marketType) {
          marketType = detectMarketFromData(sampleData)
        }
        
        setDetectedMarket(marketType)
        
        // Step 4: Get market-specific column patterns
        const COLUMN_PATTERNS = getMarketSpecificMappings(marketType)
        
        // Debug info
        setCsvDebugInfo({
          headers: headers,
          detectedMarket: marketType,
          marketInfo: marketType ? MARKET_TYPES[marketType] : null,
          sampleData: sampleData.slice(0, 3)
        })
        
        // Step 5: Intelligent column detection with market context
        const columnMap: Record<string, string> = {}
        const detected: Record<string, string> = {}
        const missing: string[] = []

        // Detect symbol column
        const symbolCol = detectColumn(headers, COLUMN_PATTERNS.symbol)
        if (symbolCol) {
          columnMap.symbol = symbolCol
          detected.symbol = symbolCol
        } else {
          missing.push('Symbol/Ticker')
        }

        // Detect type/direction column
        const typeCol = detectColumn(headers, COLUMN_PATTERNS.type)
        if (typeCol) {
          columnMap.type = typeCol
          detected.type = typeCol
        } else {
          // For some markets, type might be optional (always long)
          if (marketType !== 'FOREX' && marketType !== 'CRYPTO') {
            missing.push('Type/Direction')
          }
        }

        // Detect entry price column
        const entryCol = detectColumn(headers, COLUMN_PATTERNS.entry)
        if (entryCol) {
          columnMap.entry = entryCol
          detected.entry = entryCol
        } else {
          missing.push('Entry Price')
        }

        // Detect quantity column
        const qtyCol = detectColumn(headers, COLUMN_PATTERNS.quantity)
        if (qtyCol) {
          columnMap.quantity = qtyCol
          detected.quantity = qtyCol
        } else {
          missing.push('Quantity/Size')
        }

        // Optional columns
        const exitCol = detectColumn(headers, COLUMN_PATTERNS.exit)
        if (exitCol) {
          columnMap.exit = exitCol
          detected.exit = exitCol
        }

        const dateCol = detectColumn(headers, COLUMN_PATTERNS.date)
        if (dateCol) {
          columnMap.date = dateCol
          detected.date = dateCol
        }

        const exitDateCol = detectColumn(headers, ['exit_date', 'exit_time', 'exittime', 'close_date', 'close_time', 'closetime', 'closed_at', 'closing_time'])
        if (exitDateCol) {
          columnMap.exitDate = exitDateCol
          detected.exitDate = exitDateCol
        }

        const pnlCol = detectColumn(headers, COLUMN_PATTERNS.pnl)
        if (pnlCol) {
          columnMap.pnl = pnlCol
          detected.pnl = pnlCol
        }

        const notesCol = detectColumn(headers, ['notes', 'comment', 'comments', 'description', 'note', 'memo', 'remarks', 'trade_type', 'strategy', 'reason'])
        if (notesCol) {
          columnMap.notes = notesCol
          detected.notes = notesCol
        }

        setDetectedColumns(detected)
        setMissingColumns(missing)

        // Step 6: More flexible validation based on market type
        const hasMinimumData = columnMap.symbol && columnMap.entry && columnMap.quantity
        const canInferMissingData = columnMap.symbol && (columnMap.entry || columnMap.pnl)
        
        if (!hasMinimumData && !canInferMissingData) {
          setError(`Missing required columns: ${missing.join(', ')}. Detected market: ${marketType || 'Unknown'}. Please ensure your CSV contains these fields.`)
          
          // Provide helpful suggestions based on detected market
          if (marketType) {
            const marketInfo = MARKET_TYPES[marketType]
            setError(error => error + `\n\nFor ${marketInfo.name} trading, typical columns include: ${marketInfo.typicalColumns.join(', ')}`)
          }
          return
        }

        // Step 7: Parse data with market context
        const trades = []
        for (let i = 1; i < Math.min(lines.length, 1000); i++) { // Limit to 1000 trades
          const values = lines[i].split(',').map(v => v.trim())
          if (values.length < 2) continue // Skip empty lines
          
          const trade: any = {
            marketType: marketType || 'UNKNOWN'
          }
          
          // Extract symbol
          if (columnMap.symbol) {
            const symbolIndex = headers.indexOf(columnMap.symbol)
            trade.symbol = values[symbolIndex]?.toUpperCase() || ''
          }

          // Extract type - with better defaults based on market
          if (columnMap.type) {
            const typeIndex = headers.indexOf(columnMap.type)
            trade.type = normalizeType(values[typeIndex] || 'BUY')
          } else {
            // Default based on market type
            trade.type = 'BUY'
          }

          // Extract entry price
          if (columnMap.entry) {
            const entryIndex = headers.indexOf(columnMap.entry)
            trade.entry = parseFloat(values[entryIndex]) || 0
          }

          // Extract exit price
          if (columnMap.exit) {
            const exitIndex = headers.indexOf(columnMap.exit)
            const exitValue = parseFloat(values[exitIndex])
            trade.exit = exitValue && !isNaN(exitValue) ? exitValue : null
          }

          // Extract quantity - handle different formats
          if (columnMap.quantity) {
            const qtyIndex = headers.indexOf(columnMap.quantity)
            const qtyValue = values[qtyIndex]
            // Handle negative quantities (short positions)
            trade.quantity = Math.abs(parseFloat(qtyValue) || 0)
            
            // If quantity is negative and no type column, infer type
            if (!columnMap.type && parseFloat(qtyValue) < 0) {
              trade.type = 'SELL'
            }
          }

          // Extract date
          if (columnMap.date) {
            const dateIndex = headers.indexOf(columnMap.date)
            trade.date = parseDate(values[dateIndex])
          } else if (columnMap.exitDate) {
            // Use exit date if no entry date
            const exitDateIndex = headers.indexOf(columnMap.exitDate)
            trade.date = parseDate(values[exitDateIndex])
          } else {
            trade.date = new Date()
          }

          // Build comprehensive notes including all extra data
          const notesParts: string[] = []
          
          // Add market type to notes
          if (marketType) {
            notesParts.push(`Market: ${MARKET_TYPES[marketType].name}`)
          }
          
          // Add existing notes
          if (columnMap.notes) {
            const notesIndex = headers.indexOf(columnMap.notes)
            if (values[notesIndex]) {
              notesParts.push(values[notesIndex])
            }
          }
          
          // Add PnL if available
          if (columnMap.pnl) {
            const pnlIndex = headers.indexOf(columnMap.pnl)
            const pnlValue = parseFloat(values[pnlIndex])
            if (!isNaN(pnlValue)) {
              notesParts.push(`Reported P&L: $${pnlValue.toFixed(2)}`)
            }
          }

          // Add all other columns as extra info
          headers.forEach((header, index) => {
            // Skip already processed columns
            if (!Object.values(columnMap).includes(header) && values[index]?.trim()) {
              const value = values[index].trim()
              // Skip empty or zero values
              if (value && !['', '0', '0.0', '0.00', 'null', 'undefined'].includes(value.toLowerCase())) {
                notesParts.push(`${header}: ${value}`)
              }
            }
          })

          trade.notes = notesParts.join(' | ') || null

          // Validate trade - be more flexible
          const isValid = trade.symbol && (
            (trade.entry > 0 && trade.quantity > 0) || 
            (columnMap.pnl && trade.quantity > 0) // Allow trades with just P&L
          )
          
          if (isValid) {
            trades.push(trade)
          }
        }

        if (trades.length === 0) {
          setError('No valid trades found in CSV. Please check your data format and ensure it contains symbol, price, and quantity information.')
          return
        }

        setPreview(trades.slice(0, 5)) // Show first 5 trades as preview
      } catch (err) {
        setError('Failed to parse CSV file. Please check the file format.')
        console.error(err)
      }
    }

    reader.readAsText(file)
  }

  const handleImport = async () => {
    console.log('handleImport called', { file, previewLength: preview.length })
    if (!file || preview.length === 0) return

    setIsProcessing(true)
    setError('')

    try {
      // Re-parse the entire file for import
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim())
        
        // Use the same column mapping
        const trades = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          if (values.length < 3) continue // Skip empty lines
          
          const trade: any = {
            marketType: detectedMarket || 'UNKNOWN'
          }
          
          // Use detected columns to extract data
          Object.entries(detectedColumns).forEach(([field, column]) => {
            const index = headers.indexOf(column)
            if (index >= 0) {
              const value = values[index]
              
              switch (field) {
                case 'symbol':
                  trade.symbol = value?.toUpperCase() || ''
                  break
                case 'type':
                  trade.type = normalizeType(value || 'BUY')
                  break
                case 'entry':
                  trade.entry = parseFloat(value) || 0
                  break
                case 'exit':
                  const exitValue = parseFloat(value)
                  trade.exit = exitValue && !isNaN(exitValue) ? exitValue : null
                  break
                case 'quantity':
                  trade.quantity = Math.abs(parseFloat(value) || 0)
                  break
                case 'date':
                case 'exitDate':
                  trade.createdAt = parseDate(value).toISOString()
                  break
              }
            }
          })

          // Set defaults
          if (!trade.type) trade.type = 'BUY'
          if (!trade.createdAt) trade.createdAt = new Date().toISOString()

          // Build notes from all extra data
          const notesParts: string[] = []
          headers.forEach((header, index) => {
            if (!Object.values(detectedColumns).includes(header) && values[index]?.trim()) {
              const value = values[index].trim()
              if (value && !['', '0', '0.0', '0.00'].includes(value)) {
                notesParts.push(`${header}: ${value}`)
              }
            }
          })
          trade.notes = notesParts.join(' | ') || null

          if (trade.symbol && trade.entry > 0 && trade.quantity > 0) {
            trades.push(trade)
          }
        }

        console.log('Importing trades:', trades.length, 'trades')
        console.log('Sample trade:', trades[0])
        
        // Import trades via API
        const response = await fetch('/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'importTrades',
            trades: trades
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Import failed:', response.status, errorText)
          throw new Error(`Failed to import trades: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        console.log('Import result:', result)
        
        // Call parent callback with imported trades
        onImport(result.trades || [])
        onClose()
      }

      reader.readAsText(file)
    } catch (err) {
      setError('Failed to import trades. Please try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto bg-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Import Trades from CSV</h2>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <p className="text-lg mb-2">
            Drag and drop your CSV file here
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Supports exports from any broker (TD Ameritrade, Interactive Brokers, etc.)
          </p>
          
          <label className="inline-block">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <Button variant="outline" asChild>
              <span>Browse Files</span>
            </Button>
          </label>
        </div>

        {/* File info */}
        {file && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm">
              <span className="font-medium">Selected file:</span> {file.name}
            </p>
          </div>
        )}

        {/* Market Detection Info */}
        {detectedMarket && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h4 className="font-medium text-blue-800 mb-2">🎯 Detected Market Type</h4>
            <div className="text-sm">
              <p className="font-medium text-blue-900">{MARKET_TYPES[detectedMarket].name}</p>
              <p className="text-blue-700 mt-1">{MARKET_TYPES[detectedMarket].notes}</p>
            </div>
          </div>
        )}

        {/* Detected columns */}
        {Object.keys(detectedColumns).length > 0 && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <h4 className="font-medium text-green-800 mb-2">✓ Detected Columns</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(detectedColumns).map(([field, column]) => (
                <div key={field}>
                  <span className="text-gray-600">{field}:</span>{' '}
                  <span className="font-medium">{column}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Information */}
        {csvDebugInfo && error && (
          <details className="mt-4 p-4 bg-gray-50 rounded">
            <summary className="cursor-pointer font-medium text-gray-700">Debug Information</summary>
            <div className="mt-2 text-xs font-mono">
              <p>Headers found: {csvDebugInfo.headers.join(', ')}</p>
              <p>Market detected: {csvDebugInfo.detectedMarket || 'None'}</p>
              {csvDebugInfo.sampleData[0] && (
                <div className="mt-2">
                  <p>Sample row:</p>
                  <pre className="overflow-x-auto">
                    {JSON.stringify(csvDebugInfo.sampleData[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Missing columns warning */}
        {missingColumns.length > 0 && missingColumns.length < 3 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Optional Columns Not Found</h4>
            <p className="text-sm text-yellow-700">
              {missingColumns.join(', ')} - These will use default values
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Preview (first 5 trades)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Symbol</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Entry</th>
                    <th className="px-3 py-2 text-left">Exit</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Market</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((trade, i) => {
                    const calculatedPnL = calculateMarketPnL(trade, trade.marketType)
                    return (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{trade.symbol}</td>
                        <td className="px-3 py-2">
                          <span className={trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-3 py-2">${trade.entry}</td>
                        <td className="px-3 py-2">{trade.exit ? `$${trade.exit}` : '-'}</td>
                        <td className="px-3 py-2">{trade.quantity}</td>
                        <td className="px-3 py-2">
                          {new Date(trade.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {trade.marketType && MARKET_TYPES[trade.marketType] 
                            ? MARKET_TYPES[trade.marketType].name 
                            : 'Unknown'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {preview.length === 5 && (
                <p className="text-sm text-gray-600 mt-2">
                  ... and more trades in the file
                </p>
              )}
            </div>
          </div>
        )}

        {/* Supported Formats */}
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">🎯 Smart Import Features</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Automatically detects market type (Futures, Options, Forex, Crypto, Stocks)</li>
            <li>✓ Market-specific column recognition and P&L calculations</li>
            <li>✓ Intelligently maps columns from any broker format</li>
            <li>✓ Handles various date formats (MM/DD/YYYY, DD/MM/YYYY, ISO, timestamps)</li>
            <li>✓ Recognizes buy/sell variations (long/short, bid/ask, etc.)</li>
            <li>✓ Preserves all extra data (broker, strategy, custom fields) in notes</li>
            <li>✓ Validates and cleans data automatically</li>
          </ul>
          
          <div className="mt-3 pt-3 border-t">
            <h5 className="font-medium text-sm mb-2">Supported Markets:</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(MARKET_TYPES).map(([key, market]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-green-600">✓</span>
                  <span>{market.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || preview.length === 0 || isProcessing}
          >
            {isProcessing ? 'Importing...' : `Import ${preview.length} Trades`}
          </Button>
        </div>
      </Card>
    </div>
  )
}