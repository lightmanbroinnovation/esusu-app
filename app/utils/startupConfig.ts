// Startup configuration to prevent infinite loops and manage app initialization

export const STARTUP_CONFIG = {
  // Maximum time to show splash screen (in milliseconds)
  MAX_SPLASH_TIME: 10000, // 10 seconds
  
  // Minimum time between app state changes (in milliseconds)
  MIN_STATE_CHANGE_INTERVAL: 500,
  
  // Maximum number of session checks per minute
  MAX_SESSION_CHECKS_PER_MINUTE: 12,
  
  // Maximum number of API calls during startup
  MAX_STARTUP_API_CALLS: 5,
  
  // Startup timeout (in milliseconds)
  STARTUP_TIMEOUT: 15000, // 15 seconds
  
  // Cache check delay (in milliseconds)
  CACHE_CHECK_DELAY: 2000,
  
  // Network check interval (in milliseconds)
  NETWORK_CHECK_INTERVAL: 5000,
};

// Startup state manager
class StartupStateManager {
  private static instance: StartupStateManager;
  private startupStartTime: number = 0;
  private isStartingUp: boolean = false;
  private startupAttempts: number = 0;
  private lastStateChange: number = 0;
  
  private constructor() {}
  
  static getInstance(): StartupStateManager {
    if (!StartupStateManager.instance) {
      StartupStateManager.instance = new StartupStateManager();
    }
    return StartupStateManager.instance;
  }
  
  startStartup(): boolean {
    if (this.isStartingUp) {
      console.warn('🚨 Startup already in progress');
      return false;
    }
    
    this.startupStartTime = Date.now();
    this.isStartingUp = true;
    this.startupAttempts++;
    
    console.log(`🚀 Starting app startup (attempt ${this.startupAttempts})`);
    return true;
  }
  
  canChangeState(): boolean {
    const now = Date.now();
    if (now - this.lastStateChange < STARTUP_CONFIG.MIN_STATE_CHANGE_INTERVAL) {
      return false;
    }
    
    this.lastStateChange = now;
    return true;
  }
  
  isStartupTimedOut(): boolean {
    if (!this.isStartingUp) return false;
    
    const elapsed = Date.now() - this.startupStartTime;
    return elapsed > STARTUP_CONFIG.STARTUP_TIMEOUT;
  }
  
  completeStartup(): void {
    this.isStartingUp = false;
    console.log('✅ App startup completed successfully');
  }
  
  resetStartup(): void {
    this.isStartingUp = false;
    this.startupStartTime = 0;
    this.lastStateChange = 0;
  }
  
  getStartupInfo() {
    return {
      isStartingUp: this.isStartingUp,
      startupAttempts: this.startupAttempts,
      elapsedTime: this.isStartingUp ? Date.now() - this.startupStartTime : 0,
    };
  }
}

export const startupManager = StartupStateManager.getInstance();

// Utility to check if we're in a startup loop
export const isStartupLoop = (): boolean => {
  const info = startupManager.getStartupInfo();
  return info.startupAttempts > 3 || info.elapsedTime > STARTUP_CONFIG.STARTUP_TIMEOUT;
};

// Utility to prevent excessive state changes during startup
export const useStartupStateGuard = () => {
  const canChangeState = () => {
    if (startupManager.isStartupTimedOut()) {
      console.error('🚨 Startup timeout detected, preventing state changes');
      return false;
    }
    
    return startupManager.canChangeState();
  };
  
  return { canChangeState };
};
