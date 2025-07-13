"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  User, 
  Camera, 
  Save, 
  Calendar, 
  Clock, 
  Star, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Upload,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { cn, dateUtils, stringUtils, validationUtils } from '@/lib/utils'

// Validation schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  timezone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  linkedIn: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitter: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  sessionReminders: z.boolean(),
  assignmentDeadlines: z.boolean(),
  paymentUpdates: z.boolean(),
  marketingEmails: z.boolean(),
  weeklyDigest: z.boolean(),
})

const availabilitySchema = z.object({
  monday: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  tuesday: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  wednesday: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  thursday: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  friday: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  saturday: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  sunday: z.object({
    enabled: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
  }),
})

type PersonalInfoForm = z.infer<typeof personalInfoSchema>
type PasswordForm = z.infer<typeof passwordSchema>
type NotificationForm = z.infer<typeof notificationSchema>
type AvailabilityForm = z.infer<typeof availabilitySchema>

// Mock data for reviews and ratings
const mockReviews = [
  {
    id: '1',
    studentName: 'Sarah Johnson',
    rating: 5,
    comment: 'Excellent tutor! Very patient and explains concepts clearly.',
    date: '2024-01-15',
    subject: 'Mathematics'
  },
  {
    id: '2',
    studentName: 'Mike Chen',
    rating: 4,
    comment: 'Great teaching style and very knowledgeable.',
    date: '2024-01-10',
    subject: 'Physics'
  },
  {
    id: '3',
    studentName: 'Emily Davis',
    rating: 5,
    comment: 'Helped me improve my grades significantly!',
    date: '2024-01-05',
    subject: 'Chemistry'
  }
]

const ProfilePage = () => {
  const { user, updateUser, updateProfile, isTutor, isStudent } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form instances
  const personalForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      timezone: user?.timezone || 'America/New_York',
      website: user?.website || '',
      linkedIn: user?.linkedIn || '',
      twitter: user?.twitter || '',
    }
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  })

  const notificationForm = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: user?.preferences?.emailNotifications ?? true,
      pushNotifications: user?.preferences?.pushNotifications ?? true,
      smsNotifications: user?.preferences?.smsNotifications ?? false,
      sessionReminders: user?.preferences?.sessionReminders ?? true,
      assignmentDeadlines: user?.preferences?.assignmentDeadlines ?? true,
      paymentUpdates: user?.preferences?.paymentUpdates ?? true,
      marketingEmails: user?.preferences?.marketingEmails ?? false,
      weeklyDigest: user?.preferences?.weeklyDigest ?? true,
    }
  })

  const availabilityForm = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
      sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    }
  })

  // Load profile image on mount
  useEffect(() => {
    if (user?.profileImage) {
      setProfileImage(user.profileImage)
    }
  }, [user])

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setProfileImage(imageUrl)
        updateUser({ profileImage: imageUrl })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle personal info form submission
  const onPersonalInfoSubmit = async (data: PersonalInfoForm) => {
    try {
      updateUser(data)
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  // Handle password form submission
  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      // In a real app, this would call an API to change password
      console.log('Password change request:', { currentPassword: data.currentPassword })
      passwordForm.reset()
      alert('Password changed successfully!')
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    }
  }

  // Handle notification preferences submission
  const onNotificationSubmit = async (data: NotificationForm) => {
    try {
      updateUser({ preferences: data })
      alert('Notification preferences updated!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      alert('Failed to update preferences')
    }
  }

  // Handle availability submission
  const onAvailabilitySubmit = async (data: AvailabilityForm) => {
    try {
      updateProfile({ availability: data })
      alert('Availability updated successfully!')
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Failed to update availability')
    }
  }

  // Calculate average rating
  const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length
  const totalReviews = mockReviews.length

  // Tab navigation
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(isTutor ? [{ id: 'availability', label: 'Availability', icon: Calendar }] : []),
    ...(isTutor ? [{ id: 'reviews', label: 'Reviews', icon: Star }] : []),
    { id: 'account', label: 'Account Settings', icon: Settings },
  ]

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and profile information
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Profile Image Section */}
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors"
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                    <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>

                {/* Personal Info Form */}
                <form onSubmit={personalForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      {...personalForm.register('firstName')}
                      error={personalForm.formState.errors.firstName?.message}
                      disabled={!isEditing}
                      required
                    />
                    <Input
                      label="Last Name"
                      {...personalForm.register('lastName')}
                      error={personalForm.formState.errors.lastName?.message}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      {...personalForm.register('email')}
                      error={personalForm.formState.errors.email?.message}
                      disabled={!isEditing}
                      required
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      {...personalForm.register('phone')}
                      error={personalForm.formState.errors.phone?.message}
                      disabled={!isEditing}
                    />
                  </div>

                  <Textarea
                    label="Bio"
                    {...personalForm.register('bio')}
                    error={personalForm.formState.errors.bio?.message}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                    showCharCount
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Location"
                      {...personalForm.register('location')}
                      error={personalForm.formState.errors.location?.message}
                      disabled={!isEditing}
                      leftIcon={<MapPin className="h-4 w-4" />}
                    />
                    <div>
                      <label className="text-sm font-medium mb-2 block">Timezone</label>
                      <select
                        {...personalForm.register('timezone')}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background disabled:opacity-50"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Website"
                      type="url"
                      {...personalForm.register('website')}
                      error={personalForm.formState.errors.website?.message}
                      disabled={!isEditing}
                      leftIcon={<Globe className="h-4 w-4" />}
                      placeholder="https://yourwebsite.com"
                    />
                    <Input
                      label="LinkedIn"
                      type="url"
                      {...personalForm.register('linkedIn')}
                      error={personalForm.formState.errors.linkedIn?.message}
                      disabled={!isEditing}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <Input
                    label="Twitter Handle"
                    {...personalForm.register('twitter')}
                    error={personalForm.formState.errors.twitter?.message}
                    disabled={!isEditing}
                    placeholder="@username"
                  />

                  {isEditing && (
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          personalForm.reset()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <Input
                    label="Current Password"
                    type="password"
                    {...passwordForm.register('currentPassword')}
                    error={passwordForm.formState.errors.currentPassword?.message}
                    required
                  />

                  <Input
                    label="New Password"
                    type="password"
                    {...passwordForm.register('newPassword')}
                    error={passwordForm.formState.errors.newPassword?.message}
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    required
                  />

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Password Requirements:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters</li>
                      <li>• Contains at least one number</li>
                      <li>• Contains at least one special character</li>
                    </ul>
                  </div>

                  <Button type="submit">
                    <Shield className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Communication Preferences</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', icon: Mail },
                        { key: 'pushNotifications', label: 'Push Notifications', icon: Bell },
                        { key: 'smsNotifications', label: 'SMS Notifications', icon: Phone },
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <span>{label}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              {...notificationForm.register(key as keyof NotificationForm)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Activity Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'sessionReminders', label: 'Session Reminders' },
                        { key: 'assignmentDeadlines', label: 'Assignment Deadlines' },
                        { key: 'paymentUpdates', label: 'Payment Updates' },
                        { key: 'marketingEmails', label: 'Marketing Emails' },
                        { key: 'weeklyDigest', label: 'Weekly Digest' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span>{label}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              {...notificationForm.register(key as keyof NotificationForm)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit">
                    <Bell className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Availability Tab (Tutors only) */}
          {activeTab === 'availability' && isTutor && (
            <Card>
              <CardHeader>
                <CardTitle>Availability Calendar</CardTitle>
                <CardDescription>
                  Set your weekly availability for tutoring sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={availabilityForm.handleSubmit(onAvailabilitySubmit)} className="space-y-6">
                  <div className="space-y-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-20">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              {...availabilityForm.register(`${day}.enabled` as any)}
                              className="rounded"
                            />
                            <span className="font-medium capitalize">{day}</span>
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="time"
                            {...availabilityForm.register(`${day}.startTime` as any)}
                            disabled={!availabilityForm.watch(`${day}.enabled` as any)}
                            className="px-3 py-2 border rounded-md disabled:opacity-50"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            {...availabilityForm.register(`${day}.endTime` as any)}
                            disabled={!availabilityForm.watch(`${day}.enabled` as any)}
                            className="px-3 py-2 border rounded-md disabled:opacity-50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                          Important Note
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Changes to your availability will only affect future bookings. 
                          Existing sessions will not be affected.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button type="submit">
                    <Calendar className="h-4 w-4 mr-2" />
                    Update Availability
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Reviews Tab (Tutors only) */}
          {activeTab === 'reviews' && isTutor && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
                <CardDescription>
                  See what your students are saying about you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Rating Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{averageRating.toFixed(1)}</div>
                    <div className="flex justify-center items-center space-x-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= averageRating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Average Rating
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{totalReviews}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total Reviews
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">98%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Positive Feedback
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  <h4 className="font-medium">Recent Reviews</h4>
                  {mockReviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{review.studentName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {review.subject} • {dateUtils.formatDate(review.date)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                star <= review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Account Status</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your account is active and verified
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>

                {/* Data Export */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Download a copy of your account data
                    </p>
                  </div>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage