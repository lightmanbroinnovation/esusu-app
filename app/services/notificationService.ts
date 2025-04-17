import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { store } from '../store/store';
import { addNotification, setPermission, setToken } from '../store/slices/notificationSlice';
import Constants from 'expo-constants';

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
    
    // Get push token
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
      })).data;
      
      store.dispatch(setToken(token));
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  }

  return token;
}

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
      body: `₦${amount} has been successfully deposited to your account.`,
      type: 'success' as const,
    }),
    withdrawal: (amount: string) => ({
      title: 'Withdrawal Successful',
      body: `₦${amount} has been successfully withdrawn from your account.`,
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