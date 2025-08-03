'use client'

import { Card } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export function DisciplineScore({ trades }: { trades: any[] }) {
  return (
    <Card className="p-8 text-center">
      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Discipline Score</h3>
      <p className="text-muted-foreground">
        Rule compliance tracking coming soon...
      </p>
    </Card>
  )
}