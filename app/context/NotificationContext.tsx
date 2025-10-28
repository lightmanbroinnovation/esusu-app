/**
 * Notification Context
 * Global state management for notifications
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationFetchService';
import { Notification } from '../../services/notificationService';

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
      const fetchedNotifications = await getNotifications();
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
      const success = await markNotificationAsRead(notificationId);

      if (success) {
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
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const success = await markAllNotificationsAsRead();

      if (success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );

        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Check notification permissions
  const checkNotificationPermissions = useCallback(async () => {
    try {
      // Default to true since we're not using Firebase anymore
      setAreNotificationsEnabled(true);
      return true;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      // For web compatibility, we'll just return true
      // In a real app, you might want to use the Notifications API
      const granted = true;
      setAreNotificationsEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Initialize notifications (no longer called on mount)
  const initializeNotifications = useCallback(async () => {
    try {
      console.log('🔔 Initializing notifications...');
      
      // Check permissions
      await checkNotificationPermissions();
      
      // Load notifications
      await loadNotifications();
      
      console.log('✅ Notifications initialized');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [checkNotificationPermissions, loadNotifications]);

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

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



