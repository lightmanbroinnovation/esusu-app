/**
 * Secure Storage Utility
 * Provides secure storage for sensitive data using Expo SecureStore
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for secure storage
export const SECURE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  TRANSACTION_PIN: 'transaction_pin',
  BIOMETRIC_KEY: 'biometric_key',
  ENCRYPTION_KEY: 'encryption_key',
} as const;

// Keys for regular AsyncStorage (non-sensitive data)
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  USER_PHONE: 'userPhone',
  IS_LOGGED_IN: 'isLoggedIn',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  NOTIFICATION_COUNT: 'notification_count',
  APP_SETTINGS: 'appSettings',
  THEME: 'theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETE: 'onboardingComplete',
  LAST_SYNC_TIME: 'lastSyncTime',
  USER_PREFERENCES: 'userPreferences',
} as const;

/**
 * Secure storage operations
 */
export class SecureStorage {
  /**
   * Store sensitive data securely
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log(`✅ Securely stored: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to store securely: ${key}`, error);
      throw new Error(`Failed to store ${key} securely`);
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error(`❌ Failed to retrieve securely: ${key}`, error);
      return null;
    }
  }

  /**
   * Remove sensitive data securely
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`✅ Securely removed: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to remove securely: ${key}`, error);
    }
  }

  /**
   * Check if secure item exists
   */
  static async hasItem(key: string): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value !== null;
    } catch (error) {
      console.error(`❌ Failed to check secure item: ${key}`, error);
      return false;
    }
  }
}

/**
 * Regular storage operations (for non-sensitive data)
 */
export class RegularStorage {
  /**
   * Store non-sensitive data
   */
  static async setItem(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      console.log(`✅ Stored: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to store: ${key}`, error);
      throw new Error(`Failed to store ${key}`);
    }
  }

  /**
   * Retrieve non-sensitive data
   */
  static async getItem(key: string): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`❌ Failed to retrieve: ${key}`, error);
      return null;
    }
  }

  /**
   * Remove non-sensitive data
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`✅ Removed: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to remove: ${key}`, error);
    }
  }

  /**
   * Check if item exists
   */
  static async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`❌ Failed to check item: ${key}`, error);
      return false;
    }
  }
}

/**
 * Unified storage interface
 */
export class Storage {
  /**
   * Store data (automatically chooses secure or regular storage)
   */
  static async setItem(key: string, value: any, secure: boolean = false): Promise<void> {
    if (secure) {
      await SecureStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } else {
      await RegularStorage.setItem(key, value);
    }
  }

  /**
   * Retrieve data (automatically chooses secure or regular storage)
   */
  static async getItem(key: string, secure: boolean = false): Promise<any> {
    if (secure) {
      return await SecureStorage.getItem(key);
    } else {
      return await RegularStorage.getItem(key);
    }
  }

  /**
   * Remove data (automatically chooses secure or regular storage)
   */
  static async removeItem(key: string, secure: boolean = false): Promise<void> {
    if (secure) {
      await SecureStorage.removeItem(key);
    } else {
      await RegularStorage.removeItem(key);
    }
  }

  /**
   * Clear all data (both secure and regular)
   */
  static async clearAll(): Promise<void> {
    try {
      console.log('🧹 Clearing all storage...');
      
      // Clear secure storage
      for (const key of Object.values(SECURE_KEYS)) {
        await SecureStorage.removeItem(key);
      }
      
      // Clear regular storage
      await AsyncStorage.clear();
      
      console.log('✅ All storage cleared');
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get storage info for debugging
   */
  static async getStorageInfo(): Promise<{
    secureItems: string[];
    regularItems: string[];
    totalSize: number;
  }> {
    try {
      const secureItems: string[] = [];
      const regularItems = await AsyncStorage.getAllKeys();
      
      // Check which secure items exist
      for (const key of Object.values(SECURE_KEYS)) {
        if (await SecureStorage.hasItem(key)) {
          secureItems.push(key);
        }
      }
      
      return {
        secureItems,
        regularItems,
        totalSize: secureItems.length + regularItems.length,
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return { secureItems: [], regularItems: [], totalSize: 0 };
    }
  }
}

export default Storage;
