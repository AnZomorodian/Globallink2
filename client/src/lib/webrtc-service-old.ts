export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private remoteVideo: HTMLVideoElement | null = null;
  private localVideo: HTMLVideoElement | null = null;
  private isVideoEnabled = false;
  private connectionQuality: 'excellent' | 'good' | 'poor' = 'excellent';
  private statsInterval: number | null = null;

  private currentCallId: string | null = null;

  constructor(private sendMessage: (message: any) => void) {
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCallId) {
        this.sendMessage({
          type: 'call_signal',
          callId: this.currentCallId,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.playRemoteStream(remoteStream);
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'connected') {
        this.startQualityMonitoring();
      } else if (this.peerConnection?.connectionState === 'disconnected') {
        this.stopQualityMonitoring();
      }
    };
  }

  async startCall(callId: string, isVideoCall = false): Promise<void> {
    try {
      this.currentCallId = callId;

      // Request permissions and get user media
      await this.requestMediaPermissions(isVideoCall);
      this.localStream = await this.getUserMedia(isVideoCall);

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Create offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideoCall
      });
      await this.peerConnection!.setLocalDescription(offer);

      // Send offer
      this.sendMessage({
        type: 'call_signal',
        callId,
        signal: {
          type: 'offer',
          offer: offer
        }
      });
    } catch (error) {
      console.error('Error starting call:', error);
      throw new Error('Could not access microphone or camera. Please allow access and try again.');
    }
  }

  async answerCall(callId: string, isVideoCall = false): Promise<void> {
    try {
      this.currentCallId = callId;

      // Get user media
      this.localStream = await this.getUserMedia(isVideoCall);

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    } catch (error) {
      console.error('Error accessing microphone or camera:', error);
      throw new Error('Could not access microphone or camera. Please allow access and try again.');
    }
  }

  async handleSignal(signal: any): Promise<void> {
    if (!this.peerConnection) return;

    switch (signal.type) {
      case 'offer':
        await this.peerConnection.setRemoteDescription(signal.offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.sendMessage({
          type: 'call_signal',
          callId: this.currentCallId,
          signal: {
            type: 'answer',
            answer: answer
          }
        });
        break;

      case 'answer':
        await this.peerConnection.setRemoteDescription(signal.answer);
        break;

      case 'ice-candidate':
        await this.peerConnection.addIceCandidate(signal.candidate);
        break;
    }
  }

  private playRemoteStream(stream: MediaStream) {
    if (this.remoteAudio) {
      this.remoteAudio.remove();
      this.remoteAudio = null;
    }
    if (this.remoteVideo && this.isVideoEnabled) {
      this.remoteVideo.srcObject = stream;
      this.remoteVideo.autoplay = true;
      this.remoteVideo.muted = true; // Mute remote video to avoid echo
    } else {
      this.remoteAudio = document.createElement('audio');
      this.remoteAudio.srcObject = stream;
      this.remoteAudio.autoplay = true;
      this.remoteAudio.volume = 1.0;
      document.body.appendChild(this.remoteAudio);
    }
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  toggleDeafen(): boolean {
    if (this.remoteAudio) {
      this.remoteAudio.muted = !this.remoteAudio.muted;
      return this.remoteAudio.muted;
    }
    return false;
  }

  setVolume(volume: number) {
    if (this.remoteAudio) {
      this.remoteAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  toggleVideo(facingMode = 'user'): boolean {
    this.isVideoEnabled = !this.isVideoEnabled;
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = this.isVideoEnabled;
        if (this.localVideo) {
          this.localVideo.srcObject = this.localStream;
        }
      } else if (this.isVideoEnabled) {
        // If video was disabled and is now enabled, re-request media
        this.getUserMedia(true, facingMode).then(stream => {
          stream.getTracks().forEach(track => {
            this.peerConnection?.addTrack(track, stream);
          });
          if (this.localVideo) {
            this.localVideo.srcObject = stream;
          }
        }).catch(error => {
          console.error('Error re-enabling video:', error);
          this.isVideoEnabled = false; // Revert state if error occurs
        });
      }
    } else if (this.isVideoEnabled) {
      // If no stream exists and video is enabled, get media
      this.getUserMedia(true, facingMode).then(stream => {
        stream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, stream);
        });
        if (this.localVideo) {
          this.localVideo.srcObject = stream;
        }
      }).catch(error => {
        console.error('Error enabling video:', error);
        this.isVideoEnabled = false; // Revert state if error occurs
      });
    }
    return this.isVideoEnabled;
  }

  setLocalVideoElement(video: HTMLVideoElement) {
    this.localVideo = video;
    if (this.localStream) {
      this.localVideo.srcObject = this.localStream;
    }
  }

  setRemoteVideoElement(video: HTMLVideoElement) {
    this.remoteVideo = video;
    if (this.localStream && this.isVideoEnabled) {
      this.remoteVideo.srcObject = this.localStream;
    }
  }

  private startQualityMonitoring() {
    if (this.statsInterval) return;
    
    this.statsInterval = window.setInterval(async () => {
      if (!this.peerConnection) return;
      
      try {
        const stats = await this.peerConnection.getStats();
        let bytesReceived = 0;
        let packetsLost = 0;
        
        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            bytesReceived = report.bytesReceived || 0;
            packetsLost = report.packetsLost || 0;
          }
        });
        
        // Simple quality assessment
        if (packetsLost > 50) {
          this.connectionQuality = 'poor';
        } else if (packetsLost > 20) {
          this.connectionQuality = 'good';
        } else {
          this.connectionQuality = 'excellent';
        }
      } catch (error) {
        console.error('Error getting stats:', error);
      }
    }, 2000);
  }

  private stopQualityMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  getConnectionQuality(): 'excellent' | 'good' | 'poor' {
    return this.connectionQuality;
  }

  private async requestMediaPermissions(isVideoCall: boolean): Promise<void> {
    try {
      // Request permissions first to show user-friendly prompts
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: isVideoCall ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      };

      // Check if permissions are already granted
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
      } else {
        throw new Error('Media devices not supported');
      }
    } catch (error: any) {
      let errorMessage = 'Unable to access media devices. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += isVideoCall 
          ? 'Please allow camera and microphone access in your browser settings and refresh the page.'
          : 'Please allow microphone access in your browser settings and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += isVideoCall 
          ? 'No camera or microphone found. Please connect a device and try again.'
          : 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Your camera or microphone is being used by another application. Please close other applications and try again.';
      } else {
        errorMessage += 'Please check your device permissions and try again.';
      }
      
      throw new Error(errorMessage);
    }
  }

  private async getUserMedia(isVideoCall: boolean, facingMode = 'user'): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: isVideoCall ? {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } : false
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error: any) {
      console.error('getUserMedia error:', error);
      throw new Error('Failed to access camera or microphone. Please check your device permissions.');
    }
  }
}

  async startScreenShare(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true
      });
      
      // Replace video track in peer connection
      if (this.peerConnection && this.localStream) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      return stream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      return null;
    }
  }

  async stopScreenShare(): Promise<void> {
    try {
      // Get camera stream again
      const stream = await this.getUserMedia(this.isVideoEnabled);
      
      if (this.peerConnection && stream) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }

  endCall() {
    // Stop quality monitoring
    this.stopQualityMonitoring();
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.setupPeerConnection(); // Reset for next call
    }

    // Remove remote audio
    if (this.remoteAudio) {
      this.remoteAudio.remove();
      this.remoteAudio = null;
    }
    // Clear remote video element
    if (this.remoteVideo) {
      this.remoteVideo.srcObject = null;
    }

    // Reset call ID
    this.currentCallId = null;
    this.isVideoEnabled = false;
    this.connectionQuality = 'excellent';
  }

  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'disconnected';
  }

  async getUserMedia(isVideoCall = false, facingMode = 'user'): Promise<MediaStream> {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        },
        video: isVideoCall ? {
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: facingMode,
          aspectRatio: 16/9
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isVideoEnabled = isVideoCall;

      // Update local video element if available
      if (this.localVideo) {
        this.localVideo.srcObject = this.localStream;
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }
}