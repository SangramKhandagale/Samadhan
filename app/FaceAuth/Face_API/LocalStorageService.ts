// services/LocalStorageService.ts

// Define types
interface UserData {
    faceQualityScore: number;
    username: string;
    faceDescriptor: number[];
    imagePath: string;
    enhancedImagePath?: string;
    phone?: string;
  }
  
  interface AuthFailureLog {
    timestamp: number;
    username: string;
    attempts: number;
    notificationSent: boolean;
  }
  
  /**
   * Utility service to manage local storage operations
   */
  export default class LocalStorageService {
    private static readonly USER_DATA_KEY = 'registeredUser';
    private static readonly AUTH_FAILURES_KEY = 'failedAuthAttempts';
  
    /**
     * Get the registered user data from localStorage
     */
    static getUserData(): UserData | null {
      try {
        const storedUser = localStorage.getItem(this.USER_DATA_KEY);
        if (storedUser) {
          return JSON.parse(storedUser) as UserData;
        }
        return null;
      } catch (error) {
        console.error('Error loading user data:', error);
        return null;
      }
    }
  
    /**
     * Save user data to localStorage
     */
    static saveUserData(userData: UserData): void {
      try {
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error('Error saving user data:', error);
        throw error;
      }
    }
  
    /**
     * Clear user data from localStorage
     */
    static clearUserData(): void {
      try {
        localStorage.removeItem(this.USER_DATA_KEY);
      } catch (error) {
        console.error('Error clearing user data:', error);
      }
    }
  
    /**
     * Get failed authentication attempts from localStorage
     */
    static getFailedAuthAttempts(): { attempts: number, lastNotificationTime: number } {
      try {
        const failedAuthData = localStorage.getItem(this.AUTH_FAILURES_KEY);
        if (failedAuthData) {
          const authData: AuthFailureLog = JSON.parse(failedAuthData);
          
          // Only use data if it's from the last 30 minutes
          const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
          if (authData.timestamp > thirtyMinutesAgo) {
            return {
              attempts: authData.attempts,
              lastNotificationTime: authData.notificationSent ? authData.timestamp : 0
            };
          }
        }
        
        // Return defaults
        return { attempts: 0, lastNotificationTime: 0 };
      } catch (error) {
        console.error('Error loading failed authentication data:', error);
        return { attempts: 0, lastNotificationTime: 0 };
      }
    }
  
    /**
     * Save failed authentication attempts to localStorage
     */
    static saveFailedAuthAttempts(attempts: number, notificationSent: boolean): void {
      try {
        const userData = this.getUserData();
        
        const authData: AuthFailureLog = {
          timestamp: Date.now(),
          username: userData?.username || '',
          attempts: attempts,
          notificationSent: notificationSent
        };
        
        localStorage.setItem(this.AUTH_FAILURES_KEY, JSON.stringify(authData));
      } catch (error) {
        console.error('Error saving failed authentication data:', error);
      }
    }
  
    /**
     * Clear failed authentication data from localStorage
     */
    static clearFailedAuthAttempts(): void {
      try {
        localStorage.removeItem(this.AUTH_FAILURES_KEY);
      } catch (error) {
        console.error('Error clearing failed authentication data:', error);
      }
    }
  
    /**
     * Reset all storage
     */
    static resetAllData(): void {
      this.clearUserData();
      this.clearFailedAuthAttempts();
    }
  }