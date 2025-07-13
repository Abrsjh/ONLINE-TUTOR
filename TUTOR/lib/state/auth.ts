import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'

// User roles enum
export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
  ADMIN = 'admin'
}

// User interface
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar?: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  // Role-specific fields
  studentProfile?: {
    grade?: string
    subjects: string[]
    learningGoals: string[]
    timezone: string
  }
  tutorProfile?: {
    subjects: string[]
    hourlyRate: number
    bio: string
    experience: number
    education: string[]
    certifications: string[]
    languages: string[]
    timezone: string
    availability: {
      [key: string]: { start: string; end: string }[] // day of week -> time slots
    }
    rating: number
    totalSessions: number
    isVerified: boolean
  }
  adminProfile?: {
    permissions: string[]
    department: string
  }
}

// Authentication state interface
interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionToken: string | null
  refreshToken: string | null
  sessionExpiry: number | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: RegisterData) => Promise<void>
  updateUser: (updates: Partial<User>) => void
  updateProfile: (profileData: Partial<User['studentProfile'] | User['tutorProfile'] | User['adminProfile']>) => void
  refreshSession: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  
  // Role checking utilities
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isStudent: () => boolean
  isTutor: () => boolean
  isAdmin: () => boolean
  
  // Session management
  isSessionValid: () => boolean
  getSessionTimeRemaining: () => number
  extendSession: () => void
}

// Registration data interface
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  timezone: string
  // Role-specific registration data
  subjects?: string[]
  grade?: string
  hourlyRate?: number
  bio?: string
  experience?: number
}

// Mock authentication service
const authService = {
  async login(email: string, password: string): Promise<{ user: User; tokens: { sessionToken: string; refreshToken: string; expiresIn: number } }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock validation
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    
    if (password.length < 6) {
      throw new Error('Invalid credentials')
    }
    
    // Mock user data based on email
    const mockUser: User = {
      id: `user_${Date.now()}`,
      email,
      firstName: email.split('@')[0].split('.')[0] || 'User',
      lastName: email.split('@')[0].split('.')[1] || 'Name',
      role: email.includes('tutor') ? UserRole.TUTOR : email.includes('admin') ? UserRole.ADMIN : UserRole.STUDENT,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Add role-specific profile data
    if (mockUser.role === UserRole.STUDENT) {
      mockUser.studentProfile = {
        grade: '10th Grade',
        subjects: ['Mathematics', 'Physics'],
        learningGoals: ['Improve test scores', 'Understand concepts better'],
        timezone: 'America/New_York'
      }
    } else if (mockUser.role === UserRole.TUTOR) {
      mockUser.tutorProfile = {
        subjects: ['Mathematics', 'Physics', 'Chemistry'],
        hourlyRate: 50,
        bio: 'Experienced tutor with 5+ years of teaching experience.',
        experience: 5,
        education: ['M.S. Mathematics - MIT', 'B.S. Physics - Harvard'],
        certifications: ['Certified Math Teacher', 'Online Teaching Certificate'],
        languages: ['English', 'Spanish'],
        timezone: 'America/New_York',
        availability: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '15:00' }],
        },
        rating: 4.8,
        totalSessions: 150,
        isVerified: true
      }
    } else if (mockUser.role === UserRole.ADMIN) {
      mockUser.adminProfile = {
        permissions: ['user_management', 'content_management', 'analytics', 'payments'],
        department: 'Platform Operations'
      }
    }
    
    const tokens = {
      sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresIn: 3600000 // 1 hour in milliseconds
    }
    
    return { user: mockUser, tokens }
  },
  
  async register(userData: RegisterData): Promise<{ user: User; tokens: { sessionToken: string; refreshToken: string; expiresIn: number } }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock validation
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required')
    }
    
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    
    const mockUser: User = {
      id: `user_${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Add role-specific profile data
    if (userData.role === UserRole.STUDENT) {
      mockUser.studentProfile = {
        grade: userData.grade,
        subjects: userData.subjects || [],
        learningGoals: [],
        timezone: userData.timezone
      }
    } else if (userData.role === UserRole.TUTOR) {
      mockUser.tutorProfile = {
        subjects: userData.subjects || [],
        hourlyRate: userData.hourlyRate || 25,
        bio: userData.bio || '',
        experience: userData.experience || 0,
        education: [],
        certifications: [],
        languages: ['English'],
        timezone: userData.timezone,
        availability: {},
        rating: 0,
        totalSessions: 0,
        isVerified: false
      }
    }
    
    const tokens = {
      sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresIn: 3600000 // 1 hour in milliseconds
    }
    
    return { user: mockUser, tokens }
  },
  
  async refreshSession(refreshToken: string): Promise<{ sessionToken: string; expiresIn: number }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (!refreshToken) {
      throw new Error('Invalid refresh token')
    }
    
    return {
      sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresIn: 3600000 // 1 hour in milliseconds
    }
  }
}

// Create the auth store with persistence
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionToken: null,
        refreshToken: null,
        sessionExpiry: null,
        
        // Actions
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          
          try {
            const { user, tokens } = await authService.login(email, password)
            const expiryTime = Date.now() + tokens.expiresIn
            
            set({
              user,
              isAuthenticated: true,
              sessionToken: tokens.sessionToken,
              refreshToken: tokens.refreshToken,
              sessionExpiry: expiryTime,
              isLoading: false,
              error: null
            })
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Login failed'
            })
            throw error
          }
        },
        
        logout: () => {
          set({
            user: null,
            isAuthenticated: false,
            sessionToken: null,
            refreshToken: null,
            sessionExpiry: null,
            error: null
          })
        },
        
        register: async (userData: RegisterData) => {
          set({ isLoading: true, error: null })
          
          try {
            const { user, tokens } = await authService.register(userData)
            const expiryTime = Date.now() + tokens.expiresIn
            
            set({
              user,
              isAuthenticated: true,
              sessionToken: tokens.sessionToken,
              refreshToken: tokens.refreshToken,
              sessionExpiry: expiryTime,
              isLoading: false,
              error: null
            })
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Registration failed'
            })
            throw error
          }
        },
        
        updateUser: (updates: Partial<User>) => {
          const { user } = get()
          if (user) {
            set({
              user: {
                ...user,
                ...updates,
                updatedAt: new Date().toISOString()
              }
            })
          }
        },
        
        updateProfile: (profileData: Partial<User['studentProfile'] | User['tutorProfile'] | User['adminProfile']>) => {
          const { user } = get()
          if (user) {
            const updatedUser = { ...user }
            
            if (user.role === UserRole.STUDENT && user.studentProfile) {
              updatedUser.studentProfile = { ...user.studentProfile, ...profileData }
            } else if (user.role === UserRole.TUTOR && user.tutorProfile) {
              updatedUser.tutorProfile = { ...user.tutorProfile, ...profileData }
            } else if (user.role === UserRole.ADMIN && user.adminProfile) {
              updatedUser.adminProfile = { ...user.adminProfile, ...profileData }
            }
            
            updatedUser.updatedAt = new Date().toISOString()
            set({ user: updatedUser })
          }
        },
        
        refreshSession: async () => {
          const { refreshToken } = get()
          
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }
          
          try {
            const { sessionToken, expiresIn } = await authService.refreshSession(refreshToken)
            const expiryTime = Date.now() + expiresIn
            
            set({
              sessionToken,
              sessionExpiry: expiryTime,
              error: null
            })
          } catch (error) {
            // If refresh fails, logout the user
            get().logout()
            throw error
          }
        },
        
        clearError: () => set({ error: null }),
        
        setLoading: (loading: boolean) => set({ isLoading: loading }),
        
        // Role checking utilities
        hasRole: (role: UserRole) => {
          const { user } = get()
          return user?.role === role
        },
        
        hasAnyRole: (roles: UserRole[]) => {
          const { user } = get()
          return user ? roles.includes(user.role) : false
        },
        
        isStudent: () => get().hasRole(UserRole.STUDENT),
        
        isTutor: () => get().hasRole(UserRole.TUTOR),
        
        isAdmin: () => get().hasRole(UserRole.ADMIN),
        
        // Session management
        isSessionValid: () => {
          const { sessionExpiry } = get()
          return sessionExpiry ? Date.now() < sessionExpiry : false
        },
        
        getSessionTimeRemaining: () => {
          const { sessionExpiry } = get()
          return sessionExpiry ? Math.max(0, sessionExpiry - Date.now()) : 0
        },
        
        extendSession: () => {
          const { sessionExpiry } = get()
          if (sessionExpiry) {
            // Extend session by 30 minutes
            set({ sessionExpiry: sessionExpiry + 1800000 })
          }
        }
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sessionToken: state.sessionToken,
          refreshToken: state.refreshToken,
          sessionExpiry: state.sessionExpiry
        }),
        onRehydrateStorage: () => (state) => {
          // Check if session is still valid on rehydration
          if (state && !state.isSessionValid()) {
            state.logout()
          }
        }
      }
    ),
    {
      name: 'auth-store'
    }
  )
)

// Auto-refresh session when it's about to expire
let refreshTimer: NodeJS.Timeout | null = null

// Subscribe to session expiry changes to set up auto-refresh
useAuthStore.subscribe((state) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  
  if (state.isAuthenticated && state.sessionExpiry) {
    const timeUntilExpiry = state.sessionExpiry - Date.now()
    const refreshTime = Math.max(0, timeUntilExpiry - 300000) // Refresh 5 minutes before expiry
    
    if (refreshTime > 0) {
      refreshTimer = setTimeout(async () => {
        try {
          await state.refreshSession()
        } catch (error) {
          console.error('Auto-refresh failed:', error)
        }
      }, refreshTime)
    }
  }
})

// Export types for use in other components
export type { AuthState, User, RegisterData }