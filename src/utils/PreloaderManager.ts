/**
 * Professional Preloader Manager
 * 
 * Manages preloader display logic with sophisticated session detection.
 * Inspired by Apple's approach to loading states in native apps.
 * 
 * Key Features:
 * - Differentiates between page reload (F5) and navigation
 * - Uses sessionStorage for session tracking
 * - Uses localStorage for user preferences
 * - Leverages Performance API for reload detection
 */

const SESSION_KEY = 'ffs_session_active';
const PRELOADER_SHOWN_KEY = 'ffs_preloader_shown_in_session';

export interface PreloaderState {
  shouldShow: boolean;
  reason: 'reload' | 'new-session' | 'navigation' | 'already-shown';
}

class PreloaderManager {
  private userId: string | null = null;

  /**
   * Initialize the manager with a user ID
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Determines if the current page load is a reload (F5/refresh)
   * Uses the Performance Navigation API
   */
  private isPageReload(): boolean {
    if (typeof window === 'undefined') return false;

    // Modern API
    if (window.performance?.navigation) {
      // TYPE_RELOAD = 1
      return window.performance.navigation.type === 1;
    }

    // Fallback: Check if performance entries exist
    if (window.performance?.getEntriesByType) {
      const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        return navEntries[0].type === 'reload';
      }
    }

    return false;
  }

  /**
   * Checks if this is a new session (new tab, window, or first visit)
   */
  private isNewSession(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const sessionActive = window.sessionStorage.getItem(SESSION_KEY);
      return sessionActive === null;
    } catch (err) {
      console.warn('[PreloaderManager] Unable to access sessionStorage', err);
      return true; // Fail-safe: treat as new session
    }
  }

  /**
   * Checks if preloader was already shown in this session
   */
  private wasShownInSession(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      return window.sessionStorage.getItem(PRELOADER_SHOWN_KEY) === 'true';
    } catch (err) {
      console.warn('[PreloaderManager] Unable to check session state', err);
      return false;
    }
  }

  /**
   * Main logic: Determines if preloader should be shown
   * 
   * Shows preloader when:
   * 1. Page is reloaded (F5/refresh)
   * 2. New session (new tab/window)
   * 
   * Skips preloader when:
   * 1. Navigating within the app
   * 2. Already shown in current session
   */
  shouldShowPreloader(): PreloaderState {
    // Check if already shown in this session
    if (this.wasShownInSession()) {
      return {
        shouldShow: false,
        reason: 'already-shown'
      };
    }

    // Check if this is a page reload
    if (this.isPageReload()) {
      return {
        shouldShow: true,
        reason: 'reload'
      };
    }

    // Check if this is a new session
    if (this.isNewSession()) {
      return {
        shouldShow: true,
        reason: 'new-session'
      };
    }

    // Navigation within app
    return {
      shouldShow: false,
      reason: 'navigation'
    };
  }

  /**
   * Marks the preloader as shown in the current session
   */
  markAsShown(): void {
    if (typeof window === 'undefined') return;

    try {
      // Mark session as active
      window.sessionStorage.setItem(SESSION_KEY, 'true');
      // Mark preloader as shown in this session
      window.sessionStorage.setItem(PRELOADER_SHOWN_KEY, 'true');
    } catch (err) {
      console.warn('[PreloaderManager] Unable to persist session state', err);
    }
  }

  /**
   * Initializes the session (call on app mount)
   */
  initializeSession(): void {
    if (typeof window === 'undefined') return;

    try {
      // Mark session as active (but don't mark preloader as shown yet)
      window.sessionStorage.setItem(SESSION_KEY, 'true');
    } catch (err) {
      console.warn('[PreloaderManager] Unable to initialize session', err);
    }
  }

  /**
   * Resets session state (call on logout)
   */
  reset(): void {
    if (typeof window === 'undefined') return;

    try {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(PRELOADER_SHOWN_KEY);
    } catch (err) {
      console.warn('[PreloaderManager] Unable to reset session', err);
    }

    this.userId = null;
  }

  /**
   * Debug helper: Get current state
   */
  getDebugInfo(): {
    isReload: boolean;
    isNewSession: boolean;
    wasShown: boolean;
    userId: string | null;
  } {
    return {
      isReload: this.isPageReload(),
      isNewSession: this.isNewSession(),
      wasShown: this.wasShownInSession(),
      userId: this.userId
    };
  }
}

// Singleton instance
export const preloaderManager = new PreloaderManager();
