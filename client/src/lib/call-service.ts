import { apiRequest } from "./queryClient";

export interface CallHistoryItem {
  id: string;
  callerId: string;
  recipientId: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: string;
}

export class CallService {
  static async getUserByVoiceId(voiceId: string) {
    const response = await apiRequest('GET', `/api/users/voice/${voiceId}`);
    return response.json();
  }

  static async getCallHistory(userId: string): Promise<CallHistoryItem[]> {
    const response = await apiRequest('GET', `/api/calls/history/${userId}`);
    return response.json();
  }

  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  static formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  }
}
