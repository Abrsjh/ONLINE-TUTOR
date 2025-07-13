"use client"

import * as React from "react"
import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger, useModal } from "@/components/ui/modal"
import { cn, dateUtils, fileUtils, generateUUID } from "@/lib/utils"
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  Image,
  Video,
  Download,
  Eye,
  Save,
  Copy,
  Calendar,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Target,
  Award,
  Settings,
  MoreVertical,
  Search,
  Filter,
  SortAsc,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Type,
  Palette,
  Paperclip,
  X
} from "lucide-react"

// Types
interface Assignment {
  id: string
  title: string
  description: string
  content: string
  dueDate: Date
  points: number
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // in minutes
  instructions: string[]
  attachments: AssignmentFile[]
  rubric: RubricCriteria[]
  submissionRequirements: SubmissionRequirement[]
  tags: string[]
  isTemplate: boolean
  templateCategory?: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'published' | 'archived'
}

interface AssignmentFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
}

interface RubricCriteria {
  id: string
  name: string
  description: string
  maxPoints: number
  levels: RubricLevel[]
}

interface RubricLevel {
  id: string
  name: string
  description: string
  points: number
}

interface SubmissionRequirement {
  id: string
  type: 'file' | 'text' | 'url' | 'video' | 'audio'
  label: string
  description: string
  required: boolean
  maxFiles?: number
  allowedFileTypes?: string[]
  maxFileSize?: number // in MB
  minWords?: number
  maxWords?: number
}

interface AssignmentTemplate {
  id: string
  name: string
  description: string
  category: string
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  content: Partial<Assignment>
  tags: string[]
  usageCount: number
  rating: number
  createdAt: Date
}

// Rich Text Editor Component
interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  className
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const toolbarButtons = [
    { icon: Bold, command: 'bold', tooltip: 'Bold' },
    { icon: Italic, command: 'italic', tooltip: 'Italic' },
    { icon: Underline, command: 'underline', tooltip: 'Underline' },
    { icon: Heading1, command: 'formatBlock', value: 'h1', tooltip: 'Heading 1' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', tooltip: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', tooltip: 'Heading 3' },
    { icon: List, command: 'insertUnorderedList', tooltip: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', tooltip: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', tooltip: 'Quote' },
    { icon: Code, command: 'formatBlock', value: 'pre', tooltip: 'Code Block' },
    { icon: AlignLeft, command: 'justifyLeft', tooltip: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', tooltip: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', tooltip: 'Align Right' },
    { icon: Link, command: 'createLink', tooltip: 'Insert Link' },
    { icon: Undo, command: 'undo', tooltip: 'Undo' },
    { icon: Redo, command: 'redo', tooltip: 'Redo' },
  ]

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1">
        {toolbarButtons.map((button, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => {
              if (button.command === 'createLink') {
                const url = prompt('Enter URL:')
                if (url) formatText(button.command, url)
              } else {
                formatText(button.command, button.value)
              }
            }}
            className="h-8 w-8 p-0"
            title={button.tooltip}
          >
            <button.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "min-h-[200px] p-4 outline-none prose prose-sm max-w-none",
          "focus:ring-2 focus:ring-ring focus:ring-offset-2",
          !value && "text-muted-foreground"
        )}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        dangerouslySetInnerHTML={{ __html: value || `<p>${placeholder}</p>` }}
        suppressContentEditableWarning
      />
    </div>
  )
}

// File Upload Component
interface FileUploadProps {
  files: AssignmentFile[]
  onFilesChange: (files: AssignmentFile[]) => void
  maxFiles?: number
  allowedTypes?: string[]
  maxFileSize?: number // in MB
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  allowedTypes = ['*'],
  maxFileSize = 50
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: AssignmentFile[] = []
    
    Array.from(fileList).forEach(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`)
        return
      }

      // Check file type
      if (allowedTypes[0] !== '*') {
        const fileExtension = fileUtils.getFileExtension(file.name).toLowerCase()
        if (!allowedTypes.includes(fileExtension)) {
          alert(`File type .${fileExtension} is not allowed.`)
          return
        }
      }

      // Create file object
      const assignmentFile: AssignmentFile = {
        id: generateUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date()
      }

      newFiles.push(assignmentFile)
    })

    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`)
      return
    }

    onFilesChange([...files, ...newFiles])
  }, [files, onFilesChange, maxFiles, allowedTypes, maxFileSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeFile = useCallback((fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId))
  }, [files, onFilesChange])

  const getFileIcon = (file: AssignmentFile) => {
    if (fileUtils.isImageFile(file.name)) return Image
    if (fileUtils.isVideoFile(file.name)) return Video
    return FileText
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "hover:border-primary hover:bg-primary/5 cursor-pointer"
        )}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragActive(false)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files, {maxFileSize}MB each
          {allowedTypes[0] !== '*' && ` • ${allowedTypes.join(', ')} files only`}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept={allowedTypes[0] === '*' ? undefined : allowedTypes.map(t => `.${t}`).join(',')}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Files ({files.length})</h4>
          {files.map(file => {
            const FileIcon = getFileIcon(file)
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
              >
                <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fileUtils.formatFileSize(file.size)} • {dateUtils.formatDateTime(file.uploadedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Rubric Builder Component
interface RubricBuilderProps {
  rubric: RubricCriteria[]
  onChange: (rubric: RubricCriteria[]) => void
}

const RubricBuilder: React.FC<RubricBuilderProps> = ({ rubric, onChange }) => {
  const addCriteria = useCallback(() => {
    const newCriteria: RubricCriteria = {
      id: generateUUID(),
      name: '',
      description: '',
      maxPoints: 10,
      levels: [
        { id: generateUUID(), name: 'Excellent', description: '', points: 10 },
        { id: generateUUID(), name: 'Good', description: '', points: 8 },
        { id: generateUUID(), name: 'Satisfactory', description: '', points: 6 },
        { id: generateUUID(), name: 'Needs Improvement', description: '', points: 4 }
      ]
    }
    onChange([...rubric, newCriteria])
  }, [rubric, onChange])

  const updateCriteria = useCallback((criteriaId: string, updates: Partial<RubricCriteria>) => {
    onChange(rubric.map(c => c.id === criteriaId ? { ...c, ...updates } : c))
  }, [rubric, onChange])

  const removeCriteria = useCallback((criteriaId: string) => {
    onChange(rubric.filter(c => c.id !== criteriaId))
  }, [rubric, onChange])

  const updateLevel = useCallback((criteriaId: string, levelId: string, updates: Partial<RubricLevel>) => {
    onChange(rubric.map(c => 
      c.id === criteriaId 
        ? { ...c, levels: c.levels.map(l => l.id === levelId ? { ...l, ...updates } : l) }
        : c
    ))
  }, [rubric, onChange])

  const addLevel = useCallback((criteriaId: string) => {
    const newLevel: RubricLevel = {
      id: generateUUID(),
      name: '',
      description: '',
      points: 0
    }
    onChange(rubric.map(c => 
      c.id === criteriaId 
        ? { ...c, levels: [...c.levels, newLevel] }
        : c
    ))
  }, [rubric, onChange])

  const removeLevel = useCallback((criteriaId: string, levelId: string) => {
    onChange(rubric.map(c => 
      c.id === criteriaId 
        ? { ...c, levels: c.levels.filter(l => l.id !== levelId) }
        : c
    ))
  }, [rubric, onChange])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Grading Rubric</h3>
        <Button onClick={addCriteria} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Criteria
        </Button>
      </div>

      {rubric.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium mb-2">No Grading Criteria</h4>
            <p className="text-muted-foreground mb-4">
              Add grading criteria to help students understand how their work will be evaluated.
            </p>
            <Button onClick={addCriteria}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Criteria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rubric.map((criteria, criteriaIndex) => (
            <Card key={criteria.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Criteria name (e.g., Content Quality)"
                      value={criteria.name}
                      onChange={(e) => updateCriteria(criteria.id, { name: e.target.value })}
                    />
                    <Textarea
                      placeholder="Describe what this criteria evaluates..."
                      value={criteria.description}
                      onChange={(e) => updateCriteria(criteria.id, { description: e.target.value })}
                      resize="vertical"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      placeholder="Max points"
                      value={criteria.maxPoints}
                      onChange={(e) => updateCriteria(criteria.id, { maxPoints: parseInt(e.target.value) || 0 })}
                      className="w-24"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriteria(criteria.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">Performance Levels</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLevel(criteria.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Level
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    {criteria.levels.map((level, levelIndex) => (
                      <div key={level.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Input
                          placeholder="Level name"
                          value={level.name}
                          onChange={(e) => updateLevel(criteria.id, level.id, { name: e.target.value })}
                          className="w-32"
                        />
                        <Input
                          placeholder="Description"
                          value={level.description}
                          onChange={(e) => updateLevel(criteria.id, level.id, { description: e.target.value })}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Points"
                          value={level.points}
                          onChange={(e) => updateLevel(criteria.id, level.id, { points: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                        {criteria.levels.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLevel(criteria.id, level.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Template Library Component
interface TemplateLibraryProps {
  onSelectTemplate: (template: AssignmentTemplate) => void
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelectTemplate }) => {
  const [templates] = useState<AssignmentTemplate[]>([
    {
      id: '1',
      name: 'Essay Assignment',
      description: 'Standard essay assignment with rubric',
      category: 'Writing',
      subject: 'English',
      difficulty: 'intermediate',
      estimatedTime: 120,
      content: {
        title: 'Essay Assignment',
        description: 'Write a comprehensive essay on the given topic',
        content: '<h2>Instructions</h2><p>Write a 5-paragraph essay that includes:</p><ul><li>Introduction with thesis statement</li><li>Three body paragraphs with supporting evidence</li><li>Conclusion that restates the thesis</li></ul>',
        points: 100,
        submissionRequirements: [
          {
            id: generateUUID(),
            type: 'file',
            label: 'Essay Document',
            description: 'Upload your essay as a PDF or Word document',
            required: true,
            allowedFileTypes: ['pdf', 'doc', 'docx'],
            maxFileSize: 10
          }
        ]
      },
      tags: ['essay', 'writing', 'analysis'],
      usageCount: 156,
      rating: 4.8,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Math Problem Set',
      description: 'Collection of math problems with step-by-step solutions',
      category: 'Problem Solving',
      subject: 'Mathematics',
      difficulty: 'advanced',
      estimatedTime: 90,
      content: {
        title: 'Math Problem Set',
        description: 'Solve the following mathematical problems',
        content: '<h2>Problem Set</h2><p>Show all work and explain your reasoning for each problem.</p>',
        points: 50,
        submissionRequirements: [
          {
            id: generateUUID(),
            type: 'file',
            label: 'Solution Document',
            description: 'Upload your solutions with work shown',
            required: true,
            allowedFileTypes: ['pdf', 'jpg', 'png'],
            maxFileSize: 20
          }
        ]
      },
      tags: ['math', 'problem-solving', 'calculations'],
      usageCount: 89,
      rating: 4.6,
      createdAt: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'Science Lab Report',
      description: 'Template for scientific experiment reports',
      category: 'Lab Work',
      subject: 'Science',
      difficulty: 'intermediate',
      estimatedTime: 180,
      content: {
        title: 'Lab Report',
        description: 'Document your scientific experiment',
        content: '<h2>Lab Report Format</h2><ol><li>Hypothesis</li><li>Materials and Methods</li><li>Results</li><li>Discussion</li><li>Conclusion</li></ol>',
        points: 75,
        submissionRequirements: [
          {
            id: generateUUID(),
            type: 'file',
            label: 'Lab Report',
            description: 'Upload your complete lab report',
            required: true,
            allowedFileTypes: ['pdf', 'doc', 'docx'],
            maxFileSize: 15
          },
          {
            id: generateUUID(),
            type: 'file',
            label: 'Data Files',
            description: 'Upload any data files or images',
            required: false,
            allowedFileTypes: ['xlsx', 'csv', 'jpg', 'png'],
            maxFileSize: 10,
            maxFiles: 5
          }
        ]
      },
      tags: ['science', 'lab', 'experiment', 'report'],
      usageCount: 67,
      rating: 4.7,
      createdAt: new Date('2024-01-25')
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]
  const subjects = ['all', ...Array.from(new Set(templates.map(t => t.subject)))]

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSubject = selectedSubject === 'all' || template.subject === selectedSubject
    
    return matchesSearch && matchesCategory && matchesSubject
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              clearable
              onClear={() => setSearchTerm('')}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {template.rating}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{template.subject}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{template.category}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getDifficultyColor(template.difficulty)
                  )}>
                    {template.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {template.estimatedTime} min
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-muted text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-1 bg-muted text-xs rounded-md">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Used {template.usageCount} times
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-medium mb-2">No Templates Found</h4>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or create a new assignment from scratch.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Main Assignment Builder Component
export interface AssignmentBuilderProps {
  initialAssignment?: Partial<Assignment>
  onSave: (assignment: Assignment) => void
  onCancel: () => void
  className?: string
}

export const AssignmentBuilder: React.FC<AssignmentBuilderProps> = ({
  initialAssignment,
  onSave,
  onCancel,
  className
}) => {
  const [assignment, setAssignment] = useState<Assignment>(() => ({
    id: initialAssignment?.id || generateUUID(),
    title: initialAssignment?.title || '',
    description: initialAssignment?.description || '',
    content: initialAssignment?.content || '',
    dueDate: initialAssignment?.dueDate || dateUtils.addDays(new Date(), 7),
    points: initialAssignment?.points || 100,
    subject: initialAssignment?.subject || '',
    difficulty: initialAssignment?.difficulty || 'intermediate',
    estimatedTime: initialAssignment?.estimatedTime || 60,
    instructions: initialAssignment?.instructions || [],
    attachments: initialAssignment?.attachments || [],
    rubric: initialAssignment?.rubric || [],
    submissionRequirements: initialAssignment?.submissionRequirements || [],
    tags: initialAssignment?.tags || [],
    isTemplate: initialAssignment?.isTemplate || false,
    templateCategory: initialAssignment?.templateCategory,
    createdAt: initialAssignment?.createdAt || new Date(),
    updatedAt: new Date(),
    status: initialAssignment?.status || 'draft'
  }))

  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'requirements' | 'rubric' | 'preview'>('basic')
  const [isSaving, setIsSaving] = useState(false)
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const templateModal = useModal()

  const updateAssignment = useCallback((updates: Partial<Assignment>) => {
    setAssignment(prev => ({ ...prev, ...updates, updatedAt: new Date() }))
  }, [])

  const addInstruction = useCallback(() => {
    updateAssignment({
      instructions: [...assignment.instructions, '']
    })
  }, [assignment.instructions, updateAssignment])

  const updateInstruction = useCallback((index: number, value: string) => {
    const newInstructions = [...assignment.instructions]
    newInstructions[index] = value
    updateAssignment({ instructions: newInstructions })
  }, [assignment.instructions, updateAssignment])

  const removeInstruction = useCallback((index: number) => {
    updateAssignment({
      instructions: assignment.instructions.filter((_, i) => i !== index)
    })
  }, [assignment.instructions, updateAssignment])

  const addSubmissionRequirement = useCallback(() => {
    const newRequirement: SubmissionRequirement = {
      id: generateUUID(),
      type: 'file',
      label: '',
      description: '',
      required: true
    }
    updateAssignment({
      submissionRequirements: [...assignment.submissionRequirements, newRequirement]
    })
  }, [assignment.submissionRequirements, updateAssignment])

  const updateSubmissionRequirement = useCallback((id: string, updates: Partial<SubmissionRequirement>) => {
    updateAssignment({
      submissionRequirements: assignment.submissionRequirements.map(req =>
        req.id === id ? { ...req, ...updates } : req
      )
    })
  }, [assignment.submissionRequirements, updateAssignment])

  const removeSubmissionRequirement = useCallback((id: string) => {
    updateAssignment({
      submissionRequirements: assignment.submissionRequirements.filter(req => req.id !== id)
    })
  }, [assignment.submissionRequirements, updateAssignment])

  const addTag = useCallback((tag: string) => {
    if (tag && !assignment.tags.includes(tag)) {
      updateAssignment({
        tags: [...assignment.tags, tag]
      })
    }
  }, [assignment.tags, updateAssignment])

  const removeTag = useCallback((tag: string) => {
    updateAssignment({
      tags: assignment.tags.filter(t => t !== tag)
    })
  }, [assignment.tags, updateAssignment])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Validate required fields
      if (!assignment.title.trim()) {
        alert('Please enter a title for the assignment.')
        setActiveTab('basic')
        return
      }
      
      if (!assignment.description.trim()) {
        alert('Please enter a description for the assignment.')
        setActiveTab('basic')
        return
      }

      await onSave(assignment)
    } catch (error) {
      console.error('Error saving assignment:', error)
      alert('Failed to save assignment. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [assignment, onSave])

  const handleTemplateSelect = useCallback((template: AssignmentTemplate) => {
    const templateAssignment: Assignment = {
      ...assignment,
      ...template.content,
      id: assignment.id,
      createdAt: assignment.createdAt,
      updatedAt: new Date(),
      isTemplate: false
    } as Assignment
    
    setAssignment(templateAssignment)
    templateModal.closeModal()
  }, [assignment, templateModal])

  const calculateTotalPoints = useCallback(() => {
    return assignment.rubric.reduce((total, criteria) => total + criteria.maxPoints, 0)
  }, [assignment.rubric])

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Settings },
    { id: 'content', label: 'Content', icon: Type },
    { id: 'requirements', label: 'Requirements', icon: Target },
    { id: 'rubric', label: 'Rubric', icon: Award },
    { id: 'preview', label: 'Preview', icon: Eye }
  ] as const

  return (
    <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {initialAssignment?.id ? 'Edit Assignment' : 'Create Assignment'}
          </h1>
          <p className="text-muted-foreground">
            Build comprehensive assignments with rich content and grading rubrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => templateModal.openModal()}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save Assignment
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Title"
                  placeholder="Enter assignment title..."
                  value={assignment.title}
                  onChange={(e) => updateAssignment({ title: e.target.value })}
                  required
                />
                
                <Textarea
                  label="Description"
                  placeholder="Brief description of the assignment..."
                  value={assignment.description}
                  onChange={(e) => updateAssignment({ description: e.target.value })}
                  required
                  showCharCount
                  maxLength={500}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Subject"
                    placeholder="e.g., Mathematics"
                    value={assignment.subject}
                    onChange={(e) => updateAssignment({ subject: e.target.value })}
                  />
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Difficulty</label>
                    <select
                      value={assignment.difficulty}
                      onChange={(e) => updateAssignment({ difficulty: e.target.value as Assignment['difficulty'] })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Points"
                    type="number"
                    placeholder="100"
                    value={assignment.points}
                    onChange={(e) => updateAssignment({ points: parseInt(e.target.value) || 0 })}
                  />
                  
                  <Input
                    label="Estimated Time (minutes)"
                    type="number"
                    placeholder="60"
                    value={assignment.estimatedTime}
                    onChange={(e) => updateAssignment({ estimatedTime: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <Input
                  label="Due Date"
                  type="datetime-local"
                  value={assignment.dueDate.toISOString().slice(0, 16)}
                  onChange={(e) => updateAssignment({ dueDate: new Date(e.target.value) })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags & Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add a tag and press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const target = e.target as HTMLInputElement
                          addTag(target.value.trim())
                          target.value = ''
                        }
                      }}
                    />
                    {assignment.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {assignment.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={assignment.isTemplate}
                      onChange={(e) => updateAssignment({ isTemplate: e.target.checked })}
                      className="rounded border-input"
                    />
                    <span className="text-sm font-medium">Save as template</span>
                  </label>
                  
                  {assignment.isTemplate && (
                    <Input
                      placeholder="Template category..."
                      value={assignment.templateCategory || ''}
                      onChange={(e) => updateAssignment({ templateCategory: e.target.value })}
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={assignment.status}
                    onChange={(e) => updateAssignment({ status: e.target.value as Assignment['status'] })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Content</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={assignment.content}
                  onChange={(content) => updateAssignment({ content })}
                  placeholder="Write your assignment instructions, questions, and content here..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Step-by-Step Instructions</CardTitle>
                  <Button onClick={addInstruction} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assignment.instructions.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="text-lg font-medium mb-2">No Instructions Added</h4>
                    <p className="text-muted-foreground mb-4">
                      Break down your assignment into clear, actionable steps.
                    </p>
                    <Button onClick={addInstruction}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Step
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignment.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <Textarea
                            placeholder={`Step ${index + 1} instructions...`}
                            value={instruction}
                            onChange={(e) => updateInstruction(index, e.target.value)}
                            resize="vertical"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInstruction(index)}
                          className="text-destructive hover:text-destructive mt-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  files={assignment.attachments}
                  onFilesChange={(attachments) => updateAssignment({ attachments })}
                  maxFiles={10}
                  maxFileSize={50}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Submission Requirements</CardTitle>
                <Button onClick={addSubmissionRequirement} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignment.submissionRequirements.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-lg font-medium mb-2">No Requirements Set</h4>
                  <p className="text-muted-foreground mb-4">
                    Define what students need to submit for this assignment.
                  </p>
                  <Button onClick={addSubmissionRequirement}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Requirement
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignment.submissionRequirements.map((requirement, index) => (
                    <Card key={requirement.id} variant="outlined">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Requirement {index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubmissionRequirement(requirement.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Type</label>
                              <select
                                value={requirement.type}
                                onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                                  type: e.target.value as SubmissionRequirement['type'] 
                                })}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                              >
                                <option value="file">File Upload</option>
                                <option value="text">Text Response</option>
                                <option value="url">URL/Link</option>
                                <option value="video">Video Recording</option>
                                <option value="audio">Audio Recording</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={requirement.required}
                                  onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                                    required: e.target.checked 
                                  })}
                                  className="rounded border-input"
                                />
                                <span className="text-sm font-medium">Required</span>
                              </label>
                            </div>
                          </div>

                          <Input
                            label="Label"
                            placeholder="e.g., Essay Document, Video Presentation"
                            value={requirement.label}
                            onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                              label: e.target.value 
                            })}
                          />

                          <Textarea
                            label="Description"
                            placeholder="Describe what students should submit..."
                            value={requirement.description}
                            onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                              description: e.target.value 
                            })}
                            resize="vertical"
                          />

                          {/* Type-specific options */}
                          {requirement.type === 'file' && (
                            <div className="grid grid-cols-3 gap-4">
                              <Input
                                label="Max Files"
                                type="number"
                                placeholder="1"
                                value={requirement.maxFiles || 1}
                                onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                                  maxFiles: parseInt(e.target.value) || 1 
                                })}
                              />
                              <Input
                                label="Max File Size (MB)"
                                type="number"
                                placeholder="10"
                                value={requirement.maxFileSize || 10}
                                onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                                  maxFileSize: parseInt(e.target.value) || 10 
                                })}
                              />
                              <Input
                                label="Allowed Types"
                                placeholder="pdf,doc,docx"
                                value={requirement.allowedFileTypes?.join(',') || ''}
                                onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                                  allowedFileTypes: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                })}
                              />
                            </div>
                          )}

                          {requirement.type === 'text' && (
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                label="Min Words"
                                type="number"
                                placeholder="100"
                                value={requirement.minWords || ''}
                                onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                                  minWords: parseInt(e.target.value) || undefined 
                                })}
                              />
                              <Input
                                label="Max Words"
                                type="number"
                                placeholder="1000"
                                value={requirement.maxWords || ''}
                                onChange={(e) => updateSubmissionRequirement(requirement.id, { 
                                  maxWords: parseInt(e.target.value) || undefined 
                                })}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rubric Tab */}
        {activeTab === 'rubric' && (
          <RubricBuilder
            rubric={assignment.rubric}
            onChange={(rubric) => updateAssignment({ rubric })}
          />
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{assignment.title || 'Untitled Assignment'}</CardTitle>
                    <p className="text-muted-foreground mt-1">{assignment.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{assignment.points} pts</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {dateUtils.formatDateTime(assignment.dueDate)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Subject</div>
                    <div className="font-medium">{assignment.subject || 'Not specified'}</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Difficulty</div>
                    <div className={cn(
                      "font-medium capitalize",
                      assignment.difficulty === 'beginner' && 'text-green-600',
                      assignment.difficulty === 'intermediate' && 'text-yellow-600',
                      assignment.difficulty === 'advanced' && 'text-red-600'
                    )}>
                      {assignment.difficulty}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Est. Time</div>
                    <div className="font-medium">{assignment.estimatedTime} min</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className={cn(
                      "font-medium capitalize",
                      assignment.status === 'published' && 'text-green-600',
                      assignment.status === 'draft' && 'text-yellow-600',
                      assignment.status === 'archived' && 'text-gray-600'
                    )}>
                      {assignment.status}
                    </div>
                  </div>
                </div>

                {assignment.tags.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {assignment.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {assignment.content && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Assignment Content</h4>
                    <div 
                      className="prose prose-sm max-w-none border rounded-lg p-4"
                      dangerouslySetInnerHTML={{ __html: assignment.content }}
                    />
                  </div>
                )}

                {assignment.instructions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Instructions</h4>
                    <div className="space-y-3">
                      {assignment.instructions.map((instruction, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 text-sm">{instruction}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assignment.attachments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {assignment.attachments.map(file => {
                        const FileIcon = fileUtils.isImageFile(file.name) ? Image : 
                                        fileUtils.isVideoFile(file.name) ? Video : FileText
                        return (
                          <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <FileIcon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{file.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {fileUtils.formatFileSize(file.size)}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {assignment.submissionRequirements.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Submission Requirements</h4>
                    <div className="space-y-3">
                      {assignment.submissionRequirements.map((req, index) => (
                        <div key={req.id} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{req.label}</span>
                            {req.required && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Type: {req.type}
                            {req.type === 'file' && req.allowedFileTypes && (
                              <span> • Allowed: {req.allowedFileTypes.join(', ')}</span>
                            )}
                            {req.type === 'file' && req.maxFileSize && (
                              <span> • Max size: {req.maxFileSize}MB</span>
                            )}
                            {req.type === 'text' && (req.minWords || req.maxWords) && (
                              <span> • Words: {req.minWords || 0}-{req.maxWords || '∞'}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assignment.rubric.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Grading Rubric</h4>
                      <div className="text-sm text-muted-foreground">
                        Total: {calculateTotalPoints()} points
                      </div>
                    </div>
                    <div className="space-y-4">
                      {assignment.rubric.map(criteria => (
                        <div key={criteria.id} className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 p-3 border-b">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">{criteria.name}</h5>
                              <span className="text-sm font-medium">{criteria.maxPoints} pts</span>
                            </div>
                            {criteria.description && (
                              <p className="text-sm text-muted-foreground mt-1">{criteria.description}</p>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="grid gap-2">
                              {criteria.levels.map(level => (
                                <div key={level.id} className="flex items-center justify-between p-2 bg-muted/25 rounded">
                                  <div>
                                    <span className="font-medium">{level.name}</span>
                                    {level.description && (
                                      <span className="text-sm text-muted-foreground ml-2">
                                        - {level.description}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium">{level.points} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Template Library Modal */}
      <Modal open={templateModal.open} onOpenChange={templateModal.setOpen}>
        <ModalContent size="5xl">
          <ModalHeader>
            <ModalTitle>Assignment Templates</ModalTitle>
          </ModalHeader>
          <TemplateLibrary onSelectTemplate={handleTemplateSelect} />
        </ModalContent>
      </Modal>
    </div>
  )
}

export default AssignmentBuilder