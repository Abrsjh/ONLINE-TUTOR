import { useCallback, useEffect, useRef, useState } from 'react';
import { useClassroomStore } from '@/lib/state/classroom';

// WebRTC configuration
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
};

// Media constraints
const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 30, max: 60 },
};

const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 44100,
};

const SCREEN_SHARE_CONSTRAINTS: DisplayMediaStreamConstraints = {
  video: {
    cursor: 'always',
    displaySurface: 'monitor',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
};

interface WebRTCError {
  type: 'permission' | 'connection' | 'media' | 'network' | 'unknown';
  message: string;
  code?: string;
  details?: any;
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

interface ConnectionStats {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  packetsLost: number;
  jitter: number;
  roundTripTime: number;
  bandwidth: number;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
}

export const useWebRTC = () => {
  const {
    sessionId,
    currentUserId,
    participants,
    localStream,
    remoteStreams,
    peerConnections,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    screenShareStream,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,
    setLocalStream,
    addRemoteStream,
    removeRemoteStream,
    addPeerConnection,
    removePeerConnection,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    setConnectionStatus,
    setConnectionError,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    updateParticipant,
  } = useClassroomStore();

  // Local state
  const [isInitializing, setIsInitializing] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [connectionStats, setConnectionStats] = useState<Map<string, ConnectionStats>>(new Map());
  const [lastError, setLastError] = useState<WebRTCError | null>(null);

  // Refs for cleanup and persistence
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const statsIntervalRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize media devices
  const initializeDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mediaDevices: MediaDeviceInfo[] = devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
        kind: device.kind as 'videoinput' | 'audioinput' | 'audiooutput',
      }));

      setAvailableDevices(mediaDevices);

      // Set default devices if not already selected
      if (!selectedVideoDevice) {
        const defaultVideo = mediaDevices.find(d => d.kind === 'videoinput');
        if (defaultVideo) setSelectedVideoDevice(defaultVideo.deviceId);
      }

      if (!selectedAudioDevice) {
        const defaultAudio = mediaDevices.find(d => d.kind === 'audioinput');
        if (defaultAudio) setSelectedAudioDevice(defaultAudio.deviceId);
      }

      if (!selectedAudioOutput) {
        const defaultOutput = mediaDevices.find(d => d.kind === 'audiooutput');
        if (defaultOutput) setSelectedAudioOutput(defaultOutput.deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      setLastError({
        type: 'media',
        message: 'Failed to access media devices',
        details: error,
      });
    }
  }, [selectedVideoDevice, selectedAudioDevice, selectedAudioOutput]);

  // Get user media with specified constraints
  const getUserMedia = useCallback(async (
    videoDeviceId?: string,
    audioDeviceId?: string,
    videoConstraints: MediaTrackConstraints = DEFAULT_VIDEO_CONSTRAINTS,
    audioConstraints: MediaTrackConstraints = DEFAULT_AUDIO_CONSTRAINTS
  ): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        video: videoDeviceId ? {
          ...videoConstraints,
          deviceId: { exact: videoDeviceId },
        } : videoConstraints,
        audio: audioDeviceId ? {
          ...audioConstraints,
          deviceId: { exact: audioDeviceId },
        } : audioConstraints,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set initial track states
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });

      return stream;
    } catch (error: any) {
      console.error('Failed to get user media:', error);
      
      let errorType: WebRTCError['type'] = 'unknown';
      let errorMessage = 'Failed to access camera/microphone';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorType = 'permission';
        errorMessage = 'Camera/microphone access denied. Please grant permissions and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorType = 'media';
        errorMessage = 'No camera/microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorType = 'media';
        errorMessage = 'Camera/microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorType = 'media';
        errorMessage = 'Camera/microphone does not support the required settings.';
      }

      setLastError({
        type: errorType,
        message: errorMessage,
        code: error.name,
        details: error,
      });

      return null;
    }
  }, [isAudioEnabled, isVideoEnabled]);

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    setConnectionStatus('connecting');

    try {
      // Stop existing stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      const stream = await getUserMedia(selectedVideoDevice, selectedAudioDevice);
      if (stream) {
        setLocalStream(stream);
        setConnectionStatus('connected');
        resetReconnectAttempts();
        setLastError(null);
      } else {
        setConnectionStatus('failed');
      }
    } catch (error) {
      console.error('Failed to initialize local stream:', error);
      setConnectionStatus('failed');
    } finally {
      setIsInitializing(false);
    }
  }, [
    isInitializing,
    localStream,
    selectedVideoDevice,
    selectedAudioDevice,
    getUserMedia,
    setLocalStream,
    setConnectionStatus,
    resetReconnectAttempts,
  ]);

  // Create peer connection for a participant
  const createPeerConnection = useCallback(async (participantId: string): Promise<RTCPeerConnection> => {
    const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      addRemoteStream(participantId, remoteStream);
      
      updateParticipant(participantId, {
        connectionStatus: 'connected',
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this candidate to the remote peer
        console.log('ICE candidate:', event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`Peer connection state for ${participantId}:`, state);
      
      updateParticipant(participantId, {
        connectionStatus: state === 'connected' ? 'connected' : 
                         state === 'connecting' ? 'connecting' :
                         state === 'disconnected' ? 'disconnected' : 'reconnecting',
      });

      if (state === 'failed') {
        handleConnectionFailure(participantId);
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      console.log(`ICE connection state for ${participantId}:`, state);
      
      if (state === 'failed' || state === 'disconnected') {
        handleConnectionFailure(participantId);
      }
    };

    addPeerConnection(participantId, peerConnection);
    return peerConnection;
  }, [localStream, addRemoteStream, addPeerConnection, updateParticipant]);

  // Handle connection failure and attempt reconnection
  const handleConnectionFailure = useCallback(async (participantId: string) => {
    console.log(`Connection failed for participant ${participantId}`);
    
    if (reconnectAttempts < maxReconnectAttempts) {
      incrementReconnectAttempts();
      
      // Wait before reconnecting
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectTimeoutRef.current = setTimeout(async () => {
        try {
          // Remove old connection
          removePeerConnection(participantId);
          removeRemoteStream(participantId);
          
          // Create new connection
          await createPeerConnection(participantId);
        } catch (error) {
          console.error(`Reconnection failed for ${participantId}:`, error);
        }
      }, delay);
    } else {
      setConnectionError(`Failed to connect to participant ${participantId}`);
    }
  }, [
    reconnectAttempts,
    maxReconnectAttempts,
    incrementReconnectAttempts,
    removePeerConnection,
    removeRemoteStream,
    createPeerConnection,
    setConnectionError,
  ]);

  // Start screen sharing
  const startScreenSharing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(SCREEN_SHARE_CONSTRAINTS);
      
      // Handle screen share end
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      startScreenShare(stream);

      // Replace video track in all peer connections
      peerConnections.forEach(async (peerConnection, participantId) => {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && stream.getVideoTracks()[0]) {
          await sender.replaceTrack(stream.getVideoTracks()[0]);
        }
      });

      setLastError(null);
    } catch (error: any) {
      console.error('Failed to start screen sharing:', error);
      
      let errorMessage = 'Failed to start screen sharing';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Screen sharing permission denied';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Screen sharing is not supported in this browser';
      }

      setLastError({
        type: 'media',
        message: errorMessage,
        code: error.name,
        details: error,
      });
    }
  }, [peerConnections, startScreenShare, stopScreenShare]);

  // Stop screen sharing
  const stopScreenSharing = useCallback(async () => {
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
    }
    
    stopScreenShare();

    // Replace screen share track with camera track in all peer connections
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      
      peerConnections.forEach(async (peerConnection, participantId) => {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      });
    }
  }, [screenShareStream, stopScreenShare, localStream, peerConnections]);

  // Switch camera/microphone device
  const switchDevice = useCallback(async (
    deviceId: string,
    kind: 'videoinput' | 'audioinput'
  ) => {
    try {
      if (kind === 'videoinput') {
        setSelectedVideoDevice(deviceId);
      } else {
        setSelectedAudioDevice(deviceId);
      }

      // Get new stream with the selected device
      const newStream = await getUserMedia(
        kind === 'videoinput' ? deviceId : selectedVideoDevice,
        kind === 'audioinput' ? deviceId : selectedAudioDevice
      );

      if (newStream) {
        const oldStream = localStream;
        setLocalStream(newStream);

        // Replace tracks in all peer connections
        const newTrack = kind === 'videoinput' ? 
          newStream.getVideoTracks()[0] : 
          newStream.getAudioTracks()[0];

        if (newTrack) {
          peerConnections.forEach(async (peerConnection) => {
            const sender = peerConnection.getSenders().find(s => 
              s.track && s.track.kind === newTrack.kind
            );
            
            if (sender) {
              await sender.replaceTrack(newTrack);
            }
          });
        }

        // Stop old tracks
        if (oldStream) {
          oldStream.getTracks().forEach(track => {
            if (track.kind === newTrack?.kind) {
              track.stop();
            }
          });
        }
      }
    } catch (error) {
      console.error(`Failed to switch ${kind}:`, error);
      setLastError({
        type: 'media',
        message: `Failed to switch ${kind === 'videoinput' ? 'camera' : 'microphone'}`,
        details: error,
      });
    }
  }, [
    selectedVideoDevice,
    selectedAudioDevice,
    getUserMedia,
    localStream,
    setLocalStream,
    peerConnections,
  ]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!localStream) {
        throw new Error('No local stream available for recording');
      }

      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      };

      // Fallback to supported mime types
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          options.mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options.mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          options.mimeType = 'video/mp4';
        }
      }

      const mediaRecorder = new MediaRecorder(localStream, options);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        
        // Create download URL
        const url = URL.createObjectURL(blob);
        
        // In a real implementation, upload to server
        console.log('Recording completed:', {
          size: blob.size,
          type: blob.type,
          url,
        });
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setLastError({
        type: 'media',
        message: 'Failed to start recording',
        details: error,
      });
    }
  }, [localStream]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  // Get connection statistics
  const getConnectionStats = useCallback(async () => {
    const stats = new Map<string, ConnectionStats>();

    for (const [participantId, peerConnection] of peerConnections) {
      try {
        const rtcStats = await peerConnection.getStats();
        let bytesReceived = 0;
        let bytesSent = 0;
        let packetsReceived = 0;
        let packetsSent = 0;
        let packetsLost = 0;
        let jitter = 0;
        let roundTripTime = 0;
        let bandwidth = 0;

        rtcStats.forEach((report) => {
          if (report.type === 'inbound-rtp') {
            bytesReceived += report.bytesReceived || 0;
            packetsReceived += report.packetsReceived || 0;
            packetsLost += report.packetsLost || 0;
            jitter += report.jitter || 0;
          } else if (report.type === 'outbound-rtp') {
            bytesSent += report.bytesSent || 0;
            packetsSent += report.packetsSent || 0;
          } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            roundTripTime = report.currentRoundTripTime || 0;
            bandwidth = report.availableOutgoingBitrate || 0;
          }
        });

        stats.set(participantId, {
          bytesReceived,
          bytesSent,
          packetsReceived,
          packetsSent,
          packetsLost,
          jitter,
          roundTripTime,
          bandwidth,
          connectionState: peerConnection.connectionState,
          iceConnectionState: peerConnection.iceConnectionState,
        });
      } catch (error) {
        console.error(`Failed to get stats for ${participantId}:`, error);
      }
    }

    setConnectionStats(stats);
  }, [peerConnections]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }

    // Stop recording
    stopRecording();

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Stop screen share
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connections
    peerConnections.forEach(peerConnection => {
      peerConnection.close();
    });
  }, [localStream, screenShareStream, peerConnections, stopRecording]);

  // Initialize on mount
  useEffect(() => {
    initializeDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', initializeDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', initializeDevices);
    };
  }, [initializeDevices]);

  // Start stats collection
  useEffect(() => {
    if (peerConnections.size > 0) {
      statsIntervalRef.current = setInterval(getConnectionStats, 5000);
    } else {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [peerConnections.size, getConnectionStats]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    isInitializing,
    availableDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    selectedAudioOutput,
    connectionStats,
    lastError,
    
    // Media controls
    initializeLocalStream,
    toggleAudio,
    toggleVideo,
    switchDevice,
    setSelectedAudioOutput,
    
    // Screen sharing
    startScreenSharing,
    stopScreenSharing,
    
    // Recording
    startRecording,
    stopRecording,
    isRecording: mediaRecorderRef.current?.state === 'recording',
    
    // Peer connections
    createPeerConnection,
    
    // Stats and diagnostics
    getConnectionStats,
    
    // Utility
    cleanup,
    clearError: () => setLastError(null),
  };
};

export type WebRTCHook = ReturnType<typeof useWebRTC>;