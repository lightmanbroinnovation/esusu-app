/**
 * Firebase Cloud Messaging Service
 * Handles push notifications and FCM token management
 */
import { FirebaseMessaging } from '../../config/firebase';
import { NotificationService } from '../../services/notificationService';
import { Storage, SECURE_KEYS } from '../utils/secureStorage';
import { Platform, Linking } from 'react-native';

export interface PushNotification {
  title: string;
  body: string;
  data?: any;
  sound?: string;
  badge?: number;
}

export class FirebaseMessagingService {
  private static isInitialized = false;
  private static notificationListeners: (() => void)[] = [];

  /**
   * Initialize Firebase messaging
   */
  static async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('Firebase messaging already initialized');
        return true;
      }

      console.log('🔥 Initializing Firebase messaging...');

      // Request notification permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return false;
      }

      // Get FCM token and register with server
      const tokenRegistered = await NotificationService.registerToken();
      if (!tokenRegistered) {
        console.warn('Failed to register FCM token');
        return false;
      }

      // Setup notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('✅ Firebase messaging initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Firebase messaging:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const granted = await FirebaseMessaging.requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        return false;
      }
      console.log('✅ Notification permission granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Setup notification listeners
   */
  static setupNotificationListeners(): void {
    try {
      // Listen for FCM messages
      const fcmUnsubscribe = FirebaseMessaging.onMessage((payload) => {
        console.log('📨 FCM message received:', payload);
        this.handleFCMessage(payload);
      });

      this.notificationListeners.push(fcmUnsubscribe);

      console.log('✅ Notification listeners setup complete');
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }
  }

  /**
   * Handle FCM messages
   */
  private static handleFCMessage(payload: any): void {
    try {
      // Handle foreground messages
      if (payload.notification) {
        this.showLocalNotification({
          title: payload.notification.title,
          body: payload.notification.body,
          data: payload.data,
        });
      }

      // Update notification count in storage
      this.updateNotificationCount();
    } catch (error) {
      console.error('Error handling FCM message:', error);
    }
  }

  /**
   * Show local notification (for foreground messages)
   */
  static async showLocalNotification(notification: PushNotification): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // On web, show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            data: notification.data,
          });
        }
      } else {
        // On native, React Native Firebase handles notification display automatically
        // You can customize notification behavior here if needed
        console.log('📱 Native notification handled by React Native Firebase');
      }
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  /**
   * Update notification count
   */
  private static async updateNotificationCount(): Promise<void> {
    try {
      const count = await NotificationService.getUnreadCount();
      await Storage.setItem('notification_count', count.toString(), false);
    } catch (error) {
      console.error('Error updating notification count:', error);
    }
  }

  /**
   * Get notification count
   */
  static async getNotificationCount(): Promise<number> {
    try {
      const count = await Storage.getItem('notification_count', false);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  /**
   * Clear notification count
   */
  static async clearNotificationCount(): Promise<void> {
    try {
      await Storage.setItem('notification_count', '0', false);
    } catch (error) {
      console.error('Error clearing notification count:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return Notification.permission === 'granted';
      } else {
        // For native, we'll assume they're enabled if we have a token
        const token = await NotificationService.getStoredToken();
        return token !== null;
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Open notification settings
   */
  static async openNotificationSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  }

  /**
   * Cleanup notification listeners
   */
  static cleanup(): void {
    try {
      this.notificationListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this.notificationListeners = [];
      console.log('🧹 Notification listeners cleaned up');
    } catch (error) {
      console.error('Error cleaning up notification listeners:', error);
    }
  }
}

export default FirebaseMessagingService;
