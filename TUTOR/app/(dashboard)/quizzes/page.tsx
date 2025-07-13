"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/lib/state/auth'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, dateUtils, stringUtils, arrayUtils } from '@/lib/utils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  Filter,
  Search,
  Save,
  Eye,
  Users,
  Award,
  Timer,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  FileText,
  Settings,
  Download,
  Share2,
  Copy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  Star,
  Zap
} from 'lucide-react'

// Types for quiz system
interface QuizQuestion {
  id: string
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'fill-blank' | 'matching'
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
  timeLimit?: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  imageUrl?: string
}

interface Quiz {
  id: string
  title: string
  description: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
  totalPoints: number
  questions: QuizQuestion[]
  settings: {
    shuffleQuestions: boolean
    shuffleOptions: boolean
    showResults: boolean
    allowRetake: boolean
    passingScore: number
    showCorrectAnswers: boolean
    randomizeQuestions: boolean
  }
  createdBy: string
  createdAt: string
  updatedAt: string
  isPublished: boolean
  attempts: number
  averageScore: number
  tags: string[]
}

interface QuizAttempt {
  id: string
  quizId: string
  studentId: string
  studentName: string
  answers: Record<string, any>
  score: number
  totalPoints: number
  percentage: number
  timeSpent: number
  startedAt: string
  completedAt: string
  isPassed: boolean
}

interface QuizResult {
  attempt: QuizAttempt
  questionResults: Array<{
    questionId: string
    question: string
    userAnswer: any
    correctAnswer: any
    isCorrect: boolean
    points: number
    maxPoints: number
  }>
}

// Mock data
const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Algebra Fundamentals',
    description: 'Test your understanding of basic algebraic concepts',
    subject: 'Mathematics',
    difficulty: 'medium',
    timeLimit: 30,
    totalPoints: 100,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the value of x in the equation 2x + 5 = 13?',
        options: ['2', '4', '6', '8'],
        correctAnswer: '4',
        explanation: 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4',
        points: 10,
        difficulty: 'easy',
        tags: ['algebra', 'equations']
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'The slope of a horizontal line is zero.',
        correctAnswer: 'true',
        explanation: 'A horizontal line has no vertical change, so its slope is 0.',
        points: 5,
        difficulty: 'easy',
        tags: ['slope', 'lines']
      }
    ],
    settings: {
      shuffleQuestions: false,
      shuffleOptions: true,
      showResults: true,
      allowRetake: true,
      passingScore: 70,
      showCorrectAnswers: true,
      randomizeQuestions: false
    },
    createdBy: 'tutor-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    isPublished: true,
    attempts: 25,
    averageScore: 82,
    tags: ['algebra', 'mathematics', 'fundamentals']
  }
]

const mockAttempts: QuizAttempt[] = [
  {
    id: 'attempt-1',
    quizId: 'quiz-1',
    studentId: 'student-1',
    studentName: 'John Doe',
    answers: { 'q1': '4', 'q2': 'true' },
    score: 15,
    totalPoints: 15,
    percentage: 100,
    timeSpent: 8,
    startedAt: '2024-01-16T14:00:00Z',
    completedAt: '2024-01-16T14:08:00Z',
    isPassed: true
  }
]

export default function QuizzesPage() {
  const { user, isTutor, isStudent } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'results' | 'analytics'>('browse')
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes)
  const [attempts, setAttempts] = useState<QuizAttempt[]>(mockAttempts)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false)
  const [isQuizTakingOpen, setIsQuizTakingOpen] = useState(false)
  const [currentQuizAttempt, setCurrentQuizAttempt] = useState<Partial<QuizAttempt> | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'created' | 'difficulty' | 'attempts'>('created')

  // Quiz taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)

  // Quiz builder state
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuizQuestion> | null>(null)
  const [isEditingQuestion, setIsEditingQuestion] = useState(false)

  // Filter and search quizzes
  const filteredQuizzes = useMemo(() => {
    let filtered = quizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.subject.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = !filterSubject || quiz.subject === filterSubject
      const matchesDifficulty = !filterDifficulty || quiz.difficulty === filterDifficulty
      
      return matchesSearch && matchesSubject && matchesDifficulty
    })

    // Sort quizzes
    return arrayUtils.sortBy(filtered, sortBy === 'created' ? 'createdAt' : sortBy, 'desc')
  }, [quizzes, searchTerm, filterSubject, filterDifficulty, sortBy])

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    return arrayUtils.unique(quizzes.map(quiz => quiz.subject))
  }, [quizzes])

  // Timer for quiz taking
  useEffect(() => {
    if (isQuizTakingOpen && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isQuizTakingOpen, timeRemaining])

  // Quiz taking functions
  const startQuiz = useCallback((quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setTimeRemaining(quiz.timeLimit * 60) // Convert minutes to seconds
    setQuizStartTime(new Date())
    setIsQuizTakingOpen(true)
    setShowResults(false)
    
    // Create new attempt
    const newAttempt: Partial<QuizAttempt> = {
      id: `attempt-${Date.now()}`,
      quizId: quiz.id,
      studentId: user?.id,
      studentName: `${user?.firstName} ${user?.lastName}`,
      answers: {},
      startedAt: new Date().toISOString()
    }
    setCurrentQuizAttempt(newAttempt)
  }, [user])

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }, [])

  const handleSubmitQuiz = useCallback(() => {
    if (!selectedQuiz || !currentQuizAttempt || !quizStartTime) return

    const endTime = new Date()
    const timeSpent = Math.floor((endTime.getTime() - quizStartTime.getTime()) / 1000 / 60) // in minutes

    // Calculate score
    let totalScore = 0
    const questionResults = selectedQuiz.questions.map(question => {
      const userAnswer = answers[question.id]
      const isCorrect = checkAnswer(question, userAnswer)
      const points = isCorrect ? question.points : 0
      totalScore += points

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        maxPoints: question.points
      }
    })

    const percentage = Math.round((totalScore / selectedQuiz.totalPoints) * 100)
    const isPassed = percentage >= selectedQuiz.settings.passingScore

    const completedAttempt: QuizAttempt = {
      ...currentQuizAttempt as QuizAttempt,
      answers,
      score: totalScore,
      totalPoints: selectedQuiz.totalPoints,
      percentage,
      timeSpent,
      completedAt: endTime.toISOString(),
      isPassed
    }

    const result: QuizResult = {
      attempt: completedAttempt,
      questionResults
    }

    setAttempts(prev => [...prev, completedAttempt])
    setQuizResult(result)
    setShowResults(true)
    setIsQuizTakingOpen(false)
  }, [selectedQuiz, currentQuizAttempt, quizStartTime, answers])

  const checkAnswer = (question: QuizQuestion, userAnswer: any): boolean => {
    if (!userAnswer) return false

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return userAnswer === question.correctAnswer
      case 'short-answer':
        return userAnswer.toLowerCase().trim() === (question.correctAnswer as string).toLowerCase().trim()
      case 'fill-blank':
        return userAnswer.toLowerCase().includes((question.correctAnswer as string).toLowerCase())
      case 'matching':
        return JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)
      default:
        return false
    }
  }

  // Quiz builder functions
  const createNewQuiz = useCallback(() => {
    const newQuiz: Partial<Quiz> = {
      id: `quiz-${Date.now()}`,
      title: '',
      description: '',
      subject: '',
      difficulty: 'medium',
      timeLimit: 30,
      totalPoints: 0,
      questions: [],
      settings: {
        shuffleQuestions: false,
        shuffleOptions: true,
        showResults: true,
        allowRetake: true,
        passingScore: 70,
        showCorrectAnswers: true,
        randomizeQuestions: false
      },
      createdBy: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
      attempts: 0,
      averageScore: 0,
      tags: []
    }
    setEditingQuiz(newQuiz)
    setIsQuizBuilderOpen(true)
  }, [user])

  const saveQuiz = useCallback(() => {
    if (!editingQuiz) return

    const quiz = {
      ...editingQuiz,
      updatedAt: new Date().toISOString(),
      totalPoints: editingQuiz.questions?.reduce((sum, q) => sum + q.points, 0) || 0
    } as Quiz

    setQuizzes(prev => {
      const existing = prev.find(q => q.id === quiz.id)
      if (existing) {
        return prev.map(q => q.id === quiz.id ? quiz : q)
      } else {
        return [...prev, quiz]
      }
    })

    setIsQuizBuilderOpen(false)
    setEditingQuiz(null)
  }, [editingQuiz])

  const addQuestion = useCallback(() => {
    const newQuestion: Partial<QuizQuestion> = {
      id: `q-${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 10,
      difficulty: 'medium',
      tags: []
    }
    setEditingQuestion(newQuestion)
    setIsEditingQuestion(true)
  }, [])

  const saveQuestion = useCallback(() => {
    if (!editingQuestion || !editingQuiz) return

    const question = editingQuestion as QuizQuestion
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev?.questions ? 
        prev.questions.find(q => q.id === question.id) ?
          prev.questions.map(q => q.id === question.id ? question : q) :
          [...prev.questions, question]
        : [question]
    }))

    setIsEditingQuestion(false)
    setEditingQuestion(null)
  }, [editingQuestion, editingQuiz])

  const deleteQuestion = useCallback((questionId: string) => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: prev?.questions?.filter(q => q.id !== questionId) || []
    }))
  }, [])

  // Format time helper
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isQuizTakingOpen && selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Quiz Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h1>
                <p className="text-gray-600">Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-red-600">
                  <Timer className="h-5 w-5 mr-2" />
                  <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsQuizTakingOpen(false)}
                >
                  Exit Quiz
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{currentQuestion.question}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getDifficultyColor(currentQuestion.difficulty))}>
                      {stringUtils.capitalize(currentQuestion.difficulty)}
                    </span>
                    <span>{currentQuestion.points} points</span>
                    {currentQuestion.timeLimit && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {currentQuestion.timeLimit}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Question Content Based on Type */}
              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'true-false' && (
                <div className="space-y-3">
                  {['true', 'false'].map((option) => (
                    <label key={option} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>{stringUtils.capitalize(option)}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'short-answer' && (
                <Input
                  placeholder="Enter your answer..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full"
                />
              )}

              {currentQuestion.type === 'essay' && (
                <Textarea
                  placeholder="Write your essay answer here..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full min-h-[200px]"
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
                <Button onClick={handleSubmitQuiz} className="bg-green-600 hover:bg-green-700">
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(selectedQuiz.questions.length - 1, prev + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (showResults && quizResult) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {quizResult.attempt.isPassed ? (
                  <CheckCircle className="h-16 w-16 text-green-600" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {quizResult.attempt.isPassed ? 'Congratulations!' : 'Keep Practicing!'}
              </CardTitle>
              <CardDescription>
                You scored {quizResult.attempt.score} out of {quizResult.attempt.totalPoints} points ({quizResult.attempt.percentage}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{quizResult.attempt.percentage}%</div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{quizResult.attempt.timeSpent}m</div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {quizResult.questionResults.filter(r => r.isCorrect).length}/{quizResult.questionResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center space-x-4">
              <Button onClick={() => setShowResults(false)}>
                Back to Quizzes
              </Button>
              {selectedQuiz?.settings.allowRetake && (
                <Button variant="outline" onClick={() => startQuiz(selectedQuiz)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Question Results */}
          {selectedQuiz?.settings.showCorrectAnswers && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question Review</h3>
              {quizResult.questionResults.map((result, index) => (
                <Card key={result.questionId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        Question {index + 1}: {result.question}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {result.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          {result.points}/{result.maxPoints} pts
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Your Answer: </span>
                        <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {result.userAnswer || 'No answer provided'}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div>
                          <span className="font-medium">Correct Answer: </span>
                          <span className="text-green-600">{result.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-600 mt-1">
            {isTutor() ? 'Create and manage quizzes for your students' : 'Take quizzes to test your knowledge'}
          </p>
        </div>
        {isTutor() && (
          <Button onClick={createNewQuiz}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'browse', label: 'Browse Quizzes', icon: BookOpen },
            ...(isTutor() ? [
              { id: 'create', label: 'My Quizzes', icon: Edit },
              { id: 'results', label: 'Results', icon: BarChart3 },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ] : [
              { id: 'results', label: 'My Results', icon: Award }
            ])
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Browse Quizzes Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                clearable
                onClear={() => setSearchTerm('')}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="created">Newest</option>
                <option value="title">Title</option>
                <option value="difficulty">Difficulty</option>
                <option value="attempts">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Quiz Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map(quiz => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription className="mt-1">{quiz.description}</CardDescription>
                    </div>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getDifficultyColor(quiz.difficulty))}>
                      {stringUtils.capitalize(quiz.difficulty)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{quiz.subject}</span>
                      <span>{quiz.questions.length} questions</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {quiz.timeLimit} min
                      </span>
                      <span className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        {quiz.totalPoints} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {quiz.attempts} attempts
                      </span>
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {quiz.averageScore}% avg
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => startQuiz(quiz)}
                    disabled={!isStudent()}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredQuizzes.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attempts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Passed Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {attempts.filter(a => a.isPassed).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Attempts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attempts.map(attempt => {
                  const quiz = quizzes.find(q => q.id === attempt.quizId)
                  return (
                    <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{quiz?.title}</h4>
                        <p className="text-sm text-gray-600">
                          Completed {dateUtils.formatDateTime(attempt.completedAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={cn('font-medium', attempt.isPassed ? 'text-green-600' : 'text-red-600')}>
                            {attempt.percentage}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {attempt.score}/{attempt.totalPoints} pts
                          </div>
                        </div>
                        {attempt.isPassed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz Builder Modal */}
      {isQuizBuilderOpen && editingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Quiz Builder</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Quiz Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Quiz Title"
                  value={editingQuiz.title || ''}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter quiz title..."
                />
                <Input
                  label="Subject"
                  value={editingQuiz.subject || ''}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Mathematics"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <select
                    value={editingQuiz.difficulty || 'medium'}
                    onChange={(e) => setEditingQuiz(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <Input
                  label="Time Limit (minutes)"
                  type="number"
                  value={editingQuiz.timeLimit || 30}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                />
              </div>
              
              <Textarea
                label="Description"
                value={editingQuiz.description || ''}
                onChange={(e) => setEditingQuiz(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this quiz covers..."
              />

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Questions ({editingQuiz.questions?.length || 0})</h3>
                  <Button onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {editingQuiz.questions?.map((question, index) => (
                    <Card key={question.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">Question {index + 1}</CardTitle>
                            <CardDescription>{question.question}</CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingQuestion(question)
                                setIsEditingQuestion(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getDifficultyColor(question.difficulty))}>
                            {stringUtils.capitalize(question.difficulty)}
                          </span>
                          <span>{question.points} points</span>
                          <span>{stringUtils.capitalize(question.type.replace('-', ' '))}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setIsQuizBuilderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveQuiz}>
                <Save className="h-4 w-4 mr-2" />
                Save Quiz
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Question Editor Modal */}
      {isEditingQuestion && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Edit Question</h2>
            </div>
            <div className="p-6 space-y-6">
              <Textarea
                label="Question"
                value={editingQuestion.question || ''}
                onChange={(e) => setEditingQuestion(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question..."
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Question Type</label>
                  <select
                    value={editingQuestion.type || 'multiple-choice'}
                    onChange={(e) => setEditingQuestion(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="short-answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <Input
                  label="Points"
                  type="number"
                  value={editingQuestion.points || 10}
                  onChange={(e) => setEditingQuestion(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                />
              </div>

              {editingQuestion.type === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Options</label>
                  <div className="space-y-2">
                    {editingQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correct-answer"
                          checked={editingQuestion.correctAnswer === option}
                          onChange={() => setEditingQuestion(prev => ({ ...prev, correctAnswer: option }))}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(editingQuestion.options || [])]
                            newOptions[index] = e.target.value
                            setEditingQuestion(prev => ({ ...prev, options: newOptions }))
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingQuestion.type === 'true-false' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Correct Answer</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tf-answer"
                        value="true"
                        checked={editingQuestion.correctAnswer === 'true'}
                        onChange={(e) => setEditingQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>True</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tf-answer"
                        value="false"
                        checked={editingQuestion.correctAnswer === 'false'}
                        onChange={(e) => setEditingQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>False</span>
                    </label>
                  </div>
                </div>
              )}

              {(editingQuestion.type === 'short-answer' || editingQuestion.type === 'essay') && (
                <Input
                  label="Correct Answer"
                  value={editingQuestion.correctAnswer as string || ''}
                  onChange={(e) => setEditingQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  placeholder="Enter the correct answer..."
                />
              )}

              <Textarea
                label="Explanation (Optional)"
                value={editingQuestion.explanation || ''}
                onChange={(e) => setEditingQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain why this is the correct answer..."
              />
            </div>
            
            <div className="p-6 border-t flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setIsEditingQuestion(false)}>
                Cancel
              </Button>
              <Button onClick={saveQuestion}>
                <Save className="h-4 w-4 mr-2" />
                Save Question
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}