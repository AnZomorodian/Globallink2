export class RingtoneService {
  private audioContext: AudioContext | null = null;
  private ringtoneInterval: NodeJS.Timeout | null = null;
  private isPlaying = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private async playTone(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  async startIncomingCallRingtone() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    
    const playRingPattern = async () => {
      // Play classic phone ringtone pattern
      await this.playTone(800, 0.4, 0.1);
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.playTone(1000, 0.4, 0.1);
      await new Promise(resolve => setTimeout(resolve, 1500));
    };

    // Play immediately
    playRingPattern();
    
    // Continue playing every 2 seconds
    this.ringtoneInterval = setInterval(() => {
      if (this.isPlaying) {
        playRingPattern();
      }
    }, 2000);
  }

  async startOutgoingCallRingtone() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    
    const playRingPattern = async () => {
      await this.playTone(400, 0.8, 0.08);
      await new Promise(resolve => setTimeout(resolve, 1200));
    };

    // Play immediately
    playRingPattern();
    
    // Continue playing every 2 seconds
    this.ringtoneInterval = setInterval(() => {
      if (this.isPlaying) {
        playRingPattern();
      }
    }, 2000);
  }

  stopRingtone() {
    this.isPlaying = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  async playCallConnectedSound() {
    await this.playTone(600, 0.1, 0.05);
    setTimeout(() => this.playTone(800, 0.1, 0.05), 100);
  }

  async playCallEndedSound() {
    await this.playTone(400, 0.2, 0.05);
    setTimeout(() => this.playTone(300, 0.2, 0.05), 150);
    setTimeout(() => this.playTone(200, 0.3, 0.05), 300);
  }
}