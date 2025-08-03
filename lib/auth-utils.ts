// Auth utilities that work with or without Clerk

export function useAuthUser() {
  // Check if Clerk is configured
  const isClerkConfigured = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  )

  if (isClerkConfigured) {
    try {
      // Dynamic import to avoid errors when Clerk is not configured
      const { useUser } = require('@clerk/nextjs')
      const { user, isLoaded } = useUser()
      
      if (user) {
        return {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.emailAddresses?.[0]?.emailAddress,
            imageUrl: user.imageUrl,
            fullName: user.fullName || user.firstName || user.username || 'User'
          },
          isLoaded
        }
      }
    } catch (error) {
      console.log('Clerk not configured, using demo mode')
    }
  }

  // Return demo user if Clerk is not configured or user is not signed in
  return {
    user: {
      id: 'demo-user',
      firstName: 'Demo',
      lastName: 'User',
      username: 'demo',
      email: 'demo@example.com',
      imageUrl: null,
      fullName: 'Demo User'
    },
    isLoaded: true
  }
}