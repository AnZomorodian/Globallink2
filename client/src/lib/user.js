class UserManager {
  constructor() {
    this.STORAGE_KEY = 'globalink_user';
    this.currentUser = null;
  }

  // Get current user from localStorage
  getCurrentUser() {
    if (!this.currentUser) {
      const userData = localStorage.getItem(this.STORAGE_KEY);
      this.currentUser = userData ? JSON.parse(userData) : null;
    }
    return this.currentUser;
  }

  // Set current user and save to localStorage
  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  // Update user information
  updateUser(updates) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const updatedUser = { ...currentUser, ...updates };
    this.setCurrentUser(updatedUser);
    return updatedUser;
  }

  // Clear user data (logout)
  clearUser() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY);
    // Also clear any session-related data
    localStorage.removeItem('globalink_session');
    localStorage.removeItem('globalink_session_settings');
    // Clear any cached data
    sessionStorage.clear();
  }

  // Get user's voice ID
  getVoiceId() {
    const user = this.getCurrentUser();
    return user ? user.voiceId : null;
  }

  // Get user's display name
  getDisplayName() {
    const user = this.getCurrentUser();
    return user ? user.displayName : 'Unknown User';
  }

  // Get user ID
  getUserId() {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  // Get user initials for avatar
  getUserInitials() {
    const user = this.getCurrentUser();
    if (!user || !user.displayName) return 'UN';

    return user.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Get user's profile picture URL
  getProfilePicture() {
    const user = this.getCurrentUser();
    return user ? user.profilePicture : null;
  }

  // Update profile picture
  updateProfilePicture(pictureUrl) {
    return this.updateUser({ profilePicture: pictureUrl });
  }

  // Get user's country
  getCountry() {
    const user = this.getCurrentUser();
    return user ? user.country : null;
  }

  // Get user's phone number
  getPhoneNumber() {
    const user = this.getCurrentUser();
    return user ? user.phoneNumber : null;
  }

  // Get user's bio
  getBio() {
    const user = this.getCurrentUser();
    return user ? user.bio : null;
  }

  // Update user profile
  updateProfile(profileData) {
    return this.updateUser(profileData);
  }

  // Get user's online status
  getOnlineStatus() {
    const user = this.getCurrentUser();
    return user ? user.isOnline : false;
  }

  // Set online status
  setOnlineStatus(isOnline) {
    return this.updateUser({ isOnline });
  }

  // Get user's last seen timestamp
  getLastSeen() {
    const user = this.getCurrentUser();
    return user ? user.lastSeen : null;
  }

  // Update last seen
  updateLastSeen() {
    return this.updateUser({ lastSeen: new Date().toISOString() });
  }

  // Export user data
  exportUserData() {
    return this.getCurrentUser();
  }

  // Import user data
  importUserData(userData) {
    if (userData && typeof userData === 'object') {
      this.setCurrentUser(userData);
      return true;
    }
    return false;
  }
}

// Create singleton instance
const userManager = new UserManager();

// Create storage interface that matches App.tsx expectations
export const storage = {
  getUser: () => userManager.getCurrentUser(),
  setUser: (user) => userManager.setCurrentUser(user),
  removeUser: () => userManager.clearUser()
};

export default userManager;