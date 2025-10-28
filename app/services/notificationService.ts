import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { store } from '../store/store';
import { addNotification, setPermission, setToken } from '../store/slices/notificationSlice';
import Constants from 'expo-constants';
import * as Application from 'expo-application';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0072CE',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      store.dispatch(setPermission(false));
      return;
    }

    store.dispatch(setPermission(true));
    
    // Get project ID using multiple fallback methods
    let projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    
    // Fallback to get project ID from app.json if not found in Constants
    if (!projectId) {
      try {
        const appConfig = require('../../app.json');
        projectId = appConfig?.expo?.extra?.eas?.projectId;
      } catch (error) {
        console.warn('Could not load app.json:', error);
      }
    }
    
    // Final fallback to get project ID from native app ID
    if (!projectId) {
      try {
        projectId = Application.applicationId;
      } catch (error) {
        console.warn('Could not get application ID:', error);
      }
    }
    
    // Get push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });
      token = tokenData.data;
      
      store.dispatch(setToken(token));
      
      // Send local notification
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'You have successfully registered for push notifications!',
            body: 'You will now receive notifications from Esusu.',
            data: { type: 'success' },
          },
          trigger: null, // Show immediately
        });
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  }

  return token;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications as fetchNotifications } from './notificationFetchService';

// Export the fetched notifications function
export const getNotifications = fetchNotifications;

// Mark a specific notification as read
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token found');
    }

    // For now, we'll just log it since the backend might not support marking as read
    // In a real implementation, you'd call a PUT/PATCH endpoint
    console.log(`Marking notification ${notificationId} as read`);

    // If the backend has an endpoint like /api/notifications/:id/read, uncomment and use:
    // const response = await fetch(`https://esusu-server.onrender.com/api/notifications/${notificationId}/read`, {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token found');
    }

    // For now, we'll just log it since the backend might not support marking all as read
    // In a real implementation, you'd call a PUT endpoint
    console.log('Marking all notifications as read');

    // If the backend has an endpoint like /api/notifications/mark-all-read, uncomment and use:
    // const response = await fetch('https://esusu-server.onrender.com/api/notifications/mark-all-read', {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //   },
    // });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Notification templates
export const NotificationTemplates = {
  registration: {
    success: (name: string) => ({
      title: 'Welcome to Esusu!',
      body: `Hi ${name}, your account has been successfully created.`,
      type: 'success' as const,
    }),
    verification: {
      submitted: {
        title: 'Document Verification',
        body: 'Your verification documents have been submitted successfully. We will review them shortly.',
        type: 'info' as const,
      },
      approved: {
        title: 'Verification Approved',
        body: 'Your account has been verified successfully. You can now start using all features.',
        type: 'success' as const,
      },
    },
  },
  contributor: {
    added: (name: string) => ({
      title: 'New Contributor Added',
      body: `${name} has been successfully added to your contributors list.`,
      type: 'success' as const,
    }),
    reminder: (name: string) => ({
      title: 'Payment Reminder Sent',
      body: `A payment reminder has been sent to ${name}.`,
      type: 'info' as const,
    }),
  },
  transaction: {
    deposit: (amount: string) => ({
      title: 'Deposit Successful',
      body: `₦${amount} has been successfully deposited to your contributor account.`,
      type: 'success' as const,
    }),
    withdrawal: (amount: string) => ({
      title: 'Withdrawal Successful',
      body: `₦${amount} has been successfully withdrawn from your contributor account.`,
      type: 'success' as const,
    }),
  },
  auth: {
    login: {
      title: 'Welcome Back!',
      body: 'You have successfully logged in to your account.',
      type: 'success' as const,
    },
    logout: {
      title: 'Logged Out',
      body: 'You have been successfully logged out.',
      type: 'info' as const,
    },
  },
};

export async function sendNotification(
  title: string,
  body: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info'
) {
  // Add to Redux store for in-app notifications
  store.dispatch(addNotification({ title, body, type }));

  // Send local notification
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type },
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
} 