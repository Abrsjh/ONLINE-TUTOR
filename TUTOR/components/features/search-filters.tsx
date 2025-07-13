"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Input, SearchInput } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign,
  BookOpen,
  Calendar,
  Users,
  Globe,
  Wifi,
  Home
} from "lucide-react"

// Types for filter state
export interface FilterState {
  search: string
  subjects: string[]
  priceRange: [number, number]
  rating: number
  availability: {
    days: string[]
    timeSlots: string[]
    timezone: string
  }
  location: {
    type: 'online' | 'in-person' | 'both'
    radius: number
    city: string
  }
  experience: string
  languages: string[]
  sessionType: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
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

// Mock data for filter options
const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
  'Geography', 'Computer Science', 'Programming', 'Web Development',
  'Data Science', 'Machine Learning', 'Spanish', 'French', 'German',
  'Music', 'Art', 'Psychology', 'Economics', 'Business', 'Accounting'
]

const languages = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Hindi'
]

const experienceLevels = [
  { value: '', label: 'Any Experience' },
  { value: '0-1', label: '0-1 years' },
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-10', label: '5-10 years' },
  { value: '10+', label: '10+ years' }
]

const sessionTypes = [
  'One-on-One', 'Group Sessions', 'Workshops', 'Test Prep', 
  'Homework Help', 'Project Guidance', 'Career Counseling'
]

const timeSlots = [
  'Early Morning (6-9 AM)', 'Morning (9-12 PM)', 'Afternoon (12-5 PM)',
  'Evening (5-8 PM)', 'Night (8-11 PM)', 'Late Night (11 PM-6 AM)'
]

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'price', label: 'Price' },
  { value: 'experience', label: 'Experience' },
  { value: 'availability', label: 'Availability' },
  { value: 'reviews', label: 'Number of Reviews' }
]

interface SearchFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onSearch?: (searchTerm: string) => void
  className?: string
  isLoading?: boolean
  resultCount?: number
  showResultCount?: boolean
}

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

// Collapsible section component
const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn("border rounded-lg", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t">
          {children}
        </div>
      )}
    </div>
  )
}

// Price range slider component
interface PriceRangeSliderProps {
  value: [number, number]
  onChange: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 200,
  step = 5
}) => {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1] - step)
    const newValue: [number, number] = [newMin, localValue[1]]
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0] + step)
    const newValue: [number, number] = [localValue[0], newMax]
    setLocalValue(newValue)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>${localValue[0]}/hr</span>
        <span>${localValue[1]}/hr</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={localValue[0]}
          onChange={(e) => handleMinChange(e)}
          min={min}
          max={localValue[1] - step}
          step={step}
          size="sm"
          className="w-20"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="number"
          value={localValue[1]}
          onChange={(e) => handleMaxChange(e)}
          min={localValue[0] + step}
          max={max}
          step={step}
          size="sm"
          className="w-20"
        />
      </div>
    </div>
  )
}

// Rating filter component
interface RatingFilterProps {
  value: number
  onChange: (rating: number) => void
}

const RatingFilter: React.FC<RatingFilterProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1, 0].map((rating) => (
        <label
          key={rating}
          className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
        >
          <input
            type="radio"
            name="rating"
            value={rating}
            checked={value === rating}
            onChange={() => onChange(rating)}
            className="sr-only"
          />
          <div className="flex items-center space-x-1">
            {rating === 0 ? (
              <span className="text-sm">Any Rating</span>
            ) : (
              <>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
                <span className="text-sm text-muted-foreground">& up</span>
              </>
            )}
          </div>
          {value === rating && (
            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
          )}
        </label>
      ))}
    </div>
  )
}

// Multi-select component
interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  maxDisplay?: number
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  maxDisplay = 3
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  const displayText = value.length === 0 
    ? placeholder
    : value.length <= maxDisplay
    ? value.join(', ')
    : `${value.slice(0, maxDisplay).join(', ')} +${value.length - maxDisplay} more`

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 border rounded-md bg-background hover:bg-muted/50 transition-colors"
      >
        <span className={cn(
          "text-sm truncate",
          value.length === 0 && "text-muted-foreground"
        )}>
          {displayText}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search options..."
              size="sm"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 p-2 hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Main SearchFilters component
export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  className,
  isLoading = false,
  resultCount,
  showResultCount = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  // Check if filters are active (different from default)
  useEffect(() => {
    const isActive = 
      filters.search !== defaultFilters.search ||
      filters.subjects.length > 0 ||
      filters.priceRange[0] !== defaultFilters.priceRange[0] ||
      filters.priceRange[1] !== defaultFilters.priceRange[1] ||
      filters.rating !== defaultFilters.rating ||
      filters.availability.days.length > 0 ||
      filters.availability.timeSlots.length > 0 ||
      filters.location.type !== defaultFilters.location.type ||
      filters.location.city !== defaultFilters.location.city ||
      filters.experience !== defaultFilters.experience ||
      filters.languages.length > 0 ||
      filters.sessionType.length > 0

    setHasActiveFilters(isActive)
  }, [filters])

  // Update filter state
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates })
  }, [filters, onFiltersChange])

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange(defaultFilters)
  }

  // Handle search
  const handleSearch = (searchTerm: string) => {
    updateFilters({ search: searchTerm })
    onSearch?.(searchTerm)
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Search Bar */}
      <div className="space-y-2">
        <SearchInput
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          onSearch={handleSearch}
          placeholder="Search tutors, subjects, or skills..."
          loading={isLoading}
          size="lg"
        />
        
        {/* Results count and filter toggle */}
        <div className="flex items-center justify-between">
          {showResultCount && resultCount !== undefined && (
            <span className="text-sm text-muted-foreground">
              {resultCount} {resultCount === 1 ? 'tutor' : 'tutors'} found
            </span>
          )}
          
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Filters
              {hasActiveFilters && (
                <div className="ml-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="space-y-4 border-t pt-4">
          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              className="flex-1 p-2 border rounded-md bg-background text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ 
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
              })}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          {/* Subjects Filter */}
          <CollapsibleSection
            title="Subjects"
            icon={<BookOpen className="h-4 w-4" />}
            defaultOpen={filters.subjects.length > 0}
          >
            <div className="pt-3">
              <MultiSelect
                options={subjects}
                value={filters.subjects}
                onChange={(subjects) => updateFilters({ subjects })}
                placeholder="Select subjects..."
              />
            </div>
          </CollapsibleSection>

          {/* Price Range Filter */}
          <CollapsibleSection
            title="Price Range"
            icon={<DollarSign className="h-4 w-4" />}
            defaultOpen={filters.priceRange[0] !== defaultFilters.priceRange[0] || 
                         filters.priceRange[1] !== defaultFilters.priceRange[1]}
          >
            <div className="pt-3">
              <PriceRangeSlider
                value={filters.priceRange}
                onChange={(priceRange) => updateFilters({ priceRange })}
              />
            </div>
          </CollapsibleSection>

          {/* Rating Filter */}
          <CollapsibleSection
            title="Rating"
            icon={<Star className="h-4 w-4" />}
            defaultOpen={filters.rating > 0}
          >
            <div className="pt-3">
              <RatingFilter
                value={filters.rating}
                onChange={(rating) => updateFilters({ rating })}
              />
            </div>
          </CollapsibleSection>

          {/* Availability Filter */}
          <CollapsibleSection
            title="Availability"
            icon={<Calendar className="h-4 w-4" />}
            defaultOpen={filters.availability.days.length > 0 || 
                         filters.availability.timeSlots.length > 0}
          >
            <div className="pt-3 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Days of Week</label>
                <MultiSelect
                  options={daysOfWeek}
                  value={filters.availability.days}
                  onChange={(days) => updateFilters({ 
                    availability: { ...filters.availability, days }
                  })}
                  placeholder="Select days..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Time Slots</label>
                <MultiSelect
                  options={timeSlots}
                  value={filters.availability.timeSlots}
                  onChange={(timeSlots) => updateFilters({ 
                    availability: { ...filters.availability, timeSlots }
                  })}
                  placeholder="Select time slots..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Timezone</label>
                <Input
                  value={filters.availability.timezone}
                  onChange={(e) => updateFilters({ 
                    availability: { ...filters.availability, timezone: e.target.value }
                  })}
                  placeholder="Enter timezone..."
                  size="sm"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Location Filter */}
          <CollapsibleSection
            title="Location"
            icon={<MapPin className="h-4 w-4" />}
            defaultOpen={filters.location.type !== defaultFilters.location.type || 
                         filters.location.city !== defaultFilters.location.city}
          >
            <div className="pt-3 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Session Type</label>
                <div className="flex space-x-2">
                  {[
                    { value: 'online', label: 'Online', icon: <Wifi className="h-4 w-4" /> },
                    { value: 'in-person', label: 'In-Person', icon: <Home className="h-4 w-4" /> },
                    { value: 'both', label: 'Both', icon: <Globe className="h-4 w-4" /> }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={filters.location.type === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ 
                        location: { ...filters.location, type: option.value as any }
                      })}
                      className="flex-1"
                    >
                      {option.icon}
                      <span className="ml-1">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {filters.location.type !== 'online' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">City</label>
                    <Input
                      value={filters.location.city}
                      onChange={(e) => updateFilters({ 
                        location: { ...filters.location, city: e.target.value }
                      })}
                      placeholder="Enter city..."
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Radius: {filters.location.radius} miles
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={filters.location.radius}
                      onChange={(e) => updateFilters({ 
                        location: { ...filters.location, radius: Number(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Experience Filter */}
          <CollapsibleSection
            title="Experience Level"
            icon={<Users className="h-4 w-4" />}
            defaultOpen={filters.experience !== defaultFilters.experience}
          >
            <div className="pt-3">
              <select
                value={filters.experience}
                onChange={(e) => updateFilters({ experience: e.target.value })}
                className="w-full p-2 border rounded-md bg-background text-sm"
              >
                {experienceLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </CollapsibleSection>

          {/* Languages Filter */}
          <CollapsibleSection
            title="Languages"
            icon={<Globe className="h-4 w-4" />}
            defaultOpen={filters.languages.length > 0}
          >
            <div className="pt-3">
              <MultiSelect
                options={languages}
                value={filters.languages}
                onChange={(languages) => updateFilters({ languages })}
                placeholder="Select languages..."
              />
            </div>
          </CollapsibleSection>

          {/* Session Type Filter */}
          <CollapsibleSection
            title="Session Types"
            icon={<Clock className="h-4 w-4" />}
            defaultOpen={filters.sessionType.length > 0}
          >
            <div className="pt-3">
              <MultiSelect
                options={sessionTypes}
                value={filters.sessionType}
                onChange={(sessionType) => updateFilters({ sessionType })}
                placeholder="Select session types..."
              />
            </div>
          </CollapsibleSection>
        </div>
      )}
    </Card>
  )
}

export default SearchFilters