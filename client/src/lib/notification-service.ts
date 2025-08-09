
export type NotificationType = 'call' | 'message' | 'system' | 'update' | 'reminder';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  silent?: boolean;
  persistant?: boolean;
  data?: any;
}

export class NotificationService {
  private static readonly NOTIFICATIONS_KEY = 'globalink_notifications';
  private static readonly MAX_NOTIFICATIONS = 50;
  private static permissionGranted = false;

  static async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }
    return false;
  }

  static getNotifications(): Notification[] {
    const stored = localStorage.getItem(this.NOTIFICATIONS_KEY);
    if (!stored) return [];

    const notifications = JSON.parse(stored).map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp),
      expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
    }));

    // Filter out expired notifications
    const now = new Date();
    return notifications.filter((n: Notification) => 
      !n.expiresAt || n.expiresAt > now
    );
  }

  static addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Notification {
    const notifications = this.getNotifications();
    
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false
    };

    notifications.unshift(newNotification);

    // Keep only the most recent notifications
    if (notifications.length > this.MAX_NOTIFICATIONS) {
      notifications.splice(this.MAX_NOTIFICATIONS);
    }

    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));

    // Show browser notification if permission granted and not silent
    if (this.permissionGranted && !notification.silent) {
      this.showBrowserNotification(newNotification);
    }

    return newNotification;
  }

  private static showBrowserNotification(notification: Notification) {
    const browserNotif = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.type,
      requireInteraction: notification.priority === 'urgent',
      silent: notification.priority === 'low'
    });

    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => browserNotif.close(), 5000);
    }

    browserNotif.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      browserNotif.close();
    };
  }

  static markAsRead(notificationId: string): void {
    const notifications = this.getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.isRead = true;
      localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }
  }

  static markAllAsRead(): void {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.isRead = true);
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  static getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.isRead).length;
  }

  static clearNotifications(): void {
    localStorage.removeItem(this.NOTIFICATIONS_KEY);
  }

  static scheduleReminder(title: string, message: string, delay: number): string {
    const notification = this.addNotification({
      type: 'reminder',
      priority: 'medium',
      title,
      message,
      expiresAt: new Date(Date.now() + delay + 60000), // Expire 1 minute after scheduled time
      silent: true
    });

    setTimeout(() => {
      this.addNotification({
        type: 'reminder',
        priority: 'high',
        title: `Reminder: ${title}`,
        message,
        silent: false
      });
    }, delay);

    return notification.id;
  }

  static getPriorityColor(priority: NotificationPriority): string {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
    }
  }
}
