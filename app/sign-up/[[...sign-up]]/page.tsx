'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SignUp } from '@clerk/nextjs'

// Check if Clerk is configured
const isClerkConfigured = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default function SignUpPage() {
  const router = useRouter()
  
  // If Clerk is not configured, show a demo signup
  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Demo Mode</h2>
          <p className="text-gray-600 mb-6 text-center">
            Authentication is not configured. Click below to access the demo.
          </p>
          <Button 
            className="w-full" 
            onClick={() => router.push('/dashboard')}
          >
            Continue to Dashboard
          </Button>
          <p className="text-sm text-gray-500 mt-4 text-center">
            To enable real authentication, add Clerk API keys.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-black hover:bg-gray-800',
            footerActionLink: 'text-black hover:text-gray-800'
          }
        }}
        redirectUrl="/dashboard"
      />
    </div>
  )
}