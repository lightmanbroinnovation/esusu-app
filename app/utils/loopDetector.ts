// Loop detector utility to help identify infinite loops in data fetching

interface LoopDetectionConfig {
  maxCalls: number;
  timeWindow: number; // in milliseconds
  componentName: string;
}

class LoopDetector {
  private static instances = new Map<string, LoopDetector>();
  private callTimes: number[] = [];
  private isBlocked = false;
  private blockStartTime = 0;
  private readonly config: LoopDetectionConfig;

  constructor(config: LoopDetectionConfig) {
    this.config = config;
  }

  static getInstance(componentName: string, maxCalls = 5, timeWindow = 5000): LoopDetector {
    if (!LoopDetector.instances.has(componentName)) {
      LoopDetector.instances.set(componentName, new LoopDetector({
        componentName,
        maxCalls,
        timeWindow
      }));
    }
    return LoopDetector.instances.get(componentName)!;
  }

  canProceed(): boolean {
    const now = Date.now();

    // If blocked, check if block period has passed
    if (this.isBlocked) {
      if (now - this.blockStartTime >= this.config.timeWindow) {
        this.isBlocked = false;
        this.callTimes = [];
        console.log(`🔄 ${this.config.componentName}: Loop block expired, allowing calls again`);
      } else {
        return false;
      }
    }

    // Remove old call times outside the time window
    this.callTimes = this.callTimes.filter(time => now - time < this.config.timeWindow);

    // Check if too many calls in the time window
    if (this.callTimes.length >= this.config.maxCalls) {
      this.isBlocked = true;
      this.blockStartTime = now;
      console.error(`🚨 ${this.config.componentName}: Loop detected! Blocking calls for ${this.config.timeWindow}ms`);
      return false;
    }

    return true;
  }

  recordCall(): void {
    if (this.canProceed()) {
      this.callTimes.push(Date.now());
      console.log(`📊 ${this.config.componentName}: Call recorded (${this.callTimes.length}/${this.config.maxCalls})`);
    }
  }

  reset(): void {
    this.callTimes = [];
    this.isBlocked = false;
    this.blockStartTime = 0;
    console.log(`🔄 ${this.config.componentName}: Loop detector reset`);
  }

  getStatus() {
    return {
      componentName: this.config.componentName,
      callCount: this.callTimes.length,
      isBlocked: this.isBlocked,
      timeSinceBlock: this.isBlocked ? Date.now() - this.blockStartTime : 0,
      maxCalls: this.config.maxCalls,
      timeWindow: this.config.timeWindow
    };
  }
}

// Hook to use loop detection in components
export const useLoopDetection = (componentName: string, maxCalls = 5, timeWindow = 5000) => {
  const detector = LoopDetector.getInstance(componentName, maxCalls, timeWindow);

  const canProceed = () => detector.canProceed();
  const recordCall = () => detector.recordCall();
  const reset = () => detector.reset();
  const getStatus = () => detector.getStatus();

  return {
    canProceed,
    recordCall,
    reset,
    getStatus
  };
};

// Utility to check all loop detectors
export const getAllLoopDetectorStatuses = () => {
  const statuses: any[] = [];
  LoopDetector.instances.forEach((detector, componentName) => {
    statuses.push(detector.getStatus());
  });
  return statuses;
};

// Utility to reset all loop detectors
export const resetAllLoopDetectors = () => {
  LoopDetector.instances.forEach((detector) => {
    detector.reset();
  });
  console.log('🔄 All loop detectors reset');
};

// Global loop detection for API calls
export const globalApiLoopDetector = LoopDetector.getInstance('GlobalAPI', 10, 10000);

// Utility to detect startup loops
export const detectStartupLoop = () => {
  let startupCount = 0;
  const maxStartups = 3;
  const startTime = Date.now();
  
  return () => {
    startupCount++;
    const elapsed = Date.now() - startTime;
    
    if (startupCount > maxStartups || elapsed > 30000) { // 30 seconds max
      console.error('🚨 Startup loop detected! App has restarted too many times or taken too long');
      return false;
    }
    
    return true;
  };
};

// Export the main class for advanced usage
export { LoopDetector };
