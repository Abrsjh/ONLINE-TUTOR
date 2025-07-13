'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoClassroom } from '@/components/features/video-classroom';
import Whiteboard from '@/components/features/whiteboard';
import Chat from '@/components/features/chat';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  Settings, 
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  Upload,
  Share2,
  Save,
  Loader2,
  Phone,
  PhoneOff,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  ScreenShare,
  StopCircle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';

// Types
interface SessionData {
  id: string;
  title: string;
  tutorId: string;
  studentId: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  materials?: string[];
  recordingEnabled: boolean;
  whiteboardEnabled: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
}

interface Participant {
  id: string;
  name: string;
  role: 'tutor' | 'student';
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  joinedAt: Date;
  lastSeen?: Date;
}

interface SessionSettings {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  whiteboardEnabled: boolean;
  participantMutingEnabled: boolean;
  waitingRoomEnabled: boolean;
  autoRecording: boolean;
  qualityPreference: 'auto' | 'high' | 'medium' | 'low';
  bandwidth: 'unlimited' | 'limited';
}

interface SessionStats {
  duration: number;
  participantCount: number;
  messagesCount: number;
  filesShared: number;
  whiteboardElements: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  bandwidth: number;
  latency: number;
}

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.sessionId as string;

  // WebRTC hook
  const {
    isInitializing,
    availableDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    connectionStats,
    lastError,
    initializeLocalStream,
    toggleAudio,
    toggleVideo,
    switchDevice,
    startScreenSharing,
    stopScreenSharing,
    startRecording,
    stopRecording,
    isRecording,
    createPeerConnection,
    cleanup,
    clearError
  } = useWebRTC();

  // State management
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    audioEnabled: true,
    videoEnabled: true,
    screenShareEnabled: true,
    recordingEnabled: true,
    chatEnabled: true,
    whiteboardEnabled: true,
    participantMutingEnabled: true,
    waitingRoomEnabled: false,
    autoRecording: false,
    qualityPreference: 'auto',
    bandwidth: 'unlimited'
  });
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    duration: 0,
    participantCount: 0,
    messagesCount: 0,
    filesShared: 0,
    whiteboardElements: 0,
    connectionQuality: 'excellent',
    bandwidth: 0,
    latency: 0
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'video' | 'whiteboard' | 'chat' | 'files'>('video');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [whiteboardElements, setWhiteboardElements] = useState<any[]>([]);

  // Session timer
  const [sessionDuration, setSessionDuration] = useState(0);

  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setLoading(true);
        
        // Mock session data - in real app, fetch from API
        const mockSession: SessionData = {
          id: sessionId,
          title: 'Mathematics Tutoring Session',
          tutorId: 'tutor-1',
          studentId: 'student-1',
          subject: 'Mathematics',
          startTime: new Date(),
          endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          status: 'ongoing',
          materials: ['algebra-basics.pdf', 'practice-problems.docx'],
          recordingEnabled: true,
          whiteboardEnabled: true,
          chatEnabled: true,
          screenShareEnabled: true
        };

        // Mock participants
        const mockParticipants: Participant[] = [
          {
            id: user?.id || 'current-user',
            name: user?.name || 'You',
            role: user?.role as 'tutor' | 'student' || 'student',
            status: 'online',
            isAudioEnabled: true,
            isVideoEnabled: true,
            isScreenSharing: false,
            connectionStatus: 'connected',
            joinedAt: new Date()
          },
          {
            id: 'other-participant',
            name: user?.role === 'tutor' ? 'Sarah Johnson' : 'Dr. Smith',
            role: user?.role === 'tutor' ? 'student' : 'tutor',
            status: 'online',
            isAudioEnabled: true,
            isVideoEnabled: true,
            isScreenSharing: false,
            connectionStatus: 'connected',
            joinedAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
          }
        ];

        setSessionData(mockSession);
        setParticipants(mockParticipants);
        setSessionStartTime(new Date());
        
        // Initialize WebRTC
        await initializeLocalStream();
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load session:', err);
        setError('Failed to load session data');
        setLoading(false);
      }
    };

    if (sessionId && user) {
      loadSessionData();
    }
  }, [sessionId, user, initializeLocalStream]);

  // Session timer
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      setSessionDuration(duration);
      setSessionStats(prev => ({ ...prev, duration }));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Format duration
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle chat message
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!user) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      timestamp: new Date(),
      type: attachments && attachments.length > 0 ? 'file' : 'text',
      status: 'sending',
      attachments: attachments?.map(file => ({
        id: `att-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }))
    };

    setMessages(prev => [...prev, newMessage]);
    setSessionStats(prev => ({ 
      ...prev, 
      messagesCount: prev.messagesCount + 1,
      filesShared: prev.filesShared + (attachments?.length || 0)
    }));

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1000);
  }, [user]);

  // Handle whiteboard changes
  const handleWhiteboardChange = useCallback((elements: any[]) => {
    setWhiteboardElements(elements);
    setSessionStats(prev => ({ ...prev, whiteboardElements: elements.length }));
  }, []);

  // Handle leave session
  const handleLeaveSession = useCallback(() => {
    cleanup();
    router.push('/dashboard/sessions');
  }, [cleanup, router]);

  // Handle end session (tutor only)
  const handleEndSession = useCallback(() => {
    if (user?.role !== 'tutor') return;
    
    cleanup();
    // In real app, update session status to completed
    router.push('/dashboard/sessions');
  }, [user?.role, cleanup, router]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Handle device switch
  const handleDeviceSwitch = useCallback(async (deviceId: string, kind: 'videoinput' | 'audioinput') => {
    try {
      await switchDevice(deviceId, kind);
    } catch (error) {
      console.error('Failed to switch device:', error);
    }
  }, [switchDevice]);

  // Connection quality indicator
  const getConnectionQuality = useMemo(() => {
    if (connectionStats.size === 0) return 'excellent';
    
    let totalLatency = 0;
    let totalPacketLoss = 0;
    let count = 0;

    connectionStats.forEach(stats => {
      totalLatency += stats.roundTripTime;
      totalPacketLoss += stats.packetsLost / (stats.packetsReceived + stats.packetsLost);
      count++;
    });

    const avgLatency = totalLatency / count;
    const avgPacketLoss = totalPacketLoss / count;

    if (avgLatency < 100 && avgPacketLoss < 0.01) return 'excellent';
    if (avgLatency < 200 && avgPacketLoss < 0.03) return 'good';
    if (avgLatency < 400 && avgPacketLoss < 0.05) return 'fair';
    return 'poor';
  }, [connectionStats]);

  // Update session stats
  useEffect(() => {
    setSessionStats(prev => ({
      ...prev,
      participantCount: participants.length,
      connectionQuality: getConnectionQuality
    }));
  }, [participants.length, getConnectionQuality]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Joining Session...</h2>
          <p className="text-gray-400">Setting up your classroom experience</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <Card className="p-8 max-w-md mx-auto text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Session Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/sessions')}>
            Return to Sessions
          </Button>
        </Card>
      </div>
    );
  }

  if (!sessionData || !user) {
    return null;
  }

  const isHost = user.role === 'tutor';
  const currentParticipant = participants.find(p => p.id === user.id);

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-white font-semibold">{sessionData.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatDuration(sessionDuration)}
              </span>
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center">
                {getConnectionQuality === 'excellent' && <Wifi className="h-4 w-4 mr-1 text-green-400" />}
                {getConnectionQuality === 'good' && <Wifi className="h-4 w-4 mr-1 text-yellow-400" />}
                {getConnectionQuality === 'fair' && <Wifi className="h-4 w-4 mr-1 text-orange-400" />}
                {getConnectionQuality === 'poor' && <WifiOff className="h-4 w-4 mr-1 text-red-400" />}
                {getConnectionQuality}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Recording</span>
            </div>
          )}

          {/* Quick actions */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-white hover:bg-gray-700"
          >
            <Users className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowStats(!showStats)}
            className="text-white hover:bg-gray-700"
          >
            <Activity className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            className="text-white hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenu.Item>
              {isHost && (
                <>
                  <DropdownMenu.Item onClick={isRecording ? stopRecording : startRecording}>
                    {isRecording ? (
                      <>
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onClick={handleEndSession} className="text-red-600">
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Session
                  </DropdownMenu.Item>
                </>
              )}
              <DropdownMenu.Item onClick={handleLeaveSession}>
                <Phone className="h-4 w-4 mr-2" />
                Leave Session
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main area */}
        <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'mr-0' : 'mr-80'} transition-all duration-300`}>
          <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            {/* Tab navigation */}
            <div className="bg-gray-800 border-b border-gray-700 px-4">
              <Tabs.List className="flex space-x-1">
                <Tabs.Trigger
                  value="video"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Video
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="whiteboard"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Whiteboard
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="chat"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                  {messages.length > 0 && (
                    <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {messages.length}
                    </span>
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="files"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Files
                </Tabs.Trigger>
              </Tabs.List>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              <Tabs.Content value="video" className="h-full">
                <VideoClassroom
                  sessionId={sessionId}
                  currentUser={{
                    id: user.id,
                    name: user.name,
                    role: user.role as 'tutor' | 'student'
                  }}
                  onLeaveSession={handleLeaveSession}
                  onSessionEnd={isHost ? handleEndSession : undefined}
                />
              </Tabs.Content>

              <Tabs.Content value="whiteboard" className="h-full p-4">
                <Whiteboard
                  sessionId={sessionId}
                  onElementsChange={handleWhiteboardChange}
                  readOnly={false}
                  className="h-full"
                />
              </Tabs.Content>

              <Tabs.Content value="chat" className="h-full">
                <Chat
                  messages={messages}
                  currentUser={{
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    status: 'online'
                  }}
                  participants={participants.map(p => ({
                    id: p.id,
                    name: p.name,
                    avatar: p.avatar,
                    status: p.status,
                    isTyping: false
                  }))}
                  onSendMessage={handleSendMessage}
                  className="h-full"
                />
              </Tabs.Content>

              <Tabs.Content value="files" className="h-full p-4">
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">File Sharing</h3>
                    <p>Share documents, images, and other files with participants</p>
                    <Button className="mt-4">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </div>

        {/* Sidebar */}
        <div className={`bg-gray-800 border-l border-gray-700 transition-all duration-300 ${
          sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
        }`}>
          <div className="h-full flex flex-col">
            {/* Sidebar header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium">Session Info</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSidebarCollapsed(true)}
                className="text-gray-400 hover:text-white"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Participants */}
            <div className="p-4 border-b border-gray-700">
              <h4 className="text-white font-medium mb-3">Participants ({participants.length})</h4>
              <div className="space-y-2">
                {participants.map(participant => (
                  <div key={participant.id} className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                        participant.status === 'online' ? 'bg-green-500' :
                        participant.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-medium truncate">
                          {participant.name}
                        </span>
                        {participant.role === 'tutor' && (
                          <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded">
                            Tutor
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        {participant.isAudioEnabled ? (
                          <Mic className="h-3 w-3 text-green-400" />
                        ) : (
                          <MicOff className="h-3 w-3 text-red-400" />
                        )}
                        {participant.isVideoEnabled ? (
                          <Camera className="h-3 w-3 text-green-400" />
                        ) : (
                          <CameraOff className="h-3 w-3 text-red-400" />
                        )}
                        {participant.isScreenSharing && (
                          <ScreenShare className="h-3 w-3 text-blue-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session stats */}
            <div className="p-4 border-b border-gray-700">
              <h4 className="text-white font-medium mb-3">Session Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Duration:</span>
                  <span className="text-white">{formatDuration(sessionStats.duration)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Messages:</span>
                  <span className="text-white">{sessionStats.messagesCount}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Files Shared:</span>
                  <span className="text-white">{sessionStats.filesShared}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Connection:</span>
                  <span className={`capitalize ${
                    sessionStats.connectionQuality === 'excellent' ? 'text-green-400' :
                    sessionStats.connectionQuality === 'good' ? 'text-yellow-400' :
                    sessionStats.connectionQuality === 'fair' ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {sessionStats.connectionQuality}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-4 space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Chat
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveTab('whiteboard')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Open Whiteboard
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Collapsed sidebar toggle */}
        {sidebarCollapsed && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSidebarCollapsed(false)}
            className="fixed top-1/2 right-4 z-10 bg-gray-800 text-white hover:bg-gray-700"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error display */}
      {lastError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium">Connection Error</h4>
              <p className="text-sm mt-1">{lastError.message}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearError}
              className="text-white hover:bg-red-700"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-lg font-semibold mb-4">Session Settings</Dialog.Title>
            
            <div className="space-y-4">
              {/* Audio/Video devices */}
              <div>
                <label className="block text-sm font-medium mb-2">Camera</label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => handleDeviceSwitch(e.target.value, 'videoinput')}
                  className="w-full p-2 border rounded"
                >
                  {availableDevices
                    .filter(device => device.kind === 'videoinput')
                    .map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Microphone</label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => handleDeviceSwitch(e.target.value, 'audioinput')}
                  className="w-full p-2 border rounded"
                >
                  {availableDevices
                    .filter(device => device.kind === 'audioinput')
                    .map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Quality settings */}
              <div>
                <label className="block text-sm font-medium mb-2">Video Quality</label>
                <select
                  value={sessionSettings.qualityPreference}
                  onChange={(e) => setSessionSettings(prev => ({
                    ...prev,
                    qualityPreference: e.target.value as any
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="auto">Auto</option>
                  <option value="high">High (1080p)</option>
                  <option value="medium">Medium (720p)</option>
                  <option value="low">Low (480p)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowSettings(false)}>
                Save Settings
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}