import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache expiration time (in milliseconds)
const CACHE_EXPIRY = 1000 * 60 * 10; // 10 minutes

/**
 * Get data with caching support
 * @param key The cache key
 * @param fetchFunction The function to fetch fresh data
 * @param expiryTime Optional custom expiry time in milliseconds
 */
export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  expiryTime: number = CACHE_EXPIRY
): Promise<T> {
  try {
    // Try to get from cache first
    const cachedData = await AsyncStorage.getItem(`cache_${key}`);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const isExpired = Date.now() - timestamp > expiryTime;
      
      // Return cached data if not expired
      if (!isExpired) {
        console.log(`Using cached data for ${key}`);
        return data;
      }
    }
    
    // If cache doesn't exist or is expired, fetch fresh data
    console.log(`Fetching fresh data for ${key}`);
    const freshData = await fetchFunction();
    
    // Save to cache
    await AsyncStorage.setItem(
      `cache_${key}`,
      JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      })
    );
    
    return freshData;
  } catch (error) {
    console.error('Cache error:', error);
    // If there's an error with caching, fall back to fetching fresh data
    return fetchFunction();
  }
}

/**
 * Invalidate a cached item
 * @param key The cache key to invalidate
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`cache_${key}`);
    console.log(`Cache invalidated for ${key}`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} cached items`);
    }
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
}

/**
 * Pre-fetch and cache frequently used data
 * @param keyFetchPairs Object with keys and their fetch functions
 */
export async function prefetchData(
  keyFetchPairs: Record<string, () => Promise<any>>
): Promise<void> {
  try {
    const fetchPromises = Object.entries(keyFetchPairs).map(
      async ([key, fetchFunction]) => {
        try {
          await getCachedData(key, fetchFunction);
        } catch (error) {
          console.error(`Error prefetching ${key}:`, error);
        }
      }
    );
    
    await Promise.all(fetchPromises);
    console.log('Prefetching completed');
  } catch (error) {
    console.error('Error during prefetch:', error);
  }
} 