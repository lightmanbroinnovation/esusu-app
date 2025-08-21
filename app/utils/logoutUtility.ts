import { forceClearAllData } from '../../services/api';
import { clearAllData, clearDataByPatterns } from './dataCaching';
import { store } from '../store/store';
import { logout as logoutUser } from '../store/slices/userSlice';
import { clearNotifications } from '../store/slices/notificationSlice';
import { resetTheme } from '../store/slices/themeSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

/**
 * Comprehensive logout utility that clears ALL data and resets app state
 * This function will:
 * 1. Clear all AsyncStorage and caches
 * 2. Clear Redux state
 * 3. Clear any other storage mechanisms
 * 4. Navigate to login screen
 * 5. Optionally reload the app
 */
export const performCompleteLogout = async (reloadApp: boolean = false) => {
  try {
    console.log('🚀 Starting complete logout process...');
    
    // Step 1: Clear all device storage and caches
    await forceClearAllData();
    
    // Step 2: Clear Redux state
    store.dispatch(logoutUser());
    store.dispatch(clearNotifications());
    
    // Safely dispatch resetTheme with error handling
    try {
      store.dispatch(resetTheme());
    } catch (themeError) {
      console.log('Theme reset failed (non-critical):', themeError);
    }
    
    // Step 3: Use comprehensive data clearing as backup
    try {
      await clearAllData();
      console.log('✓ Comprehensive data clear completed');
    } catch (e) {
      console.log('Error in comprehensive data clear:', e);
    }
    
    // Step 4: Clear any potential session storage (web)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.clear();
        console.log('✓ Session storage cleared');
      } catch (e) {
        console.log('Session storage clear failed:', e);
      }
    }
    
    // Step 5: Clear any potential local storage (web)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
        console.log('✓ Local storage cleared');
      } catch (e) {
        console.log('Local storage clear failed:', e);
      }
    }
    
    // Step 6: Clear any potential cookies (web)
    if (typeof window !== 'undefined' && document.cookie) {
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
        console.log('✓ Cookies cleared');
      } catch (e) {
        console.log('Cookie clear failed:', e);
      }
    }
    
    // Step 7: Clear any potential indexedDB (web)
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
        console.log('✓ IndexedDB cleared');
      } catch (e) {
        console.log('IndexedDB clear failed:', e);
      }
    }
    
    // Step 8: Clear any potential service worker cache (web)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('✓ Service workers unregistered');
      } catch (e) {
        console.log('Service worker clear failed:', e);
      }
    }
    
    // Step 9: Final check - clear any remaining keys
    try {
      const remainingKeys = await AsyncStorage.getAllKeys();
      if (remainingKeys.length > 0) {
        console.log(`Found ${remainingKeys.length} remaining keys after logout, clearing them...`);
        await AsyncStorage.multiRemove(remainingKeys);
        console.log('✓ Final cleanup completed');
      }
    } catch (e) {
      console.log('Final cleanup failed:', e);
    }
    
    // Step 10: Navigate to login screen
    console.log('Navigating to login screen...');
    router.replace('/login');
    
    // Step 11: Optionally reload the app to clear all in-memory state
    if (reloadApp) {
      console.log('Reloading app to clear in-memory state...');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        } else {
          // For React Native, you might need to use a different approach
          // This could involve restarting the app or using a library like react-native-restart
          console.log('App reload requested (may need manual restart on mobile)');
        }
      }, 1000);
    }
    
    console.log('🎉 COMPLETE LOGOUT SUCCESSFUL!');
    
  } catch (error) {
    console.error('❌ Error during complete logout:', error);
    
    // Fallback: try to clear at least the basics
    try {
      await AsyncStorage.clear();
      store.dispatch(logoutUser());
      router.replace('/login');
      console.log('Fallback logout completed');
    } catch (fallbackError) {
      console.error('Even fallback logout failed:', fallbackError);
    }
  }
};

/**
 * Quick logout utility for normal logout scenarios
 * Uses the enhanced logoutUser function from api.js
 */
export const performQuickLogout = async () => {
  try {
    console.log('🔄 Performing quick logout...');
    
    // Use the enhanced logoutUser function
    const { logoutUser } = await import('../../services/api');
    await logoutUser();
    
    // Clear Redux state
    store.dispatch(logoutUser());
    store.dispatch(clearNotifications());
    
    // Safely dispatch resetTheme with error handling
    try {
      store.dispatch(resetTheme());
    } catch (themeError) {
      console.log('Theme reset failed (non-critical):', themeError);
    }
    
    // Navigate to login
    router.replace('/login');
    
    console.log('✅ Quick logout completed');
    
  } catch (error) {
    console.error('❌ Quick logout failed:', error);
    
    // Fallback
    try {
      await AsyncStorage.clear();
      store.dispatch(logoutUser());
      router.replace('/login');
    } catch (fallbackError) {
      console.error('Fallback logout failed:', fallbackError);
    }
  }
};

/**
 * Force logout utility that bypasses backend logout
 * Useful when backend is unavailable or logout fails
 */
export const performForceLogout = async () => {
  try {
    console.log('💥 Performing force logout (bypassing backend)...');
    
    // Clear all data without calling backend
    await forceClearAllData();
    
    // Clear Redux state
    store.dispatch(logoutUser());
    store.dispatch(clearNotifications());
    
    // Safely dispatch resetTheme with error handling
    try {
      store.dispatch(resetTheme());
    } catch (themeError) {
      console.log('Theme reset failed (non-critical):', themeError);
    }
    
    // Navigate to login
    router.replace('/login');
    
    console.log('✅ Force logout completed');
    
  } catch (error) {
    console.error('❌ Force logout failed:', error);
    
    // Last resort fallback
    try {
      await AsyncStorage.clear();
      store.dispatch(logoutUser());
      router.replace('/login');
    } catch (fallbackError) {
      console.error('Last resort logout failed:', fallbackError);
    }
  }
};

/**
 * Logout with confirmation dialog
 * Useful for settings screen logout
 */
export const performLogoutWithConfirmation = async (
  showConfirmation: () => Promise<boolean>
) => {
  try {
    const confirmed = await showConfirmation();
    if (confirmed) {
      await performSoftLogout();
    }
  } catch (error) {
    console.error('Logout with confirmation failed:', error);
  }
};

/**
 * Soft logout - clears user session but keeps cache
 * Used for regular logout from settings page
 */
export const performSoftLogout = async () => {
  try {
    console.log('🔄 Performing soft logout (keeping cache)...');
    
    // Clear only user authentication data
    await AsyncStorage.multiRemove([
      'auth_token',
      'userPhone',
      'userId',
      'isLoggedIn',
      'userDetails',
      'userData',
      'accountData',
      'dashboardData',
      'commissionData'
    ]);
    
    // Clear Redux state
    store.dispatch(logoutUser());
    store.dispatch(clearNotifications());
    
    // Safely dispatch resetTheme with error handling
    try {
      store.dispatch(resetTheme());
    } catch (themeError) {
      console.log('Theme reset failed (non-critical):', themeError);
    }
    
    // Navigate to passcode screen (not login)
    router.replace('/login/passcode');
    
    console.log('✅ Soft logout completed - cache preserved');
    
  } catch (error) {
    console.error('❌ Soft logout failed:', error);
    
    // Fallback
    try {
      store.dispatch(logoutUser());
      router.replace('/login/passcode');
    } catch (fallbackError) {
      console.error('Fallback soft logout failed:', fallbackError);
    }
  }
};

/**
 * Hard logout - clears everything including cache
 * Used for switch account functionality
 */
export const performHardLogout = async () => {
  try {
    console.log('💥 Performing hard logout (clearing everything)...');
    
    // Step 1: Clear all device storage and caches
    await forceClearAllData();
    
    // Step 2: Clear Redux state
    store.dispatch(logoutUser());
    store.dispatch(clearNotifications());
    
    // Safely dispatch resetTheme with error handling
    try {
      store.dispatch(resetTheme());
    } catch (themeError) {
      console.log('Theme reset failed (non-critical):', themeError);
    }
    
    // Step 3: Use comprehensive data clearing
    try {
      await clearAllData();
      console.log('✓ Comprehensive data clear completed');
    } catch (e) {
      console.log('Error in comprehensive data clear:', e);
    }
    
    // Step 4: Clear any potential session storage (web)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.clear();
        console.log('✓ Session storage cleared');
      } catch (e) {
        console.log('Session storage clear failed:', e);
      }
    }
    
    // Step 5: Clear any potential local storage (web)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
        console.log('✓ Local storage cleared');
      } catch (e) {
        console.log('Local storage clear failed:', e);
      }
    }
    
    // Step 6: Final check - clear any remaining AsyncStorage keys
    try {
      const remainingKeys = await AsyncStorage.getAllKeys();
      if (remainingKeys.length > 0) {
        console.log(`Found ${remainingKeys.length} remaining keys, clearing them...`);
        await AsyncStorage.multiRemove(remainingKeys);
        console.log('✓ Final cleanup completed');
      }
    } catch (e) {
      console.log('Final cleanup failed:', e);
    }
    
    // Step 7: Navigate to login index page
    console.log('🎉 HARD LOGOUT SUCCESSFUL - Everything cleared!');
    
    // Small delay to ensure all cleanup is complete before navigation
    setTimeout(() => {
      console.log('Navigating to login index page...');
      try {
        router.replace('/login');
        console.log('✅ Navigation to login page successful');
      } catch (navError) {
        console.error('❌ Navigation failed:', navError);
        // Try alternative navigation method
        try {
          router.push('/login');
          console.log('✅ Alternative navigation successful');
        } catch (altNavError) {
          console.error('❌ Alternative navigation also failed:', altNavError);
        }
      }
    }, 100);
    
  } catch (error) {
    console.error('❌ Error during hard logout:', error);
    
    // Fallback: try to clear at least the basics
    try {
      await AsyncStorage.clear();
      store.dispatch(logoutUser());
      router.replace('/login');
      console.log('Fallback hard logout completed');
    } catch (fallbackError) {
      console.error('Even fallback hard logout failed:', fallbackError);
    }
  }
}; 