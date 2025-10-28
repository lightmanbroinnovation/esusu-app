/**
 * Performance Optimization Utilities
 * Tools for optimizing React Native app performance
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce, throttle } from 'lodash';

/**
 * Custom hook for debounced API calls
 */
export const useDebouncedApiCall = <T>(
  apiCall: (...args: any[]) => Promise<T>,
  delay: number = 500
) => {
  const debouncedCall = useMemo(
    () => debounce(apiCall, delay),
    [apiCall, delay]
  );

  return useCallback(debouncedCall, [debouncedCall]);
};

/**
 * Custom hook for throttled API calls
 */
export const useThrottledApiCall = <T>(
  apiCall: (...args: any[]) => Promise<T>,
  delay: number = 1000
) => {
  const throttledCall = useMemo(
    () => throttle(apiCall, delay),
    [apiCall, delay]
  );

  return useCallback(throttledCall, [throttledCall]);
};

/**
 * Custom hook for memoized expensive calculations
 */
export const useExpensiveCalculation = <T>(
  calculation: () => T,
  dependencies: any[]
): T => {
  return useMemo(calculation, dependencies);
};

/**
 * Custom hook for preventing unnecessary re-renders
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    []
  );
};

/**
 * Custom hook for API call optimization
 */
export const useApiOptimizer = () => {
  const activeCalls = useRef(new Set<string>());
  const callHistory = useRef(new Map<string, number>());

  const canMakeCall = useCallback((endpoint: string, cooldown: number = 1000): boolean => {
    const now = Date.now();
    const lastCall = callHistory.current.get(endpoint);
    
    if (lastCall && (now - lastCall) < cooldown) {
      return false;
    }
    
    return true;
  }, []);

  const recordCall = useCallback((endpoint: string): void => {
    callHistory.current.set(endpoint, Date.now());
  }, []);

  const isCallActive = useCallback((endpoint: string): boolean => {
    return activeCalls.current.has(endpoint);
  }, []);

  const setCallActive = useCallback((endpoint: string, active: boolean): void => {
    if (active) {
      activeCalls.current.add(endpoint);
    } else {
      activeCalls.current.delete(endpoint);
    }
  }, []);

  return {
    canMakeCall,
    recordCall,
    isCallActive,
    setCallActive
  };
};

/**
 * Custom hook for image optimization
 */
export const useImageOptimizer = () => {
  const imageCache = useRef(new Map<string, string>());

  const getOptimizedImageUrl = useCallback((
    originalUrl: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string => {
    if (!originalUrl) return originalUrl;

    // Check cache first
    const cacheKey = `${originalUrl}_${width}_${height}_${quality}`;
    if (imageCache.current.has(cacheKey)) {
      return imageCache.current.get(cacheKey)!;
    }

    // For Cloudinary URLs, add transformation parameters
    if (originalUrl.includes('cloudinary.com')) {
      const parts = originalUrl.split('/upload/');
      if (parts.length === 2) {
        let transformations = [];
        
        if (width) transformations.push(`w_${width}`);
        if (height) transformations.push(`h_${height}`);
        transformations.push(`q_${quality}`);
        transformations.push('f_auto'); // Auto format
        
        const optimizedUrl = parts[0] + '/upload/' + transformations.join(',') + '/' + parts[1];
        imageCache.current.set(cacheKey, optimizedUrl);
        return optimizedUrl;
      }
    }

    return originalUrl;
  }, []);

  const clearImageCache = useCallback((): void => {
    imageCache.current.clear();
  }, []);

  return {
    getOptimizedImageUrl,
    clearImageCache
  };
};

/**
 * Custom hook for list optimization
 */
export const useListOptimizer = <T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string,
  options: {
    initialNumToRender?: number;
    maxToRenderPerBatch?: number;
    windowSize?: number;
    removeClippedSubviews?: boolean;
  } = {}
) => {
  const {
    initialNumToRender = 10,
    maxToRenderPerBatch = 10,
    windowSize = 10,
    removeClippedSubviews = true
  } = options;

  const optimizedProps = useMemo(() => ({
    initialNumToRender,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews,
    keyExtractor,
    getItemLayout: undefined, // Let FlatList calculate
    onEndReachedThreshold: 0.5,
  }), [initialNumToRender, maxToRenderPerBatch, windowSize, removeClippedSubviews, keyExtractor]);

  return optimizedProps;
};

/**
 * Custom hook for memory optimization
 */
export const useMemoryOptimizer = () => {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void): void => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const cleanup = useCallback((): void => {
    cleanupFunctions.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup function error:', error);
      }
    });
    cleanupFunctions.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    addCleanup,
    cleanup
  };
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (__DEV__) {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times (${timeSinceLastRender}ms since last render)`);
    }
  });

  return {
    renderCount: renderCount.current
  };
};

export default {
  useDebouncedApiCall,
  useThrottledApiCall,
  useExpensiveCalculation,
  useStableCallback,
  useApiOptimizer,
  useImageOptimizer,
  useListOptimizer,
  useMemoryOptimizer,
  usePerformanceMonitor
};



