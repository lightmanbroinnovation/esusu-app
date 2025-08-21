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
 * Clear ALL data including cache and non-cache keys
 * This is a nuclear option that clears everything
 */
export async function clearAllData(): Promise<void> {
  try {
    console.log('🧹 Starting comprehensive data clear...');
    
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log(`Found ${allKeys.length} total keys to clear`);
    
    if (allKeys.length > 0) {
      // Clear everything
      await AsyncStorage.multiRemove(allKeys);
      console.log(`✅ Cleared all ${allKeys.length} keys`);
    }
    
    // Double-check that everything is cleared
    const remainingKeys = await AsyncStorage.getAllKeys();
    if (remainingKeys.length > 0) {
      console.log(`⚠️ Found ${remainingKeys.length} remaining keys, clearing them...`);
      await AsyncStorage.multiRemove(remainingKeys);
      console.log('✅ Remaining keys cleared');
    }
    
    console.log('🎉 ALL DATA CLEARED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error clearing all data:', error);
    
    // Fallback: try to clear everything again
    try {
      await AsyncStorage.clear();
      console.log('Fallback: AsyncStorage.clear() completed');
    } catch (fallbackError) {
      console.error('Even fallback clear failed:', fallbackError);
    }
  }
}

/**
 * Clear specific types of data with pattern matching
 * @param patterns Array of patterns to match against keys
 */
export async function clearDataByPatterns(patterns: string[]): Promise<void> {
  try {
    console.log('🧹 Clearing data by patterns:', patterns);
    
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove: string[] = [];
    
    for (const pattern of patterns) {
      const matchingKeys = allKeys.filter(key => 
        key.toLowerCase().includes(pattern.toLowerCase()) ||
        key.startsWith(pattern) ||
        key.endsWith(pattern)
      );
      keysToRemove.push(...matchingKeys);
    }
    
    // Remove duplicates
    const uniqueKeys = [...new Set(keysToRemove)];
    
    if (uniqueKeys.length > 0) {
      await AsyncStorage.multiRemove(uniqueKeys);
      console.log(`✅ Cleared ${uniqueKeys.length} keys matching patterns:`, patterns);
    } else {
      console.log('No keys found matching the patterns');
    }
    
  } catch (error) {
    console.error('❌ Error clearing data by patterns:', error);
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