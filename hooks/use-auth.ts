import { useCallback, useEffect, useMemo } from 'react'
import { useAuthStore, UserRole, type User, type RegisterData } from '@/lib/state/auth'

// Hook return type interface
interface UseAuthReturn {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionTimeRemaining: number
  isSessionValid: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: RegisterData) => Promise<void>
  updateUser: (updates: Partial<User>) => void
  updateProfile: (profileData: Partial<User['studentProfile'] | User['tutorProfile'] | User['adminProfile']>) => void
  refreshSession: () => Promise<void>
  clearError: () => void
  extendSession: () => void
  
  // Role checking utilities
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isStudent: boolean
  isTutor: boolean
  isAdmin: boolean
  
  // User profile helpers
  getDisplayName: () => string
  getInitials: () => string
  getUserRole: () => UserRole | null
  getProfileData: () => User['studentProfile'] | User['tutorProfile'] | User['adminProfile'] | null
}

// Session warning thresholds (in milliseconds)
const SESSION_WARNING_TIME = 5 * 60 * 1000 // 5 minutes
const SESSION_CRITICAL_TIME = 1 * 60 * 1000 // 1 minute

/**
 * Custom hook for authentication management
 * Provides a clean interface to the auth store with additional utilities
 */
export const useAuth = (): UseAuthReturn => {
  // Get state and actions from the auth store
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    sessionToken,
    sessionExpiry,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
    updateUser: storeUpdateUser,
    updateProfile: storeUpdateProfile,
    refreshSession: storeRefreshSession,
    clearError: storeClearError,
    extendSession: storeExtendSession,
    hasRole: storeHasRole,
    hasAnyRole: storeHasAnyRole,
    isStudent: storeIsStudent,
    isTutor: storeIsTutor,
    isAdmin: storeIsAdmin,
    isSessionValid: storeIsSessionValid,
    getSessionTimeRemaining: storeGetSessionTimeRemaining
  } = useAuthStore()

  // Memoized session time remaining
  const sessionTimeRemaining = useMemo(() => {
    return storeGetSessionTimeRemaining()
  }, [sessionExpiry, storeGetSessionTimeRemaining])

  // Memoized session validity
  const isSessionValid = useMemo(() => {
    return storeIsSessionValid()
  }, [sessionExpiry, storeIsSessionValid])

  // Wrapped login function with error handling
  const login = useCallback(async (email: string, password: string) => {
    try {
      await storeLogin(email, password)
    } catch (error) {
      // Error is already handled in the store, just re-throw for component handling
      throw error
    }
  }, [storeLogin])

  // Wrapped logout function
  const logout = useCallback(() => {
    storeLogout()
  }, [storeLogout])

  // Wrapped register function with error handling
  const register = useCallback(async (userData: RegisterData) => {
    try {
      await storeRegister(userData)
    } catch (error) {
      // Error is already handled in the store, just re-throw for component handling
      throw error
    }
  }, [storeRegister])

  // Wrapped update user function
  const updateUser = useCallback((updates: Partial<User>) => {
    storeUpdateUser(updates)
  }, [storeUpdateUser])

  // Wrapped update profile function
  const updateProfile = useCallback((profileData: Partial<User['studentProfile'] | User['tutorProfile'] | User['adminProfile']>) => {
    storeUpdateProfile(profileData)
  }, [storeUpdateProfile])

  // Wrapped refresh session function with error handling
  const refreshSession = useCallback(async () => {
    try {
      await storeRefreshSession()
    } catch (error) {
      // Error is already handled in the store, just re-throw for component handling
      throw error
    }
  }, [storeRefreshSession])

  // Wrapped clear error function
  const clearError = useCallback(() => {
    storeClearError()
  }, [storeClearError])

  // Wrapped extend session function
  const extendSession = useCallback(() => {
    storeExtendSession()
  }, [storeExtendSession])

  // Role checking functions
  const hasRole = useCallback((role: UserRole) => {
    return storeHasRole(role)
  }, [storeHasRole])

  const hasAnyRole = useCallback((roles: UserRole[]) => {
    return storeHasAnyRole(roles)
  }, [storeHasAnyRole])

  // Memoized role booleans
  const isStudent = useMemo(() => storeIsStudent(), [storeIsStudent])
  const isTutor = useMemo(() => storeIsTutor(), [storeIsTutor])
  const isAdmin = useMemo(() => storeIsAdmin(), [storeIsAdmin])

  // User profile helper functions
  const getDisplayName = useCallback(() => {
    if (!user) return 'Guest'
    return `${user.firstName} ${user.lastName}`.trim() || user.email
  }, [user])

  const getInitials = useCallback(() => {
    if (!user) return 'G'
    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || ''
    return firstInitial + lastInitial || user.email.charAt(0).toUpperCase()
  }, [user])

  const getUserRole = useCallback(() => {
    return user?.role || null
  }, [user])

  const getProfileData = useCallback(() => {
    if (!user) return null
    
    switch (user.role) {
      case UserRole.STUDENT:
        return user.studentProfile || null
      case UserRole.TUTOR:
        return user.tutorProfile || null
      case UserRole.ADMIN:
        return user.adminProfile || null
      default:
        return null
    }
  }, [user])

  // Session monitoring effect
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiry) return

    const checkSession = () => {
      const timeRemaining = sessionExpiry - Date.now()
      
      // Warn user when session is about to expire
      if (timeRemaining <= SESSION_WARNING_TIME && timeRemaining > SESSION_CRITICAL_TIME) {
        // You can dispatch a custom event or use a notification system here
        console.warn('Session will expire soon. Please save your work.')
      } else if (timeRemaining <= SESSION_CRITICAL_TIME && timeRemaining > 0) {
        // Critical warning
        console.warn('Session expires in less than 1 minute!')
      } else if (timeRemaining <= 0) {
        // Session expired, logout user
        console.warn('Session expired. Logging out...')
        logout()
      }
    }

    // Check session immediately
    checkSession()

    // Set up interval to check session every 30 seconds
    const interval = setInterval(checkSession, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated, sessionExpiry, logout])

  // Auto-clear errors after a timeout
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        clearError()
      }, 10000) // Clear error after 10 seconds

      return () => clearTimeout(timeout)
    }
  }, [error, clearError])

  // Automatic session refresh when user is active
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiry) return

    const handleUserActivity = () => {
      const timeRemaining = sessionExpiry - Date.now()
      const halfSessionTime = 30 * 60 * 1000 // 30 minutes

      // If session has less than half time remaining and user is active, extend it
      if (timeRemaining < halfSessionTime && timeRemaining > 0) {
        extendSession()
      }
    }

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    // Throttle the activity handler to avoid excessive calls
    let throttleTimeout: NodeJS.Timeout | null = null
    const throttledHandler = () => {
      if (throttleTimeout) return
      
      throttleTimeout = setTimeout(() => {
        handleUserActivity()
        throttleTimeout = null
      }, 60000) // Throttle to once per minute
    }

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler)
      })
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
    }
  }, [isAuthenticated, sessionExpiry, extendSession])

  // Return the hook interface
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    sessionTimeRemaining,
    isSessionValid,
    
    // Actions
    login,
    logout,
    register,
    updateUser,
    updateProfile,
    refreshSession,
    clearError,
    extendSession,
    
    // Role checking utilities
    hasRole,
    hasAnyRole,
    isStudent,
    isTutor,
    isAdmin,
    
    // User profile helpers
    getDisplayName,
    getInitials,
    getUserRole,
    getProfileData
  }
}

// Additional utility hooks for specific use cases

/**
 * Hook for checking if user has required permissions
 */
export const usePermissions = () => {
  const { user, hasRole, hasAnyRole } = useAuth()

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false
    
    // Admin has all permissions
    if (user.role === UserRole.ADMIN) {
      return user.adminProfile?.permissions?.includes(permission) ?? false
    }
    
    // Define role-based permissions
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.STUDENT]: [
        'view_tutors',
        'book_sessions',
        'view_assignments',
        'submit_assignments',
        'view_progress',
        'manage_profile'
      ],
      [UserRole.TUTOR]: [
        'view_students',
        'manage_availability',
        'create_assignments',
        'grade_assignments',
        'view_earnings',
        'manage_profile',
        'conduct_sessions'
      ],
      [UserRole.ADMIN]: [] // Handled above
    }
    
    return rolePermissions[user.role]?.includes(permission) ?? false
  }, [user])

  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission))
  }, [hasPermission])

  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission))
  }, [hasPermission])

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole
  }
}

/**
 * Hook for session management utilities
 */
export const useSession = () => {
  const { 
    sessionTimeRemaining, 
    isSessionValid, 
    refreshSession, 
    extendSession,
    logout 
  } = useAuth()

  const formatTimeRemaining = useCallback(() => {
    const minutes = Math.floor(sessionTimeRemaining / 60000)
    const seconds = Math.floor((sessionTimeRemaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [sessionTimeRemaining])

  const isSessionWarning = useMemo(() => {
    return sessionTimeRemaining <= SESSION_WARNING_TIME && sessionTimeRemaining > SESSION_CRITICAL_TIME
  }, [sessionTimeRemaining])

  const isSessionCritical = useMemo(() => {
    return sessionTimeRemaining <= SESSION_CRITICAL_TIME && sessionTimeRemaining > 0
  }, [sessionTimeRemaining])

  const getSessionStatus = useCallback(() => {
    if (!isSessionValid) return 'expired'
    if (isSessionCritical) return 'critical'
    if (isSessionWarning) return 'warning'
    return 'active'
  }, [isSessionValid, isSessionCritical, isSessionWarning])

  return {
    sessionTimeRemaining,
    isSessionValid,
    isSessionWarning,
    isSessionCritical,
    formatTimeRemaining,
    getSessionStatus,
    refreshSession,
    extendSession,
    logout
  }
}

// Export the main hook as default
export default useAuth