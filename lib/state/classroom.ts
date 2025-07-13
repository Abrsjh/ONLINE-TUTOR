import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types for WebRTC and classroom functionality
export interface Participant {
  id: string;
  name: string;
  role: 'tutor' | 'student';
  avatar?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  joinedAt: Date;
  lastSeen: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'system';
  timestamp: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
}

export interface WhiteboardElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  color: string;
  strokeWidth: number;
  opacity: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteboardState {
  elements: WhiteboardElement[];
  selectedTool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'select';
  selectedColor: string;
  strokeWidth: number;
  isDrawing: boolean;
  selectedElementId?: string;
  history: WhiteboardElement[][];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'recording' | 'paused' | 'stopped' | 'processing' | 'ready';
  fileUrl?: string;
  fileSize?: number;
  participants: string[];
}

export interface SessionControls {
  isRecording: boolean;
  isPaused: boolean;
  startTime?: Date;
  duration: number;
  canRecord: boolean;
  canPause: boolean;
  canStop: boolean;
  recordingId?: string;
}

export interface ClassroomState {
  // Session info
  sessionId: string | null;
  sessionTitle: string;
  sessionDescription: string;
  sessionStartTime: Date | null;
  sessionEndTime: Date | null;
  sessionStatus: 'waiting' | 'active' | 'ended' | 'cancelled';

  // Participants
  participants: Map<string, Participant>;
  currentUserId: string | null;
  hostId: string | null;
  maxParticipants: number;

  // WebRTC connections
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peerConnections: Map<string, RTCPeerConnection>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  screenShareStream: MediaStream | null;
  screenShareParticipantId: string | null;

  // Chat
  chatMessages: ChatMessage[];
  unreadMessageCount: number;
  isChatOpen: boolean;
  isTyping: Map<string, boolean>;
  typingTimeout: Map<string, NodeJS.Timeout>;

  // Whiteboard
  whiteboard: WhiteboardState;
  isWhiteboardOpen: boolean;
  whiteboardPermissions: Map<string, boolean>;

  // Session controls
  sessionControls: SessionControls;
  recordings: SessionRecording[];

  // UI state
  isFullscreen: boolean;
  layout: 'grid' | 'speaker' | 'sidebar';
  sidebarTab: 'chat' | 'participants' | 'files' | 'settings';
  isSettingsOpen: boolean;

  // Connection state
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  lastConnectionError: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;

  // File sharing
  sharedFiles: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
}

export interface ClassroomActions {
  // Session management
  initializeSession: (sessionId: string, userId: string) => void;
  joinSession: (participant: Omit<Participant, 'joinedAt' | 'lastSeen'>) => void;
  leaveSession: () => void;
  endSession: () => void;
  updateSessionStatus: (status: ClassroomState['sessionStatus']) => void;

  // Participant management
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipant: (participantId: string, updates: Partial<Participant>) => void;
  setHost: (participantId: string) => void;
  kickParticipant: (participantId: string) => void;

  // WebRTC controls
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (participantId: string, stream: MediaStream) => void;
  removeRemoteStream: (participantId: string) => void;
  addPeerConnection: (participantId: string, connection: RTCPeerConnection) => void;
  removePeerConnection: (participantId: string) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: (stream: MediaStream) => void;
  stopScreenShare: () => void;

  // Chat management
  sendMessage: (content: string, type?: ChatMessage['type']) => void;
  sendFileMessage: (file: File, fileUrl: string) => void;
  markMessageAsRead: (messageId: string) => void;
  markAllMessagesAsRead: () => void;
  toggleChat: () => void;
  setTyping: (participantId: string, isTyping: boolean) => void;
  clearTypingTimeout: (participantId: string) => void;

  // Whiteboard management
  addWhiteboardElement: (element: Omit<WhiteboardElement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWhiteboardElement: (elementId: string, updates: Partial<WhiteboardElement>) => void;
  removeWhiteboardElement: (elementId: string) => void;
  clearWhiteboard: () => void;
  setWhiteboardTool: (tool: WhiteboardState['selectedTool']) => void;
  setWhiteboardColor: (color: string) => void;
  setWhiteboardStrokeWidth: (width: number) => void;
  setDrawingState: (isDrawing: boolean) => void;
  selectWhiteboardElement: (elementId: string | undefined) => void;
  undoWhiteboard: () => void;
  redoWhiteboard: () => void;
  saveWhiteboardState: () => void;
  toggleWhiteboard: () => void;
  setWhiteboardPermission: (participantId: string, hasPermission: boolean) => void;

  // Recording controls
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  addRecording: (recording: SessionRecording) => void;
  updateRecording: (recordingId: string, updates: Partial<SessionRecording>) => void;

  // UI controls
  toggleFullscreen: () => void;
  setLayout: (layout: ClassroomState['layout']) => void;
  setSidebarTab: (tab: ClassroomState['sidebarTab']) => void;
  toggleSettings: () => void;

  // Connection management
  setConnectionStatus: (status: ClassroomState['connectionStatus']) => void;
  setConnectionError: (error: string | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // File sharing
  addSharedFile: (file: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedBy: string;
  }) => void;
  removeSharedFile: (fileId: string) => void;

  // Utility actions
  reset: () => void;
}

const initialWhiteboardState: WhiteboardState = {
  elements: [],
  selectedTool: 'pen',
  selectedColor: '#000000',
  strokeWidth: 2,
  isDrawing: false,
  selectedElementId: undefined,
  history: [[]],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,
};

const initialSessionControls: SessionControls = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  canRecord: true,
  canPause: false,
  canStop: false,
};

const initialState: ClassroomState = {
  sessionId: null,
  sessionTitle: '',
  sessionDescription: '',
  sessionStartTime: null,
  sessionEndTime: null,
  sessionStatus: 'waiting',

  participants: new Map(),
  currentUserId: null,
  hostId: null,
  maxParticipants: 10,

  localStream: null,
  remoteStreams: new Map(),
  peerConnections: new Map(),
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  screenShareStream: null,
  screenShareParticipantId: null,

  chatMessages: [],
  unreadMessageCount: 0,
  isChatOpen: false,
  isTyping: new Map(),
  typingTimeout: new Map(),

  whiteboard: initialWhiteboardState,
  isWhiteboardOpen: false,
  whiteboardPermissions: new Map(),

  sessionControls: initialSessionControls,
  recordings: [],

  isFullscreen: false,
  layout: 'grid',
  sidebarTab: 'chat',
  isSettingsOpen: false,

  connectionStatus: 'disconnected',
  lastConnectionError: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,

  sharedFiles: [],
};

export const useClassroomStore = create<ClassroomState & ClassroomActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Session management
      initializeSession: (sessionId: string, userId: string) => {
        set((state) => {
          state.sessionId = sessionId;
          state.currentUserId = userId;
          state.sessionStatus = 'waiting';
          state.connectionStatus = 'connecting';
        });
      },

      joinSession: (participant) => {
        set((state) => {
          const fullParticipant: Participant = {
            ...participant,
            joinedAt: new Date(),
            lastSeen: new Date(),
          };
          state.participants.set(participant.id, fullParticipant);
          
          if (!state.hostId && participant.role === 'tutor') {
            state.hostId = participant.id;
          }
          
          state.sessionStatus = 'active';
          state.connectionStatus = 'connected';
        });
      },

      leaveSession: () => {
        set((state) => {
          const currentUserId = state.currentUserId;
          if (currentUserId) {
            state.participants.delete(currentUserId);
          }
          
          // Clean up streams and connections
          state.localStream?.getTracks().forEach(track => track.stop());
          state.localStream = null;
          state.remoteStreams.clear();
          state.peerConnections.forEach(pc => pc.close());
          state.peerConnections.clear();
          
          state.connectionStatus = 'disconnected';
        });
      },

      endSession: () => {
        set((state) => {
          state.sessionStatus = 'ended';
          state.sessionEndTime = new Date();
          
          // Stop recording if active
          if (state.sessionControls.isRecording) {
            state.sessionControls.isRecording = false;
            state.sessionControls.canRecord = false;
          }
        });
      },

      updateSessionStatus: (status) => {
        set((state) => {
          state.sessionStatus = status;
        });
      },

      // Participant management
      addParticipant: (participant) => {
        set((state) => {
          state.participants.set(participant.id, participant);
          state.whiteboardPermissions.set(participant.id, participant.role === 'tutor');
        });
      },

      removeParticipant: (participantId) => {
        set((state) => {
          state.participants.delete(participantId);
          state.remoteStreams.delete(participantId);
          state.whiteboardPermissions.delete(participantId);
          
          const connection = state.peerConnections.get(participantId);
          if (connection) {
            connection.close();
            state.peerConnections.delete(participantId);
          }
          
          if (state.hostId === participantId) {
            // Transfer host to another tutor or first participant
            const newHost = Array.from(state.participants.values()).find(p => p.role === 'tutor') ||
                           Array.from(state.participants.values())[0];
            state.hostId = newHost?.id || null;
          }
        });
      },

      updateParticipant: (participantId, updates) => {
        set((state) => {
          const participant = state.participants.get(participantId);
          if (participant) {
            Object.assign(participant, updates, { lastSeen: new Date() });
          }
        });
      },

      setHost: (participantId) => {
        set((state) => {
          state.hostId = participantId;
        });
      },

      kickParticipant: (participantId) => {
        const { removeParticipant } = get();
        removeParticipant(participantId);
      },

      // WebRTC controls
      setLocalStream: (stream) => {
        set((state) => {
          state.localStream = stream;
        });
      },

      addRemoteStream: (participantId, stream) => {
        set((state) => {
          state.remoteStreams.set(participantId, stream);
        });
      },

      removeRemoteStream: (participantId) => {
        set((state) => {
          state.remoteStreams.delete(participantId);
        });
      },

      addPeerConnection: (participantId, connection) => {
        set((state) => {
          state.peerConnections.set(participantId, connection);
        });
      },

      removePeerConnection: (participantId) => {
        set((state) => {
          const connection = state.peerConnections.get(participantId);
          if (connection) {
            connection.close();
            state.peerConnections.delete(participantId);
          }
        });
      },

      toggleAudio: () => {
        set((state) => {
          state.isAudioEnabled = !state.isAudioEnabled;
          if (state.localStream) {
            state.localStream.getAudioTracks().forEach(track => {
              track.enabled = state.isAudioEnabled;
            });
          }
          
          // Update current participant
          const currentUser = state.participants.get(state.currentUserId || '');
          if (currentUser) {
            currentUser.isAudioEnabled = state.isAudioEnabled;
          }
        });
      },

      toggleVideo: () => {
        set((state) => {
          state.isVideoEnabled = !state.isVideoEnabled;
          if (state.localStream) {
            state.localStream.getVideoTracks().forEach(track => {
              track.enabled = state.isVideoEnabled;
            });
          }
          
          // Update current participant
          const currentUser = state.participants.get(state.currentUserId || '');
          if (currentUser) {
            currentUser.isVideoEnabled = state.isVideoEnabled;
          }
        });
      },

      startScreenShare: (stream) => {
        set((state) => {
          state.isScreenSharing = true;
          state.screenShareStream = stream;
          state.screenShareParticipantId = state.currentUserId;
          
          // Update current participant
          const currentUser = state.participants.get(state.currentUserId || '');
          if (currentUser) {
            currentUser.isScreenSharing = true;
          }
        });
      },

      stopScreenShare: () => {
        set((state) => {
          state.isScreenSharing = false;
          state.screenShareStream?.getTracks().forEach(track => track.stop());
          state.screenShareStream = null;
          
          if (state.screenShareParticipantId) {
            const participant = state.participants.get(state.screenShareParticipantId);
            if (participant) {
              participant.isScreenSharing = false;
            }
          }
          state.screenShareParticipantId = null;
        });
      },

      // Chat management
      sendMessage: (content, type = 'text') => {
        set((state) => {
          const message: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            senderId: state.currentUserId || '',
            senderName: state.participants.get(state.currentUserId || '')?.name || 'Unknown',
            content,
            type,
            timestamp: new Date(),
            isRead: false,
          };
          state.chatMessages.push(message);
        });
      },

      sendFileMessage: (file, fileUrl) => {
        set((state) => {
          const message: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            senderId: state.currentUserId || '',
            senderName: state.participants.get(state.currentUserId || '')?.name || 'Unknown',
            content: `Shared file: ${file.name}`,
            type: 'file',
            timestamp: new Date(),
            fileUrl,
            fileName: file.name,
            fileSize: file.size,
            isRead: false,
          };
          state.chatMessages.push(message);
        });
      },

      markMessageAsRead: (messageId) => {
        set((state) => {
          const message = state.chatMessages.find(m => m.id === messageId);
          if (message && !message.isRead) {
            message.isRead = true;
            state.unreadMessageCount = Math.max(0, state.unreadMessageCount - 1);
          }
        });
      },

      markAllMessagesAsRead: () => {
        set((state) => {
          state.chatMessages.forEach(message => {
            message.isRead = true;
          });
          state.unreadMessageCount = 0;
        });
      },

      toggleChat: () => {
        set((state) => {
          state.isChatOpen = !state.isChatOpen;
          if (state.isChatOpen) {
            state.sidebarTab = 'chat';
          }
        });
      },

      setTyping: (participantId, isTyping) => {
        set((state) => {
          state.isTyping.set(participantId, isTyping);
          
          // Clear existing timeout
          const existingTimeout = state.typingTimeout.get(participantId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          // Set new timeout to clear typing status
          if (isTyping) {
            const timeout = setTimeout(() => {
              get().setTyping(participantId, false);
            }, 3000);
            state.typingTimeout.set(participantId, timeout);
          }
        });
      },

      clearTypingTimeout: (participantId) => {
        set((state) => {
          const timeout = state.typingTimeout.get(participantId);
          if (timeout) {
            clearTimeout(timeout);
            state.typingTimeout.delete(participantId);
          }
        });
      },

      // Whiteboard management
      addWhiteboardElement: (elementData) => {
        set((state) => {
          const element: WhiteboardElement = {
            ...elementData,
            id: `wb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          state.whiteboard.elements.push(element);
          
          // Save to history
          state.whiteboard.history = state.whiteboard.history.slice(0, state.whiteboard.historyIndex + 1);
          state.whiteboard.history.push([...state.whiteboard.elements]);
          state.whiteboard.historyIndex++;
          state.whiteboard.canUndo = state.whiteboard.historyIndex > 0;
          state.whiteboard.canRedo = false;
        });
      },

      updateWhiteboardElement: (elementId, updates) => {
        set((state) => {
          const element = state.whiteboard.elements.find(e => e.id === elementId);
          if (element) {
            Object.assign(element, updates, { updatedAt: new Date() });
          }
        });
      },

      removeWhiteboardElement: (elementId) => {
        set((state) => {
          state.whiteboard.elements = state.whiteboard.elements.filter(e => e.id !== elementId);
          
          // Save to history
          state.whiteboard.history = state.whiteboard.history.slice(0, state.whiteboard.historyIndex + 1);
          state.whiteboard.history.push([...state.whiteboard.elements]);
          state.whiteboard.historyIndex++;
          state.whiteboard.canUndo = state.whiteboard.historyIndex > 0;
          state.whiteboard.canRedo = false;
        });
      },

      clearWhiteboard: () => {
        set((state) => {
          state.whiteboard.elements = [];
          state.whiteboard.selectedElementId = undefined;
          
          // Save to history
          state.whiteboard.history = state.whiteboard.history.slice(0, state.whiteboard.historyIndex + 1);
          state.whiteboard.history.push([]);
          state.whiteboard.historyIndex++;
          state.whiteboard.canUndo = state.whiteboard.historyIndex > 0;
          state.whiteboard.canRedo = false;
        });
      },

      setWhiteboardTool: (tool) => {
        set((state) => {
          state.whiteboard.selectedTool = tool;
          state.whiteboard.selectedElementId = undefined;
        });
      },

      setWhiteboardColor: (color) => {
        set((state) => {
          state.whiteboard.selectedColor = color;
        });
      },

      setWhiteboardStrokeWidth: (width) => {
        set((state) => {
          state.whiteboard.strokeWidth = width;
        });
      },

      setDrawingState: (isDrawing) => {
        set((state) => {
          state.whiteboard.isDrawing = isDrawing;
        });
      },

      selectWhiteboardElement: (elementId) => {
        set((state) => {
          state.whiteboard.selectedElementId = elementId;
          if (elementId) {
            state.whiteboard.selectedTool = 'select';
          }
        });
      },

      undoWhiteboard: () => {
        set((state) => {
          if (state.whiteboard.canUndo && state.whiteboard.historyIndex > 0) {
            state.whiteboard.historyIndex--;
            state.whiteboard.elements = [...state.whiteboard.history[state.whiteboard.historyIndex]];
            state.whiteboard.canUndo = state.whiteboard.historyIndex > 0;
            state.whiteboard.canRedo = true;
          }
        });
      },

      redoWhiteboard: () => {
        set((state) => {
          if (state.whiteboard.canRedo && state.whiteboard.historyIndex < state.whiteboard.history.length - 1) {
            state.whiteboard.historyIndex++;
            state.whiteboard.elements = [...state.whiteboard.history[state.whiteboard.historyIndex]];
            state.whiteboard.canRedo = state.whiteboard.historyIndex < state.whiteboard.history.length - 1;
            state.whiteboard.canUndo = true;
          }
        });
      },

      saveWhiteboardState: () => {
        set((state) => {
          // Save current state to history if not already saved
          const currentElements = state.whiteboard.elements;
          const lastHistoryState = state.whiteboard.history[state.whiteboard.historyIndex];
          
          if (JSON.stringify(currentElements) !== JSON.stringify(lastHistoryState)) {
            state.whiteboard.history = state.whiteboard.history.slice(0, state.whiteboard.historyIndex + 1);
            state.whiteboard.history.push([...currentElements]);
            state.whiteboard.historyIndex++;
            state.whiteboard.canUndo = state.whiteboard.historyIndex > 0;
            state.whiteboard.canRedo = false;
          }
        });
      },

      toggleWhiteboard: () => {
        set((state) => {
          state.isWhiteboardOpen = !state.isWhiteboardOpen;
        });
      },

      setWhiteboardPermission: (participantId, hasPermission) => {
        set((state) => {
          state.whiteboardPermissions.set(participantId, hasPermission);
        });
      },

      // Recording controls
      startRecording: () => {
        set((state) => {
          const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          state.sessionControls.isRecording = true;
          state.sessionControls.isPaused = false;
          state.sessionControls.startTime = new Date();
          state.sessionControls.canPause = true;
          state.sessionControls.canStop = true;
          state.sessionControls.recordingId = recordingId;
          
          const recording: SessionRecording = {
            id: recordingId,
            sessionId: state.sessionId || '',
            startTime: new Date(),
            duration: 0,
            status: 'recording',
            participants: Array.from(state.participants.keys()),
          };
          state.recordings.push(recording);
        });
      },

      pauseRecording: () => {
        set((state) => {
          state.sessionControls.isPaused = true;
          
          const recording = state.recordings.find(r => r.id === state.sessionControls.recordingId);
          if (recording) {
            recording.status = 'paused';
          }
        });
      },

      resumeRecording: () => {
        set((state) => {
          state.sessionControls.isPaused = false;
          
          const recording = state.recordings.find(r => r.id === state.sessionControls.recordingId);
          if (recording) {
            recording.status = 'recording';
          }
        });
      },

      stopRecording: () => {
        set((state) => {
          state.sessionControls.isRecording = false;
          state.sessionControls.isPaused = false;
          state.sessionControls.canPause = false;
          state.sessionControls.canStop = false;
          
          const recording = state.recordings.find(r => r.id === state.sessionControls.recordingId);
          if (recording) {
            recording.endTime = new Date();
            recording.duration = recording.endTime.getTime() - recording.startTime.getTime();
            recording.status = 'processing';
          }
          
          state.sessionControls.recordingId = undefined;
        });
      },

      addRecording: (recording) => {
        set((state) => {
          state.recordings.push(recording);
        });
      },

      updateRecording: (recordingId, updates) => {
        set((state) => {
          const recording = state.recordings.find(r => r.id === recordingId);
          if (recording) {
            Object.assign(recording, updates);
          }
        });
      },

      // UI controls
      toggleFullscreen: () => {
        set((state) => {
          state.isFullscreen = !state.isFullscreen;
        });
      },

      setLayout: (layout) => {
        set((state) => {
          state.layout = layout;
        });
      },

      setSidebarTab: (tab) => {
        set((state) => {
          state.sidebarTab = tab;
        });
      },

      toggleSettings: () => {
        set((state) => {
          state.isSettingsOpen = !state.isSettingsOpen;
        });
      },

      // Connection management
      setConnectionStatus: (status) => {
        set((state) => {
          state.connectionStatus = status;
          if (status === 'connected') {
            state.reconnectAttempts = 0;
            state.lastConnectionError = null;
          }
        });
      },

      setConnectionError: (error) => {
        set((state) => {
          state.lastConnectionError = error;
          if (error) {
            state.connectionStatus = 'failed';
          }
        });
      },

      incrementReconnectAttempts: () => {
        set((state) => {
          state.reconnectAttempts++;
          if (state.reconnectAttempts >= state.maxReconnectAttempts) {
            state.connectionStatus = 'failed';
          } else {
            state.connectionStatus = 'reconnecting';
          }
        });
      },

      resetReconnectAttempts: () => {
        set((state) => {
          state.reconnectAttempts = 0;
        });
      },

      // File sharing
      addSharedFile: (file) => {
        set((state) => {
          state.sharedFiles.push({
            ...file,
            uploadedAt: new Date(),
          });
        });
      },

      removeSharedFile: (fileId) => {
        set((state) => {
          state.sharedFiles = state.sharedFiles.filter(f => f.id !== fileId);
        });
      },

      // Utility actions
      reset: () => {
        set(() => ({
          ...initialState,
          participants: new Map(),
          remoteStreams: new Map(),
          peerConnections: new Map(),
          isTyping: new Map(),
          typingTimeout: new Map(),
          whiteboardPermissions: new Map(),
        }));
      },
    }))
  )
);

// Selectors for computed values
export const useClassroomSelectors = () => {
  const store = useClassroomStore();
  
  return {
    // Participant selectors
    participantCount: store.participants.size,
    participantList: Array.from(store.participants.values()),
    currentParticipant: store.currentUserId ? store.participants.get(store.currentUserId) : null,
    hostParticipant: store.hostId ? store.participants.get(store.hostId) : null,
    isHost: store.currentUserId === store.hostId,
    
    // Chat selectors
    hasUnreadMessages: store.unreadMessageCount > 0,
    typingParticipants: Array.from(store.isTyping.entries())
      .filter(([_, isTyping]) => isTyping)
      .map(([participantId]) => store.participants.get(participantId))
      .filter(Boolean),
    
    // Whiteboard selectors
    canEditWhiteboard: store.currentUserId ? 
      store.whiteboardPermissions.get(store.currentUserId) || false : false,
    
    // Session selectors
    sessionDuration: store.sessionStartTime ? 
      Date.now() - store.sessionStartTime.getTime() : 0,
    isSessionActive: store.sessionStatus === 'active',
    
    // Connection selectors
    isConnected: store.connectionStatus === 'connected',
    shouldShowReconnect: store.connectionStatus === 'failed' && 
      store.reconnectAttempts < store.maxReconnectAttempts,
  };
};

// Export types for external use
export type ClassroomStore = ClassroomState & ClassroomActions;