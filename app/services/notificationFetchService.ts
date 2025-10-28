import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Notification interface
export interface Notification {
  _id: string;
  subject: string;
  text: string;
  createdAt: string;
  isRead: boolean;
  type?: string;
}

// Fetch notifications from backend
export async function getNotifications(): Promise<Notification[]> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    console.log('🔑 Auth token for notifications:', token ? 'Token found' : 'No token');
    console.log('🔑 Token being sent:', token ? token.substring(0, 20) + '...' : 'No token');
    if (!token) {
      console.log('No auth token found, skipping notification fetch');
      return [];
    }

    // Log the request being sent
    console.log('🚀 Sending request to:', 'https://esusu-server.onrender.com/api/notifications');
    console.log('📋 Request headers:', {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const response = await axios.get('https://esusu-server.onrender.com/api/notifications/merchants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    // Log the response received
    console.log('📡 Response status:', response.status);
    console.log('📦 Response data:', response.data);

    if (response.status !== 200) {
      console.log(`HTTP error! status: ${response.status}, returning empty array`);
      return [];
    }

    const data = response.data;
    console.log('📦 Notification data received:', data);

    if (!data || !data.success || !Array.isArray(data.data)) {
      console.log('Invalid response format, returning empty array');
      return [];
    }

    // Transform backend data to match Notification interface
    const notifications: Notification[] = data.data.map((item: any) => ({
      _id: item._id,
      subject: item.subject,
      text: item.text,
      createdAt: item.createdAt,
      isRead: false, // Backend doesn't provide read status, assume unread
      type: 'info', // Default type
    }));

    console.log('🔔 Notifications fetched from server:', notifications);

    return notifications;
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      console.log('No auth token found for marking notification as read');
      return false;
    }

    console.log('🚀 Marking notification as read:', notificationId);

    const response = await axios.post(
      `https://esusu-server.onrender.com/api/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('📡 Mark as read response:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return false;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      console.log('No auth token found for marking all notifications as read');
      return false;
    }

    console.log('🚀 Marking all notifications as read');

    const response = await axios.post(
      'https://esusu-server.onrender.com/api/notifications/read-all',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('📡 Mark all as read response:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    return false;
  }
}
