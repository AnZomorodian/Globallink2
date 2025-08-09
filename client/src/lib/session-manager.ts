import type { User } from "@shared/schema";

interface SessionSettings {
  rememberSession: boolean;
  autoLogin: boolean;
}

class SessionManager {
  private readonly SESSION_KEY = 'globalink_session';
  private readonly SETTINGS_KEY = 'globalink_session_settings';

  getSessionSettings(): SessionSettings {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('Error loading session settings:', error);
    }
    
    return {
      rememberSession: false,
      autoLogin: false
    };
  }

  setSessionSettings(settings: Partial<SessionSettings>): void {
    try {
      const currentSettings = this.getSessionSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
      
      // If remember session is disabled, clear current session
      if (!newSettings.rememberSession) {
        this.clearSession();
      }
    } catch (error) {
      console.error('Error saving session settings:', error);
    }
  }

  saveSession(user: User): void {
    try {
      const settings = this.getSessionSettings();
      if (settings.rememberSession) {
        const sessionData = {
          user,
          timestamp: Date.now(),
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  getSession(): User | null {
    try {
      const settings = this.getSessionSettings();
      if (!settings.rememberSession) {
        return null;
      }

      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        
        // Check if session is expired
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          this.clearSession();
          return null;
        }
        
        return parsed.user;
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.clearSession();
    }
    
    return null;
  }

  clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  isSessionValid(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  refreshSession(user: User): void {
    const settings = this.getSessionSettings();
    if (settings.rememberSession) {
      this.saveSession(user);
    }
  }
}

export const sessionManager = new SessionManager();