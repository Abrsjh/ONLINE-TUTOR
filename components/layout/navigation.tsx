'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Home,
  Users,
  Calendar,
  BookOpen,
  Video,
  FileText,
  CreditCard,
  BarChart3,
  GraduationCap,
  MessageSquare,
  Library,
  Award,
  HelpCircle,
  ChevronRight
} from 'lucide-react'
import { useAuthStore, UserRole } from '@/lib/state/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string | number
  children?: NavigationItem[]
}

interface BreadcrumbItem {
  label: string
  href?: string
}

const navigationItems: NavigationItem[] = [
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
    label: 'Sessions',
    href: '/sessions',
    icon: Calendar,
    roles: [UserRole.STUDENT, UserRole.TUTOR],
    children: [
      {
        label: 'Upcoming',
        href: '/sessions?filter=upcoming',
        icon: Calendar,
        roles: [UserRole.STUDENT, UserRole.TUTOR]
      },
      {
        label: 'Past Sessions',
        href: '/sessions?filter=past',
        icon: Calendar,
        roles: [UserRole.STUDENT, UserRole.TUTOR]
      }
    ]
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
    icon: BookOpen,
    roles: [UserRole.STUDENT, UserRole.TUTOR]
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    roles: [UserRole.STUDENT, UserRole.TUTOR],
    badge: 3
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
    label: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Platform Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: [UserRole.ADMIN]
  }
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuthStore()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NavigationItem[]>([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => 
    user && item.roles.includes(user.role)
  )

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard' }
    ]

    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Find matching navigation item
      const navItem = filteredNavItems.find(item => 
        item.href === currentPath || item.href.includes(segment)
      )
      
      if (navItem) {
        breadcrumbs.push({
          label: navItem.label,
          href: index === pathSegments.length - 1 ? undefined : currentPath
        })
      } else {
        // Fallback to formatted segment name
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        breadcrumbs.push({
          label,
          href: index === pathSegments.length - 1 ? undefined : currentPath
        })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (query.trim() === '') {
      setSearchResults([])
      return
    }

    const results = filteredNavItems.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.href.toLowerCase().includes(query.toLowerCase())
    )
    
    setSearchResults(results)
  }

  // Handle search result selection
  const handleSearchSelect = (item: NavigationItem) => {
    router.push(item.href)
    setSearchQuery('')
    setSearchResults([])
    setIsSearchFocused(false)
    setIsMobileMenuOpen(false)
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Toggle expanded navigation items
  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu')) {
        setIsUserMenuOpen(false)
      }
      if (!target.closest('.search-container')) {
        setIsSearchFocused(false)
        setSearchResults([])
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  if (!isAuthenticated || !user) {
    return null
  }

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.href)

    return (
      <div key={item.href} className={cn('relative', level > 0 && 'ml-4')}>
        <div className="flex items-center">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.href)}
              className={cn(
                'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                isActive && 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              )}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronRight 
                className={cn(
                  'w-4 h-4 ml-2 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            </button>
          ) : (
            <Link
              href={item.href}
              className={cn(
                'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                isActive && 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              )}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Navigation Header */}
      <header className="hidden lg:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  TutorPlatform
                </span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8 search-container relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search navigation..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Search Results */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                  {searchResults.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleSearchSelect(item)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md"
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-900"></span>
              </button>

              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      <Link
                        href="/help"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <HelpCircle className="w-4 h-4 mr-3" />
                        Help
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-t border-gray-200 dark:border-gray-700">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              <Link href="/dashboard" className="flex items-center space-x-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  TutorPlatform
                </span>
              </Link>

              <div className="flex items-center space-x-2">
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
                </button>
                
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
            
            <div className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-white text-sm font-medium">
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
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 search-container">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {searchResults.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleSearchSelect(item)}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Navigation Items */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {filteredNavItems.map(item => renderNavigationItem(item))}
              </nav>

              {/* Mobile Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}