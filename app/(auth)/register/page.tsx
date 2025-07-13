"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { authApi } from '@/lib/api/auth'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  GraduationCap, 
  Mail, 
  Lock, 
  Phone, 
  Calendar,
  Globe,
  Languages,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface RegistrationStep {
  id: number
  title: string
  description: string
}

const registrationSteps: RegistrationStep[] = [
  {
    id: 1,
    title: "Choose Your Role",
    description: "Select whether you're here to learn or teach"
  },
  {
    id: 2,
    title: "Basic Information",
    description: "Tell us about yourself"
  },
  {
    id: 3,
    title: "Account Security",
    description: "Create a secure password"
  },
  {
    id: 4,
    title: "Profile Details",
    description: "Complete your profile setup"
  },
  {
    id: 5,
    title: "Terms & Verification",
    description: "Accept terms and verify your email"
  }
]

const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
  'Geography', 'Computer Science', 'Programming', 'Web Development',
  'Data Science', 'Machine Learning', 'Languages', 'Music', 'Art'
]

const languages = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Hindi'
]

const timezones = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00',
  'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00',
  'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00', 'UTC+02:00',
  'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+06:00', 'UTC+07:00',
  'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
]

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'student' | 'tutor' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [] as string[]
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      role: undefined,
      termsAccepted: false,
      marketingConsent: false,
      timezone: 'UTC+00:00',
      language: 'en'
    }
  })

  const watchedPassword = watch('password')
  const watchedRole = watch('role')

  // Update password strength when password changes
  React.useEffect(() => {
    if (watchedPassword) {
      const score = calculatePasswordStrength(watchedPassword)
      setPasswordStrength(score)
    }
  }, [watchedPassword])

  // Update selected role when form value changes
  React.useEffect(() => {
    if (watchedRole) {
      setSelectedRole(watchedRole)
    }
  }, [watchedRole])

  const calculatePasswordStrength = (password: string) => {
    let score = 0
    const feedback: string[] = []

    if (password.length >= 8) score += 1
    else feedback.push('At least 8 characters')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('One uppercase letter')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('One lowercase letter')

    if (/\d/.test(password)) score += 1
    else feedback.push('One number')

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else feedback.push('One special character')

    return { score, feedback }
  }

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500'
    if (score <= 3) return 'bg-yellow-500'
    if (score <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'Weak'
    if (score <= 3) return 'Fair'
    if (score <= 4) return 'Good'
    return 'Strong'
  }

  const handleRoleSelect = (role: 'student' | 'tutor') => {
    setSelectedRole(role)
    setValue('role', role)
    trigger('role')
  }

  const handleSubjectToggle = (subject: string) => {
    const newSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject]
    
    setSelectedSubjects(newSubjects)
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['role']
        break
      case 2:
        fieldsToValidate = ['firstName', 'lastName', 'email', 'phone']
        break
      case 3:
        fieldsToValidate = ['password', 'confirmPassword']
        break
      case 4:
        fieldsToValidate = ['dateOfBirth']
        break
      case 5:
        fieldsToValidate = ['termsAccepted']
        break
    }

    const isStepValid = await trigger(fieldsToValidate)
    
    if (isStepValid && currentStep < registrationSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    
    try {
      const response = await authApi.register({
        ...data,
        subjects: selectedRole === 'tutor' ? selectedSubjects : undefined,
        preferredSubjects: selectedRole === 'student' ? selectedSubjects : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined
      })

      if (response.success) {
        // Simulate email verification
        setEmailVerificationSent(true)
        
        // In a real app, you would redirect after email verification
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        // Handle registration error
        console.error('Registration failed:', response.error)
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Role
              </h2>
              <p className="text-gray-600">
                Are you here to learn or teach? Select the option that best describes you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('student')}
                className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                  selectedRole === 'student'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-full ${
                    selectedRole === 'student' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <User className={`h-8 w-8 ${
                      selectedRole === 'student' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Student</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      I want to learn from expert tutors
                    </p>
                  </div>
                  {selectedRole === 'student' && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('tutor')}
                className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                  selectedRole === 'tutor'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-full ${
                    selectedRole === 'tutor' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <GraduationCap className={`h-8 w-8 ${
                      selectedRole === 'tutor' ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Tutor</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      I want to teach and share my knowledge
                    </p>
                  </div>
                  {selectedRole === 'tutor' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </button>
            </div>

            {errors.role && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.role.message}</span>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Basic Information
              </h2>
              <p className="text-gray-600">
                Tell us about yourself so we can personalize your experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Enter your first name"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.firstName?.message}
                {...register('firstName')}
                required
              />

              <Input
                label="Last Name"
                placeholder="Enter your last name"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.lastName?.message}
                {...register('lastName')}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              leftIcon={<Phone className="h-4 w-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('timezone')}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('language')}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Account Security
              </h2>
              <p className="text-gray-600">
                Create a strong password to protect your account.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                  required
                />

                {watchedPassword && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-600' :
                        passwordStrength.score <= 3 ? 'text-yellow-600' :
                        passwordStrength.score <= 4 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {getPasswordStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="text-xs text-gray-600">
                        Missing: {passwordStrength.feedback.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                required
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Profile Details
              </h2>
              <p className="text-gray-600">
                Complete your profile to get the best experience.
              </p>
            </div>

            <Input
              label="Date of Birth"
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
              required
            />

            {selectedRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {selectedRole === 'tutor' ? 'Subjects You Can Teach' : 'Subjects You Want to Learn'}
                  <span className="text-gray-500 ml-1">(Select up to 5)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {subjects.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleSubjectToggle(subject)}
                      disabled={!selectedSubjects.includes(subject) && selectedSubjects.length >= 5}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        selectedSubjects.includes(subject)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {selectedSubjects.length}/5
                </p>
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Terms & Verification
              </h2>
              <p className="text-gray-600">
                Review and accept our terms to complete your registration.
              </p>
            </div>

            {!emailVerificationSent ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Terms and Conditions</h3>
                  <div className="text-sm text-gray-600 space-y-2 max-h-32 overflow-y-auto">
                    <p>By creating an account, you agree to our terms of service and privacy policy.</p>
                    <p>• You must be at least 13 years old to use this platform</p>
                    <p>• You are responsible for maintaining account security</p>
                    <p>• You agree to use the platform respectfully and lawfully</p>
                    <p>• We may suspend accounts that violate our community guidelines</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      {...register('termsAccepted')}
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      {...register('marketingConsent')}
                    />
                    <span className="text-sm text-gray-700">
                      I would like to receive updates about new features and educational content
                    </span>
                  </label>
                </div>

                {errors.termsAccepted && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.termsAccepted.message}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Registration Successful!
                  </h3>
                  <p className="text-gray-600 mt-2">
                    We've sent a verification email to your address. Please check your inbox and click the verification link to activate your account.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Redirecting to dashboard in a few seconds...
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">TutorPlatform</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {registrationSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep > step.id
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  {index < registrationSteps.length - 1 && (
                    <div className={`w-12 h-0.5 ml-2 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">
                {registrationSteps[currentStep - 1]?.title}
              </h3>
              <p className="text-sm text-gray-600">
                {registrationSteps[currentStep - 1]?.description}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            {!emailVerificationSent && (
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                {currentStep < registrationSteps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!selectedRole && currentStep === 1}
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    loading={isLoading}
                    loadingText="Creating Account..."
                    disabled={!isValid}
                    className="flex items-center space-x-2"
                  >
                    <span>Create Account</span>
                  </Button>
                )}
              </div>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}