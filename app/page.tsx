import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <h2 className="text-2xl font-bold">Trading Journal</h2>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/sign-in">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Sign Up Free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-bold mb-4">Trading Journal</h1>
        <p className="text-xl mb-8 text-gray-600">
          Track trades. See patterns. Make money.
        </p>
        
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/sign-up">Start Free (2 features/week)</Link>
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
    </div>
  )
}