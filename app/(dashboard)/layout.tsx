'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  Home,
  Users,
  Calendar,
  Video,
  FileText,
  Library,
  HelpCircle,
  CreditCard,
  BarChart3,
  User,
  GraduationCap,
  Shield,
  MessageSquare,
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionLabel?: string
  actionHref?: string
}

// Route configuration for breadcrumbs and page titles
const routeConfig: Record<string, { title: string; breadcrumbs: BreadcrumbItem[]; icon?: React.ComponentType<{ className?: string }> }> = {
  '/dashboard': {
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Dashboard', icon: Home }],
    icon: Home
  },
  '/tutors': {
    title: 'Find Tutors',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Find Tutors', icon: Users }
    ],
    icon: Users
  },
  '/students': {
    title: 'My Students',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'My Students', icon: GraduationCap }
    ],
    icon: GraduationCap
  },
  '/admin/users': {
    title: 'User Management',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Admin', icon: Shield },
      { label: 'User Management', icon: Users }
    ],
    icon: Shield
  },
  '/sessions': {
    title: 'Sessions',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Sessions', icon: Calendar }
    ],
    icon: Calendar
  },
  '/classroom': {
    title: 'Virtual Classroom',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Classroom', icon: Video }
    ],
    icon: Video
  },
  '/assignments': {
    title: 'Assignments',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Assignments', icon: FileText }
    ],
    icon: FileText
  },
  '/library': {
    title: 'Study Library',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Library', icon: Library }
    ],
    icon: Library
  },
  '/quizzes': {
    title: 'Quizzes',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Quizzes', icon: HelpCircle }
    ],
    icon: HelpCircle
  },
  '/wallet': {
    title: 'Wallet',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Wallet', icon: CreditCard }
    ],
    icon: CreditCard
  },
  '/analytics': {
    title: 'Analytics',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Analytics', icon: BarChart3 }
    ],
    icon: BarChart3
  },
  '/profile': {
    title: 'Profile',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Profile', icon: User }
    ],
    icon: User
  },
  '/messages': {
    title: 'Messages',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Messages', icon: MessageSquare }
    ],
    icon: MessageSquare
  },
  '/booking': {
    title: 'Book Session',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Book Session', icon: Calendar }
    ],
    icon: Calendar
  }
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuth()
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'Session Reminder',
      message: 'You have a session with John Doe starting in 30 minutes.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      isRead: false,
      actionLabel: 'Join Session',
      actionHref: '/classroom/session-123'
    },
    {
      id: '2',
      type: 'success',
      title: 'Payment Received',
      message: 'Payment of $50 has been successfully processed.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false
    },
    {
      id: '3',
      type: 'warning',
      title: 'Profile Incomplete',
      message: 'Please complete your profile to improve your visibility.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      actionLabel: 'Complete Profile',
      actionHref: '/profile'
    }
  ])
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)

  // Get current route configuration
  const currentRoute = routeConfig[pathname] || {
    title: 'Page',
    breadcrumbs: [{ label: 'Dashboard', href: '/dashboard', icon: Home }]
  }

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mark notification as read
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
  }

  // Dismiss notification
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertTriangle
      case 'error':
        return XCircle
      default:
        return Info
    }
  }

  // Get notification color classes
  const getNotificationColors = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please log in to access the dashboard.</p>
          <Button asChild>
            <a href="/login">Go to Login</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header className="lg:pl-64" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 ease-in-out",
        "lg:pl-64 pt-16"
      )}>
        {/* Breadcrumbs and Page Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-30">
          <div className="flex h-14 items-center gap-4 px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
              {currentRoute.breadcrumbs.map((item, index) => {
                const Icon = item.icon
                const isLast = index === currentRoute.breadcrumbs.length - 1

                return (
                  <div key={index} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 mx-1" aria-hidden="true" />
                    )}
                    
                    {item.href && !isLast ? (
                      <a
                        href={item.href}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        {Icon && <Icon className="h-4 w-4 mr-1" />}
                        {item.label}
                      </a>
                    ) : (
                      <span className={cn(
                        "flex items-center",
                        isLast && "text-foreground font-medium"
                      )}>
                        {Icon && <Icon className="h-4 w-4 mr-1" />}
                        {item.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Notification Center Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
              className="relative"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Notification Center Sidebar */}
      {isNotificationCenterOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsNotificationCenterOpen(false)}
          />

          {/* Notification Panel */}
          <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border z-50 shadow-lg">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNotificationCenterOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type)
                      const colors = getNotificationColors(notification.type)
                      
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            notification.isRead ? 'bg-muted/50' : colors,
                            "hover:bg-accent cursor-pointer"
                          )}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={cn(
                                  "text-sm font-medium",
                                  notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                                )}>
                                  {notification.title}
                                </p>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    dismissNotification(notification.id)
                                  }}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <p className={cn(
                                "text-sm mt-1",
                                notification.isRead ? 'text-muted-foreground' : 'text-foreground/80'
                              )}>
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                
                                {notification.actionLabel && notification.actionHref && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-6 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <a href={notification.actionHref}>
                                      {notification.actionLabel}
                                    </a>
                                  </Button>
                                )}
                              </div>
                              
                              {!notification.isRead && (
                                <div className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No notifications
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You're all caught up! Check back later for updates.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-border p-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <a href="/notifications">View All Notifications</a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}