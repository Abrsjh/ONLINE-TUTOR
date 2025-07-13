"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/lib/state/auth'
import { db, Assignment, AssignmentSubmission } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Star,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Bell,
  Send,
  Save,
  RotateCcw,
  FileIcon,
  Image,
  Video,
  Music,
  Archive
} from 'lucide-react'
import { format, isAfter, isBefore, differenceInDays, addDays } from 'date-fns'

// Types for assignment management
interface AssignmentWithDetails extends Assignment {
  tutorName?: string
  studentName?: string
  submission?: AssignmentSubmission
  isOverdue?: boolean
  daysUntilDue?: number
  progressPercentage?: number
}

interface AssignmentFilters {
  status: 'all' | 'assigned' | 'submitted' | 'graded' | 'overdue'
  subject: string
  dateRange: 'all' | 'week' | 'month' | 'overdue'
  search: string
}

interface FileUpload {
  file: File
  preview?: string
  type: 'document' | 'image' | 'video' | 'audio' | 'other'
}

const AssignmentsPage: React.FC = () => {
  const { user, isStudent, isTutor } = useAuthStore()
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithDetails | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [filters, setFilters] = useState<AssignmentFilters>({
    status: 'all',
    subject: '',
    dateRange: 'all',
    search: ''
  })

  // Form states
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxPoints: 100,
    studentId: '',
    sessionId: ''
  })

  const [submissionData, setSubmissionData] = useState({
    content: '',
    attachments: [] as FileUpload[]
  })

  const [gradingData, setGradingData] = useState({
    grade: 0,
    feedback: ''
  })

  // Load assignments on component mount
  useEffect(() => {
    loadAssignments()
  }, [user])

  const loadAssignments = async () => {
    if (!user) return

    try {
      setLoading(true)
      let assignmentsList: Assignment[] = []

      if (isStudent()) {
        assignmentsList = await db.getAssignmentsByStudent(user.id as any)
      } else if (isTutor()) {
        assignmentsList = await db.assignments.where('tutorId').equals(user.id as any).toArray()
      }

      // Enhance assignments with additional data
      const enhancedAssignments = await Promise.all(
        assignmentsList.map(async (assignment) => {
          const enhanced: AssignmentWithDetails = { ...assignment }

          // Get tutor and student names
          if (assignment.tutorId) {
            const tutor = await db.users.get(assignment.tutorId)
            enhanced.tutorName = tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown Tutor'
          }

          if (assignment.studentId) {
            const student = await db.users.get(assignment.studentId)
            enhanced.studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'
          }

          // Get submission if exists
          const submission = await db.assignmentSubmissions
            .where('assignmentId')
            .equals(assignment.id!)
            .first()
          enhanced.submission = submission

          // Calculate overdue status and days until due
          const now = new Date()
          const dueDate = new Date(assignment.dueDate)
          enhanced.isOverdue = isAfter(now, dueDate) && assignment.status !== 'submitted' && assignment.status !== 'graded'
          enhanced.daysUntilDue = differenceInDays(dueDate, now)

          // Calculate progress percentage
          if (assignment.status === 'graded') {
            enhanced.progressPercentage = 100
          } else if (assignment.status === 'submitted') {
            enhanced.progressPercentage = 75
          } else if (enhanced.isOverdue) {
            enhanced.progressPercentage = 0
          } else {
            // Calculate based on time remaining
            const totalDays = differenceInDays(dueDate, new Date(assignment.createdAt))
            const remainingDays = Math.max(0, enhanced.daysUntilDue)
            enhanced.progressPercentage = Math.max(0, Math.min(50, ((totalDays - remainingDays) / totalDays) * 50))
          }

          return enhanced
        })
      )

      setAssignments(enhancedAssignments)
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter assignments based on current filters
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'overdue' && !assignment.isOverdue) return false
        if (filters.status !== 'overdue' && assignment.status !== filters.status) return false
      }

      // Subject filter
      if (filters.subject && !assignment.title.toLowerCase().includes(filters.subject.toLowerCase())) {
        return false
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date()
        const dueDate = new Date(assignment.dueDate)
        
        if (filters.dateRange === 'week' && differenceInDays(dueDate, now) > 7) return false
        if (filters.dateRange === 'month' && differenceInDays(dueDate, now) > 30) return false
        if (filters.dateRange === 'overdue' && !assignment.isOverdue) return false
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        return (
          assignment.title.toLowerCase().includes(searchTerm) ||
          assignment.description.toLowerCase().includes(searchTerm) ||
          assignment.tutorName?.toLowerCase().includes(searchTerm) ||
          assignment.studentName?.toLowerCase().includes(searchTerm)
        )
      }

      return true
    })
  }, [assignments, filters])

  // Statistics for dashboard
  const stats = useMemo(() => {
    const total = assignments.length
    const completed = assignments.filter(a => a.status === 'graded').length
    const pending = assignments.filter(a => a.status === 'assigned').length
    const overdue = assignments.filter(a => a.isOverdue).length
    const avgGrade = assignments
      .filter(a => a.grade !== undefined)
      .reduce((sum, a) => sum + (a.grade || 0), 0) / Math.max(1, assignments.filter(a => a.grade !== undefined).length)

    return { total, completed, pending, overdue, avgGrade: Math.round(avgGrade) }
  }, [assignments])

  // Handle file upload
  const handleFileUpload = (files: FileList) => {
    const newFiles: FileUpload[] = Array.from(files).map(file => {
      const fileType = getFileType(file)
      const upload: FileUpload = { file, type: fileType }

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader()
        reader.onload = (e) => {
          upload.preview = e.target?.result as string
          setSubmissionData(prev => ({ ...prev, attachments: [...prev.attachments] }))
        }
        reader.readAsDataURL(file)
      }

      return upload
    })

    setSubmissionData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }))
  }

  const getFileType = (file: File): FileUpload['type'] => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document'
    return 'other'
  }

  const getFileIcon = (type: FileUpload['type']) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <FileIcon className="h-4 w-4" />
    }
  }

  // Handle assignment creation
  const handleCreateAssignment = async () => {
    if (!user || !isTutor()) return

    try {
      const assignment: Omit<Assignment, 'id'> = {
        tutorId: user.id as any,
        studentId: parseInt(newAssignment.studentId),
        sessionId: newAssignment.sessionId ? parseInt(newAssignment.sessionId) : undefined,
        title: newAssignment.title,
        description: newAssignment.description,
        instructions: newAssignment.instructions,
        dueDate: new Date(newAssignment.dueDate),
        maxPoints: newAssignment.maxPoints,
        status: 'assigned',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.assignments.add(assignment)
      await loadAssignments()
      setShowCreateModal(false)
      setNewAssignment({
        title: '',
        description: '',
        instructions: '',
        dueDate: '',
        maxPoints: 100,
        studentId: '',
        sessionId: ''
      })
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  // Handle assignment submission
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !user) return

    try {
      // Create submission record
      const submission: Omit<AssignmentSubmission, 'id'> = {
        assignmentId: selectedAssignment.id!,
        studentId: user.id as any,
        content: submissionData.content,
        attachments: submissionData.attachments.map(upload => upload.file.name),
        submittedAt: new Date(),
        isLate: selectedAssignment.isOverdue || false
      }

      await db.assignmentSubmissions.add(submission)

      // Update assignment status
      await db.assignments.update(selectedAssignment.id!, {
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date()
      })

      await loadAssignments()
      setShowSubmissionModal(false)
      setSubmissionData({ content: '', attachments: [] })
      setSelectedAssignment(null)
    } catch (error) {
      console.error('Error submitting assignment:', error)
    }
  }

  // Handle assignment grading
  const handleGradeAssignment = async () => {
    if (!selectedAssignment || !user) return

    try {
      await db.assignments.update(selectedAssignment.id!, {
        status: 'graded',
        grade: gradingData.grade,
        feedback: gradingData.feedback,
        gradedAt: new Date(),
        updatedAt: new Date()
      })

      await loadAssignments()
      setShowGradingModal(false)
      setGradingData({ grade: 0, feedback: '' })
      setSelectedAssignment(null)
    } catch (error) {
      console.error('Error grading assignment:', error)
    }
  }

  const getStatusColor = (status: Assignment['status'], isOverdue?: boolean) => {
    if (isOverdue) return 'text-red-600 bg-red-50'
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-50'
      case 'submitted': return 'text-yellow-600 bg-yellow-50'
      case 'graded': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: Assignment['status'], isOverdue?: boolean) => {
    if (isOverdue) return <XCircle className="h-4 w-4" />
    switch (status) {
      case 'assigned': return <Clock className="h-4 w-4" />
      case 'submitted': return <Upload className="h-4 w-4" />
      case 'graded': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">
            {isStudent() ? 'View and submit your assignments' : 'Create and manage assignments for your students'}
          </p>
        </div>
        {isTutor() && (
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isStudent() ? 'Average Grade' : 'Overdue'}
                </p>
                <p className={`text-2xl font-bold ${isStudent() ? 'text-blue-600' : 'text-red-600'}`}>
                  {isStudent() ? `${stats.avgGrade}%` : stats.overdue}
                </p>
              </div>
              {isStudent() ? (
                <Award className="h-8 w-8 text-blue-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search assignments..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                leftIcon={<Search className="h-4 w-4" />}
                clearable
                onClear={() => setFilters(prev => ({ ...prev, search: '' }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                placeholder="Filter by subject..."
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              <select
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              >
                <option value="all">All Dates</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
              <p className="text-muted-foreground">
                {assignments.length === 0 
                  ? "You don't have any assignments yet."
                  : "No assignments match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{assignment.title}</h3>
                        <p className="text-muted-foreground">{assignment.description}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status, assignment.isOverdue)}`}>
                        {getStatusIcon(assignment.status, assignment.isOverdue)}
                        {assignment.isOverdue ? 'Overdue' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</span>
                        {assignment.daysUntilDue !== undefined && assignment.daysUntilDue >= 0 && (
                          <span className="text-muted-foreground">
                            ({assignment.daysUntilDue} days left)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span>Max Points: {assignment.maxPoints}</span>
                        {assignment.grade !== undefined && (
                          <span className="font-medium text-green-600">
                            (Grade: {assignment.grade}/{assignment.maxPoints})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {isStudent() ? `Tutor: ${assignment.tutorName}` : `Student: ${assignment.studentName}`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{assignment.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            assignment.isOverdue 
                              ? 'bg-red-500' 
                              : assignment.status === 'graded' 
                                ? 'bg-green-500' 
                                : 'bg-blue-500'
                          }`}
                          style={{ width: `${assignment.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAssignment(assignment)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>

                    {isStudent() && assignment.status === 'assigned' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setShowSubmissionModal(true)
                        }}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Submit
                      </Button>
                    )}

                    {isTutor() && assignment.status === 'submitted' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setGradingData({
                            grade: assignment.grade || 0,
                            feedback: assignment.feedback || ''
                          })
                          setShowGradingModal(true)
                        }}
                        className="flex items-center gap-2"
                      >
                        <Star className="h-4 w-4" />
                        Grade
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Assignment</CardTitle>
              <CardDescription>
                Create a new assignment for your students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Assignment Title"
                placeholder="Enter assignment title..."
                value={newAssignment.title}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                required
              />

              <Textarea
                label="Description"
                placeholder="Brief description of the assignment..."
                value={newAssignment.description}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />

              <Textarea
                label="Instructions"
                placeholder="Detailed instructions for the assignment..."
                value={newAssignment.instructions}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                rows={5}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Due Date"
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />

                <Input
                  label="Max Points"
                  type="number"
                  min="1"
                  max="1000"
                  value={newAssignment.maxPoints}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
                  required
                />
              </div>

              <Input
                label="Student ID"
                placeholder="Enter student ID..."
                value={newAssignment.studentId}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, studentId: e.target.value }))}
                required
              />

              <Input
                label="Session ID (Optional)"
                placeholder="Link to a specific session..."
                value={newAssignment.sessionId}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, sessionId: e.target.value }))}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={!newAssignment.title || !newAssignment.instructions || !newAssignment.dueDate || !newAssignment.studentId}
              >
                Create Assignment
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Submit Assignment</CardTitle>
              <CardDescription>
                {selectedAssignment.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Instructions:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedAssignment.instructions}
                </p>
              </div>

              <Textarea
                label="Your Response"
                placeholder="Enter your assignment response..."
                value={submissionData.content}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                required
              />

              <div>
                <label className="text-sm font-medium mb-2 block">Attachments</label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload files or drag and drop
                    </p>
                  </label>
                </div>

                {submissionData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {submissionData.attachments.map((upload, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          {getFileIcon(upload.type)}
                          <span className="text-sm">{upload.file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(upload.file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSubmissionData(prev => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== index)
                          }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSubmissionModal(false)
                  setSubmissionData({ content: '', attachments: [] })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAssignment}
                disabled={!submissionData.content.trim()}
              >
                Submit Assignment
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Grading Modal */}
      {showGradingModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Grade Assignment</CardTitle>
              <CardDescription>
                {selectedAssignment.title} - {selectedAssignment.studentName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAssignment.submission && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Student Response:</h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedAssignment.submission.content}
                  </p>
                  {selectedAssignment.submission.attachments.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-medium text-sm mb-2">Attachments:</h5>
                      <div className="space-y-1">
                        {selectedAssignment.submission.attachments.map((filename, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4" />
                            <span>{filename}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Grade"
                  type="number"
                  min="0"
                  max={selectedAssignment.maxPoints}
                  value={gradingData.grade}
                  onChange={(e) => setGradingData(prev => ({ ...prev, grade: parseInt(e.target.value) || 0 }))}
                  description={`Out of ${selectedAssignment.maxPoints} points`}
                />

                <div>
                  <label className="text-sm font-medium mb-2 block">Percentage</label>
                  <div className="h-10 px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
                    {Math.round((gradingData.grade / selectedAssignment.maxPoints) * 100)}%
                  </div>
                </div>
              </div>

              <Textarea
                label="Feedback"
                placeholder="Provide feedback for the student..."
                value={gradingData.feedback}
                onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                rows={6}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGradingModal(false)
                  setGradingData({ grade: 0, feedback: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGradeAssignment}
                disabled={gradingData.grade < 0 || gradingData.grade > selectedAssignment.maxPoints}
              >
                Save Grade
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Assignment Details Modal */}
      {selectedAssignment && !showSubmissionModal && !showGradingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedAssignment.title}</CardTitle>
                  <CardDescription>
                    {isStudent() ? `Tutor: ${selectedAssignment.tutorName}` : `Student: ${selectedAssignment.studentName}`}
                  </CardDescription>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAssignment.status, selectedAssignment.isOverdue)}`}>
                  {getStatusIcon(selectedAssignment.status, selectedAssignment.isOverdue)}
                  {selectedAssignment.isOverdue ? 'Overdue' : selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedAssignment.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Instructions</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedAssignment.instructions}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Due Date</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedAssignment.dueDate), 'PPP p')}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Max Points</h4>
                  <p className="text-sm text-muted-foreground">{selectedAssignment.maxPoints}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedAssignment.createdAt), 'PPP')}
                  </p>
                </div>
              </div>

              {selectedAssignment.submission && (
                <div>
                  <h4 className="font-medium mb-2">Submission</h4>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm font-medium">Submitted on:</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedAssignment.submission.submittedAt), 'PPP p')}
                        {selectedAssignment.submission.isLate && (
                          <span className="text-red-600 ml-2">(Late)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Response:</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedAssignment.submission.content}</p>
                    </div>
                    {selectedAssignment.submission.attachments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Attachments:</p>
                        <div className="space-y-1">
                          {selectedAssignment.submission.attachments.map((filename, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4" />
                              <span>{filename}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAssignment.grade !== undefined && (
                <div>
                  <h4 className="font-medium mb-2">Grade & Feedback</h4>
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Grade:</span>
                      <span className="text-lg font-bold text-green-600">
                        {selectedAssignment.grade}/{selectedAssignment.maxPoints} 
                        ({Math.round((selectedAssignment.grade / selectedAssignment.maxPoints) * 100)}%)
                      </span>
                    </div>
                    {selectedAssignment.feedback && (
                      <div>
                        <p className="text-sm font-medium mb-1">Feedback:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedAssignment.feedback}</p>
                      </div>
                    )}
                    {selectedAssignment.gradedAt && (
                      <p className="text-xs text-muted-foreground">
                        Graded on {format(new Date(selectedAssignment.gradedAt), 'PPP p')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedAssignment(null)}
              >
                Close
              </Button>
              
              {isStudent() && selectedAssignment.status === 'assigned' && (
                <Button
                  onClick={() => setShowSubmissionModal(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Submit Assignment
                </Button>
              )}

              {isTutor() && selectedAssignment.status === 'submitted' && (
                <Button
                  onClick={() => {
                    setGradingData({
                      grade: selectedAssignment.grade || 0,
                      feedback: selectedAssignment.feedback || ''
                    })
                    setShowGradingModal(true)
                  }}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Grade Assignment
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AssignmentsPage