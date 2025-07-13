"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SlidersHorizontal,
  Heart,
  Star,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Bookmark,
  Eye,
  MessageCircle,
  Calendar,
  AlertCircle,
  Loader2,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearch } from "@/hooks/use-search"
import { useAuth } from "@/hooks/use-auth"
import { TutorCard, TutorCardSkeleton } from "@/components/features/tutor-card"
import { SearchFilters, FilterState } from "@/components/features/search-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"

// Types for component state
interface ViewState {
  layout: 'grid' | 'list'
  showFilters: boolean
  selectedTutors: Set<string>
  favoriteLoading: Set<string>
  previewTutor: string | null
}

interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

// Default filter state
const defaultFilters: FilterState = {
  search: '',
  subjects: [],
  priceRange: [0, 200],
  rating: 0,
  availability: {
    days: [],
    timeSlots: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  },
  location: {
    type: 'both',
    radius: 25,
    city: ''
  },
  experience: '',
  languages: [],
  sessionType: [],
  sortBy: 'relevance',
  sortOrder: 'desc'
}

// Convert FilterState to TutorSearchFilters
const convertFiltersToSearchFilters = (filters: FilterState) => {
  return {
    subjects: filters.subjects.length > 0 ? filters.subjects : undefined,
    minRating: filters.rating > 0 ? filters.rating : undefined,
    minHourlyRate: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
    maxHourlyRate: filters.priceRange[1] < 200 ? filters.priceRange[1] : undefined,
    languages: filters.languages.length > 0 ? filters.languages : undefined,
    experience: filters.experience ? {
      min: parseInt(filters.experience.split('-')[0]) || 0,
      max: filters.experience.includes('+') ? undefined : parseInt(filters.experience.split('-')[1]) || undefined
    } : undefined,
    searchQuery: filters.search.trim() || undefined,
    location: filters.location.city || undefined
  }
}

export default function TutorsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // Initialize filters from URL params
  const initialFilters = useMemo(() => {
    const urlFilters = { ...defaultFilters }
    
    // Parse URL parameters
    const searchQuery = searchParams.get('search')
    const subject = searchParams.get('subject')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const rating = searchParams.get('rating')
    const sortBy = searchParams.get('sortBy')
    
    if (searchQuery) urlFilters.search = searchQuery
    if (subject) urlFilters.subjects = [subject]
    if (minPrice) urlFilters.priceRange[0] = parseInt(minPrice)
    if (maxPrice) urlFilters.priceRange[1] = parseInt(maxPrice)
    if (rating) urlFilters.rating = parseInt(rating)
    if (sortBy) urlFilters.sortBy = sortBy
    
    return urlFilters
  }, [searchParams])

  // Component state
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [viewState, setViewState] = useState<ViewState>({
    layout: 'grid',
    showFilters: false,
    selectedTutors: new Set(),
    favoriteLoading: new Set(),
    previewTutor: null
  })
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Search hook with converted filters
  const searchFilters = useMemo(() => convertFiltersToSearchFilters(filters), [filters])
  const searchOptions = useMemo(() => ({
    page: 1,
    limit: viewState.layout === 'grid' ? 12 : 20,
    sortBy: filters.sortBy as any,
    sortOrder: filters.sortOrder,
    includeUnavailable: false
  }), [filters.sortBy, filters.sortOrder, viewState.layout])

  const {
    results,
    isLoading,
    error,
    popularSubjects,
    featuredTutors,
    hasSearched,
    setQuery,
    setFilters: setSearchFilters,
    setOptions,
    executeSearch,
    refetch
  } = useSearch(searchFilters, searchOptions)

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('favorite-tutors')
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      }
    } catch (error) {
      console.warn('Failed to load favorites:', error)
    }
  }, [])

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('favorite-tutors', JSON.stringify(Array.from(favorites)))
    } catch (error) {
      console.warn('Failed to save favorites:', error)
    }
  }, [favorites])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.subjects.length > 0) params.set('subject', filters.subjects[0])
    if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString())
    if (filters.priceRange[1] < 200) params.set('maxPrice', filters.priceRange[1].toString())
    if (filters.rating > 0) params.set('rating', filters.rating.toString())
    if (filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy)
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    if (newUrl !== window.location.search) {
      router.replace(`/tutors${newUrl}`, { scroll: false })
    }
  }, [filters, router])

  // Update search when filters change
  useEffect(() => {
    const convertedFilters = convertFiltersToSearchFilters(filters)
    setSearchFilters(convertedFilters)
  }, [filters, setSearchFilters])

  // Handlers
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
    executeSearch()
  }, [executeSearch])

  const handleTutorBooking = useCallback((tutorId: string) => {
    if (!user) {
      toast.error('Please log in to book a session')
      router.push('/login')
      return
    }
    
    router.push(`/booking?tutorId=${tutorId}`)
  }, [user, router])

  const handleTutorFavorite = useCallback(async (tutorId: string, isFavorite: boolean) => {
    if (!user) {
      toast.error('Please log in to save favorites')
      return
    }

    setViewState(prev => ({
      ...prev,
      favoriteLoading: new Set([...prev.favoriteLoading, tutorId])
    }))

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setFavorites(prev => {
        const newFavorites = new Set(prev)
        if (isFavorite) {
          newFavorites.add(tutorId)
        } else {
          newFavorites.delete(tutorId)
        }
        return newFavorites
      })

      toast.success(isFavorite ? 'Added to favorites' : 'Removed from favorites')
    } catch (error) {
      toast.error('Failed to update favorites')
    } finally {
      setViewState(prev => ({
        ...prev,
        favoriteLoading: new Set([...prev.favoriteLoading].filter(id => id !== tutorId))
      }))
    }
  }, [user])

  const handleTutorPreview = useCallback((tutorId: string) => {
    setViewState(prev => ({ ...prev, previewTutor: tutorId }))
  }, [])

  const handleTutorMessage = useCallback((tutorId: string) => {
    if (!user) {
      toast.error('Please log in to send messages')
      router.push('/login')
      return
    }
    
    router.push(`/messages?tutorId=${tutorId}`)
  }, [user, router])

  const handleLayoutChange = useCallback((layout: 'grid' | 'list') => {
    setViewState(prev => ({ ...prev, layout }))
    
    // Update items per page based on layout
    const newLimit = layout === 'grid' ? 12 : 20
    setOptions({ limit: newLimit, page: 1 })
  }, [setOptions])

  const handlePageChange = useCallback((page: number) => {
    setOptions({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setOptions])

  const handleSubjectClick = useCallback((subject: string) => {
    setFilters(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject) 
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }, [])

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success('Results refreshed')
  }, [refetch])

  // Render helpers
  const renderHeader = () => (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Your Perfect Tutor</h1>
          <p className="text-muted-foreground mt-1">
            Discover expert tutors for any subject, available when you need them
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewState.layout === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLayoutChange('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewState.layout === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLayoutChange('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Popular subjects */}
      {!hasSearched && popularSubjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Popular subjects:</span>
          {popularSubjects.slice(0, 8).map((subject) => (
            <Button
              key={subject}
              variant="outline"
              size="sm"
              onClick={() => handleSubjectClick(subject)}
              className={cn(
                "h-7 text-xs",
                filters.subjects.includes(subject) && "bg-primary text-primary-foreground"
              )}
            >
              {subject}
            </Button>
          ))}
        </div>
      )}
    </div>
  )

  const renderFilters = () => (
    <div className={cn(
      "transition-all duration-300 overflow-hidden",
      viewState.showFilters ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
    )}>
      <SearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        isLoading={isLoading}
        resultCount={results?.total}
        showResultCount={true}
        className="mb-6"
      />
    </div>
  )

  const renderResultsHeader = () => {
    if (!hasSearched && !results) return null

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {results ? `${results.total} tutors found` : 'Search Results'}
          </h2>
          
          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to load results</span>
            </div>
          )}
        </div>

        {results && results.total > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {((searchOptions.page - 1) * searchOptions.limit) + 1}-
              {Math.min(searchOptions.page * searchOptions.limit, results.total)} of {results.total}
            </span>
          </div>
        )}
      </div>
    )
  }

  const renderTutorGrid = () => {
    if (isLoading) {
      return (
        <div className={cn(
          "grid gap-6",
          viewState.layout === 'grid' 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}>
          {Array.from({ length: searchOptions.limit }).map((_, index) => (
            <TutorCardSkeleton 
              key={index} 
              variant={viewState.layout === 'list' ? 'compact' : 'default'}
            />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load tutors</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the tutor results. Please try again.
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      )
    }

    if (!results || results.tutors.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tutors found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or filters to find more tutors.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setFilters(defaultFilters)}
          >
            Clear Filters
          </Button>
        </Card>
      )
    }

    return (
      <div className={cn(
        "grid gap-6",
        viewState.layout === 'grid' 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1"
      )}>
        {results.tutors.map((tutor) => (
          <TutorCard
            key={tutor.id}
            tutor={{
              id: tutor.id!.toString(),
              name: `${tutor.user.firstName} ${tutor.user.lastName}`,
              avatar: tutor.user.avatar || '/default-avatar.png',
              title: tutor.title,
              subjects: tutor.subjects,
              rating: tutor.averageRating,
              reviewCount: tutor.reviewCount,
              hourlyRate: tutor.hourlyRate,
              currency: '$',
              isOnline: tutor.isAvailableNow,
              responseTime: '< 1 hour',
              location: tutor.location || 'Online',
              languages: tutor.languages,
              totalStudents: tutor.totalStudents,
              completedSessions: tutor.totalSessions,
              yearsExperience: tutor.experience,
              isVerified: tutor.isVerified,
              nextAvailable: tutor.nextAvailableSlot?.toLocaleDateString() || 'Available now',
              bio: tutor.bio,
              specializations: tutor.specializations || [],
              videoIntroUrl: tutor.videoIntroUrl
            }}
            variant={viewState.layout === 'list' ? 'compact' : 'default'}
            isFavorite={favorites.has(tutor.id!.toString())}
            onBooking={handleTutorBooking}
            onFavorite={handleTutorFavorite}
            onQuickPreview={handleTutorPreview}
            onMessage={handleTutorMessage}
            className="cursor-pointer"
            onClick={() => router.push(`/tutors/${tutor.id}`)}
          />
        ))}
      </div>
    )
  }

  const renderPagination = () => {
    if (!results || results.totalPages <= 1) return null

    const currentPage = searchOptions.page
    const totalPages = results.totalPages
    const hasMore = results.hasMore

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1
            return (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            )
          })}
          
          {totalPages > 5 && (
            <>
              <span className="px-2">...</span>
              <Button
                variant={totalPages === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                className="w-8 h-8 p-0"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasMore}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const renderFeaturedTutors = () => {
    if (hasSearched || featuredTutors.length === 0) return null

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Featured Tutors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTutors.slice(0, 6).map((tutor) => (
            <TutorCard
              key={tutor.id}
              tutor={{
                id: tutor.id!.toString(),
                name: `${tutor.user.firstName} ${tutor.user.lastName}`,
                avatar: tutor.user.avatar || '/default-avatar.png',
                title: tutor.title,
                subjects: tutor.subjects,
                rating: tutor.averageRating,
                reviewCount: tutor.reviewCount,
                hourlyRate: tutor.hourlyRate,
                currency: '$',
                isOnline: tutor.isAvailableNow,
                responseTime: '< 1 hour',
                location: tutor.location || 'Online',
                languages: tutor.languages,
                totalStudents: tutor.totalStudents,
                completedSessions: tutor.totalSessions,
                yearsExperience: tutor.experience,
                isVerified: tutor.isVerified,
                nextAvailable: tutor.nextAvailableSlot?.toLocaleDateString() || 'Available now',
                bio: tutor.bio,
                specializations: tutor.specializations || [],
                videoIntroUrl: tutor.videoIntroUrl
              }}
              variant="default"
              isFavorite={favorites.has(tutor.id!.toString())}
              onBooking={handleTutorBooking}
              onFavorite={handleTutorFavorite}
              onQuickPreview={handleTutorPreview}
              onMessage={handleTutorMessage}
              className="cursor-pointer"
              onClick={() => router.push(`/tutors/${tutor.id}`)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {renderHeader()}
      {renderFilters()}
      {renderFeaturedTutors()}
      {renderResultsHeader()}
      {renderTutorGrid()}
      {renderPagination()}

      {/* Quick Preview Modal */}
      {viewState.previewTutor && (
        <Modal
          open={!!viewState.previewTutor}
          onOpenChange={(open) => !open && setViewState(prev => ({ ...prev, previewTutor: null }))}
          title="Tutor Preview"
          size="lg"
        >
          <div className="p-4">
            <p>Quick preview for tutor {viewState.previewTutor}</p>
            {/* Add video preview component here */}
          </div>
        </Modal>
      )}
    </div>
  )
}