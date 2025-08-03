import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

export default function Home() {
  // For now, redirect directly to dashboard
  redirect('/dashboard')
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">TradeVolt</h2>
          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">BETA</span>
        </div>
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
        <span className="inline-block px-3 py-1 bg-purple-600 text-white text-sm rounded-full font-medium mb-4">🎉 BETA ACCESS</span>
        <h1 className="text-6xl font-bold mb-4">TradeVolt</h1>
        <p className="text-xl mb-8 text-gray-600">
          Professional trading analytics. <span className="font-semibold text-purple-600">Free during beta.</span>
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/sign-up">Get Beta Access - All Features Free</Link>
          </Button>
          <p className="text-sm text-gray-600">No credit card required • Full access during beta</p>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Join 1,247 beta traders improving their performance
          </p>
        </div>
      </div>
    </div>
  )
}