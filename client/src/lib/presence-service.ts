
export type UserStatus = 'online' | 'away' | 'busy' | 'invisible' | 'offline';
export type ActivityStatus = 'active' | 'idle' | 'in-call' | 'in-meeting' | 'do-not-disturb';

interface PresenceData {
  status: UserStatus;
  activity: ActivityStatus;
  customMessage?: string;
  lastSeen: Date;
  location?: string;
  timezone?: string;
}

export class PresenceService {
  private static readonly PRESENCE_KEY = 'globalink_presence';
  private static readonly ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private activityTimer: number | null = null;
  private isActive = true;

  static getPresence(): PresenceData {
    const stored = localStorage.getItem(this.PRESENCE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return { ...data, lastSeen: new Date(data.lastSeen) };
    }
    
    return {
      status: 'online',
      activity: 'active',
      lastSeen: new Date(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  static updatePresence(presence: Partial<PresenceData>) {
    const current = this.getPresence();
    const updated = { 
      ...current, 
      ...presence, 
      lastSeen: new Date() 
    };
    localStorage.setItem(this.PRESENCE_KEY, JSON.stringify(updated));
    return updated;
  }

  static setStatus(status: UserStatus, customMessage?: string) {
    return this.updatePresence({ status, customMessage });
  }

  static setActivity(activity: ActivityStatus) {
    return this.updatePresence({ activity });
  }

  static startActivityMonitoring() {
    const resetIdleTimer = () => {
      if (this.activityTimer) clearTimeout(this.activityTimer);
      
      if (!this.isActive) {
        this.isActive = true;
        this.setActivity('active');
      }

      this.activityTimer = window.setTimeout(() => {
        this.isActive = false;
        this.setActivity('idle');
      }, this.ACTIVITY_TIMEOUT);
    };

    // Monitor user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    resetIdleTimer();
  }

  static getStatusColor(status: UserStatus): string {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'invisible': return 'bg-gray-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  }

  static getActivityIcon(activity: ActivityStatus): string {
    switch (activity) {
      case 'in-call': return '📞';
      case 'in-meeting': return '🎥';
      case 'do-not-disturb': return '🚫';
      case 'idle': return '💤';
      default: return '';
    }
  }
}
