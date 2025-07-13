"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { authApi } from '@/lib/api/auth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const message = searchParams.get('message')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    clearErrors
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const watchedEmail = watch('email')
  const watchedPassword = watch('password')

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      const session = authApi.getCurrentSession()
      if (session) {
        const validation = await authApi.validateSession()
        if (validation.isValid) {
          router.replace(redirectTo)
        }
      }
    }
    
    checkExistingSession()
  }, [router, redirectTo])

  // Clear login error when user starts typing
  useEffect(() => {
    if (loginError && (watchedEmail || watchedPassword)) {
      setLoginError(null)
    }
  }, [watchedEmail, watchedPassword, loginError])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError(null)

    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password
      })

      if (response.success && response.data) {
        // Store remember me preference
        if (data.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberMe')
        }

        // Redirect based on user role
        const userRole = response.data.user.role
        let redirectUrl = redirectTo

        // Default redirects based on role if no specific redirect is provided
        if (redirectTo === '/dashboard') {
          switch (userRole) {
            case 'student':
              redirectUrl = '/dashboard'
              break
            case 'tutor':
              redirectUrl = '/dashboard'
              break
            case 'admin':
              redirectUrl = '/dashboard/analytics'
              break
            default:
              redirectUrl = '/dashboard'
          }
        }

        // Show success message briefly before redirect
        router.replace(redirectUrl)
      } else {
        setLoginError(response.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setSocialLoading(provider)
    
    try {
      // Mock social login - in real app, integrate with OAuth providers
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For demo purposes, create a mock social login
      const mockSocialUser = {
        email: `demo.${provider}@example.com`,
        firstName: 'Demo',
        lastName: 'User',
        role: 'student' as const,
        avatar: `https://ui-avatars.com/api/?name=Demo+User&background=random`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en'
      }

      // Check if user exists, if not create them
      const existingSession = authApi.getCurrentSession()
      if (!existingSession) {
        // In real app, handle OAuth flow here
        console.log(`Social login with ${provider} would be handled here`)
        setLoginError(`Social login with ${provider} is not yet implemented in this demo.`)
      }
    } catch (error) {
      console.error(`${provider} login error:`, error)
      setLoginError(`Failed to login with ${provider}. Please try again.`)
    } finally {
      setSocialLoading(null)
    }
  }

  const handleDemoLogin = async (role: 'student' | 'tutor' | 'admin') => {
    setIsLoading(true)
    setLoginError(null)

    // Demo credentials
    const demoCredentials = {
      student: { email: 'student@demo.com', password: 'Demo123!' },
      tutor: { email: 'tutor@demo.com', password: 'Demo123!' },
      admin: { email: 'admin@demo.com', password: 'Demo123!' }
    }

    const credentials = demoCredentials[role]
    
    // Fill form with demo credentials
    setValue('email', credentials.email)
    setValue('password', credentials.password)
    
    try {
      const response = await authApi.login(credentials)
      
      if (response.success && response.data) {
        const userRole = response.data.user.role
        let redirectUrl = '/dashboard'
        
        if (userRole === 'admin') {
          redirectUrl = '/dashboard/analytics'
        }
        
        router.replace(redirectUrl)
      } else {
        setLoginError(response.error || 'Demo login failed.')
      }
    } catch (error) {
      console.error('Demo login error:', error)
      setLoginError('Demo login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your tutoring account
          </p>
        </div>

        {/* Message from redirect */}
        {message && (
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Login Error */}
        {loginError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{loginError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Login Buttons */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600 font-medium">
            Quick Demo Access
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('student')}
              disabled={isLoading}
              className="text-xs"
            >
              Student
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('tutor')}
              disabled={isLoading}
              className="text-xs"
            >
              Tutor
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
              className="text-xs"
            >
              Admin
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Field */}
            <Input
              {...register('email')}
              type="email"
              label="Email address"
              placeholder="Enter your email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              disabled={isLoading}
              autoComplete="email"
              required
            />

            {/* Password Field */}
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter your password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isValid}
            loading={isLoading}
            loadingText="Signing in..."
          >
            Sign in
          </Button>
        </form>

        {/* Social Login */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign in with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {/* Google */}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading || socialLoading !== null}
              className="w-full"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
            </Button>

            {/* Facebook */}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('facebook')}
              disabled={isLoading || socialLoading !== null}
              className="w-full"
            >
              {socialLoading === 'facebook' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
            </Button>

            {/* Apple */}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('apple')}
              disabled={isLoading || socialLoading !== null}
              className="w-full"
            >
              {socialLoading === 'apple' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C8.396 0 8.025.044 8.025.044c0 0-.396.044-.396.044C4.747.044 2.85 2.72 2.85 5.13c0 2.409 1.897 5.086 4.777 5.086.396 0 .792-.044.792-.044s.396.044.792.044c2.88 0 4.777-2.677 4.777-5.086C13.988 2.72 12.091.044 12.017.044zM8.421 18.258c-.396 0-.792.044-.792.044s-.396-.044-.792-.044c-2.88 0-4.777 2.677-4.777 5.086 0 2.409 1.897 5.086 4.777 5.086.396 0 .792-.044.792-.044s.396.044.792.044c2.88 0 4.777-2.677 4.777-5.086 0-2.409-1.897-5.086-4.777-5.086z" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              Terms of Service
            </Link>
            <Link href="/help" className="hover:text-gray-700 transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}