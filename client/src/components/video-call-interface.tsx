import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, RotateCcw, Volume2, VolumeX, Settings, Monitor, User, Grid3X3 } from "lucide-react";
import { SettingsService } from "@/lib/settings-service";

interface VideoCallInterfaceProps {
  isVideoEnabled: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleVideo: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onEndCall: () => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
}

export function VideoCallInterface({
  isVideoEnabled,
  isMuted,
  isDeafened,
  onToggleVideo,
  onToggleMute,
  onToggleDeafen,
  onEndCall,
  localStream,
  remoteStream
}: VideoCallInterfaceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showSettings, setShowSettings] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p' | '4k'>('720p');
  const [beautyFilter, setBeautyFilter] = useState(false);
  const [virtualBackground, setVirtualBackground] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [participants, setParticipants] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'none' | 'blur' | 'vintage' | 'black-white'>('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(100);
  const settings = SettingsService.getSettings();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleCamera = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: newFacingMode },
            audio: true
          });
          
          // Replace video track
          const newVideoTrack = newStream.getVideoTracks()[0];
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
          }
          setFacingMode(newFacingMode);
        } catch (error) {
          console.error('Error switching camera:', error);
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden">
      {/* Remote Video (Main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted={isDeafened}
        className="w-full h-full object-cover"
        style={{ display: remoteStream && isVideoEnabled ? 'block' : 'none' }}
      />
      
      {/* Remote Video Placeholder */}
      {(!remoteStream || !isVideoEnabled) && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-white text-lg font-medium">Waiting for video...</p>
          </div>
        </div>
      )}

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
           onClick={() => setIsFullscreen(!isFullscreen)}>
        {isVideoEnabled && localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${settings.mirrorFrontCamera ? 'transform scale-x-[-1]' : ''}`}
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                activeFilter === 'blur' ? 'blur(2px)' : 
                activeFilter === 'vintage' ? 'sepia(1) hue-rotate(320deg)' :
                activeFilter === 'black-white' ? 'grayscale(1)' : ''
              }`
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <CameraOff className="h-6 w-6 text-gray-400" />
          </div>
        )}
        
        {/* PiP Controls */}
        <div className="absolute bottom-1 right-1 flex space-x-1">
          <button
            className="w-6 h-6 bg-black/50 rounded text-white text-xs flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowFilters(!showFilters);
            }}
          >
            🎨
          </button>
        </div>
      </div>

      {/* Enhanced Call Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-3 bg-black/60 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/10">
          {/* Mute Button */}
          <Button
            variant="outline"
            size="icon"
            className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25' 
                : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
            }`}
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          {/* Video Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
              !isVideoEnabled 
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25' 
                : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
            }`}
            onClick={onToggleVideo}
          >
            {isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          </Button>

          {/* Camera Flip Button */}
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full border-2 bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200"
            onClick={toggleCamera}
            disabled={!isVideoEnabled}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          {/* Video Settings Button */}
          <Button
            variant="outline"
            size="icon"
            className="w-12 h-12 rounded-full border-2 bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200"
            onClick={() => setShowSettings(!showSettings)}
            disabled={!isVideoEnabled}
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Speaker Button */}
          <Button
            variant="outline"
            size="icon"
            className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
              isDeafened 
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25' 
                : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
            }`}
            onClick={onToggleDeafen}
          >
            {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>

          {/* Screen Share Button */}
          <Button
            variant="outline"
            size="icon"
            className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
              screenShareActive 
                ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25' 
                : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
            }`}
            onClick={async () => {
              try {
                if (!screenShareActive) {
                  const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { frameRate: 30 },
                    audio: true
                  });
                  setScreenShareActive(true);
                  // Handle screen share stream
                } else {
                  setScreenShareActive(false);
                  // Stop screen sharing
                }
              } catch (error) {
                console.error('Screen sharing error:', error);
              }
            }}
          >
            <Monitor className="h-5 w-5" />
          </Button>

          {/* Record Button */}
          <Button
            variant="outline"
            size="icon"
            className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25' 
                : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
            }`}
            onClick={() => {
              setIsRecording(!isRecording);
              // TODO: Implement call recording
            }}
          >
            <div className={`w-3 h-3 ${isRecording ? 'bg-white rounded-sm' : 'bg-red-500 rounded-full'}`} />
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="icon"
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 shadow-lg shadow-red-500/25"
            onClick={onEndCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-lg rounded-xl p-4 border border-white/10 min-w-[280px]">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Video Settings
          </h3>
          
          <div className="space-y-3">
            {/* Video Quality */}
            <div>
              <label className="text-white text-sm mb-2 block">Video Quality</label>
              <select 
                className="w-full bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20"
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value as any)}
              >
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="4k">4K Ultra HD</option>
              </select>
            </div>

            {/* Beauty Filter */}
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Beauty Filter</span>
              <button
                className={`w-10 h-6 rounded-full transition-colors ${
                  beautyFilter ? 'bg-blue-500' : 'bg-white/20'
                }`}
                onClick={() => setBeautyFilter(!beautyFilter)}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  beautyFilter ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Virtual Background */}
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Virtual Background</span>
              <button
                className={`w-10 h-6 rounded-full transition-colors ${
                  virtualBackground ? 'bg-blue-500' : 'bg-white/20'
                }`}
                onClick={() => setVirtualBackground(!virtualBackground)}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  virtualBackground ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Mirror Camera */}
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">Mirror Camera</span>
              <button
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.mirrorFrontCamera ? 'bg-blue-500' : 'bg-white/20'
                }`}
                onClick={() => {
                  SettingsService.updateSetting('mirrorFrontCamera', !settings.mirrorFrontCamera);
                }}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.mirrorFrontCamera ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Stats (if enabled) */}
      {settings.showConnectionStats && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-lg rounded-lg p-3 text-white text-xs">
          <div className="space-y-1">
            <div>📶 Signal: Strong</div>
            <div>⚡ Latency: 24ms</div>
            <div>📹 Resolution: {videoQuality}</div>
            <div>🔊 Audio: HD</div>
          </div>
        </div>
      )}
    </div>
  );
}