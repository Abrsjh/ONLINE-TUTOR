"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, dateUtils, currencyUtils } from '@/lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Calendar,
  Target,
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  Star,
  Trophy,
  Medal,
  Zap,
  Brain,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Filter,
  Download,
  Settings
} from 'lucide-react'

// Types
interface ProgressData {
  date: string
  value: number
  goal?: number
  subject?: string
  sessionType?: string
}

interface Milestone {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  completed: boolean
  completedDate?: string
  category: 'academic' | 'attendance' | 'engagement' | 'skill'
  icon: React.ReactNode
  color: string
}

interface Goal {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  category: string
  priority: 'low' | 'medium' | 'high'
  progress: number
}

interface Achievement {
  id: string
  title: string
  description: string
  earnedDate: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  icon: React.ReactNode
  points: number
}

interface ProgressTrackerProps {
  userId: string
  userRole: 'student' | 'tutor' | 'admin'
  className?: string
}

// Sample data generators
const generateProgressData = (days: number = 30): ProgressData[] => {
  const data: ProgressData[] = []
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English']
  const sessionTypes = ['Regular', 'Quiz', 'Assignment', 'Review']
  
  for (let i = days; i >= 0; i--) {
    const date = dateUtils.addDays(new Date(), -i)
    data.push({
      date: dateUtils.formatDate(date, { month: 'short', day: 'numeric' }),
      value: Math.floor(Math.random() * 100) + 20,
      goal: 80,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      sessionType: sessionTypes[Math.floor(Math.random() * sessionTypes.length)]
    })
  }
  
  return data
}

const generateMilestones = (): Milestone[] => [
  {
    id: '1',
    title: 'First Session Complete',
    description: 'Complete your first tutoring session',
    targetValue: 1,
    currentValue: 1,
    completed: true,
    completedDate: '2024-01-15',
    category: 'academic',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'text-blue-500'
  },
  {
    id: '2',
    title: 'Perfect Week',
    description: 'Attend all scheduled sessions in a week',
    targetValue: 5,
    currentValue: 3,
    completed: false,
    category: 'attendance',
    icon: <Calendar className="h-4 w-4" />,
    color: 'text-green-500'
  },
  {
    id: '3',
    title: 'Quiz Master',
    description: 'Score 90% or higher on 10 quizzes',
    targetValue: 10,
    currentValue: 7,
    completed: false,
    category: 'academic',
    icon: <Brain className="h-4 w-4" />,
    color: 'text-purple-500'
  },
  {
    id: '4',
    title: 'Engagement Champion',
    description: 'Participate actively in 20 sessions',
    targetValue: 20,
    currentValue: 15,
    completed: false,
    category: 'engagement',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-yellow-500'
  }
]

const generateGoals = (): Goal[] => [
  {
    id: '1',
    title: 'Mathematics Mastery',
    description: 'Achieve 85% average in mathematics',
    targetValue: 85,
    currentValue: 78,
    unit: '%',
    deadline: '2024-06-30',
    category: 'Academic',
    priority: 'high',
    progress: 78
  },
  {
    id: '2',
    title: 'Session Consistency',
    description: 'Attend 40 sessions this semester',
    targetValue: 40,
    currentValue: 28,
    unit: 'sessions',
    deadline: '2024-05-15',
    category: 'Attendance',
    priority: 'medium',
    progress: 70
  },
  {
    id: '3',
    title: 'Study Hours',
    description: 'Complete 100 hours of study time',
    targetValue: 100,
    currentValue: 65,
    unit: 'hours',
    deadline: '2024-04-30',
    category: 'Study Time',
    priority: 'medium',
    progress: 65
  }
]

const generateAchievements = (): Achievement[] => [
  {
    id: '1',
    title: 'Early Bird',
    description: 'Joined 10 sessions early',
    earnedDate: '2024-01-20',
    category: 'Punctuality',
    rarity: 'common',
    icon: <Clock className="h-4 w-4" />,
    points: 50
  },
  {
    id: '2',
    title: 'Perfect Score',
    description: 'Achieved 100% on a quiz',
    earnedDate: '2024-01-25',
    category: 'Academic',
    rarity: 'rare',
    icon: <Star className="h-4 w-4" />,
    points: 100
  },
  {
    id: '3',
    title: 'Streak Master',
    description: 'Maintained a 30-day learning streak',
    earnedDate: '2024-02-01',
    category: 'Consistency',
    rarity: 'epic',
    icon: <Trophy className="h-4 w-4" />,
    points: 250
  },
  {
    id: '4',
    title: 'Knowledge Seeker',
    description: 'Completed 50 assignments',
    earnedDate: '2024-02-10',
    category: 'Academic',
    rarity: 'legendary',
    icon: <Medal className="h-4 w-4" />,
    points: 500
  }
]

// Chart components
const ProgressLineChart: React.FC<{ data: ProgressData[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
      <XAxis 
        dataKey="date" 
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={false}
        domain={[0, 100]}
      />
      <Tooltip 
        contentStyle={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px'
        }}
      />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke="hsl(var(--primary))" 
        strokeWidth={2}
        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
        name="Progress"
      />
      <Line 
        type="monotone" 
        dataKey="goal" 
        stroke="hsl(var(--muted-foreground))" 
        strokeWidth={1}
        strokeDasharray="5 5"
        dot={false}
        name="Goal"
      />
    </LineChart>
  </ResponsiveContainer>
)

const ProgressAreaChart: React.FC<{ data: ProgressData[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
      <XAxis 
        dataKey="date" 
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        tick={{ fontSize: 12 }}
        tickLine={false}
        axisLine={false}
        domain={[0, 100]}
      />
      <Tooltip 
        contentStyle={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px'
        }}
      />
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke="hsl(var(--primary))" 
        fill="hsl(var(--primary))"
        fillOpacity={0.2}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
)

const SubjectProgressChart: React.FC<{ data: ProgressData[] }> = ({ data }) => {
  const subjectData = useMemo(() => {
    const subjects = data.reduce((acc, item) => {
      if (item.subject) {
        if (!acc[item.subject]) {
          acc[item.subject] = { subject: item.subject, total: 0, count: 0 }
        }
        acc[item.subject].total += item.value
        acc[item.subject].count += 1
      }
      return acc
    }, {} as Record<string, { subject: string; total: number; count: number }>)

    return Object.values(subjects).map(s => ({
      subject: s.subject,
      average: Math.round(s.total / s.count)
    }))
  }, [data])

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1']

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={subjectData}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="subject" 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
        />
        <Bar dataKey="average" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const GoalProgressChart: React.FC<{ goals: Goal[] }> = ({ goals }) => {
  const data = goals.map(goal => ({
    name: goal.title,
    progress: goal.progress,
    target: 100
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={data}>
        <RadialBar 
          dataKey="progress" 
          cornerRadius={10} 
          fill="hsl(var(--primary))"
          background={{ fill: 'hsl(var(--muted))' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px'
          }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  )
}

// Component sections
const StatsOverview: React.FC<{ data: ProgressData[]; goals: Goal[] }> = ({ data, goals }) => {
  const stats = useMemo(() => {
    const avgProgress = data.reduce((sum, item) => sum + item.value, 0) / data.length
    const completedGoals = goals.filter(g => g.progress >= 100).length
    const totalSessions = data.length
    const improvementTrend = data.length > 1 ? 
      ((data[data.length - 1].value - data[0].value) / data[0].value) * 100 : 0

    return {
      avgProgress: Math.round(avgProgress),
      completedGoals,
      totalGoals: goals.length,
      totalSessions,
      improvementTrend: Math.round(improvementTrend)
    }
  }, [data, goals])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Progress</p>
              <p className="text-2xl font-bold">{stats.avgProgress}%</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Goals Completed</p>
              <p className="text-2xl font-bold">{stats.completedGoals}/{stats.totalGoals}</p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
            <BookOpen className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Improvement</p>
              <p className="text-2xl font-bold flex items-center">
                {stats.improvementTrend > 0 ? '+' : ''}{stats.improvementTrend}%
                <TrendingUp className={cn(
                  "h-4 w-4 ml-1",
                  stats.improvementTrend > 0 ? "text-green-500" : "text-red-500"
                )} />
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const MilestonesSection: React.FC<{ milestones: Milestone[] }> = ({ milestones }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Award className="h-5 w-5" />
        Milestones
      </CardTitle>
      <CardDescription>Track your learning milestones and achievements</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                milestone.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
              )}>
                {milestone.completed ? <CheckCircle className="h-4 w-4" /> : milestone.icon}
              </div>
              <div>
                <h4 className="font-medium">{milestone.title}</h4>
                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                {milestone.completedDate && (
                  <p className="text-xs text-green-600">
                    Completed on {dateUtils.formatDate(milestone.completedDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      milestone.completed ? "bg-green-500" : "bg-blue-500"
                    )}
                    style={{ 
                      width: `${Math.min((milestone.currentValue / milestone.targetValue) * 100, 100)}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {milestone.currentValue}/{milestone.targetValue}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const GoalsSection: React.FC<{ goals: Goal[] }> = ({ goals }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        Goals
      </CardTitle>
      <CardDescription>Set and track your learning goals</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium">{goal.title}</h4>
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              </div>
              <div className="text-right">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  goal.priority === 'high' ? "bg-red-100 text-red-700" :
                  goal.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                )}>
                  {goal.priority} priority
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {goal.currentValue} / {goal.targetValue} {goal.unit}
              </span>
              <span className="text-sm text-muted-foreground">
                Due: {dateUtils.formatDate(goal.deadline)}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">{goal.progress}% complete</span>
              <span className="text-xs text-muted-foreground">{goal.category}</span>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const AchievementsSection: React.FC<{ achievements: Achievement[] }> = ({ achievements }) => {
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
        </CardTitle>
        <CardDescription>Your earned badges and accomplishments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  getRarityColor(achievement.rarity)
                )}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <span className="text-sm font-medium text-blue-600">
                      +{achievement.points} pts
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium capitalize",
                      getRarityColor(achievement.rarity)
                    )}>
                      {achievement.rarity}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateUtils.formatDate(achievement.earnedDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Main component
export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  userId,
  userRole,
  className
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'radial'>('line')
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'milestones' | 'achievements'>('overview')

  // Generate sample data
  const progressData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    return generateProgressData(days)
  }, [timeRange])

  const milestones = useMemo(() => generateMilestones(), [])
  const goals = useMemo(() => generateGoals(), [])
  const achievements = useMemo(() => generateAchievements(), [])

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return <ProgressAreaChart data={progressData} />
      case 'bar':
        return <SubjectProgressChart data={progressData} />
      case 'radial':
        return <GoalProgressChart goals={goals} />
      default:
        return <ProgressLineChart data={progressData} />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Progress Tracker</h2>
          <p className="text-muted-foreground">
            Monitor your learning journey and achievements
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'milestones', label: 'Milestones', icon: Award },
          { id: 'achievements', label: 'Achievements', icon: Trophy }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Stats Overview */}
      <StatsOverview data={progressData} goals={goals} />

      {/* Main Content */}
      {activeTab === 'overview' && (
        <>
          {/* Chart Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Range:</span>
              {[
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
                { value: '90d', label: '90 Days' },
                { value: '1y', label: '1 Year' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={timeRange === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(option.value as any)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Chart Type:</span>
              {[
                { value: 'line', label: 'Line', icon: Activity },
                { value: 'area', label: 'Area', icon: Activity },
                { value: 'bar', label: 'Bar', icon: BarChart3 },
                { value: 'radial', label: 'Radial', icon: PieChartIcon }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={chartType === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType(option.value as any)}
                >
                  <option.icon className="h-4 w-4 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>
                Your learning progress and goal tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>
        </>
      )}

      {/* Tab Content */}
      {activeTab === 'goals' && <GoalsSection goals={goals} />}
      {activeTab === 'milestones' && <MilestonesSection milestones={milestones} />}
      {activeTab === 'achievements' && <AchievementsSection achievements={achievements} />}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your progress and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Set New Goal
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Review
            </Button>
            <Button variant="outline" size="sm">
              <Award className="h-4 w-4 mr-2" />
              View All Achievements
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProgressTracker