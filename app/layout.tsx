import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { SubscriptionProvider } from '@/lib/subscription'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trading Journal - Track trades. See patterns. Make money.',
  description: 'Simple trading journal to track your trades and improve your performance',
}

// Check if Clerk keys are configured
const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.CLERK_SECRET_KEY
)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // If Clerk is configured, wrap with ClerkProvider
  if (isClerkConfigured) {
    return (
      <ClerkProvider>
        <html lang="en">
          <body className={inter.className}>
            <SubscriptionProvider>
              {children}
            </SubscriptionProvider>
          </body>
        </html>
      </ClerkProvider>
    )
  }

  // Otherwise, render without authentication
  return (
    <html lang="en">
      <body className={inter.className}>
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </body>
    </html>
  )
}