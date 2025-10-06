/**
 * Firebase Configuration
 * Firebase setup for push notifications and analytics
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';
// For native platforms, we'll use React Native Firebase
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { ENV } from './environment';

// Firebase configuration
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY || "your-api-key",
  authDomain: ENV.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: ENV.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: ENV.FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: ENV.FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging (web and native)
let webMessaging: any = null;
if (Platform.OS === 'web') {
  if (typeof window !== 'undefined') {
    try {
      webMessaging = getMessaging(app);
    } catch (e) {
      // Messaging not supported in this environment/browser
      webMessaging = null;
    }
  }
}

// Initialize Analytics (only in browser)
let analytics: any = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, webMessaging as messaging, analytics };

// Firebase Cloud Messaging utilities
export class FirebaseMessaging {
  /**
   * Get FCM token for the current device
   */
  static async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (!webMessaging) {
          console.warn('Firebase messaging not available');
          return null;
        }

        // Ensure Messaging is supported in this browser (web only)
        if (typeof window === 'undefined' || !(await isSupported().catch(() => Promise.resolve(false)))) {
          console.warn('Firebase messaging not supported in this environment');
          return null;
        }

        // Register service worker (required for background messages on web)
        let swRegistration: ServiceWorkerRegistration | undefined;
        if ('serviceWorker' in navigator) {
          swRegistration =
            (await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')) ||
            (await navigator.serviceWorker.register('/firebase-messaging-sw.js'));
        }

        const token = await getToken(webMessaging, {
          vapidKey: ENV.FIREBASE_VAPID_KEY || 'your-vapid-key',
          serviceWorkerRegistration: swRegistration as any,
        });

        if (token) {
          console.log('FCM Token:', token);
          return token;
        } else {
          console.log('No registration token available.');
          return null;
        }
      } else {
        // Native platforms use React Native Firebase
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          console.log('FCM Token:', token);
          return token;
        } else {
          console.warn('Notification permission not granted');
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Listen for foreground messages
   */
  static onMessage(callback: (payload: any) => void): () => void {
    if (Platform.OS === 'web') {
      if (!webMessaging) {
        console.warn('Firebase messaging not available');
        return () => {};
      }

      return onMessage(webMessaging, callback);
    } else {
      // Native platforms use React Native Firebase
      const unsubscribe = messaging().onMessage(callback);
      return () => unsubscribe();
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (!webMessaging) {
          console.warn('Firebase messaging not available');
          return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } else {
        // Native platforms use React Native Firebase
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        return enabled;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
}

export default app;
