import { useEffect, useRef } from 'react';

// Startup debugging utility to prevent infinite loops
export const useStartupGuard = (componentName: string, maxRenders: number = 5) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  
  useEffect(() => {
    const now = Date.now();
    renderCount.current++;
    
    // Log render frequency
    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = now - lastRenderTime.current;
      if (timeSinceLastRender < 100) { // Less than 100ms between renders
        console.warn(`🚨 ${componentName}: Rapid re-renders detected (${timeSinceLastRender}ms)`);
      }
    }
    
    // Warn if too many renders
    if (renderCount.current > maxRenders) {
      console.error(`🚨 ${componentName}: Excessive renders detected (${renderCount.current})`);
    }
    
    lastRenderTime.current = now;
    
    return () => {
      // Cleanup
    };
  });
  
  // Reset counter on unmount
  useEffect(() => {
    return () => {
      renderCount.current = 0;
      lastRenderTime.current = 0;
    };
  }, []);
};

// Utility to prevent excessive API calls
export const useApiCallGuard = (apiFunction: () => Promise<any>, maxCalls: number = 3, cooldownMs: number = 1000) => {
  const callCount = useRef(0);
  const lastCallTime = useRef(0);
  const isBlocked = useRef(false);
  
  const guardedApiCall = async () => {
    const now = Date.now();
    
    // Check if we're blocked
    if (isBlocked.current) {
      console.warn('🚨 API call blocked: Too many calls in short time');
      return null;
    }
    
    // Check cooldown
    if (now - lastCallTime.current < cooldownMs) {
      console.warn('🚨 API call blocked: Cooldown period active');
      return null;
    }
    
    // Check call limit
    if (callCount.current >= maxCalls) {
      console.error('🚨 API call blocked: Maximum calls reached');
      isBlocked.current = true;
      
      // Reset after cooldown
      setTimeout(() => {
        isBlocked.current = false;
        callCount.current = 0;
      }, cooldownMs);
      
      return null;
    }
    
    // Allow the call
    callCount.current++;
    lastCallTime.current = now;
    
    try {
      return await apiFunction();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };
  
  return guardedApiCall;
};

// Utility to detect startup loops
export const detectStartupLoop = () => {
  let startupCount = 0;
  const maxStartups = 3;
  
  return () => {
    startupCount++;
    if (startupCount > maxStartups) {
      console.error('🚨 Startup loop detected! App has restarted too many times');
      return false;
    }
    return true;
  };
};
