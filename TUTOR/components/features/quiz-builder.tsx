"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { quizSchema, type QuizData } from "@/lib/validations"
import { cn } from "@/lib/utils"
import {
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Shuffle,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Play,
  Settings,
  HelpCircle,
  CheckCircle,
  X,
  Copy,
  ArrowUp,
  ArrowDown,
  Timer,
  Users,
  Target
} from "lucide-react"

// Question types
type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'

interface QuizQuestion {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  correctAnswer?: string
  points: number
  explanation?: string
  required: boolean
}

interface QuizSettings {
  timeLimit?: number
  allowRetakes: boolean
  showCorrectAnswers: boolean
  randomizeQuestions: boolean
  passingScore?: number
  instantFeedback: boolean
  showProgressBar: boolean
  allowBackNavigation: boolean
  shuffleAnswers: boolean
}

interface QuizBuilderProps {
  initialQuiz?: Partial<QuizData>
  onSave?: (quiz: QuizData) => void
  onPreview?: (quiz: QuizData) => void
  onPublish?: (quiz: QuizData) => void
  className?: string
}

const questionTypeOptions = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: CheckCircle },
  { value: 'true_false', label: 'True/False', icon: HelpCircle },
  { value: 'short_answer', label: 'Short Answer', icon: Edit },
  { value: 'essay', label: 'Essay', icon: FileText }
] as const

const QuizBuilder: React.FC<QuizBuilderProps> = ({
  initialQuiz,
  onSave,
  onPreview,
  onPublish,
  className
}) => {
  // Quiz state
  const [title, setTitle] = useState(initialQuiz?.title || '')
  const [description, setDescription] = useState(initialQuiz?.description || '')
  const [subject, setSubject] = useState(initialQuiz?.subject || '')
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuiz?.questions?.map((q, index) => ({
      id: `question-${index}`,
      type: q.type,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: q.points,
      explanation: q.explanation,
      required: true
    })) || []
  )
  
  const [settings, setSettings] = useState<QuizSettings>({
    timeLimit: initialQuiz?.timeLimit,
    allowRetakes: initialQuiz?.allowRetakes || false,
    showCorrectAnswers: initialQuiz?.showCorrectAnswers || false,
    randomizeQuestions: initialQuiz?.randomizeQuestions || false,
    passingScore: initialQuiz?.passingScore,
    instantFeedback: true,
    showProgressBar: true,
    allowBackNavigation: true,
    shuffleAnswers: false
  })

  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    initialQuiz?.studentIds || []
  )
  
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'students'>('questions')
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Add new question
  const addQuestion = useCallback((type: QuestionType) => {
    const newQuestion: QuizQuestion = {
      id: `question-${Date.now()}`,
      type,
      question: '',
      options: type === 'multiple_choice' ? ['', '', '', ''] : type === 'true_false' ? ['True', 'False'] : undefined,
      correctAnswer: '',
      points: 1,
      explanation: '',
      required: true
    }
    setQuestions(prev => [...prev, newQuestion])
  }, [])

  // Update question
  const updateQuestion = useCallback((id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }, [])

  // Delete question
  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }, [])

  // Duplicate question
  const duplicateQuestion = useCallback((id: string) => {
    const question = questions.find(q => q.id === id)
    if (question) {
      const duplicated = {
        ...question,
        id: `question-${Date.now()}`,
        question: `${question.question} (Copy)`
      }
      setQuestions(prev => {
        const index = prev.findIndex(q => q.id === id)
        return [...prev.slice(0, index + 1), duplicated, ...prev.slice(index + 1)]
      })
    }
  }, [questions])

  // Move question
  const moveQuestion = useCallback((id: string, direction: 'up' | 'down') => {
    setQuestions(prev => {
      const index = prev.findIndex(q => q.id === id)
      if (index === -1) return prev
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev
      
      const newQuestions = [...prev]
      const [movedQuestion] = newQuestions.splice(index, 1)
      newQuestions.splice(newIndex, 0, movedQuestion)
      return newQuestions
    })
  }, [])

  // Validate quiz
  const validateQuiz = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!title.trim()) {
      newErrors.title = 'Quiz title is required'
    }
    
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required'
    }
    
    if (questions.length === 0) {
      newErrors.questions = 'At least one question is required'
    }
    
    questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors[`question-${question.id}-text`] = 'Question text is required'
      }
      
      if (question.type === 'multiple_choice') {
        if (!question.options || question.options.length < 2) {
          newErrors[`question-${question.id}-options`] = 'At least 2 options are required'
        } else if (question.options.some(opt => !opt.trim())) {
          newErrors[`question-${question.id}-options`] = 'All options must have text'
        }
      }
      
      if (!question.correctAnswer?.trim() && question.type !== 'essay') {
        newErrors[`question-${question.id}-answer`] = 'Correct answer is required'
      }
      
      if (question.points < 1) {
        newErrors[`question-${question.id}-points`] = 'Points must be at least 1'
      }
    })
    
    if (selectedStudents.length === 0) {
      newErrors.students = 'At least one student must be selected'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [title, subject, questions, selectedStudents])

  // Save quiz
  const handleSave = useCallback(async () => {
    if (!validateQuiz()) return
    
    setIsSaving(true)
    try {
      const quizData: QuizData = {
        title,
        description,
        subject,
        questions: questions.map(q => ({
          type: q.type,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          explanation: q.explanation
        })),
        timeLimit: settings.timeLimit,
        allowRetakes: settings.allowRetakes,
        showCorrectAnswers: settings.showCorrectAnswers,
        randomizeQuestions: settings.randomizeQuestions,
        passingScore: settings.passingScore,
        studentIds: selectedStudents
      }
      
      await onSave?.(quizData)
    } catch (error) {
      console.error('Failed to save quiz:', error)
    } finally {
      setIsSaving(false)
    }
  }, [validateQuiz, title, description, subject, questions, settings, selectedStudents, onSave])

  // Preview quiz
  const handlePreview = useCallback(() => {
    if (!validateQuiz()) return
    
    const quizData: QuizData = {
      title,
      description,
      subject,
      questions: questions.map(q => ({
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        explanation: q.explanation
      })),
      timeLimit: settings.timeLimit,
      allowRetakes: settings.allowRetakes,
      showCorrectAnswers: settings.showCorrectAnswers,
      randomizeQuestions: settings.randomizeQuestions,
      passingScore: settings.passingScore,
      studentIds: selectedStudents
    }
    
    onPreview?.(quizData)
  }, [validateQuiz, title, description, subject, questions, settings, selectedStudents, onPreview])

  // Calculate total points
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Builder</h1>
          <p className="text-muted-foreground">Create and customize your quiz</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handlePreview} disabled={questions.length === 0}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save Quiz
          </Button>
        </div>
      </div>

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quiz Title"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
            />
            <Input
              label="Subject"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              error={errors.subject}
              required
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Enter quiz description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          
          {/* Quiz Stats */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <HelpCircle className="h-4 w-4" />
              <span>{questions.length} questions</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>{totalPoints} total points</span>
            </div>
            {settings.timeLimit && (
              <div className="flex items-center space-x-1">
                <Timer className="h-4 w-4" />
                <span>{settings.timeLimit} minutes</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{selectedStudents.length} students</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'questions', label: 'Questions', icon: HelpCircle },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'students', label: 'Students', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Add Question Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Add Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {questionTypeOptions.map((type) => (
                  <Button
                    key={type.value}
                    variant="outline"
                    onClick={() => addQuestion(type.value)}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <type.icon className="h-6 w-6" />
                    <span className="text-sm">{type.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          {questions.length > 0 && (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={(updates) => updateQuestion(question.id, updates)}
                  onDelete={() => deleteQuestion(question.id)}
                  onDuplicate={() => duplicateQuestion(question.id)}
                  onMoveUp={() => moveQuestion(question.id, 'up')}
                  onMoveDown={() => moveQuestion(question.id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < questions.length - 1}
                  errors={errors}
                />
              ))}
            </div>
          )}

          {questions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first question to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <QuizSettings
          settings={settings}
          onUpdate={setSettings}
          errors={errors}
        />
      )}

      {activeTab === 'students' && (
        <StudentSelector
          selectedStudents={selectedStudents}
          onUpdate={setSelectedStudents}
          error={errors.students}
        />
      )}
    </div>
  )
}

// Question Editor Component
interface QuestionEditorProps {
  question: QuizQuestion
  index: number
  onUpdate: (updates: Partial<QuizQuestion>) => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  errors: Record<string, string>
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  errors
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const addOption = () => {
    const newOptions = [...(question.options || []), '']
    onUpdate({ options: newOptions })
  }

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])]
    newOptions[optionIndex] = value
    onUpdate({ options: newOptions })
  }

  const removeOption = (optionIndex: number) => {
    const newOptions = question.options?.filter((_, i) => i !== optionIndex) || []
    onUpdate({ options: newOptions })
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
              <span className="text-sm font-medium">Question {index + 1}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs px-2 py-1 bg-muted rounded-full">
                {questionTypeOptions.find(t => t.value === question.type)?.label}
              </span>
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                {question.points} {question.points === 1 ? 'point' : 'points'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={!canMoveUp}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={!canMoveDown}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Question Text */}
          <Textarea
            label="Question"
            placeholder="Enter your question"
            value={question.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            error={errors[`question-${question.id}-text`]}
            required
          />

          {/* Question Type Specific Fields */}
          {question.type === 'multiple_choice' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Answer Options</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={(question.options?.length || 0) >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-2">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={question.correctAnswer === option}
                      onChange={() => onUpdate({ correctAnswer: option })}
                      className="mt-1"
                    />
                    <Input
                      placeholder={`Option ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                      className="flex-1"
                    />
                    {(question.options?.length || 0) > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(optionIndex)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {errors[`question-${question.id}-options`] && (
                <p className="text-sm text-destructive">{errors[`question-${question.id}-options`]}</p>
              )}
            </div>
          )}

          {question.type === 'true_false' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Correct Answer</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctAnswer === 'True'}
                    onChange={() => onUpdate({ correctAnswer: 'True' })}
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correctAnswer === 'False'}
                    onChange={() => onUpdate({ correctAnswer: 'False' })}
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {question.type === 'short_answer' && (
            <Input
              label="Correct Answer"
              placeholder="Enter the correct answer"
              value={question.correctAnswer || ''}
              onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
              error={errors[`question-${question.id}-answer`]}
            />
          )}

          {question.type === 'essay' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Grading Instructions</label>
              <Textarea
                placeholder="Provide instructions for manual grading (optional)"
                value={question.explanation || ''}
                onChange={(e) => onUpdate({ explanation: e.target.value })}
                rows={3}
              />
            </div>
          )}

          {/* Points and Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Points"
              type="number"
              min="1"
              max="100"
              value={question.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
              error={errors[`question-${question.id}-points`]}
            />
          </div>

          {question.type !== 'essay' && (
            <Textarea
              label="Explanation (Optional)"
              placeholder="Explain why this is the correct answer"
              value={question.explanation || ''}
              onChange={(e) => onUpdate({ explanation: e.target.value })}
              rows={2}
            />
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Quiz Settings Component
interface QuizSettingsProps {
  settings: QuizSettings
  onUpdate: (settings: QuizSettings) => void
  errors: Record<string, string>
}

const QuizSettings: React.FC<QuizSettingsProps> = ({
  settings,
  onUpdate,
  errors
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time & Attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!settings.timeLimit}
                  onChange={(e) => onUpdate({
                    ...settings,
                    timeLimit: e.target.checked ? 30 : undefined
                  })}
                />
                <span className="text-sm font-medium">Set time limit</span>
              </label>
              {settings.timeLimit && (
                <Input
                  type="number"
                  min="5"
                  max="300"
                  value={settings.timeLimit}
                  onChange={(e) => onUpdate({
                    ...settings,
                    timeLimit: parseInt(e.target.value) || 30
                  })}
                  placeholder="Minutes"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!settings.passingScore}
                  onChange={(e) => onUpdate({
                    ...settings,
                    passingScore: e.target.checked ? 70 : undefined
                  })}
                />
                <span className="text-sm font-medium">Set passing score</span>
              </label>
              {settings.passingScore && (
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.passingScore}
                  onChange={(e) => onUpdate({
                    ...settings,
                    passingScore: parseInt(e.target.value) || 70
                  })}
                  placeholder="Percentage"
                />
              )}
            </div>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.allowRetakes}
              onChange={(e) => onUpdate({
                ...settings,
                allowRetakes: e.target.checked
              })}
            />
            <span className="text-sm font-medium">Allow retakes</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.randomizeQuestions}
              onChange={(e) => onUpdate({
                ...settings,
                randomizeQuestions: e.target.checked
              })}
            />
            <span className="text-sm font-medium">Randomize question order</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.shuffleAnswers}
              onChange={(e) => onUpdate({
                ...settings,
                shuffleAnswers: e.target.checked
              })}
            />
            <span className="text-sm font-medium">Shuffle answer choices</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.allowBackNavigation}
              onChange={(e) => onUpdate({
                ...settings,
                allowBackNavigation: e.target.checked
              })}
            />
            <span className="text-sm font-medium">Allow going back to previous questions</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback & Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.instantFeedback}
              onChange={(e) => onUpdate({
                ...settings,
                instantFeedback: e.target.checked
              })}
            />
            <span className="text-sm font-medium">Show instant feedback after each question</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.showCorrectAnswers}
              onChange={(e) => onUpdate({
                ...settings,
                showCorrectAnswers: e.target.checked
              })}
            />
            <span className="text-sm font-medium">Show correct answers in results</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.showProgressBar}
              onChange={(e) => onUpdate({
                ...settings,
                showProgressBar: e.target.checked
              })}
            />
            <span className="text-sm font-medium">Show progress bar</span>
          </label>
        </CardContent>
      </Card>
    </div>
  )
}

// Student Selector Component
interface StudentSelectorProps {
  selectedStudents: string[]
  onUpdate: (students: string[]) => void
  error?: string
}

const StudentSelector: React.FC<StudentSelectorProps> = ({
  selectedStudents,
  onUpdate,
  error
}) => {
  // Mock student data - in real app, this would come from an API
  const [students] = useState([
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com' },
    { id: '3', name: 'Carol Davis', email: 'carol@example.com' },
    { id: '4', name: 'David Wilson', email: 'david@example.com' },
    { id: '5', name: 'Eva Brown', email: 'eva@example.com' }
  ])

  const [searchTerm, setSearchTerm] = useState('')

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      onUpdate(selectedStudents.filter(id => id !== studentId))
    } else {
      onUpdate([...selectedStudents, studentId])
    }
  }

  const selectAll = () => {
    onUpdate(filteredStudents.map(s => s.id))
  }

  const deselectAll = () => {
    onUpdate([])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assign to Students</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredStudents.map((student) => (
            <label
              key={student.id}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
              />
              <div className="flex-1">
                <div className="font-medium">{student.name}</div>
                <div className="text-sm text-muted-foreground">{student.email}</div>
              </div>
            </label>
          ))}
        </div>
        
        {filteredStudents.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No students found
          </p>
        )}
        
        <div className="text-sm text-muted-foreground">
          {selectedStudents.length} of {students.length} students selected
        </div>
      </CardContent>
    </Card>
  )
}

export default QuizBuilder