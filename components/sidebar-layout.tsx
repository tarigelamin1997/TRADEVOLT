'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthUser } from '@/lib/auth-wrapper'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { 
  User,
  ChevronsUpDown,
  Home,
  History,
  BarChart3,
  Settings,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
  LogOut,
  Clock,
  Brain,
  Zap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Users
} from "lucide-react"
import { cn } from '@/lib/utils'

// Menu items (same as other pages)
const mainMenuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Trading Playbooks', href: '/playbooks' },
  { icon: History, label: 'Trade History', href: '/history' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: TrendingUp, label: 'Performance Metrics', href: '/metrics' },
  { icon: Calendar, label: 'Calendar', href: '/calendar' },
  { icon: Clock, label: 'Time Analysis', href: '/time-analysis' },
  { icon: Brain, label: 'Behavioral Analysis', href: '/behavioral' },
  { icon: Zap, label: 'Execution Quality', href: '/execution' },
  { icon: PieChart, label: 'Market Analysis', href: '/analysis' },
  { icon: DollarSign, label: 'P&L Report', href: '/pnl' },
  { icon: FileText, label: 'Trade Journal', href: '/journal' },
  { icon: Users, label: 'Affiliate', href: '/affiliate' },
  { icon: Settings, label: 'Settings', href: '/settings' }
]

interface SidebarLayoutProps {
  children: React.ReactNode
  currentPath?: string
}

export function SidebarLayout({ children, currentPath }: SidebarLayoutProps) {
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuthUser()
  
  // Get display values from user
  const displayName = user.fullName
  const email = user.email || 'demo@example.com'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DU'

  const handleSignOut = async () => {
    if (user.id !== 'demo-user') {
      // If using Clerk, sign out properly
      window.location.href = '/sign-out'
    } else {
      // For demo mode, just redirect to home
      router.push('/')
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className={cn("transition-all duration-300", isCollapsed && "w-16")}>
          <SidebarHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-3 top-2 z-50 h-6 w-6 rounded-full border bg-background shadow-md"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </Button>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <BarChart3 className="size-4" />
                  </div>
                  {!isCollapsed && <span className="font-semibold">Trading Journal</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "transition-colors",
                      currentPath === item.href && "bg-gray-100 dark:bg-gray-800"
                    )}
                    tooltip={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <div className="flex items-center w-full">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium",
                          isCollapsed && "h-6 w-6"
                        )}>
                          {user.imageUrl ? (
                            <div className="relative h-full w-full">
                              <Image 
                                src={user.imageUrl} 
                                alt={displayName}
                                className="rounded-full object-cover"
                                fill
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            initials
                          )}
                        </div>
                        {!isCollapsed && (
                          <>
                            <div className="ml-2 flex-1 text-left">
                              <p className="text-sm font-medium">{displayName}</p>
                              <p className="text-xs text-muted-foreground">{email}</p>
                            </div>
                            <ChevronsUpDown className="ml-auto h-4 w-4" />
                          </>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/subscribe')}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Export SidebarTrigger for use in pages
export { SidebarTrigger }