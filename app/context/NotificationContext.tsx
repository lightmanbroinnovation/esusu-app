/**
 * Notification Context
 * Global state management for notifications
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationService, Notification } from '../../services/notificationService';
import { FirebaseMessagingService } from '../services/firebaseMessaging';
import { Storage, STORAGE_KEYS } from '../utils/secureStorage';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  initializeNotifications: () => Promise<void>;
  areNotificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [areNotificationsEnabled, setAreNotificationsEnabled] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedNotifications = await NotificationService.getNotifications();
      setNotifications(fetchedNotifications);
      
      // Calculate unread count
      const unread = fetchedNotifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, isRead: true }
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Check notification permissions
  const checkNotificationPermissions = useCallback(async () => {
    try {
      const enabled = await FirebaseMessagingService.areNotificationsEnabled();
      setAreNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await NotificationService.requestPermission();
      setAreNotificationsEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    try {
      console.log('🔔 Initializing notifications...');
      
      // Check permissions
      await checkNotificationPermissions();
      
      // Initialize Firebase messaging
      await FirebaseMessagingService.initialize();
      
      // Load notifications
      await loadNotifications();
      
      console.log('✅ Notifications initialized');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [checkNotificationPermissions, loadNotifications]);

  // Setup notification listeners
  useEffect(() => {
    const setupListeners = () => {
      // Listen for new notifications
      const handleNewNotification = (notification: any) => {
        console.log('📱 New notification received:', notification);
        // Refresh notifications list
        loadNotifications();
      };

      // Listen for token refresh
      const handleTokenRefresh = (token: string) => {
        console.log('🔄 FCM token refreshed:', token);
        // Re-register token
        NotificationService.registerToken();
      };

      // Setup Firebase messaging listeners
      const unsubscribe = NotificationService.setupNotificationListeners(
        handleNewNotification,
        handleTokenRefresh
      );

      return unsubscribe;
    };

    const unsubscribe = setupListeners();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadNotifications]);

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      FirebaseMessagingService.cleanup();
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    initializeNotifications,
    areNotificationsEnabled,
    requestNotificationPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
