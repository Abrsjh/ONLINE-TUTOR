import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Date formatting utilities
 */
export const dateUtils = {
  /**
   * Format date to readable string
   */
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj)
  },

  /**
   * Format time to readable string
   */
  formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(dateObj)
  },

  /**
   * Format date and time together
   */
  formatDateTime: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(dateObj)
  },

  /**
   * Get relative time (e.g., "2 hours ago", "in 3 days")
   */
  getRelativeTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ]

    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds)
      if (count >= 1) {
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
        return rtf.format(diffInSeconds > 0 ? -count : count, interval.label as Intl.RelativeTimeFormatUnit)
      }
    }

    return 'just now'
  },

  /**
   * Check if date is today
   */
  isToday: (date: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    return dateObj.toDateString() === today.toDateString()
  },

  /**
   * Check if date is tomorrow
   */
  isTomorrow: (date: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return dateObj.toDateString() === tomorrow.toDateString()
  },

  /**
   * Get start of day
   */
  startOfDay: (date: Date | string): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    return dateObj
  },

  /**
   * Get end of day
   */
  endOfDay: (date: Date | string): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    dateObj.setHours(23, 59, 59, 999)
    return dateObj
  },

  /**
   * Add days to date
   */
  addDays: (date: Date | string, days: number): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    dateObj.setDate(dateObj.getDate() + days)
    return dateObj
  },

  /**
   * Add hours to date
   */
  addHours: (date: Date | string, hours: number): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    dateObj.setHours(dateObj.getHours() + hours)
    return dateObj
  },

  /**
   * Add minutes to date
   */
  addMinutes: (date: Date | string, minutes: number): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
    dateObj.setMinutes(dateObj.getMinutes() + minutes)
    return dateObj
  },
}

/**
 * Timezone conversion utilities
 */
export const timezoneUtils = {
  /**
   * Convert date to specific timezone
   */
  convertToTimezone: (date: Date | string, timezone: string): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }))
  },

  /**
   * Get user's timezone
   */
  getUserTimezone: (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  },

  /**
   * Format date in specific timezone
   */
  formatInTimezone: (
    date: Date | string,
    timezone: string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(dateObj)
  },

  /**
   * Get timezone offset in hours
   */
  getTimezoneOffset: (timezone: string): number => {
    const now = new Date()
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
    const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }))
    return (target.getTime() - utc.getTime()) / (1000 * 60 * 60)
  },

  /**
   * List of common timezones
   */
  commonTimezones: [
    { label: 'Eastern Time', value: 'America/New_York' },
    { label: 'Central Time', value: 'America/Chicago' },
    { label: 'Mountain Time', value: 'America/Denver' },
    { label: 'Pacific Time', value: 'America/Los_Angeles' },
    { label: 'UTC', value: 'UTC' },
    { label: 'London', value: 'Europe/London' },
    { label: 'Paris', value: 'Europe/Paris' },
    { label: 'Tokyo', value: 'Asia/Tokyo' },
    { label: 'Sydney', value: 'Australia/Sydney' },
    { label: 'Mumbai', value: 'Asia/Kolkata' },
  ],
}

/**
 * Currency formatting utilities
 */
export const currencyUtils = {
  /**
   * Format amount as currency
   */
  formatCurrency: (
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  },

  /**
   * Format amount as currency without symbol
   */
  formatAmount: (amount: number, locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  },

  /**
   * Parse currency string to number
   */
  parseCurrency: (currencyString: string): number => {
    const cleaned = currencyString.replace(/[^0-9.-]+/g, '')
    return parseFloat(cleaned) || 0
  },

  /**
   * Format percentage
   */
  formatPercentage: (value: number, decimals: number = 1): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100)
  },

  /**
   * Calculate percentage
   */
  calculatePercentage: (value: number, total: number): number => {
    if (total === 0) return 0
    return (value / total) * 100
  },

  /**
   * Calculate discount amount
   */
  calculateDiscount: (originalPrice: number, discountPercent: number): number => {
    return originalPrice * (discountPercent / 100)
  },

  /**
   * Calculate final price after discount
   */
  calculateDiscountedPrice: (originalPrice: number, discountPercent: number): number => {
    return originalPrice - currencyUtils.calculateDiscount(originalPrice, discountPercent)
  },
}

/**
 * String utilities
 */
export const stringUtils = {
  /**
   * Capitalize first letter
   */
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  /**
   * Convert to title case
   */
  toTitleCase: (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  },

  /**
   * Convert to slug (URL-friendly string)
   */
  toSlug: (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },

  /**
   * Truncate string with ellipsis
   */
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) return str
    return str.substring(0, length - suffix.length) + suffix
  },

  /**
   * Extract initials from name
   */
  getInitials: (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  },

  /**
   * Generate random string
   */
  generateRandomString: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * Check if string is email
   */
  isEmail: (str: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(str)
  },

  /**
   * Check if string is phone number
   */
  isPhoneNumber: (str: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(str.replace(/[\s\-\(\)]/g, ''))
  },

  /**
   * Format phone number
   */
  formatPhoneNumber: (str: string): string => {
    const cleaned = str.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return str
  },
}

/**
 * Validation utilities
 */
export const validationUtils = {
  /**
   * Check if value is empty
   */
  isEmpty: (value: any): boolean => {
    if (value == null) return true
    if (typeof value === 'string') return value.trim().length === 0
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  },

  /**
   * Check if value is valid email
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * Check if password is strong
   */
  isStrongPassword: (password: string): boolean => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  },

  /**
   * Get password strength score (0-4)
   */
  getPasswordStrength: (password: string): number => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
    return Math.min(score, 4)
  },

  /**
   * Check if URL is valid
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  /**
   * Check if value is numeric
   */
  isNumeric: (value: string): boolean => {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value))
  },

  /**
   * Check if value is within range
   */
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max
  },
}

/**
 * Array utilities
 */
export const arrayUtils = {
  /**
   * Remove duplicates from array
   */
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)]
  },

  /**
   * Group array by key
   */
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  /**
   * Sort array by key
   */
  sortBy: <T, K extends keyof T>(array: T[], key: K, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  },

  /**
   * Shuffle array
   */
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  },
}

/**
 * Object utilities
 */
export const objectUtils = {
  /**
   * Deep clone object
   */
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  },

  /**
   * Pick specific keys from object
   */
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key]
      }
    })
    return result
  },

  /**
   * Omit specific keys from object
   */
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj }
    keys.forEach(key => {
      delete result[key]
    })
    return result
  },

  /**
   * Check if object has nested property
   */
  hasNestedProperty: (obj: any, path: string): boolean => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined
    }, obj) !== undefined
  },

  /**
   * Get nested property value
   */
  getNestedProperty: (obj: any, path: string, defaultValue?: any): any => {
    const value = path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
    return value !== undefined ? value : defaultValue
  },
}

/**
 * File utilities
 */
export const fileUtils = {
  /**
   * Format file size
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Get file extension
   */
  getFileExtension: (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
  },

  /**
   * Check if file is image
   */
  isImageFile: (filename: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    const extension = fileUtils.getFileExtension(filename).toLowerCase()
    return imageExtensions.includes(extension)
  },

  /**
   * Check if file is video
   */
  isVideoFile: (filename: string): boolean => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
    const extension = fileUtils.getFileExtension(filename).toLowerCase()
    return videoExtensions.includes(extension)
  },

  /**
   * Check if file is document
   */
  isDocumentFile: (filename: string): boolean => {
    const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
    const extension = fileUtils.getFileExtension(filename).toLowerCase()
    return docExtensions.includes(extension)
  },
}

/**
 * Local storage utilities
 */
export const storageUtils = {
  /**
   * Set item in localStorage with JSON serialization
   */
  setItem: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  },

  /**
   * Get item from localStorage with JSON parsing
   */
  getItem: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue || null
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },

  /**
   * Clear all localStorage
   */
  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Sleep function for async operations
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Download file from blob
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Calculate reading time for text
 */
export const calculateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Get contrast color (black or white) for background
 */
export const getContrastColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#FFFFFF'
}