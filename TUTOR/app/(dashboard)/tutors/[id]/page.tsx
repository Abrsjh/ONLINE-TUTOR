'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, Clock, MapPin, Globe, Award, BookOpen, Calendar, Heart, Share2, MessageCircle, Video, CheckCircle, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter, CardBadge } from '@/components/ui/card'
import { tutorAPI, type TutorWithUser } from '@/lib/api/tutors'
import { db, type Review, type Session } from '@/lib/db/index'
import { cn, dateUtils, currencyUtils, stringUtils } from '@/lib/utils'

interface TutorProfilePageProps {}

interface SimilarTutor {
  id: number
  name: string
  title: string
  rating: number
  hourlyRate: number
  subjects: string[]
  avatar?: string
  totalSessions: number
}

interface ReviewWithUser extends Review {
  studentName: string
  studentAvatar?: string
}

const TutorProfilePage: React.FC<TutorProfilePageProps> = () => {
  const params = useParams()
  const router = useRouter()
  const tutorId = parseInt(params.id as string)

  // State management
  const [tutor, setTutor] = useState<TutorWithUser | null>(null)
  const [reviews, setReviews] = useState<ReviewWithUser[]>([])
  const [similarTutors, setSimilarTutors] = useState<SimilarTutor[]>([])
  const [upcomingAvailability, setUpcomingAvailability] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'availability'>('overview')

  // Load tutor data
  useEffect(() => {
    const loadTutorData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load tutor profile
        const tutorData = await tutorAPI.getTutorById(tutorId)
        if (!tutorData) {
          setError('Tutor not found')
          return
        }
        setTutor(tutorData)

        // Set default subject
        if (tutorData.subjects.length > 0) {
          setSelectedSubject(tutorData.subjects[0])
        }

        // Load reviews
        const tutorReviews = await db.getReviewsByTutor(tutorId)
        const reviewsWithUsers = await Promise.all(
          tutorReviews.map(async (review) => {
            const student = await db.users.get(review.studentId)
            return {
              ...review,
              studentName: student ? `${student.firstName} ${student.lastName}` : 'Anonymous',
              studentAvatar: student?.avatar
            }
          })
        )
        setReviews(reviewsWithUsers.slice(0, showAllReviews ? undefined : 5))

        // Load upcoming availability
        const availability = await tutorAPI.getUpcomingAvailability(tutorId, 14)
        setUpcomingAvailability(availability.slice(0, 12)) // Show next 12 slots

        // Load similar tutors
        const searchResult = await tutorAPI.searchTutors(
          { 
            subjects: tutorData.subjects.slice(0, 2),
            minRating: Math.max(tutorData.averageRating - 1, 0)
          },
          { limit: 6 }
        )
        const similar = searchResult.tutors
          .filter(t => t.id !== tutorId)
          .slice(0, 4)
          .map(t => ({
            id: t.id!,
            name: `${t.user.firstName} ${t.user.lastName}`,
            title: t.title,
            rating: t.averageRating,
            hourlyRate: t.hourlyRate,
            subjects: t.subjects,
            avatar: t.user.avatar,
            totalSessions: t.totalSessions
          }))
        setSimilarTutors(similar)

        // Check if tutor is in favorites (mock implementation)
        const favorites = JSON.parse(localStorage.getItem('favoriteTutors') || '[]')
        setIsFavorite(favorites.includes(tutorId))

      } catch (err) {
        console.error('Error loading tutor data:', err)
        setError('Failed to load tutor profile')
      } finally {
        setLoading(false)
      }
    }

    if (tutorId) {
      loadTutorData()
    }
  }, [tutorId, showAllReviews])

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteTutors') || '[]')
    let updatedFavorites

    if (isFavorite) {
      updatedFavorites = favorites.filter((id: number) => id !== tutorId)
    } else {
      updatedFavorites = [...favorites, tutorId]
    }

    localStorage.setItem('favoriteTutors', JSON.stringify(updatedFavorites))
    setIsFavorite(!isFavorite)
  }

  // Handle booking
  const handleBookSession = () => {
    const bookingData = {
      tutorId,
      subject: selectedSubject,
      tutorName: tutor ? `${tutor.user.firstName} ${tutor.user.lastName}` : '',
      hourlyRate: tutor?.hourlyRate || 0
    }
    localStorage.setItem('bookingData', JSON.stringify(bookingData))
    router.push('/dashboard/booking')
  }

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tutor?.user.firstName} ${tutor?.user.lastName} - Tutor Profile`,
          text: `Check out ${tutor?.user.firstName}'s tutoring profile`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href)
      // You could show a toast notification here
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error || !tutor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Tutor not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The tutor profile you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/dashboard/tutors')}>
              Browse Other Tutors
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tutorName = `${tutor.user.firstName} ${tutor.user.lastName}`
  const ratingStars = Array.from({ length: 5 }, (_, i) => i < Math.floor(tutor.averageRating))

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Tutors
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavoriteToggle}
            className={cn(
              "flex items-center gap-2",
              isFavorite && "text-red-600 border-red-200 bg-red-50"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tutor Header Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                {/* Background Pattern */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                
                {/* Profile Section */}
                <div className="relative px-6 pb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                        {tutor.user.avatar ? (
                          <img
                            src={tutor.user.avatar}
                            alt={tutorName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                            {stringUtils.getInitials(tutorName)}
                          </div>
                        )}
                      </div>
                      {tutor.isVerified && (
                        <CardBadge variant="success" position="bottom-right">
                          <CheckCircle className="h-3 w-3" />
                        </CardBadge>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{tutorName}</h1>
                        {tutor.isAvailableNow && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Available Now
                          </span>
                        )}
                      </div>
                      
                      <p className="text-lg text-gray-600 mb-3">{tutor.title}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{tutor.averageRating.toFixed(1)}</span>
                          <span>({tutor.reviewCount} reviews)</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{tutor.totalSessions} sessions</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{tutor.experience} years experience</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <span>{tutor.languages.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {currencyUtils.formatCurrency(tutor.hourlyRate, tutor.currency)}
                      </div>
                      <div className="text-sm text-gray-500">per hour</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Introduction */}
          {tutor.videoIntroUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Introduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <video
                    src={tutor.videoIntroUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster="/placeholder-video.jpg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpen },
                { id: 'reviews', label: 'Reviews', icon: Star },
                { id: 'availability', label: 'Availability', icon: Calendar }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={cn(
                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* About Section */}
              <Card>
                <CardHeader>
                  <CardTitle>About {tutor.user.firstName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {tutor.bio}
                  </p>
                </CardContent>
              </Card>

              {/* Subjects & Expertise */}
              <Card>
                <CardHeader>
                  <CardTitle>Subjects & Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {tutor.subjects.map((subject) => (
                      <div
                        key={subject}
                        className={cn(
                          "p-3 rounded-lg border text-center cursor-pointer transition-colors",
                          selectedSubject === subject
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => setSelectedSubject(subject)}
                      >
                        <div className="font-medium">{subject}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Education & Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Education & Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                    <p className="text-gray-700">{tutor.education}</p>
                  </div>
                  
                  {tutor.certifications.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
                      <ul className="space-y-1">
                        {tutor.certifications.map((cert, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Reviews Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Reviews</CardTitle>
                  <CardDescription>
                    Based on {tutor.reviewCount} reviews from verified students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        {tutor.averageRating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {ratingStars.map((filled, index) => (
                          <Star
                            key={index}
                            className={cn(
                              "h-4 w-4",
                              filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {tutor.reviewCount} reviews
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviews.filter(r => Math.floor(r.rating) === rating).length
                        const percentage = tutor.reviewCount > 0 ? (count / tutor.reviewCount) * 100 : 0
                        
                        return (
                          <div key={rating} className="flex items-center gap-2 mb-1">
                            <span className="text-sm w-8">{rating}★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-8">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Reviews */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                          {review.studentAvatar ? (
                            <img
                              src={review.studentAvatar}
                              alt={review.studentName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            stringUtils.getInitials(review.studentName)
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-900">{review.studentName}</div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "h-3 w-3",
                                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                      )}
                                    />
                                  ))}
                                </div>
                                <span>•</span>
                                <span>{dateUtils.getRelativeTime(review.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                          
                          {review.tutorResponse && (
                            <div className="bg-gray-50 rounded-lg p-3 mt-3">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                Response from {tutor.user.firstName}
                              </div>
                              <p className="text-sm text-gray-700">{review.tutorResponse}</p>
                              <div className="text-xs text-gray-500 mt-1">
                                {dateUtils.getRelativeTime(review.respondedAt!)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {reviews.length < tutor.reviewCount && !showAllReviews && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAllReviews(true)}
                    className="w-full"
                  >
                    Show All Reviews ({tutor.reviewCount})
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Availability
                </CardTitle>
                <CardDescription>
                  Next available time slots for booking sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAvailability.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {upcomingAvailability.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          localStorage.setItem('selectedTimeSlot', slot.toISOString())
                          handleBookSession()
                        }}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {dateUtils.isToday(slot) ? 'Today' : 
                           dateUtils.isTomorrow(slot) ? 'Tomorrow' :
                           dateUtils.formatDate(slot, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dateUtils.formatTime(slot)}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No upcoming availability slots found.</p>
                    <p className="text-sm">Please check back later or contact the tutor directly.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Book a Session</CardTitle>
              <CardDescription>
                Start learning with {tutor.user.firstName} today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {tutor.subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {currencyUtils.formatCurrency(tutor.hourlyRate, tutor.currency)}
                  </span>
                </div>
              </div>

              {/* Next Available */}
              {tutor.nextAvailableSlot && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Next available:</span>{' '}
                  {dateUtils.formatDateTime(tutor.nextAvailableSlot)}
                </div>
              )}
            </CardContent>
            <CardFooter className="space-y-2">
              <Button
                onClick={handleBookSession}
                className="w-full"
                disabled={!selectedSubject}
              >
                Book Session
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => {
                  // Navigate to chat or contact
                  router.push(`/dashboard/chat?tutor=${tutorId}`)
                }}
              >
                <MessageCircle className="h-4 w-4" />
                Send Message
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Response Time</span>
                <span className="font-medium">Within 2 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Repeat Students</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">On-time Rate</span>
                <span className="font-medium">98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Cancellation Rate</span>
                <span className="font-medium">2%</span>
              </div>
            </CardContent>
          </Card>

          {/* Similar Tutors */}
          {similarTutors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Similar Tutors
                </CardTitle>
                <CardDescription>
                  Other tutors you might like
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {similarTutors.map((similarTutor) => (
                  <div
                    key={similarTutor.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/tutors/${similarTutor.id}`)}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                      {similarTutor.avatar ? (
                        <img
                          src={similarTutor.avatar}
                          alt={similarTutor.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        stringUtils.getInitials(similarTutor.name)
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {similarTutor.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {similarTutor.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">
                            {similarTutor.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">
                          {currencyUtils.formatCurrency(similarTutor.hourlyRate)}/hr
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default TutorProfilePage