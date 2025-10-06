/**
 * Notification Service
 * Handles Firebase token management and notification API calls
 */

import { Storage, SECURE_KEYS } from '../app/utils/secureStorage';
import { ENV } from '../config/environment';
import { FirebaseMessaging } from '../config/firebase';
import { ErrorHandler, ErrorType } from '../app/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface Notification {
  _id: string;
  subject: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
}

export interface NotificationToken {
  token: string;
  device: string;
  platform: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
}

export class NotificationService {
  private static readonly API_BASE_URL = ENV.API_BASE_URL;
  private static readonly TOKEN_STORAGE_KEY = 'fcm_token';

  /**
   * Get FCM token and register with server
   */
  static async registerToken(): Promise<boolean> {
    try {
      console.log('🔔 Registering FCM token...');

      // Get FCM token for all platforms
      const fcmToken = await FirebaseMessaging.getToken();
      if (!fcmToken) {
        console.warn('No FCM token available');
        return false;
      }

      // Check if token is already registered
      const storedToken = await AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (storedToken === fcmToken) {
        console.log('FCM token already registered');
        return true;
      }

      // Prepare token data
      const tokenData: NotificationToken = {
        token: fcmToken,
        device: Platform.OS,
        platform: Platform.OS === 'web' ? 'FirebaseWeb' : 'FirebaseNative'
      };

      // Register token with server
      const response = await this.saveTokenToServer(tokenData);
      
      if (response) {
        // Store token locally
        await AsyncStorage.setItem(this.TOKEN_STORAGE_KEY, fcmToken);
        console.log('✅ FCM token registered successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
      return false;
    }
  }

  /**
   * Save FCM token to server
   */
  private static async saveTokenToServer(tokenData: NotificationToken): Promise<boolean> {
    try {
      const authToken = await Storage.getItem(SECURE_KEYS.AUTH_TOKEN, true);
      
      const response = await fetch(`${this.API_BASE_URL}/notifications/save-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(tokenData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Token registration response:', result);
      
      return result.success || result.status === 'Success';
    } catch (error) {
      console.error('Error saving token to server:', error);
      throw ErrorHandler.handleApiError(error, 'save-token');
    }
  }

  /**
   * Get all notifications for the merchant
   */
  static async getNotifications(): Promise<Notification[]> {
    try {
      console.log('🔔 Fetching notifications...');

      const authToken = await Storage.getItem(SECURE_KEYS.AUTH_TOKEN, true);
      
      const response = await fetch(`${this.API_BASE_URL}/notifications/merchants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: NotificationResponse = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        console.log(`✅ Fetched ${result.data.length} notifications`);
        return result.data;
      } else {
        console.warn('Invalid notification response format');
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw ErrorHandler.handleApiError(error, 'get-notifications');
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const authToken = await Storage.getItem(SECURE_KEYS.AUTH_TOKEN, true);
      
      const response = await fetch(`${this.API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success || result.status === 'Success';
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<boolean> {
    try {
      const authToken = await Storage.getItem(SECURE_KEYS.AUTH_TOKEN, true);
      
      const response = await fetch(`${this.API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success || result.status === 'Success';
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(notification => !notification.isRead).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      // Use FCM for all platforms now
      const hasPermission = await FirebaseMessaging.requestPermission();

      if (hasPermission) {
        // Register token after getting permission
        await this.registerToken();
      }

      return hasPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Setup notification listeners
   */
  static setupNotificationListeners(
    onNotification: (notification: any) => void,
    onTokenRefresh: (token: string) => void
  ): () => void {
    // Listen for foreground messages
    const unsubscribeMessage = FirebaseMessaging.onMessage((payload) => {
      console.log('📱 Foreground notification received:', payload);
      onNotification(payload);
    });

    // Listen for token refresh
    const handleTokenRefresh = async () => {
      try {
        const newToken = await FirebaseMessaging.getToken();
        if (newToken) {
          console.log('🔄 FCM token refreshed:', newToken);
          await this.registerToken();
          onTokenRefresh(newToken);
        }
      } catch (error) {
        console.error('Error handling token refresh:', error);
      }
    };

    // Return cleanup function
    return () => {
      unsubscribeMessage();
    };
  }

  /**
   * Clear stored FCM token
   */
  static async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_STORAGE_KEY);
      console.log('🗑️ FCM token cleared');
    } catch (error) {
      console.error('Error clearing FCM token:', error);
    }
  }

  /**
   * Get stored FCM token
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Error getting stored FCM token:', error);
      return null;
    }
  }
}

export default NotificationService;
