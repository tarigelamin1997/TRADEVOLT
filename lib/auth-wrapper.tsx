'use client'

import { createContext, useContext, ReactNode } from 'react'

interface AuthUser {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string | null
  imageUrl: string | null
  fullName: string
}

interface AuthContextType {
  user: AuthUser
  isLoaded: boolean
}

const AuthContext = createContext<AuthContextType>({
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
})

export function useAuthUser() {
  return useContext(AuthContext)
}

// Provider component that wraps the app
export function AuthProvider({ children }: { children: ReactNode }) {
  // Default demo user
  const demoUser: AuthContextType = {
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

  // For now, always return demo user
  // When Clerk is properly configured, this can be updated
  return (
    <AuthContext.Provider value={demoUser}>
      {children}
    </AuthContext.Provider>
  )
}