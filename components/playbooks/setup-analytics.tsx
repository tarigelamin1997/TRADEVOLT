'use client'

import { Card } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export function SetupAnalytics({ setups, trades }: { setups: any[]; trades: any[] }) {
  return (
    <Card className="p-8 text-center">
      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Setup Analytics</h3>
      <p className="text-muted-foreground">
        Detailed analytics and comparisons coming soon...
      </p>
    </Card>
  )
}