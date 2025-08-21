import { forceClearAllData } from '../../services/api';
import { clearAllData as clearAllDataFromCache } from './dataCaching';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility function to clear ALL data stored on the device
 * This can be called from anywhere in the app without logging out
 * Useful for debugging, testing, or when you need to reset the app state
 */
export const clearAllAppData = async (): Promise<void> => {
  try {
    console.log('🧹 Starting complete data clear...');
    
    // Use the comprehensive clear function from api.js
    await forceClearAllData();
    
    // Use the new comprehensive data clearing function as backup
    await clearAllDataFromCache();
    
    // Final check - if anything remains, clear it
    const remainingKeys = await AsyncStorage.getAllKeys();
    if (remainingKeys.length > 0) {
      console.log(`Found ${remainingKeys.length} remaining keys, clearing them...`);
      await AsyncStorage.multiRemove(remainingKeys);
    }
    
    console.log('✅ ALL APP DATA CLEARED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error clearing app data:', error);
    
    // Fallback: try to clear at least AsyncStorage
    try {
      await AsyncStorage.clear();
      console.log('Fallback: AsyncStorage cleared');
    } catch (fallbackError) {
      console.error('Even fallback clear failed:', fallbackError);
    }
  }
};

/**
 * Clear only specific types of data
 * Useful when you want to clear specific data without clearing everything
 */
export const clearSpecificData = async (dataTypes: string[]): Promise<void> => {
  try {
    console.log('🧹 Clearing specific data types:', dataTypes);
    
    const keysToRemove: string[] = [];
    
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter keys based on data types
    for (const dataType of dataTypes) {
      const matchingKeys = allKeys.filter(key => 
        key.toLowerCase().includes(dataType.toLowerCase()) ||
        key.startsWith(`cache_${dataType}`)
      );
      keysToRemove.push(...matchingKeys);
    }
    
    // Remove the filtered keys
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`✅ Cleared ${keysToRemove.length} keys for data types:`, dataTypes);
    } else {
      console.log('No keys found for the specified data types');
    }
    
  } catch (error) {
    console.error('❌ Error clearing specific data:', error);
  }
};

/**
 * Clear cache data only (keeps user data)
 * Useful when you want to refresh data but keep user logged in
 */
export const clearCacheOnly = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing cache data only...');
    
    // Get all cache keys
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`✅ Cleared ${cacheKeys.length} cache keys`);
    } else {
      console.log('No cache keys found');
    }
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

/**
 * Clear user data only (keeps cache)
 * Useful when you want to clear user info but keep cached data
 */
export const clearUserDataOnly = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing user data only...');
    
    const userDataKeys = [
      'auth_token',
      'userId',
      'userData',
      'userPreferences',
      'biometricEnabled',
      'transactionPin',
      'lastLoginTime',
      'sessionData'
    ];
    
    await AsyncStorage.multiRemove(userDataKeys);
    console.log('✅ User data cleared');
    
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
};

/**
 * Clear user data and cache data specifically
 * This targets user-related data that might persist after logout
 */
export const clearUserAndCacheData = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing user and cache data...');
    
    // Import the pattern clearing function
    const { clearDataByPatterns } = await import('./dataCaching');
    
    // Clear data by specific patterns
    await clearDataByPatterns([
      'user',
      'auth',
      'token',
      'cache',
      'settings',
      'contributor',
      'transaction',
      'commission',
      'dashboard',
      'account',
      'bank',
      'settlement',
      'biometric',
      'pin',
      'session',
      'login',
      'logout'
    ]);
    
    // Also clear specific known keys
    const specificKeys = [
      'auth_token',
      'userId',
      'userData',
      'userPhone',
      'isLoggedIn',
      'biometricEnabled',
      'transactionPin',
      'lastLoginTime',
      'sessionData',
      'settings_user',
      'merchantDashboardAccount',
      'transactionHistory',
      'contributors_data',
      'contributor_list_daily',
      'contributor_list_weekly',
      'contributor_list_monthly',
      'settlementAccounts',
      'bankAccounts',
      'commissionData'
    ];
    
    await AsyncStorage.multiRemove(specificKeys);
    console.log('✅ User and cache data cleared');
    
  } catch (error) {
    console.error('❌ Error clearing user and cache data:', error);
  }
};

/**
 * Get information about stored data
 * Useful for debugging and understanding what data is stored
 */
export const getDataInfo = async (): Promise<{
  totalKeys: number;
  cacheKeys: number;
  userDataKeys: number;
  otherKeys: number;
  keyList: string[];
}> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
    const userDataKeys = allKeys.filter(key => 
      key.includes('user') || 
      key.includes('auth') || 
      key.includes('token') ||
      key.includes('pin')
    );
    const otherKeys = allKeys.filter(key => 
      !key.startsWith('cache_') && 
      !key.includes('user') && 
      !key.includes('auth') && 
      !key.includes('token') &&
      !key.includes('pin')
    );
    
    return {
      totalKeys: allKeys.length,
      cacheKeys: cacheKeys.length,
      userDataKeys: userDataKeys.length,
      otherKeys: otherKeys.length,
      keyList: allKeys
    };
    
  } catch (error) {
    console.error('❌ Error getting data info:', error);
    return {
      totalKeys: 0,
      cacheKeys: 0,
      userDataKeys: 0,
      otherKeys: 0,
      keyList: []
    };
  }
}; 