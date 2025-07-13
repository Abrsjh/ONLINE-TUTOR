"use client"

import * as React from "react"
import { useState } from "react"
import { Heart, Star, Clock, MapPin, Video, MessageCircle, Eye, Calendar, Award, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardImage, 
  CardBadge 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface TutorCardProps {
  tutor: {
    id: string
    name: string
    avatar: string
    title: string
    subjects: string[]
    rating: number
    reviewCount: number
    hourlyRate: number
    currency: string
    isOnline: boolean
    responseTime: string
    location: string
    languages: string[]
    totalStudents: number
    completedSessions: number
    yearsExperience: number
    isVerified: boolean
    nextAvailable: string
    bio: string
    specializations: string[]
    videoIntroUrl?: string
  }
  onBooking?: (tutorId: string) => void
  onFavorite?: (tutorId: string, isFavorite: boolean) => void
  onQuickPreview?: (tutorId: string) => void
  onMessage?: (tutorId: string) => void
  isFavorite?: boolean
  variant?: "default" | "compact" | "detailed"
  showQuickActions?: boolean
  className?: string
}

export const TutorCard = React.forwardRef<HTMLDivElement, TutorCardProps>(
  ({
    tutor,
    onBooking,
    onFavorite,
    onQuickPreview,
    onMessage,
    isFavorite = false,
    variant = "default",
    showQuickActions = true,
    className,
    ...props
  }, ref) => {
    const [isHovered, setIsHovered] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [favoriteState, setFavoriteState] = useState(isFavorite)

    const handleFavoriteToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      const newFavoriteState = !favoriteState
      setFavoriteState(newFavoriteState)
      onFavorite?.(tutor.id, newFavoriteState)
    }

    const handleBooking = (e: React.MouseEvent) => {
      e.stopPropagation()
      onBooking?.(tutor.id)
    }

    const handleQuickPreview = (e: React.MouseEvent) => {
      e.stopPropagation()
      onQuickPreview?.(tutor.id)
    }

    const handleMessage = (e: React.MouseEvent) => {
      e.stopPropagation()
      onMessage?.(tutor.id)
    }

    const renderRating = () => (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3 w-3",
                i < Math.floor(tutor.rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : i < tutor.rating
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{tutor.rating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">
          ({tutor.reviewCount})
        </span>
      </div>
    )

    const renderAvailabilityStatus = () => (
      <div className="flex items-center gap-1">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            tutor.isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        />
        <span className="text-xs text-muted-foreground">
          {tutor.isOnline ? "Online" : `Next: ${tutor.nextAvailable}`}
        </span>
      </div>
    )

    const renderSubjects = () => (
      <div className="flex flex-wrap gap-1">
        {tutor.subjects.slice(0, variant === "compact" ? 2 : 3).map((subject) => (
          <span
            key={subject}
            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
          >
            {subject}
          </span>
        ))}
        {tutor.subjects.length > (variant === "compact" ? 2 : 3) && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            +{tutor.subjects.length - (variant === "compact" ? 2 : 3)}
          </span>
        )}
      </div>
    )

    const renderStats = () => (
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{tutor.totalStudents} students</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{tutor.responseTime}</span>
        </div>
        {variant === "detailed" && (
          <>
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              <span>{tutor.yearsExperience}y exp</span>
            </div>
            <div className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              <span>{tutor.completedSessions} sessions</span>
            </div>
          </>
        )}
      </div>
    )

    const renderQuickActions = () => (
      <div className="flex items-center gap-1">
        {tutor.videoIntroUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickPreview}
            className="h-8 w-8 p-0"
            title="Quick preview"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMessage}
          className="h-8 w-8 p-0"
          title="Send message"
        >
          <MessageCircle className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFavoriteToggle}
          className={cn(
            "h-8 w-8 p-0",
            favoriteState && "text-red-500 hover:text-red-600"
          )}
          title={favoriteState ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("h-3 w-3", favoriteState && "fill-current")} />
        </Button>
      </div>
    )

    if (variant === "compact") {
      return (
        <Card
          ref={ref}
          variant="interactive"
          hover="lift"
          className={cn("cursor-pointer transition-all duration-200", className)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...props}
        >
          <CardContent variant="compact">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="h-full w-full object-cover"
                    onLoad={() => setImageLoaded(true)}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-muted animate-pulse" />
                  )}
                </div>
                {tutor.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                )}
                {tutor.isVerified && (
                  <CardBadge
                    variant="success"
                    position="top-right"
                    className="h-4 w-4 p-0 text-[10px]"
                  >
                    ✓
                  </CardBadge>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{tutor.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{tutor.title}</p>
                    {renderRating()}
                  </div>
                  {showQuickActions && isHovered && (
                    <div className="flex-shrink-0">
                      {renderQuickActions()}
                    </div>
                  )}
                </div>
                
                <div className="mt-2 space-y-1">
                  {renderSubjects()}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {tutor.currency}{tutor.hourlyRate}/hr
                    </span>
                    <Button size="sm" onClick={handleBooking}>
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card
        ref={ref}
        variant="interactive"
        hover="lift"
        className={cn("cursor-pointer transition-all duration-200", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <div className="relative">
          <CardImage
            src={tutor.avatar}
            alt={tutor.name}
            aspectRatio="square"
            className="h-48"
          />
          
          {tutor.isOnline && (
            <CardBadge variant="success" position="top-left">
              Online
            </CardBadge>
          )}
          
          {tutor.isVerified && (
            <CardBadge variant="default" position="top-right">
              Verified
            </CardBadge>
          )}
          
          {showQuickActions && (
            <div
              className={cn(
                "absolute top-2 right-2 flex items-center gap-1 transition-opacity duration-200",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              {renderQuickActions()}
            </div>
          )}
        </div>

        <CardHeader variant="compact">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">{tutor.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{tutor.title}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {renderRating()}
            {renderAvailabilityStatus()}
          </div>
        </CardHeader>

        <CardContent variant="compact">
          <div className="space-y-3">
            {variant === "detailed" && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {tutor.bio}
              </p>
            )}
            
            {renderSubjects()}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{tutor.location}</span>
              <span>•</span>
              <span>{tutor.languages.join(", ")}</span>
            </div>
            
            {renderStats()}
            
            {variant === "detailed" && tutor.specializations.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">
                  Specializations
                </h4>
                <div className="flex flex-wrap gap-1">
                  {tutor.specializations.slice(0, 3).map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center rounded-full bg-secondary/50 px-2 py-1 text-xs text-secondary-foreground"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter variant="split">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              {tutor.currency}{tutor.hourlyRate}
            </span>
            <span className="text-sm text-muted-foreground">/hour</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMessage}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-3 w-3" />
              Message
            </Button>
            <Button
              size="sm"
              onClick={handleBooking}
              className="flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              Book Now
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }
)

TutorCard.displayName = "TutorCard"

// Skeleton component for loading states
export const TutorCardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "compact"
  }
>(({ className, variant = "default", ...props }, ref) => {
  if (variant === "compact") {
    return (
      <Card ref={ref} className={cn("animate-pulse", className)} {...props}>
        <CardContent variant="compact">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="flex gap-1">
                <div className="h-5 bg-muted rounded-full w-16" />
                <div className="h-5 bg-muted rounded-full w-20" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-16" />
                <div className="h-8 bg-muted rounded w-12" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card ref={ref} className={cn("animate-pulse", className)} {...props}>
      <div className="h-48 bg-muted rounded-t-lg" />
      <CardHeader variant="compact">
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent variant="compact">
        <div className="space-y-3">
          <div className="flex gap-1">
            <div className="h-6 bg-muted rounded-full w-16" />
            <div className="h-6 bg-muted rounded-full w-20" />
            <div className="h-6 bg-muted rounded-full w-14" />
          </div>
          <div className="h-3 bg-muted rounded w-full" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-3 bg-muted rounded" />
            <div className="h-3 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
      <CardFooter variant="split">
        <div className="h-6 bg-muted rounded w-16" />
        <div className="flex gap-2">
          <div className="h-8 bg-muted rounded w-16" />
          <div className="h-8 bg-muted rounded w-20" />
        </div>
      </CardFooter>
    </Card>
  )
})

TutorCardSkeleton.displayName = "TutorCardSkeleton"

export default TutorCard