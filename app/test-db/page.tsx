'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function TestDBPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'testConnection' })
      })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to connect' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <Card className="p-6">
        <Button onClick={testConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Test Database Connection'}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </Card>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Environment Check:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Node Environment: {process.env.NODE_ENV}</li>
          <li>Vercel URL: {process.env.VERCEL_URL || 'Not on Vercel'}</li>
        </ul>
      </div>
    </div>
  )
}