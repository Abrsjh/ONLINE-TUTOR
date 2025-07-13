'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore, UserRole } from '@/lib/state/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Clock,
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  Star,
  Award,
  Bell,
  ChevronRight,
  Play,
  MessageSquare,
  FileText,
  BarChart3,
  UserCheck,
  GraduationCap,
  Target,
  Zap
} from 'lucide-react'
import { cn, dateUtils, currencyUtils, formatNumber } from '@/lib/utils'
import Link from 'next/link'

// Mock data interfaces
interface UpcomingSession {
  id: string
  tutorName: string
  tutorAvatar?: string
  subject: string
  startTime: string
  duration: number
  type: 'video' | 'audio' | 'chat'
  status: 'confirmed' | 'pending' | 'cancelled'
}

interface ProgressData {
  subject: string
  progress: number
  totalHours: number
  completedAssignments: number
  totalAssignments: number
  grade?: string
}

interface RecommendedTutor {
  id: string
  name: string
  avatar?: string
  subjects: string[]
  rating: number
  hourlyRate: number
  totalStudents: number
  isOnline: boolean
}

interface EarningsData {
  today: number
  thisWeek: number
  thisMonth: number
  totalEarnings: number
  pendingPayouts: number
}

interface StudentRequest {
  id: string
  studentName: string
  studentAvatar?: string
  subject: string
  requestedTime: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
}

interface PlatformAnalytics {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  revenue: number
  growthRate: number
  popularSubjects: { name: string; count: number }[]
}

// Mock data generators
const generateMockUpcomingSessions = (): UpcomingSession[] => [
  {
    id: '1',
    tutorName: 'Dr. Sarah Johnson',
    subject: 'Mathematics',
    startTime: dateUtils.addHours(new Date(), 2).toISOString(),
    duration: 60,
    type: 'video',
    status: 'confirmed'
  },
  {
    id: '2',
    tutorName: 'Prof. Michael Chen',
    subject: 'Physics',
    startTime: dateUtils.addDays(new Date(), 1).toISOString(),
    duration: 90,
    type: 'video',
    status: 'confirmed'
  },
  {
    id: '3',
    tutorName: 'Ms. Emily Rodriguez',
    subject: 'Chemistry',
    startTime: dateUtils.addDays(new Date(), 2).toISOString(),
    duration: 60,
    type: 'video',
    status: 'pending'
  }
]

const generateMockProgressData = (): ProgressData[] => [
  {
    subject: 'Mathematics',
    progress: 75,
    totalHours: 24,
    completedAssignments: 8,
    totalAssignments: 10,
    grade: 'A-'
  },
  {
    subject: 'Physics',
    progress: 60,
    totalHours: 18,
    completedAssignments: 6,
    totalAssignments: 12,
    grade: 'B+'
  },
  {
    subject: 'Chemistry',
    progress: 45,
    totalHours: 12,
    completedAssignments: 4,
    totalAssignments: 8,
    grade: 'B'
  }
]

const generateMockRecommendedTutors = (): RecommendedTutor[] => [
  {
    id: '1',
    name: 'Dr. Alex Thompson',
    subjects: ['Advanced Mathematics', 'Calculus'],
    rating: 4.9,
    hourlyRate: 65,
    totalStudents: 150,
    isOnline: true
  },
  {
    id: '2',
    name: 'Prof. Lisa Wang',
    subjects: ['Organic Chemistry', 'Biochemistry'],
    rating: 4.8,
    hourlyRate: 70,
    totalStudents: 120,
    isOnline: false
  },
  {
    id: '3',
    name: 'Mr. David Kumar',
    subjects: ['Computer Science', 'Programming'],
    rating: 4.7,
    hourlyRate: 55,
    totalStudents: 200,
    isOnline: true
  }
]

const generateMockEarningsData = (): EarningsData => ({
  today: 150,
  thisWeek: 850,
  thisMonth: 3200,
  totalEarnings: 15750,
  pendingPayouts: 450
})

const generateMockStudentRequests = (): StudentRequest[] => [
  {
    id: '1',
    studentName: 'Alice Johnson',
    subject: 'Calculus',
    requestedTime: dateUtils.addDays(new Date(), 1).toISOString(),
    message: 'Need help with integration problems for upcoming exam.',
    status: 'pending'
  },
  {
    id: '2',
    studentName: 'Bob Smith',
    subject: 'Physics',
    requestedTime: dateUtils.addDays(new Date(), 2).toISOString(),
    message: 'Struggling with quantum mechanics concepts.',
    status: 'pending'
  },
  {
    id: '3',
    studentName: 'Carol Davis',
    subject: 'Chemistry',
    requestedTime: dateUtils.addHours(new Date(), 4).toISOString(),
    message: 'Need review session before midterm exam.',
    status: 'pending'
  }
]

const generateMockPlatformAnalytics = (): PlatformAnalytics => ({
  totalUsers: 12450,
  activeUsers: 3200,
  totalSessions: 8750,
  revenue: 125000,
  growthRate: 15.5,
  popularSubjects: [
    { name: 'Mathematics', count: 2500 },
    { name: 'Physics', count: 1800 },
    { name: 'Chemistry', count: 1600 },
    { name: 'Computer Science', count: 1400 },
    { name: 'Biology', count: 1200 }
  ]
})

// Component for upcoming sessions
const UpcomingSessionsCard: React.FC<{ sessions: UpcomingSession[] }> = ({ sessions }) => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-lg font-semibold">Upcoming Sessions</CardTitle>
      <Calendar className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {sessions.slice(0, 3).map((session) => (
          <div key={session.id} className="flex items-center space-x-4 p-3 rounded-lg border">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.subject} with {session.tutorName}
              </p>
              <p className="text-sm text-gray-500">
                {dateUtils.formatDateTime(session.startTime)} • {session.duration}min
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                session.status === 'confirmed' ? "bg-green-100 text-green-800" :
                session.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              )}>
                {session.status}
              </span>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No upcoming sessions</p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/dashboard/tutors">Find a Tutor</Link>
            </Button>
          </div>
        )}
        {sessions.length > 3 && (
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/dashboard/sessions">
              View All Sessions <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
)

// Component for progress overview
const ProgressOverviewCard: React.FC<{ progressData: ProgressData[] }> = ({ progressData }) => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-lg font-semibold">Learning Progress</CardTitle>
      <TrendingUp className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {progressData.map((subject) => (
          <div key={subject.subject} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{subject.subject}</span>
              <span className="text-sm text-gray-500">{subject.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${subject.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{subject.totalHours}h studied</span>
              <span>{subject.completedAssignments}/{subject.totalAssignments} assignments</span>
              {subject.grade && <span className="font-medium">Grade: {subject.grade}</span>}
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/dashboard/analytics">
            View Detailed Analytics <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)

// Component for recommended tutors
const RecommendedTutorsCard: React.FC<{ tutors: RecommendedTutor[] }> = ({ tutors }) => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-lg font-semibold">Recommended Tutors</CardTitle>
      <Users className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {tutors.slice(0, 3).map((tutor) => (
          <div key={tutor.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {tutor.name.split(' ').map(n => n[0]).join('')}
              </div>
              {tutor.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{tutor.name}</p>
              <p className="text-xs text-gray-500 truncate">{tutor.subjects.join(', ')}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600 ml-1">{tutor.rating}</span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">{currencyUtils.formatCurrency(tutor.hourlyRate)}/hr</span>
              </div>
            </div>
            <Button size="sm" asChild>
              <Link href={`/dashboard/tutors/${tutor.id}`}>View</Link>
            </Button>
          </div>
        ))}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/tutors">
            Browse All Tutors <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
)

// Student Dashboard Component
const StudentDashboard: React.FC = () => {
  const [upcomingSessions] = useState<UpcomingSession[]>(generateMockUpcomingSessions())
  const [progressData] = useState<ProgressData[]>(generateMockProgressData())
  const [recommendedTutors] = useState<RecommendedTutor[]>(generateMockRecommendedTutors())

  const totalHours = progressData.reduce((sum, subject) => sum + subject.totalHours, 0)
  const averageProgress = Math.round(progressData.reduce((sum, subject) => sum + subject.progress, 0) / progressData.length)
  const completedAssignments = progressData.reduce((sum, subject) => sum + subject.completedAssignments, 0)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, Student!</h1>
        <p className="text-blue-100">Continue your learning journey and achieve your goals.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Study Hours</p>
                <p className="text-2xl font-bold">{totalHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Progress</p>
                <p className="text-2xl font-bold">{averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold">{completedAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Session</p>
                <p className="text-sm font-bold">
                  {upcomingSessions.length > 0 
                    ? dateUtils.getRelativeTime(upcomingSessions[0].startTime)
                    : 'None scheduled'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingSessionsCard sessions={upcomingSessions} />
        <ProgressOverviewCard progressData={progressData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendedTutorsCard tutors={recommendedTutors} />
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                <Link href="/dashboard/tutors">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Find Tutors</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                <Link href="/dashboard/assignments">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Assignments</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                <Link href="/dashboard/library">
                  <BookOpen className="h-6 w-6" />
                  <span className="text-sm">Study Library</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                <Link href="/dashboard/quizzes">
                  <Zap className="h-6 w-6" />
                  <span className="text-sm">Practice Quiz</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Tutor Dashboard Component
const TutorDashboard: React.FC = () => {
  const [earningsData] = useState<EarningsData>(generateMockEarningsData())
  const [studentRequests] = useState<StudentRequest[]>(generateMockStudentRequests())
  const [upcomingSessions] = useState<UpcomingSession[]>(generateMockUpcomingSessions())

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, Tutor!</h1>
        <p className="text-green-100">Help students achieve their learning goals today.</p>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold">{currencyUtils.formatCurrency(earningsData.today)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{currencyUtils.formatCurrency(earningsData.thisWeek)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{currencyUtils.formatCurrency(earningsData.thisMonth)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">{currencyUtils.formatCurrency(earningsData.totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{currencyUtils.formatCurrency(earningsData.pendingPayouts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Student Requests</CardTitle>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {request.studentName.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{request.studentName}</p>
                    <p className="text-sm text-gray-500">{request.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">{request.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: {dateUtils.formatDateTime(request.requestedTime)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 space-x-2">
                    <Button size="sm" variant="outline">Accept</Button>
                    <Button size="sm" variant="ghost">Decline</Button>
                  </div>
                </div>
              ))}
              {studentRequests.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No pending requests</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.filter(session => dateUtils.isToday(session.startTime)).map((session) => (
                <div key={session.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Play className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{session.subject}</p>
                    <p className="text-sm text-gray-500">
                      {dateUtils.formatTime(session.startTime)} • {session.duration}min
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/classroom/${session.id}`}>Join</Link>
                  </Button>
                </div>
              ))}
              {upcomingSessions.filter(session => dateUtils.isToday(session.startTime)).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No sessions scheduled for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Tutors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Manage your tutoring activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                <Link href="/dashboard/sessions">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">My Schedule</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                <Link href="/dashboard/assignments">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Create Assignment</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                <Link href="/dashboard/wallet">
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm">Earnings</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                <Link href="/dashboard/profile">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">My Profile</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
            <CardDescription>Your tutoring statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Student Satisfaction</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-bold ml-1">4.8/5</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Students</span>
                <span className="text-sm font-bold">127</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sessions This Month</span>
                <span className="text-sm font-bold">45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-sm font-bold">98%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const [analyticsData] = useState<PlatformAnalytics>(generateMockPlatformAnalytics())

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-purple-100">Monitor and manage the tutoring platform.</p>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.totalUsers)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.activeUsers)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.totalSessions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{currencyUtils.formatCurrency(analyticsData.revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold">{analyticsData.growthRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics and Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Popular Subjects</CardTitle>
            <CardDescription>Most requested subjects on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.popularSubjects.map((subject, index) => (
                <div key={subject.name} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{subject.name}</span>
                      <span className="text-sm text-gray-500">{formatNumber(subject.count)} sessions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(subject.count / analyticsData.popularSubjects[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Management Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Management Actions</CardTitle>
            <CardDescription>Platform administration tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">User Management</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Content Review</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Payment Reports</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">Support Tickets</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New tutor verified</p>
                  <p className="text-xs text-gray-500">Dr. Sarah Johnson - Mathematics</p>
                </div>
                <span className="text-xs text-gray-400">2 min ago</span>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment processed</p>
                  <p className="text-xs text-gray-500">$150.00 - Session payment</p>
                </div>
                <span className="text-xs text-gray-400">5 min ago</span>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New session completed</p>
                  <p className="text-xs text-gray-500">Physics - Advanced Mechanics</p>
                </div>
                <span className="text-xs text-gray-400">10 min ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">System Status</CardTitle>
            <CardDescription>Platform health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Server Status</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Gateway</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Video Service</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                  <span className="text-sm text-yellow-600">Degraded</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/dashboard/analytics">
                  View Detailed Analytics <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main Dashboard Page Component
const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // Auto-refresh data every 5 minutes
    const interval = setInterval(() => {
      // Trigger data refresh here if needed
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render role-specific dashboard
  switch (user.role) {
    case UserRole.STUDENT:
      return <StudentDashboard />
    case UserRole.TUTOR:
      return <TutorDashboard />
    case UserRole.ADMIN:
      return <AdminDashboard />
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Invalid Role</h2>
              <p className="text-gray-600 mb-4">Your account role is not recognized.</p>
              <Button asChild>
                <Link href="/profile">Update Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
  }
}

export default DashboardPage