"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, fileUtils, dateUtils, stringUtils } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import {
  Search,
  Filter,
  Download,
  Eye,
  BookOpen,
  FileText,
  Video,
  Image,
  Music,
  Archive,
  Star,
  StarOff,
  Clock,
  CheckCircle,
  PlayCircle,
  Bookmark,
  BookmarkCheck,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Tag,
  FolderOpen,
  Plus,
  MoreVertical,
  Share,
  Trash2,
  Edit,
  Upload
} from 'lucide-react'

// Types for study materials
interface StudyMaterial {
  id: string
  title: string
  description: string
  type: 'document' | 'video' | 'audio' | 'image' | 'presentation' | 'quiz' | 'assignment'
  category: string
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  fileUrl: string
  thumbnailUrl?: string
  fileSize: number
  duration?: number // in minutes for video/audio
  pages?: number // for documents
  uploadedBy: {
    id: string
    name: string
    role: 'tutor' | 'admin'
  }
  uploadedAt: string
  lastModified: string
  tags: string[]
  isPublic: boolean
  downloadCount: number
  viewCount: number
  rating: number
  ratingCount: number
  isFavorited: boolean
  isCompleted: boolean
  completedAt?: string
  progress: number // 0-100
  estimatedReadTime?: number // in minutes
}

interface Collection {
  id: string
  name: string
  description: string
  materialIds: string[]
  createdAt: string
  isPublic: boolean
  color: string
}

interface StudyProgress {
  materialId: string
  progress: number
  completedAt?: string
  timeSpent: number // in minutes
  lastAccessedAt: string
  notes: string
}

// Mock data
const mockMaterials: StudyMaterial[] = [
  {
    id: '1',
    title: 'Introduction to Calculus',
    description: 'Comprehensive guide covering limits, derivatives, and basic integration techniques.',
    type: 'document',
    category: 'Mathematics',
    subject: 'Calculus',
    difficulty: 'beginner',
    fileUrl: '/materials/calculus-intro.pdf',
    thumbnailUrl: '/thumbnails/calculus-intro.jpg',
    fileSize: 2048000,
    pages: 45,
    uploadedBy: { id: 'tutor1', name: 'Dr. Sarah Johnson', role: 'tutor' },
    uploadedAt: '2024-01-15T10:00:00Z',
    lastModified: '2024-01-20T14:30:00Z',
    tags: ['calculus', 'mathematics', 'derivatives', 'limits'],
    isPublic: true,
    downloadCount: 156,
    viewCount: 342,
    rating: 4.7,
    ratingCount: 23,
    isFavorited: true,
    isCompleted: false,
    progress: 65,
    estimatedReadTime: 35
  },
  {
    id: '2',
    title: 'Physics: Motion and Forces',
    description: 'Video lecture series on Newtonian mechanics and force analysis.',
    type: 'video',
    category: 'Science',
    subject: 'Physics',
    difficulty: 'intermediate',
    fileUrl: '/materials/physics-motion.mp4',
    thumbnailUrl: '/thumbnails/physics-motion.jpg',
    fileSize: 524288000,
    duration: 45,
    uploadedBy: { id: 'tutor2', name: 'Prof. Michael Chen', role: 'tutor' },
    uploadedAt: '2024-01-10T09:15:00Z',
    lastModified: '2024-01-10T09:15:00Z',
    tags: ['physics', 'mechanics', 'forces', 'motion'],
    isPublic: true,
    downloadCount: 89,
    viewCount: 234,
    rating: 4.5,
    ratingCount: 18,
    isFavorited: false,
    isCompleted: true,
    completedAt: '2024-01-25T16:45:00Z',
    progress: 100
  },
  {
    id: '3',
    title: 'English Grammar Essentials',
    description: 'Interactive presentation covering fundamental grammar rules and common mistakes.',
    type: 'presentation',
    category: 'Language',
    subject: 'English',
    difficulty: 'beginner',
    fileUrl: '/materials/grammar-essentials.pptx',
    thumbnailUrl: '/thumbnails/grammar-essentials.jpg',
    fileSize: 15728640,
    pages: 32,
    uploadedBy: { id: 'tutor3', name: 'Ms. Emily Rodriguez', role: 'tutor' },
    uploadedAt: '2024-01-08T11:30:00Z',
    lastModified: '2024-01-12T13:20:00Z',
    tags: ['english', 'grammar', 'language', 'writing'],
    isPublic: true,
    downloadCount: 203,
    viewCount: 456,
    rating: 4.8,
    ratingCount: 31,
    isFavorited: true,
    isCompleted: false,
    progress: 25,
    estimatedReadTime: 20
  },
  {
    id: '4',
    title: 'Chemistry Lab Safety Quiz',
    description: 'Interactive quiz to test knowledge of laboratory safety procedures and protocols.',
    type: 'quiz',
    category: 'Science',
    subject: 'Chemistry',
    difficulty: 'beginner',
    fileUrl: '/materials/lab-safety-quiz',
    uploadedBy: { id: 'admin1', name: 'Admin Team', role: 'admin' },
    uploadedAt: '2024-01-05T14:00:00Z',
    lastModified: '2024-01-18T10:15:00Z',
    tags: ['chemistry', 'safety', 'laboratory', 'quiz'],
    isPublic: true,
    downloadCount: 67,
    viewCount: 189,
    rating: 4.3,
    ratingCount: 12,
    isFavorited: false,
    isCompleted: false,
    progress: 0,
    fileSize: 0
  },
  {
    id: '5',
    title: 'World History Timeline',
    description: 'Comprehensive timeline of major world events from ancient civilizations to modern times.',
    type: 'document',
    category: 'History',
    subject: 'World History',
    difficulty: 'intermediate',
    fileUrl: '/materials/world-history-timeline.pdf',
    thumbnailUrl: '/thumbnails/world-history.jpg',
    fileSize: 8388608,
    pages: 78,
    uploadedBy: { id: 'tutor4', name: 'Dr. James Wilson', role: 'tutor' },
    uploadedAt: '2024-01-03T16:45:00Z',
    lastModified: '2024-01-15T12:30:00Z',
    tags: ['history', 'timeline', 'civilizations', 'events'],
    isPublic: true,
    downloadCount: 134,
    viewCount: 298,
    rating: 4.6,
    ratingCount: 19,
    isFavorited: false,
    isCompleted: false,
    progress: 40,
    estimatedReadTime: 60
  }
]

const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Mathematics Fundamentals',
    description: 'Essential math concepts for beginners',
    materialIds: ['1'],
    createdAt: '2024-01-20T10:00:00Z',
    isPublic: false,
    color: '#3B82F6'
  },
  {
    id: '2',
    name: 'Science Basics',
    description: 'Introduction to physics and chemistry',
    materialIds: ['2', '4'],
    createdAt: '2024-01-18T14:30:00Z',
    isPublic: false,
    color: '#10B981'
  }
]

// Filter and sort options
const categories = ['All', 'Mathematics', 'Science', 'Language', 'History', 'Computer Science', 'Arts']
const subjects = ['All', 'Calculus', 'Physics', 'Chemistry', 'English', 'World History', 'Programming']
const difficulties = ['All', 'beginner', 'intermediate', 'advanced']
const types = ['All', 'document', 'video', 'audio', 'image', 'presentation', 'quiz', 'assignment']
const sortOptions = [
  { value: 'title', label: 'Title' },
  { value: 'uploadedAt', label: 'Upload Date' },
  { value: 'rating', label: 'Rating' },
  { value: 'viewCount', label: 'Views' },
  { value: 'downloadCount', label: 'Downloads' },
  { value: 'progress', label: 'Progress' }
]

export default function LibraryPage() {
  const { user, isAuthenticated } = useAuth()
  
  // State management
  const [materials, setMaterials] = useState<StudyMaterial[]>(mockMaterials)
  const [collections, setCollections] = useState<Collection[]>(mockCollections)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [sortBy, setSortBy] = useState('uploadedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showCompletedOnly, setShowCompletedOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // File type icons
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5" />
      case 'video':
        return <Video className="h-5 w-5" />
      case 'audio':
        return <Music className="h-5 w-5" />
      case 'image':
        return <Image className="h-5 w-5" />
      case 'presentation':
        return <BookOpen className="h-5 w-5" />
      case 'quiz':
      case 'assignment':
        return <Archive className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  // Difficulty badge colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Filter and sort materials
  const filteredAndSortedMaterials = useMemo(() => {
    let filtered = materials

    // Apply collection filter
    if (selectedCollection) {
      const collection = collections.find(c => c.id === selectedCollection)
      if (collection) {
        filtered = filtered.filter(material => collection.materialIds.includes(material.id))
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(query) ||
        material.description.toLowerCase().includes(query) ||
        material.tags.some(tag => tag.toLowerCase().includes(query)) ||
        material.category.toLowerCase().includes(query) ||
        material.subject.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(material => material.category === selectedCategory)
    }

    // Apply subject filter
    if (selectedSubject !== 'All') {
      filtered = filtered.filter(material => material.subject === selectedSubject)
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(material => material.difficulty === selectedDifficulty)
    }

    // Apply type filter
    if (selectedType !== 'All') {
      filtered = filtered.filter(material => material.type === selectedType)
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(material => material.isFavorited)
    }

    // Apply completed filter
    if (showCompletedOnly) {
      filtered = filtered.filter(material => material.isCompleted)
    }

    // Sort materials
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof StudyMaterial]
      let bValue: any = b[sortBy as keyof StudyMaterial]

      // Handle nested properties
      if (sortBy === 'uploadedAt' || sortBy === 'lastModified') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [
    materials,
    collections,
    selectedCollection,
    searchQuery,
    selectedCategory,
    selectedSubject,
    selectedDifficulty,
    selectedType,
    showFavoritesOnly,
    showCompletedOnly,
    sortBy,
    sortOrder
  ])

  // Handle material actions
  const handleToggleFavorite = useCallback((materialId: string) => {
    setMaterials(prev => prev.map(material =>
      material.id === materialId
        ? { ...material, isFavorited: !material.isFavorited }
        : material
    ))
  }, [])

  const handleMarkComplete = useCallback((materialId: string) => {
    setMaterials(prev => prev.map(material =>
      material.id === materialId
        ? {
            ...material,
            isCompleted: !material.isCompleted,
            completedAt: !material.isCompleted ? new Date().toISOString() : undefined,
            progress: !material.isCompleted ? 100 : material.progress
          }
        : material
    ))
  }, [])

  const handleDownload = useCallback(async (material: StudyMaterial) => {
    try {
      setIsLoading(true)
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update download count
      setMaterials(prev => prev.map(m =>
        m.id === material.id
          ? { ...m, downloadCount: m.downloadCount + 1 }
          : m
      ))
      
      // In a real app, you would trigger the actual download here
      console.log('Downloading:', material.title)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePreview = useCallback((material: StudyMaterial) => {
    // Update view count
    setMaterials(prev => prev.map(m =>
      m.id === material.id
        ? { ...m, viewCount: m.viewCount + 1 }
        : m
    ))
    
    // In a real app, you would open a preview modal or navigate to preview page
    console.log('Previewing:', material.title)
  }, [])

  const handleAddToCollection = useCallback((materialId: string, collectionId: string) => {
    setCollections(prev => prev.map(collection =>
      collection.id === collectionId
        ? {
            ...collection,
            materialIds: collection.materialIds.includes(materialId)
              ? collection.materialIds.filter(id => id !== materialId)
              : [...collection.materialIds, materialId]
          }
        : collection
    ))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('All')
    setSelectedSubject('All')
    setSelectedDifficulty('All')
    setSelectedType('All')
    setSelectedCollection(null)
    setShowFavoritesOnly(false)
    setShowCompletedOnly(false)
  }, [])

  // Material card component
  const MaterialCard = ({ material }: { material: StudyMaterial }) => (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-lg",
      material.isCompleted && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50"
    )}>
      {/* Thumbnail/Icon */}
      <div className="relative">
        {material.thumbnailUrl ? (
          <img
            src={material.thumbnailUrl}
            alt={material.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-t-lg flex items-center justify-center">
            <div className="text-blue-500 dark:text-blue-400">
              {getFileIcon(material.type)}
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            getDifficultyColor(material.difficulty)
          )}>
            {stringUtils.capitalize(material.difficulty)}
          </span>
        </div>
        
        <div className="absolute top-2 right-2 flex gap-1">
          {material.isCompleted && (
            <div className="bg-green-500 text-white p-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white/80 hover:bg-white dark:bg-black/80 dark:hover:bg-black"
            onClick={() => handleToggleFavorite(material.id)}
          >
            {material.isFavorited ? (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Progress bar */}
        {material.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm">
            <div className="h-1 bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${material.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {material.title}
          </CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {getFileIcon(material.type)}
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {material.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Metadata */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {material.uploadedBy.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateUtils.formatDate(material.uploadedAt)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {material.category}
            </span>
            <span>
              {fileUtils.formatFileSize(material.fileSize)}
            </span>
          </div>

          {material.estimatedReadTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {material.estimatedReadTime} min read
            </div>
          )}

          {material.duration && (
            <div className="flex items-center gap-1">
              <PlayCircle className="h-3 w-3" />
              {material.duration} min
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {material.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-md"
            >
              {tag}
            </span>
          ))}
          {material.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-muted-foreground">
              +{material.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(material.rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300 dark:text-gray-600"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {material.rating} ({material.ratingCount})
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handlePreview(material)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleDownload(material)}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkComplete(material.id)}
          >
            {material.isCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  // List view component
  const MaterialListItem = ({ material }: { material: StudyMaterial }) => (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {/* Icon/Thumbnail */}
        <div className="flex-shrink-0">
          {material.thumbnailUrl ? (
            <img
              src={material.thumbnailUrl}
              alt={material.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-lg flex items-center justify-center">
              <div className="text-blue-500 dark:text-blue-400">
                {getFileIcon(material.type)}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {material.title}
              </h3>
              <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                {material.description}
              </p>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{material.category}</span>
                <span>{material.uploadedBy.name}</span>
                <span>{dateUtils.formatDate(material.uploadedAt)}</span>
                <span>{fileUtils.formatFileSize(material.fileSize)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleFavorite(material.id)}
              >
                {material.isFavorited ? (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreview(material)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(material)}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {material.progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{material.progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${material.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Study Materials Library</h1>
          <p className="text-muted-foreground mt-2">
            Access your learning resources and track your progress
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search materials by title, description, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(selectedCategory !== 'All' || selectedSubject !== 'All' || selectedDifficulty !== 'All' || selectedType !== 'All' || showFavoritesOnly || showCompletedOnly) && (
              <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                !
              </span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty === 'All' ? difficulty : stringUtils.capitalize(difficulty)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {types.map(type => (
                    <option key={type} value={type}>
                      {type === 'All' ? type : stringUtils.capitalize(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Favorites only</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompletedOnly}
                  onChange={(e) => setShowCompletedOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Completed only</span>
              </label>

              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          </Card>
        )}

        {/* Collections */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCollection === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCollection(null)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            All Materials
          </Button>
          {collections.map(collection => (
            <Button
              key={collection.id}
              variant={selectedCollection === collection.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCollection(collection.id)}
              className="whitespace-nowrap"
            >
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: collection.color }}
              />
              {collection.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedMaterials.length} materials found
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border rounded-md bg-background text-sm"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                Sort by {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          {/* View Mode */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Materials Grid/List */}
      {filteredAndSortedMaterials.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No materials found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or filters
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear all filters
          </Button>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        )}>
          {filteredAndSortedMaterials.map(material => (
            viewMode === 'grid' ? (
              <MaterialCard key={material.id} material={material} />
            ) : (
              <MaterialListItem key={material.id} material={material} />
            )
          ))}
        </div>
      )}
    </div>
  )
}