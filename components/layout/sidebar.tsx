'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore, UserRole } from '@/lib/state/auth'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  Calendar,
  Video,
  BookOpen,
  FileText,
  Library,
  HelpCircle,
  CreditCard,
  BarChart3,
  User,
  Settings,
  Bell,
  Plus,
  MessageSquare,
  Clock,
  Star,
  DollarSign,
  GraduationCap,
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string | number
  isQuickAction?: boolean
}

interface QuickAction {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  variant?: 'default' | 'outline' | 'ghost'
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: [UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN]
  },
  {
    label: 'Find Tutors',
    href: '/tutors',
    icon: Users,
    roles: [UserRole.STUDENT]
  },
  {
    label: 'My Students',
    href: '/students',
    icon: GraduationCap,
    roles: [UserRole.TUTOR]
  },
  {
    label: 'User Management',
    href: '/admin/users',
    icon: Shield,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Sessions',
    href: '/sessions',
    icon: Calendar,
    roles: [UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN],
    badge: 3
  },
  {
    label: 'Classroom',
    href: '/classroom',
    icon: Video,
    roles: [UserRole.STUDENT, UserRole.TUTOR]
  },
  {
    label: 'Assignments',
    href: '/assignments',
    icon: FileText,
    roles: [UserRole.STUDENT, UserRole.TUTOR]
  },
  {
    label: 'Library',
    href: '/library',
    icon: Library,
    roles: [UserRole.STUDENT, UserRole.TUTOR]
  },
  {
    label: 'Quizzes',
    href: '/quizzes',
    icon: HelpCircle,
    roles: [UserRole.STUDENT, UserRole.TUTOR]
  },
  {
    label: 'Wallet',
    href: '/wallet',
    icon: CreditCard,
    roles: [UserRole.STUDENT, UserRole.TUTOR]
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: [UserRole.TUTOR, UserRole.ADMIN]
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
    roles: [UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN]
  }
]

const quickActions: QuickAction[] = [
  {
    label: 'Book Session',
    href: '/booking',
    icon: Plus,
    roles: [UserRole.STUDENT]
  },
  {
    label: 'Create Assignment',
    href: '/assignments/create',
    icon: Plus,
    roles: [UserRole.TUTOR]
  },
  {
    label: 'New Quiz',
    href: '/quizzes/create',
    icon: Plus,
    roles: [UserRole.TUTOR]
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    roles: [UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN],
    variant: 'outline'
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout, hasAnyRole } = useAuthStore()

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault()
        setIsCollapsed(!isCollapsed)
      }
      if (event.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed, isMobileOpen])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isAuthenticated || !user) {
    return null
  }

  const filteredNavItems = navigationItems.filter(item => 
    hasAnyRole(item.roles)
  )

  const filteredQuickActions = quickActions.filter(action => 
    hasAnyRole(action.roles)
  )

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const getUserStatusColor = () => {
    if (user.role === UserRole.TUTOR && user.tutorProfile?.isVerified) {
      return 'bg-green-500'
    }
    if (user.isEmailVerified) {
      return 'bg-blue-500'
    }
    return 'bg-yellow-500'
  }

  const getUserStatusText = () => {
    if (user.role === UserRole.TUTOR && user.tutorProfile?.isVerified) {
      return 'Verified Tutor'
    }
    if (user.isEmailVerified) {
      return 'Active'
    }
    return 'Pending Verification'
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-border px-4 py-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">TutorPlatform</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "h-8 w-8",
            isCollapsed && "mx-auto"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Status */}
      <div className={cn(
        "border-b border-border px-4 py-3",
        isCollapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center space-x-3",
          isCollapsed && "justify-center"
        )}>
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
              getUserStatusColor()
            )} />
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {getUserStatusText()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {filteredQuickActions.length > 0 && (
        <div className={cn(
          "border-b border-border px-4 py-3",
          isCollapsed && "px-2"
        )}>
          {!isCollapsed && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Actions
            </h3>
          )}
          <div className={cn(
            "space-y-1",
            isCollapsed && "flex flex-col items-center space-y-2"
          )}>
            {filteredQuickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.href}
                  variant={action.variant || "default"}
                  size={isCollapsed ? "icon" : "sm"}
                  asChild
                  className={cn(
                    "w-full justify-start",
                    isCollapsed && "w-8 h-8"
                  )}
                >
                  <Link href={action.href}>
                    <Icon className={cn(
                      "h-4 w-4",
                      !isCollapsed && "mr-2"
                    )} />
                    {!isCollapsed && action.label}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {!isCollapsed && (
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </h3>
        )}
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "bg-accent text-accent-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "h-4 w-4 flex-shrink-0",
                  !isCollapsed && "mr-3"
                )} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-border px-4 py-3",
        isCollapsed && "px-2"
      )}>
        <div className={cn(
          "space-y-1",
          isCollapsed && "flex flex-col items-center space-y-2"
        )}>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            asChild
            className={cn(
              "w-full justify-start",
              isCollapsed && "w-8 h-8"
            )}
          >
            <Link href="/settings">
              <Settings className={cn(
                "h-4 w-4",
                !isCollapsed && "mr-2"
              )} />
              {!isCollapsed && "Settings"}
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={logout}
            className={cn(
              "w-full justify-start text-destructive hover:text-destructive",
              isCollapsed && "w-8 h-8"
            )}
          >
            <LogOut className={cn(
              "h-4 w-4",
              !isCollapsed && "mr-2"
            )} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle mobile menu"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-background border-r border-border transition-all duration-300",
          "lg:relative lg:z-auto lg:translate-x-0",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}