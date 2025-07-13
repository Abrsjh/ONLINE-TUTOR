'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Mic, MicOff, Monitor, MonitorOff, Phone, PhoneOff, Settings, Users, MessageSquare, MoreVertical, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

// Types
interface Participant {
  id: string;
  name: string;
  role: 'tutor' | 'student';
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  stream?: MediaStream;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
}

interface VideoClassroomProps {
  sessionId: string;
  currentUser: {
    id: string;
    name: string;
    role: 'tutor' | 'student';
  };
  onLeaveSession?: () => void;
  onSessionEnd?: () => void;
}

interface MediaControls {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  participants: Participant[];
}

// Custom hooks
const useMediaStream = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(async (constraints: MediaStreamConstraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access media devices';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, [localStream]);

  return {
    localStream,
    error,
    startStream,
    stopStream,
    toggleAudio,
    toggleVideo
  };
};

const useScreenShare = () => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });
      
      setScreenStream(stream);
      setIsSharing(true);
      return stream;
    } catch (err) {
      console.error('Error starting screen share:', err);
      throw err;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsSharing(false);
  }, [screenStream]);

  return {
    screenStream,
    isSharing,
    startScreenShare,
    stopScreenShare
  };
};

// Components
const VideoFeed: React.FC<{
  stream: MediaStream | null;
  participant?: Participant;
  isLocal?: boolean;
  isMuted?: boolean;
  className?: string;
}> = ({ stream, participant, isLocal = false, isMuted = false, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isMuted}
        className="w-full h-full object-cover"
      />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 left-2 flex items-center space-x-2">
          {participant && (
            <>
              <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                {participant.name} {isLocal && '(You)'}
              </span>
              {participant.role === 'tutor' && (
                <span className="text-yellow-400 text-xs bg-black/50 px-2 py-1 rounded">
                  Tutor
                </span>
              )}
            </>
          )}
        </div>
        
        <div className="absolute bottom-2 right-2 flex items-center space-x-1">
          {participant && !participant.isAudioEnabled && (
            <MicOff className="w-4 h-4 text-red-400" />
          )}
          {participant && !participant.isVideoEnabled && (
            <CameraOff className="w-4 h-4 text-red-400" />
          )}
          {participant?.isSpeaking && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
        
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-white" />
          ) : (
            <Maximize2 className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
      
      {/* No video placeholder */}
      {(!stream || (participant && !participant.isVideoEnabled)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-xl font-semibold">
                {participant?.name.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <p className="text-gray-300 text-sm">{participant?.name || 'User'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ControlBar: React.FC<{
  controls: MediaControls;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onLeaveSession: () => void;
  onEndSession?: () => void;
  isHost: boolean;
}> = ({
  controls,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onLeaveSession,
  onEndSession,
  isHost
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-gray-900 border-t border-gray-700 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleAudio}
            className={`p-3 rounded-full transition-colors ${
              controls.isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {controls.isAudioEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-colors ${
              controls.isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {controls.isVideoEnabled ? (
              <Camera className="w-5 h-5" />
            ) : (
              <CameraOff className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              controls.isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {controls.isScreenSharing ? (
              <MonitorOff className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Center controls */}
        <div className="flex items-center space-x-2">
          {isHost && (
            <button
              onClick={onToggleRecording}
              className={`px-4 py-2 rounded-lg transition-colors ${
                controls.isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${controls.isRecording ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  {controls.isRecording ? 'Recording' : 'Record'}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={onLeaveSession}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <Phone className="w-5 h-5" />
          </button>
          
          {isHost && onEndSession && (
            <button
              onClick={onEndSession}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <PhoneOff className="w-4 h-4" />
                <span className="text-sm font-medium">End Session</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ParticipantsList: React.FC<{
  participants: Participant[];
  isVisible: boolean;
  onToggle: () => void;
}> = ({ participants, isVisible, onToggle }) => {
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors z-10"
      >
        <Users className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 z-20">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Participants ({participants.length})</h3>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-3 overflow-y-auto h-full">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg"
          >
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {participant.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm font-medium">{participant.name}</span>
                {participant.role === 'tutor' && (
                  <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded">
                    Tutor
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                {participant.isAudioEnabled ? (
                  <Mic className="w-3 h-3 text-green-400" />
                ) : (
                  <MicOff className="w-3 h-3 text-red-400" />
                )}
                {participant.isVideoEnabled ? (
                  <Camera className="w-3 h-3 text-green-400" />
                ) : (
                  <CameraOff className="w-3 h-3 text-red-400" />
                )}
                {participant.isSpeaking && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConnectionIndicator: React.FC<{
  quality: ConnectionState['connectionQuality'];
  isConnected: boolean;
}> = ({ quality, isConnected }) => {
  const getColor = () => {
    if (!isConnected) return 'text-red-400';
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  const getBars = () => {
    if (!isConnected) return 0;
    switch (quality) {
      case 'excellent': return 4;
      case 'good': return 3;
      case 'poor': return 2;
      default: return 1;
    }
  };

  return (
    <div className="fixed top-4 left-4 flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-lg z-10">
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 h-3 rounded-full ${
              bar <= getBars() ? getColor().replace('text-', 'bg-') : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${getColor()}`}>
        {isConnected ? quality : 'disconnected'}
      </span>
    </div>
  );
};

// Main component
export const VideoClassroom: React.FC<VideoClassroomProps> = ({
  sessionId,
  currentUser,
  onLeaveSession,
  onSessionEnd
}) => {
  const { localStream, startStream, stopStream, toggleAudio, toggleVideo } = useMediaStream();
  const { screenStream, isSharing, startScreenShare, stopScreenShare } = useScreenShare();
  
  const [controls, setControls] = useState<MediaControls>({
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    isRecording: false
  });
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: true,
    connectionQuality: 'excellent',
    participants: []
  });
  
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Initialize media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        await startStream({ video: true, audio: true });
        setConnectionState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
        
        // Mock participants for demo
        setConnectionState(prev => ({
          ...prev,
          participants: [
            {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role,
              isAudioEnabled: true,
              isVideoEnabled: true,
              stream: localStream
            },
            {
              id: 'participant-2',
              name: 'John Smith',
              role: currentUser.role === 'tutor' ? 'student' : 'tutor',
              isAudioEnabled: true,
              isVideoEnabled: true,
              isSpeaking: false
            }
          ]
        }));
      } catch (error) {
        console.error('Failed to initialize media:', error);
        setConnectionState(prev => ({ ...prev, isConnecting: false, connectionQuality: 'disconnected' }));
      }
    };

    initializeMedia();

    return () => {
      stopStream();
      stopScreenShare();
    };
  }, []);

  // Control handlers
  const handleToggleAudio = useCallback(() => {
    toggleAudio();
    setControls(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
  }, [toggleAudio]);

  const handleToggleVideo = useCallback(() => {
    toggleVideo();
    setControls(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
  }, [toggleVideo]);

  const handleToggleScreenShare = useCallback(async () => {
    try {
      if (isSharing) {
        stopScreenShare();
      } else {
        await startScreenShare();
      }
      setControls(prev => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
    } catch (error) {
      console.error('Screen share error:', error);
    }
  }, [isSharing, startScreenShare, stopScreenShare]);

  const handleToggleRecording = useCallback(() => {
    setControls(prev => ({ ...prev, isRecording: !prev.isRecording }));
    // TODO: Implement actual recording logic
  }, []);

  const handleLeaveSession = useCallback(() => {
    stopStream();
    stopScreenShare();
    onLeaveSession?.();
  }, [stopStream, stopScreenShare, onLeaveSession]);

  const handleEndSession = useCallback(() => {
    stopStream();
    stopScreenShare();
    onSessionEnd?.();
  }, [stopStream, stopScreenShare, onSessionEnd]);

  const isHost = currentUser.role === 'tutor';
  const remoteParticipants = connectionState.participants.filter(p => p.id !== currentUser.id);
  const localParticipant = connectionState.participants.find(p => p.id === currentUser.id);

  return (
    <div className="h-screen bg-gray-900 flex flex-col relative">
      {/* Connection indicator */}
      <ConnectionIndicator
        quality={connectionState.connectionQuality}
        isConnected={connectionState.isConnected}
      />

      {/* Main video area */}
      <div className="flex-1 p-4 relative">
        {connectionState.isConnecting ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white">Connecting to session...</p>
            </div>
          </div>
        ) : (
          <div className="h-full grid gap-4" style={{
            gridTemplateColumns: remoteParticipants.length > 1 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
            gridTemplateRows: remoteParticipants.length > 2 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr'
          }}>
            {/* Screen share takes priority */}
            {isSharing && screenStream && (
              <VideoFeed
                stream={screenStream}
                participant={localParticipant}
                className="col-span-full row-span-full"
              />
            )}
            
            {/* Remote participants */}
            {!isSharing && remoteParticipants.map((participant) => (
              <VideoFeed
                key={participant.id}
                stream={participant.stream || null}
                participant={participant}
                className="min-h-[200px]"
              />
            ))}
            
            {/* Local video (picture-in-picture when screen sharing) */}
            {localStream && (
              <VideoFeed
                stream={localStream}
                participant={localParticipant}
                isLocal={true}
                className={isSharing 
                  ? "absolute bottom-20 right-4 w-48 h-36 z-10 border-2 border-gray-600" 
                  : remoteParticipants.length === 0 ? "col-span-full" : "min-h-[200px]"
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        controls={controls}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleRecording={handleToggleRecording}
        onLeaveSession={handleLeaveSession}
        onEndSession={isHost ? handleEndSession : undefined}
        isHost={isHost}
      />

      {/* Participants list */}
      <ParticipantsList
        participants={connectionState.participants}
        isVisible={showParticipants}
        onToggle={() => setShowParticipants(!showParticipants)}
      />

      {/* Chat toggle button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-20 right-4 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors z-10"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default VideoClassroom;