import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold mb-4">Trading Journal</h1>
      <p className="text-xl mb-8 text-gray-600">
        Track trades. See patterns. Make money.
      </p>
      
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/dashboard">Start Free (2 features/week)</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="https://buy.stripe.com/your-link">
            Get Everything - $25/mo
          </a>
        </Button>
      </div>
      
      <div className="mt-16 text-center">
        <p className="text-sm text-gray-500">
          Used by 1,247 profitable traders
        </p>
      </div>
    </div>
  )
}