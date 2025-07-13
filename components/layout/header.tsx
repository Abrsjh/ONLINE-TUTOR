'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  GraduationCap,
  HelpCircle
} from 'lucide-react'
import { useAuthStore } from '@/lib/state/auth'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeaderProps {
  showNavigation?: boolean
  className?: string
}

export function Header({ showNavigation = true, className }: HeaderProps) {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuthStore()
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New session request', time: '5 min ago', unread: true },
    { id: 2, title: 'Payment received', time: '1 hour ago', unread: true },
    { id: 3, title: 'Assignment submitted', time: '2 hours ago', unread: false }
  ])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = savedTheme || systemTheme
    
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  // Apply theme to document
  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    router.push('/login')
    setIsUserMenuOpen(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false)
      }
      
      if (!target.closest('.notification-container')) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  // Mark notification as read
  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, unread: false } : notif
      )
    )
  }

  // Get unread notification count
  const unreadCount = notifications.filter(n => n.unread).length

  if (!isAuthenticated || !user) {
    return (
      <header className={cn(
        'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50',
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/" 
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="TutorPlatform Home"
            >
              <GraduationCap className="w-8 h-8 text-blue-600" aria-hidden="true" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                TutorPlatform
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="p-2"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Sun className="w-5 h-5" aria-hidden="true" />
                )}
              </Button>
              
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              
              <Link href="/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className={cn(
        'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50',
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
                className="p-2 mr-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </Button>
            </div>

            {/* Logo */}
            <div className="flex items-center">
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="TutorPlatform Dashboard"
              >
                <GraduationCap className="w-8 h-8 text-blue-600" aria-hidden="true" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  TutorPlatform
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {showNavigation && (
              <div className="hidden lg:block flex-1 max-w-2xl mx-8">
                <Navigation />
              </div>
            )}

            {/* Right side items */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search button for mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2"
                aria-label="Search"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </Button>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="p-2"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Sun className="w-5 h-5" aria-hidden="true" />
                )}
              </Button>

              {/* Notifications */}
              <div className="relative notification-container">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  onKeyDown={(e) => handleKeyDown(e, () => setIsNotificationOpen(!isNotificationOpen))}
                  aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                  aria-expanded={isNotificationOpen}
                  aria-haspopup="true"
                  className="relative p-2"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {isNotificationOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="notifications-menu"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                      </div>
                      
                      {notifications.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => markNotificationAsRead(notification.id)}
                              className={cn(
                                'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0',
                                notification.unread && 'bg-blue-50 dark:bg-blue-900/20'
                              )}
                              role="menuitem"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className={cn(
                                    'text-sm',
                                    notification.unread 
                                      ? 'font-medium text-gray-900 dark:text-white' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  )}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {notification.time}
                                  </p>
                                </div>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" aria-hidden="true" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No notifications
                          </p>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <Link
                          href="/notifications"
                          className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
                          role="menuitem"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative user-menu-container">
                <Button
                  variant="ghost"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onKeyDown={(e) => handleKeyDown(e, () => setIsUserMenuOpen(!isUserMenuOpen))}
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium" aria-hidden="true">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.role}
                    </p>
                  </div>
                  
                  <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 sm:hidden">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {user.role}
                        </p>
                      </div>
                      
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <User className="w-4 h-4 mr-3" aria-hidden="true" />
                        Profile
                      </Link>
                      
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4 mr-3" aria-hidden="true" />
                        Settings
                      </Link>
                      
                      <Link
                        href="/help"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <HelpCircle className="w-4 h-4 mr-3" aria-hidden="true" />
                        Help & Support
                      </Link>
                      
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 mr-3" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-25" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          <div 
            className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-medium" aria-hidden="true">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close mobile menu"
                className="p-2"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>

            {/* Mobile Navigation Content */}
            {showNavigation && (
              <div className="flex-1 overflow-y-auto">
                <Navigation />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}