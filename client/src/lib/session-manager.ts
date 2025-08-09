
class SessionManager {
  private readonly SESSION_KEY = 'globalink_session';
  private readonly SETTINGS_KEY = 'globalink_session_settings';

  saveSession(user: any): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  getSession(): any | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      this.clearSession(); // Clear corrupted data
      return null;
    }
  }

  clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  updateSession(updates: any): void {
    try {
      const currentSession = this.getSession();
      if (currentSession) {
        const updatedSession = { ...currentSession, ...updates };
        this.saveSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  isSessionValid(): boolean {
    const session = this.getSession();
    return session && session.id;
  }

  getSessionSettings(): any {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Failed to get session settings:', error);
      return {};
    }
  }

  saveSessionSettings(settings: any): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save session settings:', error);
    }
  }
}

export const sessionManager = new SessionManager();
