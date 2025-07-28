'use client'

import { useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface CSVImportProps {
  onImport: (trades: any[]) => void
  onClose: () => void
}

export function CSVImport({ onImport, onClose }: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

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
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    setError('')
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setFile(file)
    parseCSV(file)
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
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        // Required fields
        const requiredFields = ['symbol', 'type', 'entry', 'quantity']
        const hasRequired = requiredFields.every(field => 
          headers.some(h => h.includes(field))
        )
        
        if (!hasRequired) {
          setError('CSV must include: Symbol, Type, Entry, Quantity columns')
          return
        }

        // Parse data
        const trades = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          if (values.length !== headers.length) continue

          const trade: any = {}
          headers.forEach((header, index) => {
            const value = values[index]
            
            if (header.includes('symbol')) trade.symbol = value.toUpperCase()
            else if (header.includes('type')) trade.type = value.toUpperCase()
            else if (header.includes('entry')) trade.entry = parseFloat(value) || 0
            else if (header.includes('exit')) trade.exit = parseFloat(value) || null
            else if (header.includes('quantity')) trade.quantity = parseFloat(value) || 0
            else if (header.includes('date')) trade.date = value
            else if (header.includes('notes')) trade.notes = value
          })

          // Validate trade
          if (trade.symbol && trade.type && trade.entry > 0 && trade.quantity > 0) {
            // Ensure type is BUY or SELL
            if (!['BUY', 'SELL'].includes(trade.type)) {
              trade.type = 'BUY' // Default to BUY if invalid
            }
            
            // Set date if not provided
            if (!trade.date) {
              trade.date = new Date().toISOString()
            } else {
              // Try to parse the date
              const parsedDate = new Date(trade.date)
              if (!isNaN(parsedDate.getTime())) {
                trade.date = parsedDate.toISOString()
              } else {
                trade.date = new Date().toISOString()
              }
            }
            
            trades.push(trade)
          }
        }

        if (trades.length === 0) {
          setError('No valid trades found in CSV')
          return
        }

        setPreview(trades.slice(0, 5)) // Show first 5 trades as preview
      } catch (err) {
        setError('Failed to parse CSV file')
        console.error(err)
      }
    }

    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!file || preview.length === 0) return

    setIsProcessing(true)
    setError('')

    try {
      // Parse full file again for import
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        const trades = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          if (values.length !== headers.length) continue

          const trade: any = {}
          headers.forEach((header, index) => {
            const value = values[index]
            
            if (header.includes('symbol')) trade.symbol = value.toUpperCase()
            else if (header.includes('type')) trade.type = value.toUpperCase()
            else if (header.includes('entry')) trade.entry = parseFloat(value) || 0
            else if (header.includes('exit')) trade.exit = parseFloat(value) || null
            else if (header.includes('quantity')) trade.quantity = parseFloat(value) || 0
            else if (header.includes('date')) {
              const parsedDate = new Date(value)
              trade.createdAt = !isNaN(parsedDate.getTime()) 
                ? parsedDate.toISOString() 
                : new Date().toISOString()
            }
            else if (header.includes('notes')) trade.notes = value
          })

          if (trade.symbol && trade.type && trade.entry > 0 && trade.quantity > 0) {
            if (!['BUY', 'SELL'].includes(trade.type)) {
              trade.type = 'BUY'
            }
            if (!trade.createdAt) {
              trade.createdAt = new Date().toISOString()
            }
            trades.push(trade)
          }
        }

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
          throw new Error('Failed to import trades')
        }

        const result = await response.json()
        
        // Call parent callback with imported trades
        onImport(result.trades)
        onClose()
      }

      reader.readAsText(file)
    } catch (err) {
      setError('Failed to import trades')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl p-6">
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
            or
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
                    <th className="px-3 py-2 text-left">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((trade, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{trade.symbol}</td>
                      <td className="px-3 py-2">{trade.type}</td>
                      <td className="px-3 py-2">${trade.entry}</td>
                      <td className="px-3 py-2">{trade.exit ? `$${trade.exit}` : '-'}</td>
                      <td className="px-3 py-2">{trade.quantity}</td>
                    </tr>
                  ))}
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

        {/* CSV Format Help */}
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">CSV Format</h4>
          <p className="text-sm text-gray-600 mb-2">
            Your CSV should include these columns:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            <li><strong>Symbol</strong> (required): Stock ticker</li>
            <li><strong>Type</strong> (required): BUY or SELL</li>
            <li><strong>Entry</strong> (required): Entry price</li>
            <li><strong>Quantity</strong> (required): Number of shares</li>
            <li><strong>Exit</strong> (optional): Exit price</li>
            <li><strong>Date</strong> (optional): Trade date</li>
            <li><strong>Notes</strong> (optional): Trade notes</li>
          </ul>
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