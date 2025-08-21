import { useRef, useCallback } from 'react';
import { useState } from 'react';

// Data fetching guard to prevent infinite loops
export const useDataFetchGuard = (maxCalls: number = 3, cooldownMs: number = 2000) => {
  const callCount = useRef(0);
  const lastCallTime = useRef(0);
  const isBlocked = useRef(false);
  const hasInitialized = useRef(false);

  const canFetch = useCallback(() => {
    const now = Date.now();
    
    // If already blocked, check if cooldown period has passed
    if (isBlocked.current) {
      if (now - lastCallTime.current >= cooldownMs) {
        isBlocked.current = false;
        callCount.current = 0;
        console.log('🔄 Data fetch guard: Cooldown period ended, allowing fetches again');
      } else {
        console.warn('🚨 Data fetch guard: Still in cooldown period, blocking fetch');
        return false;
      }
    }

    // Check if too many calls in short time
    if (callCount.current >= maxCalls) {
      console.error('🚨 Data fetch guard: Maximum calls reached, blocking fetches');
      isBlocked.current = true;
      lastCallTime.current = now;
      return false;
    }

    // Check minimum interval between calls
    if (lastCallTime.current > 0 && (now - lastCallTime.current) < 500) {
      console.warn('🚨 Data fetch guard: Calls too frequent, blocking fetch');
      return false;
    }

    return true;
  }, [maxCalls, cooldownMs]);

  const recordFetch = useCallback(() => {
    const now = Date.now();
    callCount.current++;
    lastCallTime.current = now;
    
    console.log(`📊 Data fetch guard: Recorded fetch #${callCount.current}`);
  }, []);

  const resetGuard = useCallback(() => {
    callCount.current = 0;
    lastCallTime.current = 0;
    isBlocked.current = false;
    hasInitialized.current = false;
    console.log('🔄 Data fetch guard: Reset');
  }, []);

  const markInitialized = useCallback(() => {
    hasInitialized.current = true;
    console.log('✅ Data fetch guard: Marked as initialized');
  }, []);

  const isInitialized = useCallback(() => {
    return hasInitialized.current;
  }, []);

  return {
    canFetch,
    recordFetch,
    resetGuard,
    markInitialized,
    isInitialized,
    getStatus: () => ({
      callCount: callCount.current,
      isBlocked: isBlocked.current,
      timeSinceLastCall: lastCallTime.current > 0 ? Date.now() - lastCallTime.current : 0,
      hasInitialized: hasInitialized.current
    })
  };
};

// Hook to prevent excessive re-renders during data fetching
export const useRenderGuard = (componentName: string, maxRenders: number = 10) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const isExcessive = useRef(false);

  const checkRender = useCallback(() => {
    const now = Date.now();
    renderCount.current++;
    
    // Check render frequency
    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = now - lastRenderTime.current;
      if (timeSinceLastRender < 100) { // Less than 100ms between renders
        console.warn(`🚨 ${componentName}: Rapid re-renders detected (${timeSinceLastRender}ms)`);
      }
    }
    
    // Check if too many renders
    if (renderCount.current > maxRenders) {
      if (!isExcessive.current) {
        console.error(`🚨 ${componentName}: Excessive renders detected (${renderCount.current})`);
        isExcessive.current = true;
      }
      return false;
    }
    
    lastRenderTime.current = now;
    return true;
  }, [componentName, maxRenders]);

  const resetRenderCount = useCallback(() => {
    renderCount.current = 0;
    isExcessive.current = false;
    console.log(`🔄 ${componentName}: Render count reset`);
  }, [componentName]);

  return {
    checkRender,
    resetRenderCount,
    getRenderCount: () => renderCount.current
  };
};

// Hook to manage data fetching state and prevent loops
export const useDataFetchState = (initialLoading = true) => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const fetchGuard = useDataFetchGuard();

  const setLoadingSafe = useCallback((value: boolean) => {
    if (fetchGuard.canFetch()) {
      setLoading(value);
    }
  }, [fetchGuard]);

  const setErrorSafe = useCallback((value: string | null) => {
    if (fetchGuard.canFetch()) {
      setError(value);
    }
  }, [fetchGuard]);

  const setDataSafe = useCallback((value: any) => {
    if (fetchGuard.canFetch()) {
      setData(value);
      fetchGuard.markInitialized();
    }
  }, [fetchGuard]);

  const fetchData = useCallback(async (fetchFunction: () => Promise<any>, force = false) => {
    if (!force && !fetchGuard.canFetch()) {
      console.warn('🚨 Data fetch blocked by guard');
      return null;
    }

    try {
      fetchGuard.recordFetch();
      setLoadingSafe(true);
      setErrorSafe(null);
      
      const result = await fetchFunction();
      setDataSafe(result);
      setLastFetchTime(Date.now());
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setErrorSafe(errorMessage);
      console.error('Data fetch error:', err);
      return null;
    } finally {
      setLoadingSafe(false);
    }
  }, [fetchGuard, setLoadingSafe, setErrorSafe, setDataSafe]);

  const resetState = useCallback(() => {
    fetchGuard.resetGuard();
    setLoading(false);
    setError(null);
    setData(null);
    setLastFetchTime(0);
  }, [fetchGuard]);

  return {
    loading,
    error,
    data,
    lastFetchTime,
    fetchData,
    resetState,
    fetchGuard,
    setLoading: setLoadingSafe,
    setError: setErrorSafe,
    setData: setDataSafe
  };
};

// Utility to create a debounced fetch function
export const createDebouncedFetch = (fetchFunction: () => Promise<any>, delayMs: number = 1000) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fetchFunction();
          resolve(result);
        } catch (error) {
          resolve(null);
        }
      }, delayMs);
    });
  };
};
