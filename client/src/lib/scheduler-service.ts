
export interface ScheduledCall {
  id: string;
  title: string;
  description?: string;
  participants: string[]; // Voice IDs
  scheduledTime: Date;
  duration: number; // minutes
  isVideoCall: boolean;
  reminderMinutes: number[];
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: Date;
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  };
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  createdBy: string;
  meetingLink?: string;
  notes?: string;
}

export class SchedulerService {
  private static readonly SCHEDULED_CALLS_KEY = 'globalink_scheduled_calls';

  static getScheduledCalls(): ScheduledCall[] {
    const stored = localStorage.getItem(this.SCHEDULED_CALLS_KEY);
    if (!stored) return [];

    return JSON.parse(stored).map((call: any) => ({
      ...call,
      scheduledTime: new Date(call.scheduledTime),
      recurring: call.recurring ? {
        ...call.recurring,
        endDate: call.recurring.endDate ? new Date(call.recurring.endDate) : undefined
      } : undefined
    }));
  }

  static scheduleCall(call: Omit<ScheduledCall, 'id' | 'status'>): ScheduledCall {
    const calls = this.getScheduledCalls();
    
    const newCall: ScheduledCall = {
      ...call,
      id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'scheduled'
    };

    calls.push(newCall);
    this.saveScheduledCalls(calls);

    // Set up reminders
    this.setupReminders(newCall);

    return newCall;
  }

  private static setupReminders(call: ScheduledCall): void {
    const now = new Date();
    const callTime = call.scheduledTime;

    call.reminderMinutes.forEach(minutes => {
      const reminderTime = new Date(callTime.getTime() - minutes * 60000);
      
      if (reminderTime > now) {
        const delay = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
          // This would integrate with NotificationService
          console.log(`Reminder: ${call.title} in ${minutes} minutes`);
        }, delay);
      }
    });
  }

  static getUpcomingCalls(hoursAhead = 24): ScheduledCall[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    return this.getScheduledCalls()
      .filter(call => 
        call.status === 'scheduled' && 
        call.scheduledTime >= now && 
        call.scheduledTime <= cutoff
      )
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  static getTodaysSchedule(): ScheduledCall[] {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return this.getScheduledCalls()
      .filter(call => 
        call.scheduledTime >= startOfDay && 
        call.scheduledTime < endOfDay &&
        call.status === 'scheduled'
      )
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  static updateCallStatus(callId: string, status: ScheduledCall['status']): void {
    const calls = this.getScheduledCalls();
    const call = calls.find(c => c.id === callId);
    
    if (call) {
      call.status = status;
      this.saveScheduledCalls(calls);
    }
  }

  static rescheduleCall(callId: string, newTime: Date): boolean {
    const calls = this.getScheduledCalls();
    const call = calls.find(c => c.id === callId);
    
    if (call) {
      call.scheduledTime = newTime;
      this.saveScheduledCalls(calls);
      this.setupReminders(call);
      return true;
    }
    
    return false;
  }

  private static saveScheduledCalls(calls: ScheduledCall[]): void {
    localStorage.setItem(this.SCHEDULED_CALLS_KEY, JSON.stringify(calls));
  }

  static exportToCalendar(call: ScheduledCall): string {
    const startTime = call.scheduledTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(call.scheduledTime.getTime() + call.duration * 60000)
      .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:Globalink',
      'BEGIN:VEVENT',
      `UID:${call.id}@globalink.com`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${call.title}`,
      `DESCRIPTION:${call.description || 'Scheduled call via Globalink'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }
}
