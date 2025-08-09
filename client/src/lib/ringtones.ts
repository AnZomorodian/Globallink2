export interface RingtoneOption {
  id: string;
  name: string;
  description: string;
}

export const RINGTONE_OPTIONS: RingtoneOption[] = [
  { id: 'default', name: 'Default', description: 'Classic phone ring' },
  { id: 'modern', name: 'Modern', description: 'Digital notification sound' },
  { id: 'soft', name: 'Soft', description: 'Gentle melodic tone' }
];

export class RingtoneService {
  private context: AudioContext;
  private currentTone: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private selectedRingtone: string = 'default';

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  setRingtone(ringtoneId: string) {
    this.selectedRingtone = ringtoneId;
    localStorage.setItem('globalink_ringtone', ringtoneId);
  }

  getRingtone(): string {
    const saved = localStorage.getItem('globalink_ringtone');
    return saved || 'default';
  }

  private createTone(frequency: number, type: OscillatorType = 'sine'): OscillatorNode {
    const oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();
    
    oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    return oscillator;
  }

  private playDefaultRingtone() {
    let frequency = 800;
    const interval = setInterval(() => {
      this.currentTone = this.createTone(frequency);
      this.gainNode!.gain.value = 0.3;
      this.currentTone.start();
      this.currentTone.stop(this.context.currentTime + 0.5);
      
      frequency = frequency === 800 ? 1000 : 800;
    }, 1000);
    
    return interval;
  }

  private playModernRingtone() {
    const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
    let index = 0;
    
    const interval = setInterval(() => {
      this.currentTone = this.createTone(frequencies[index], 'triangle');
      this.gainNode!.gain.value = 0.2;
      this.currentTone.start();
      this.currentTone.stop(this.context.currentTime + 0.3);
      
      index = (index + 1) % frequencies.length;
    }, 400);
    
    return interval;
  }

  private playSoftRingtone() {
    const frequencies = [440, 554, 659]; // A4, C#5, E5
    let index = 0;
    
    const interval = setInterval(() => {
      this.currentTone = this.createTone(frequencies[index], 'sine');
      this.gainNode!.gain.value = 0.15;
      this.currentTone.start();
      this.currentTone.stop(this.context.currentTime + 0.8);
      
      index = (index + 1) % frequencies.length;
    }, 1200);
    
    return interval;
  }

  startRinging(): () => void {
    const ringtone = this.getRingtone();
    let interval: NodeJS.Timeout;

    switch (ringtone) {
      case 'modern':
        interval = this.playModernRingtone();
        break;
      case 'soft':
        interval = this.playSoftRingtone();
        break;
      default:
        interval = this.playDefaultRingtone();
        break;
    }

    return () => {
      clearInterval(interval);
      if (this.currentTone) {
        this.currentTone.stop();
        this.currentTone = null;
      }
    };
  }

  playConnectionSound() {
    this.currentTone = this.createTone(600);
    this.gainNode!.gain.value = 0.2;
    this.currentTone.start();
    this.currentTone.stop(this.context.currentTime + 0.2);
  }

  playDisconnectionSound() {
    this.currentTone = this.createTone(300);
    this.gainNode!.gain.value = 0.2;
    this.currentTone.start();
    this.currentTone.stop(this.context.currentTime + 0.5);
  }
}