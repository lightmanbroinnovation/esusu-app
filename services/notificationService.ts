/**
 * Notification Service
 * Handles notification management and API calls
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Storage, SECURE_KEYS } from '../app/utils/secureStorage';
import { ENV } from '../config/environment';
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
   * Register device for push notifications
   */
  static async registerToken(): Promise<boolean> {
    try {
      console.log('🔔 Registering for push notifications...');

      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Get the token
      const expoToken = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      })).data;

      if (!expoToken) {
        console.warn('No push token available');
        return false;
      }

      // Check if token is already registered
      const storedToken = await AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (storedToken === expoToken) {
        console.log('Push token already registered');
        return true;
      }

      // Prepare token data
      const tokenData: NotificationToken = {
        token: expoToken,
        device: Platform.OS,
        platform: 'ReactNative'
      };

      // Register token with server
      const response = await this.saveTokenToServer(tokenData);
      
      if (response) {
        // Store token locally
        await AsyncStorage.setItem(this.TOKEN_STORAGE_KEY, expoToken);
        console.log('✅ Push token registered successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error registering push token:', error);
      return false;
    }
  }

  /**
   * Save push notification token to server
   */
  private static async saveTokenToServer(tokenData: NotificationToken): Promise<boolean> {
    try {
      // Get device info
      const deviceName = Device.modelName || 'Unknown Device';
      const platform = Platform.OS;

      // Save token to storage
      await Storage.setItem(SECURE_KEYS.NOTIFICATION_TOKEN, tokenData.token);

      // Register with server if needed
      if (this.API_BASE_URL) {
        const response = await fetch(`${this.API_BASE_URL}/notifications/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await Storage.getItem(SECURE_KEYS.AUTH_TOKEN)}`,
          },
          body: JSON.stringify({
            token: tokenData.token,
            device: deviceName,
            platform: tokenData.platform,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.warn('Failed to register token with server:', error.message || 'Unknown error');
          // Continue even if server registration fails
        }
      }

      console.log('✅ Push notification token registered successfully');
      return true;
    } catch (error) {
      console.error('Error saving token to server:', error);
      throw ErrorHandler.handleApiError(error, 'save-token');
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
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
    onTokenRefresh?: (token: string) => void
  ): () => void {
    // Listen for foreground notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      onNotification(notification.request.content.data);
    });

    // Listen for notification responses
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      onNotification(response.notification.request.content.data);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }

  /**
   * Clear stored push token
   */
  static async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_STORAGE_KEY);
      console.log('🗑️ Push token cleared');
    } catch (error) {
      console.error('Error clearing push token:', error);
    }
  }

  /**
   * Get stored push token
   */
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Error getting stored push token:', error);
      return null;
    }
  }

  /**
   * Get all notifications
   */
  static async getNotifications(): Promise<Notification[]> {
    try {
      // Implement your API call to get notifications
      // This is a placeholder implementation
      const response = await fetch(`${this.API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${await Storage.getItem(SECURE_KEYS.AUTH_TOKEN)}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      // Implement your API call to mark notification as read
      const response = await fetch(`${this.API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await Storage.getItem(SECURE_KEYS.AUTH_TOKEN)}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<boolean> {
    try {
      // Implement your API call to mark all notifications as read
      const response = await fetch(`${this.API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await Storage.getItem(SECURE_KEYS.AUTH_TOKEN)}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

export default NotificationService;



