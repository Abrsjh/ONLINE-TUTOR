"use client"

import * as React from "react"
import { cn, dateUtils, fileUtils, stringUtils } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import {
  Send,
  Paperclip,
  Smile,
  Search,
  Download,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  X,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Eye,
  Copy,
  Reply,
  Forward,
  Trash2,
  Edit3,
  Pin,
  Star,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Phone,
  VideoIcon,
  Settings,
  Users,
  Filter,
  Calendar,
  Hash,
  AtSign,
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  List,
  Quote,
  Heading,
} from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Dialog from "@radix-ui/react-dialog"
import * as Tooltip from "@radix-ui/react-tooltip"
import * as Popover from "@radix-ui/react-popover"
import * as ScrollArea from "@radix-ui/react-scroll-area"

// Types
export interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: Date
  type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system'
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  replyTo?: string
  attachments?: ChatAttachment[]
  reactions?: ChatReaction[]
  isEdited?: boolean
  editedAt?: Date
  isPinned?: boolean
  isStarred?: boolean
  mentions?: string[]
  metadata?: Record<string, any>
}

export interface ChatAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnail?: string
  duration?: number // for audio/video files
  dimensions?: { width: number; height: number } // for images/videos
}

export interface ChatReaction {
  emoji: string
  users: string[]
  count: number
}

export interface ChatUser {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen?: Date
  isTyping?: boolean
}

export interface ChatProps {
  messages: ChatMessage[]
  currentUser: ChatUser
  participants: ChatUser[]
  onSendMessage: (content: string, attachments?: File[]) => void
  onEditMessage?: (messageId: string, content: string) => void
  onDeleteMessage?: (messageId: string) => void
  onReplyToMessage?: (messageId: string) => void
  onForwardMessage?: (messageId: string) => void
  onPinMessage?: (messageId: string) => void
  onStarMessage?: (messageId: string) => void
  onReactToMessage?: (messageId: string, emoji: string) => void
  onUploadFile?: (files: File[]) => Promise<ChatAttachment[]>
  onDownloadFile?: (attachment: ChatAttachment) => void
  onStartCall?: (type: 'audio' | 'video') => void
  onSearchMessages?: (query: string) => ChatMessage[]
  onExportChat?: (format: 'txt' | 'pdf' | 'json') => void
  onMarkAsRead?: (messageId: string) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  className?: string
  disabled?: boolean
  placeholder?: string
  maxFileSize?: number
  allowedFileTypes?: string[]
  showParticipants?: boolean
  showSearch?: boolean
  showExport?: boolean
  enableVoiceMessages?: boolean
  enableVideoMessages?: boolean
  enableScreenShare?: boolean
  theme?: 'light' | 'dark' | 'auto'
  soundEnabled?: boolean
  notificationsEnabled?: boolean
}

// Emoji data (simplified - in real app would use emoji-js or similar)
const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺'],
  'Food & Drink': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'],
  'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️'],
}

const COMMON_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯']

export function Chat({
  messages = [],
  currentUser,
  participants = [],
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReplyToMessage,
  onForwardMessage,
  onPinMessage,
  onStarMessage,
  onReactToMessage,
  onUploadFile,
  onDownloadFile,
  onStartCall,
  onSearchMessages,
  onExportChat,
  onMarkAsRead,
  onTypingStart,
  onTypingStop,
  className,
  disabled = false,
  placeholder = "Type a message...",
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedFileTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc,.docx,.txt'],
  showParticipants = true,
  showSearch = true,
  showExport = true,
  enableVoiceMessages = true,
  enableVideoMessages = true,
  enableScreenShare = false,
  theme = 'auto',
  soundEnabled = true,
  notificationsEnabled = true,
}: ChatProps) {
  // State
  const [messageInput, setMessageInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<ChatMessage[]>([])
  const [showSearch, setShowSearchPanel] = React.useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [showParticipantsPanel, setShowParticipantsPanel] = React.useState(false)
  const [selectedMessages, setSelectedMessages] = React.useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = React.useState<ChatMessage | null>(null)
  const [editingMessage, setEditingMessage] = React.useState<ChatMessage | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({})
  const [isRecording, setIsRecording] = React.useState(false)
  const [recordingTime, setRecordingTime] = React.useState(0)
  const [showMessageActions, setShowMessageActions] = React.useState<string | null>(null)
  const [filteredMessages, setFilteredMessages] = React.useState<ChatMessage[]>(messages)
  const [messageFilter, setMessageFilter] = React.useState<'all' | 'files' | 'images' | 'links' | 'pinned' | 'starred'>('all')

  // Refs
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const messageInputRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>()
  const recordingTimeoutRef = React.useRef<NodeJS.Timeout>()
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)

  // Auto-scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Filter messages
  React.useEffect(() => {
    let filtered = messages

    if (searchQuery) {
      filtered = filtered.filter(message =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    switch (messageFilter) {
      case 'files':
        filtered = filtered.filter(message => message.attachments && message.attachments.length > 0)
        break
      case 'images':
        filtered = filtered.filter(message => 
          message.type === 'image' || 
          (message.attachments && message.attachments.some(att => fileUtils.isImageFile(att.name)))
        )
        break
      case 'links':
        filtered = filtered.filter(message => 
          /https?:\/\/[^\s]+/g.test(message.content)
        )
        break
      case 'pinned':
        filtered = filtered.filter(message => message.isPinned)
        break
      case 'starred':
        filtered = filtered.filter(message => message.isStarred)
        break
    }

    setFilteredMessages(filtered)
  }, [messages, searchQuery, messageFilter])

  // Typing indicator
  const handleInputChange = React.useCallback((value: string) => {
    setMessageInput(value)

    if (!isTyping && value.trim()) {
      setIsTyping(true)
      onTypingStart?.()
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTypingStop?.()
    }, 1000)
  }, [isTyping, onTypingStart, onTypingStop])

  // Send message
  const handleSendMessage = React.useCallback(async (attachments?: File[]) => {
    const content = messageInput.trim()
    if (!content && !attachments?.length) return

    try {
      await onSendMessage(content, attachments)
      setMessageInput("")
      setReplyingTo(null)
      setEditingMessage(null)
      setIsTyping(false)
      onTypingStop?.()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [messageInput, onSendMessage, onTypingStop])

  // Handle file upload
  const handleFileUpload = React.useCallback(async (files: File[]) => {
    if (!onUploadFile) return

    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${fileUtils.formatFileSize(maxFileSize)}`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    try {
      const attachments = await onUploadFile(validFiles)
      await handleSendMessage()
    } catch (error) {
      console.error('Failed to upload files:', error)
    }
  }, [onUploadFile, maxFileSize, handleSendMessage])

  // Handle drag and drop
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  // Voice recording
  const startRecording = React.useCallback(async () => {
    if (!enableVoiceMessages) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        handleFileUpload([file])
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingTimeoutRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [enableVoiceMessages, handleFileUpload])

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingTime(0)
      if (recordingTimeoutRef.current) {
        clearInterval(recordingTimeoutRef.current)
      }
    }
  }, [isRecording])

  // Message actions
  const handleMessageAction = React.useCallback((action: string, message: ChatMessage) => {
    switch (action) {
      case 'reply':
        setReplyingTo(message)
        messageInputRef.current?.focus()
        break
      case 'edit':
        setEditingMessage(message)
        setMessageInput(message.content)
        messageInputRef.current?.focus()
        break
      case 'delete':
        onDeleteMessage?.(message.id)
        break
      case 'forward':
        onForwardMessage?.(message.id)
        break
      case 'pin':
        onPinMessage?.(message.id)
        break
      case 'star':
        onStarMessage?.(message.id)
        break
      case 'copy':
        navigator.clipboard.writeText(message.content)
        break
    }
    setShowMessageActions(null)
  }, [onDeleteMessage, onForwardMessage, onPinMessage, onStarMessage])

  // Search messages
  const handleSearch = React.useCallback((query: string) => {
    setSearchQuery(query)
    if (onSearchMessages) {
      const results = onSearchMessages(query)
      setSearchResults(results)
    }
  }, [onSearchMessages])

  // Export chat
  const handleExport = React.useCallback((format: 'txt' | 'pdf' | 'json') => {
    onExportChat?.(format)
  }, [onExportChat])

  // Render message status icon
  const renderMessageStatus = React.useCallback((status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />
      default:
        return null
    }
  }, [])

  // Render file icon
  const renderFileIcon = React.useCallback((filename: string) => {
    if (fileUtils.isImageFile(filename)) return <Image className="h-4 w-4" />
    if (fileUtils.isVideoFile(filename)) return <Video className="h-4 w-4" />
    if (filename.includes('audio')) return <Music className="h-4 w-4" />
    if (fileUtils.isDocumentFile(filename)) return <FileText className="h-4 w-4" />
    return <Archive className="h-4 w-4" />
  }, [])

  // Render message content
  const renderMessageContent = React.useCallback((message: ChatMessage) => {
    const isOwnMessage = message.senderId === currentUser.id

    return (
      <div
        className={cn(
          "group relative max-w-[70%] rounded-lg px-3 py-2 text-sm",
          isOwnMessage
            ? "ml-auto bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
        onMouseEnter={() => setShowMessageActions(message.id)}
        onMouseLeave={() => setShowMessageActions(null)}
      >
        {/* Reply indicator */}
        {message.replyTo && (
          <div className="mb-2 border-l-2 border-muted-foreground/30 pl-2 text-xs opacity-70">
            <div className="font-medium">Replying to {message.senderName}</div>
            <div className="truncate">
              {messages.find(m => m.id === message.replyTo)?.content}
            </div>
          </div>
        )}

        {/* Message content */}
        <div className="break-words">
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center space-x-2 rounded border bg-background/10 p-2"
              >
                {renderFileIcon(attachment.name)}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs font-medium">
                    {attachment.name}
                  </div>
                  <div className="text-xs opacity-70">
                    {fileUtils.formatFileSize(attachment.size)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDownloadFile?.(attachment)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                className="flex items-center space-x-1 rounded-full bg-background/20 px-2 py-1 text-xs hover:bg-background/30"
                onClick={() => onReactToMessage?.(message.id, reaction.emoji)}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Message metadata */}
        <div className="mt-1 flex items-center justify-between text-xs opacity-70">
          <div className="flex items-center space-x-1">
            <span>{dateUtils.formatTime(message.timestamp)}</span>
            {message.isEdited && <span>(edited)</span>}
            {message.isPinned && <Pin className="h-3 w-3" />}
            {message.isStarred && <Star className="h-3 w-3 fill-current" />}
          </div>
          {isOwnMessage && renderMessageStatus(message.status)}
        </div>

        {/* Message actions */}
        {showMessageActions === message.id && (
          <div className="absolute -top-8 right-0 flex items-center space-x-1 rounded bg-background shadow-lg border p-1">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMessageAction('reply', message)}
                  >
                    <Reply className="h-3 w-3" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Reply</Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>

            {isOwnMessage && (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMessageAction('edit', message)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Edit</Tooltip.Content>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => handleMessageAction('forward', message)}>
                  <Forward className="h-3 w-3 mr-2" />
                  Forward
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => handleMessageAction('pin', message)}>
                  <Pin className="h-3 w-3 mr-2" />
                  {message.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => handleMessageAction('star', message)}>
                  <Star className="h-3 w-3 mr-2" />
                  {message.isStarred ? 'Unstar' : 'Star'}
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => handleMessageAction('copy', message)}>
                  <Copy className="h-3 w-3 mr-2" />
                  Copy
                </DropdownMenu.Item>
                {isOwnMessage && (
                  <DropdownMenu.Item 
                    onClick={() => handleMessageAction('delete', message)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        )}
      </div>
    )
  }, [currentUser.id, messages, showMessageActions, renderMessageStatus, renderFileIcon, onDownloadFile, onReactToMessage, handleMessageAction])

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            {participants.slice(0, 3).map((participant) => (
              <div
                key={participant.id}
                className="relative h-8 w-8 rounded-full border-2 border-background"
              >
                {participant.avatar ? (
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {stringUtils.getInitials(participant.name)}
                  </div>
                )}
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                    {
                      "bg-green-500": participant.status === 'online',
                      "bg-yellow-500": participant.status === 'away',
                      "bg-red-500": participant.status === 'busy',
                      "bg-gray-400": participant.status === 'offline',
                    }
                  )}
                />
              </div>
            ))}
          </div>
          <div>
            <div className="font-medium">
              {participants.length === 1 
                ? participants[0].name 
                : `${participants.length} participants`
              }
            </div>
            <div className="text-xs text-muted-foreground">
              {participants.some(p => p.isTyping) 
                ? "Someone is typing..." 
                : participants.filter(p => p.status === 'online').length > 0
                ? `${participants.filter(p => p.status === 'online').length} online`
                : "Offline"
              }
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search toggle */}
          {showSearch && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSearchPanel(!showSearch)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Voice call */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStartCall?.('audio')}
          >
            <Phone className="h-4 w-4" />
          </Button>

          {/* Video call */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStartCall?.('video')}
          >
            <VideoIcon className="h-4 w-4" />
          </Button>

          {/* Participants toggle */}
          {showParticipants && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowParticipantsPanel(!showParticipantsPanel)}
            >
              <Users className="h-4 w-4" />
            </Button>
          )}

          {/* More options */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Messages
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  <DropdownMenu.Item onClick={() => setMessageFilter('all')}>
                    All Messages
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => setMessageFilter('files')}>
                    Files Only
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => setMessageFilter('images')}>
                    Images Only
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => setMessageFilter('links')}>
                    Links Only
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => setMessageFilter('pinned')}>
                    Pinned Messages
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => setMessageFilter('starred')}>
                    Starred Messages
                  </DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
              
              {showExport && (
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger>
                    <Download className="h-4 w-4 mr-2" />
                    Export Chat
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.SubContent>
                    <DropdownMenu.Item onClick={() => handleExport('txt')}>
                      Text File
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => handleExport('pdf')}>
                      PDF Document
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => handleExport('json')}>
                      JSON Data
                    </DropdownMenu.Item>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
              )}
              
              <DropdownMenu.Separator />
              <DropdownMenu.Item>
                <Settings className="h-4 w-4 mr-2" />
                Chat Settings
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="border-b p-4">
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            clearable
            onClear={() => handleSearch("")}
          />
          {searchResults.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              {searchResults.length} result(s) found
            </div>
          )}
        </div>
      )}

      {/* Messages area */}
      <div
        className="flex-1 overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ScrollArea.Root className="h-full">
          <ScrollArea.Viewport className="h-full p-4">
            <div className="space-y-4">
              {filteredMessages.map((message, index) => {
                const showAvatar = index === 0 || 
                  filteredMessages[index - 1].senderId !== message.senderId ||
                  dateUtils.addMinutes(filteredMessages[index - 1].timestamp, 5) < message.timestamp

                const showTimestamp = index === 0 ||
                  !dateUtils.isToday(filteredMessages[index - 1].timestamp) !== !dateUtils.isToday(message.timestamp) ||
                  dateUtils.addHours(filteredMessages[index - 1].timestamp, 1) < message.timestamp

                return (
                  <div key={message.id}>
                    {/* Timestamp separator */}
                    {showTimestamp && (
                      <div className="flex items-center justify-center py-2">
                        <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                          {dateUtils.isToday(message.timestamp)
                            ? "Today"
                            : dateUtils.isTomorrow(message.timestamp)
                            ? "Tomorrow"
                            : dateUtils.formatDate(message.timestamp)
                          }
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div className={cn(
                      "flex items-end space-x-2",
                      message.senderId === currentUser.id ? "justify-end" : "justify-start"
                    )}>
                      {/* Avatar */}
                      {showAvatar && message.senderId !== currentUser.id && (
                        <div className="h-8 w-8 rounded-full">
                          {message.senderAvatar ? (
                            <img
                              src={message.senderAvatar}
                              alt={message.senderName}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {stringUtils.getInitials(message.senderName)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message content */}
                      <div className="flex-1">
                        {showAvatar && message.senderId !== currentUser.id && (
                          <div className="mb-1 text-xs font-medium text-muted-foreground">
                            {message.senderName}
                          </div>
                        )}
                        {renderMessageContent(message)}
                      </div>

                      {/* Spacer for alignment */}
                      {!showAvatar && message.senderId !== currentUser.id && (
                        <div className="w-8" />
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Typing indicators */}
              {participants.some(p => p.isTyping) && (
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>

        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="rounded-lg border-2 border-dashed border-primary p-8 text-center">
              <Paperclip className="mx-auto h-12 w-12 text-primary" />
              <div className="mt-2 text-lg font-medium">Drop files here</div>
              <div className="text-sm text-muted-foreground">
                Maximum file size: {fileUtils.formatFileSize(maxFileSize)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-2">
          <div className="flex items-center space-x-2">
            <Reply className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium">Replying to {replyingTo.senderName}</span>
              <div className="truncate text-muted-foreground">
                {replyingTo.content}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setReplyingTo(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message input */}
      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedFileTypes.join(',')}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length > 0) {
                handleFileUpload(files)
              }
            }}
          />
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Voice recording */}
          {enableVoiceMessages && (
            <Button
              size="sm"
              variant={isRecording ? "destructive" : "ghost"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span className="ml-1 text-xs">{recordingTime}s</span>
                </>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Message input */}
          <div className="flex-1">
            <Textarea
              ref={messageInputRef}
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || isRecording}
              className="min-h-[40px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
          </div>

          {/* Emoji picker */}
          <Popover.Root open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <Popover.Trigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={disabled}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </Popover.Trigger>
            <Popover.Content className="w-80 p-4">
              <div className="space-y-4">
                <div className="text-sm font-medium">Quick Reactions</div>
                <div className="grid grid-cols-10 gap-2">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className="rounded p-1 text-lg hover:bg-muted"
                      onClick={() => {
                        setMessageInput(prev => prev + emoji)
                        setShowEmojiPicker(false)
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <div key={category}>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      {category}
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                      {emojis.slice(0, 20).map((emoji) => (
                        <button
                          key={emoji}
                          className="rounded p-1 text-sm hover:bg-muted"
                          onClick={() => {
                            setMessageInput(prev => prev + emoji)
                            setShowEmojiPicker(false)
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Popover.Content>
          </Popover.Root>

          {/* Send button */}
          <Button
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={disabled || (!messageInput.trim() && !isRecording)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Chat