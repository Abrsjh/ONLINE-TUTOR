'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/lib/state/auth'
import { db } from '@/lib/db'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2'
import { Calendar, DollarSign, Users, BookOpen, TrendingUp, Clock, Star, Target } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

interface AnalyticsData {
  // Student analytics
  studentProgress: {
    totalSessions: number
    completedAssignments: number
    averageGrade: number
    hoursStudied: number
    subjectProgress: { subject: string; progress: number }[]
    weeklyActivity: { day: string; sessions: number }[]
    upcomingDeadlines: { assignment: string; dueDate: string }[]
  }
  
  // Tutor analytics
  tutorEarnings: {
    totalEarnings: number
    monthlyEarnings: { month: string; amount: number }[]
    sessionCount: number
    averageRating: number
    studentEngagement: { metric: string; value: number }[]
    popularSubjects: { subject: string; sessions: number }[]
    revenueBySubject: { subject: string; revenue: number }[]
  }
  
  // Admin analytics
  platformAnalytics: {
    totalUsers: number
    totalRevenue: number
    monthlyRevenue: { month: string; revenue: number }[]
    userGrowth: { month: string; students: number; tutors: number }[]
    popularSubjects: { subject: string; sessions: number; revenue: number }[]
    sessionsByStatus: { status: string; count: number }[]
    geographicData: { region: string; users: number }[]
    retentionRate: number
    averageSessionDuration: number
  }
}

const AnalyticsPage = () => {
  const { user, isStudent, isTutor, isAdmin } = useAuthStore()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<string>('overview')

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Generate mock analytics data based on user role
        const mockData: AnalyticsData = {
          studentProgress: {
            totalSessions: 24,
            completedAssignments: 18,
            averageGrade: 87.5,
            hoursStudied: 48,
            subjectProgress: [
              { subject: 'Mathematics', progress: 85 },
              { subject: 'Physics', progress: 72 },
              { subject: 'Chemistry', progress: 91 },
              { subject: 'Biology', progress: 68 }
            ],
            weeklyActivity: [
              { day: 'Mon', sessions: 2 },
              { day: 'Tue', sessions: 1 },
              { day: 'Wed', sessions: 3 },
              { day: 'Thu', sessions: 2 },
              { day: 'Fri', sessions: 1 },
              { day: 'Sat', sessions: 0 },
              { day: 'Sun', sessions: 1 }
            ],
            upcomingDeadlines: [
              { assignment: 'Calculus Problem Set', dueDate: '2024-01-15' },
              { assignment: 'Physics Lab Report', dueDate: '2024-01-18' },
              { assignment: 'Chemistry Quiz', dueDate: '2024-01-20' }
            ]
          },
          tutorEarnings: {
            totalEarnings: 3250,
            monthlyEarnings: [
              { month: 'Jul', amount: 450 },
              { month: 'Aug', amount: 520 },
              { month: 'Sep', amount: 680 },
              { month: 'Oct', amount: 750 },
              { month: 'Nov', amount: 620 },
              { month: 'Dec', amount: 850 }
            ],
            sessionCount: 65,
            averageRating: 4.8,
            studentEngagement: [
              { metric: 'Assignment Completion', value: 92 },
              { metric: 'Session Attendance', value: 96 },
              { metric: 'Quiz Performance', value: 88 },
              { metric: 'Homework Submission', value: 94 }
            ],
            popularSubjects: [
              { subject: 'Mathematics', sessions: 28 },
              { subject: 'Physics', sessions: 22 },
              { subject: 'Chemistry', sessions: 15 }
            ],
            revenueBySubject: [
              { subject: 'Mathematics', revenue: 1400 },
              { subject: 'Physics', revenue: 1100 },
              { subject: 'Chemistry', revenue: 750 }
            ]
          },
          platformAnalytics: {
            totalUsers: 1247,
            totalRevenue: 125000,
            monthlyRevenue: [
              { month: 'Jul', revenue: 18500 },
              { month: 'Aug', revenue: 19200 },
              { month: 'Sep', revenue: 21800 },
              { month: 'Oct', revenue: 23500 },
              { month: 'Nov', revenue: 20800 },
              { month: 'Dec', revenue: 25200 }
            ],
            userGrowth: [
              { month: 'Jul', students: 45, tutors: 8 },
              { month: 'Aug', students: 52, tutors: 12 },
              { month: 'Sep', students: 68, tutors: 15 },
              { month: 'Oct', students: 71, tutors: 18 },
              { month: 'Nov', students: 58, tutors: 14 },
              { month: 'Dec', students: 82, tutors: 22 }
            ],
            popularSubjects: [
              { subject: 'Mathematics', sessions: 342, revenue: 17100 },
              { subject: 'Physics', sessions: 268, revenue: 13400 },
              { subject: 'Chemistry', sessions: 195, revenue: 9750 },
              { subject: 'Biology', sessions: 156, revenue: 7800 },
              { subject: 'English', sessions: 134, revenue: 6700 }
            ],
            sessionsByStatus: [
              { status: 'Completed', count: 1095 },
              { status: 'Scheduled', count: 156 },
              { status: 'Cancelled', count: 43 },
              { status: 'No-show', count: 12 }
            ],
            geographicData: [
              { region: 'North America', users: 542 },
              { region: 'Europe', users: 398 },
              { region: 'Asia', users: 234 },
              { region: 'Others', users: 73 }
            ],
            retentionRate: 78.5,
            averageSessionDuration: 52
          }
        }

        setAnalyticsData(mockData)
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [user, timeRange])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Unable to load analytics data at this time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {isStudent() && 'Track your learning progress and performance'}
            {isTutor() && 'Monitor your earnings and student engagement'}
            {isAdmin() && 'Platform-wide analytics and insights'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Student Analytics */}
      {isStudent() && (
        <>
          {/* Student KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.studentProgress.totalSessions}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.studentProgress.completedAssignments}</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Grade</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.studentProgress.averageGrade}%</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hours Studied</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.studentProgress.hoursStudied}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Student Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Progress */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Progress</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: analyticsData.studentProgress.subjectProgress.map(s => s.subject),
                    datasets: [{
                      label: 'Progress (%)',
                      data: analyticsData.studentProgress.subjectProgress.map(s => s.progress),
                      backgroundColor: 'rgba(59, 130, 246, 0.5)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 1,
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: analyticsData.studentProgress.weeklyActivity.map(w => w.day),
                    datasets: [{
                      label: 'Sessions',
                      data: analyticsData.studentProgress.weeklyActivity.map(w => w.sessions),
                      borderColor: 'rgba(16, 185, 129, 1)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      fill: true,
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {analyticsData.studentProgress.upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{deadline.assignment}</span>
                  <span className="text-sm text-gray-600">{new Date(deadline.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tutor Analytics */}
      {isTutor() && (
        <>
          {/* Tutor KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">${analyticsData.tutorEarnings.totalEarnings}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.tutorEarnings.sessionCount}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.tutorEarnings.averageRating}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analyticsData.tutorEarnings.monthlyEarnings[analyticsData.tutorEarnings.monthlyEarnings.length - 1]?.amount || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Tutor Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Earnings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: analyticsData.tutorEarnings.monthlyEarnings.map(e => e.month),
                    datasets: [{
                      label: 'Earnings ($)',
                      data: analyticsData.tutorEarnings.monthlyEarnings.map(e => e.amount),
                      backgroundColor: 'rgba(34, 197, 94, 0.5)',
                      borderColor: 'rgba(34, 197, 94, 1)',
                      borderWidth: 1,
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Revenue by Subject */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Subject</h3>
              <div className="h-64">
                <Doughnut
                  data={{
                    labels: analyticsData.tutorEarnings.revenueBySubject.map(s => s.subject),
                    datasets: [{
                      data: analyticsData.tutorEarnings.revenueBySubject.map(s => s.revenue),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                      ],
                    }]
                  }}
                  options={pieChartOptions}
                />
              </div>
            </div>
          </div>

          {/* Student Engagement */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Engagement Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsData.tutorEarnings.studentEngagement.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metric.value}%</div>
                  <div className="text-sm text-gray-600">{metric.metric}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Admin Analytics */}
      {isAdmin() && (
        <>
          {/* Admin KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.platformAnalytics.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${analyticsData.platformAnalytics.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.platformAnalytics.retentionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Session Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.platformAnalytics.averageSessionDuration}m</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Admin Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: analyticsData.platformAnalytics.monthlyRevenue.map(r => r.month),
                    datasets: [{
                      label: 'Revenue ($)',
                      data: analyticsData.platformAnalytics.monthlyRevenue.map(r => r.revenue),
                      borderColor: 'rgba(34, 197, 94, 1)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      fill: true,
                    }]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* User Growth */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: analyticsData.platformAnalytics.userGrowth.map(u => u.month),
                    datasets: [
                      {
                        label: 'Students',
                        data: analyticsData.platformAnalytics.userGrowth.map(u => u.students),
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                      },
                      {
                        label: 'Tutors',
                        data: analyticsData.platformAnalytics.userGrowth.map(u => u.tutors),
                        backgroundColor: 'rgba(16, 185, 129, 0.5)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              </div>
            </div>

            {/* Popular Subjects Heatmap */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Subjects</h3>
              <div className="space-y-3">
                {analyticsData.platformAnalytics.popularSubjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{subject.subject}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{subject.sessions} sessions</span>
                      <span className="text-sm font-medium text-green-600">${subject.revenue}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(subject.sessions / Math.max(...analyticsData.platformAnalytics.popularSubjects.map(s => s.sessions))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
              <div className="h-64">
                <Pie
                  data={{
                    labels: analyticsData.platformAnalytics.geographicData.map(g => g.region),
                    datasets: [{
                      data: analyticsData.platformAnalytics.geographicData.map(g => g.users),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                      ],
                    }]
                  }}
                  options={pieChartOptions}
                />
              </div>
            </div>
          </div>

          {/* Session Status Overview */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {analyticsData.platformAnalytics.sessionsByStatus.map((status, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status.status}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsPage