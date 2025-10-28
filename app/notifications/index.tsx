import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBackButtonHandler } from '../utils/backButtonHandler';
import { useNotifications } from '../context/NotificationContext';
import { usePerformanceMonitor } from '../utils/performanceOptimizer';
import moment from 'moment';

export default function Notifications() {
  // Use back button handler with error handling
  try {
    useBackButtonHandler('/notifications');
  } catch (error) {
    console.warn('Back button handler not available:', error);
  }
  
  // Performance monitoring with error handling
  try {
    usePerformanceMonitor('NotificationsScreen');
  } catch (error) {
    console.warn('Performance monitor not available:', error);
  }

  // Use notification context with error handling
  const notificationContext = useNotifications();
  
  // Check if context is available
  if (!notificationContext) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-red-500">Error loading notifications</Text>
      </View>
    );
  }

  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  } = notificationContext; 

  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Refresh notifications with error handling
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.warn('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  // Initialize
  useEffect(() => {
    // Component is ready
  }, []);

  const handlePreviousPage = () => {
    try {
      router.back();
    } catch (error) {
      console.warn('Error navigating back:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return moment(dateString).format('MMM DD, YYYY [at] h:mm A');
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Use unreadCount from context

  // Render notification item with error handling
  const renderNotificationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {
        try {
          markAsRead(item._id);
        } catch (error) {
          console.warn('Error marking notification as read:', error);
        }
      }}
      className={`p-4 mb-3 rounded-xl border ${
        item.isRead 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className={`text-lg font-semibold mb-1 ${
            item.isRead ? 'text-gray-900' : 'text-blue-900'
          }`}>
            {item.subject}
          </Text>
          <Text className={`text-sm mb-2 ${
            item.isRead ? 'text-gray-600' : 'text-blue-700'
          }`}>
            {item.text}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {!item.isRead && (
          <View className="w-3 h-3 bg-blue-500 rounded-full" />
        )}
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
      <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
        No Notifications
      </Text>
      <Text className="text-sm text-gray-500 text-center px-8">
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 pt-10 pb-4">
          <TouchableOpacity 
            onPress={handlePreviousPage}
            className="p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Notifications</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0074FF" />
          <Text className="text-gray-500 mt-4">Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-10 pb-4">
        <TouchableOpacity 
          onPress={handlePreviousPage}
          className="p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Centered Title and Badge */}
        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold">Notifications</Text>
            {/* {unreadCount > 0 && (
              <View className="ml-2 bg-red-500 rounded-full px-2 py-1">
                <Text className="text-white text-xs font-bold">
                  {unreadCount}
                </Text>
              </View>
            )} */}
          </View>
        </View>
        
        {/* Mark All Read Button */}
        {/* {notifications && notifications.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              try {
                markAllAsRead();
              } catch (error) {
                console.warn('Error marking all notifications as read:', error);
              }
            }}
            className="p-2"
          >
            <Text className="text-blue-600 text-sm font-medium">Mark All Read</Text>
          </TouchableOpacity>
        )} */}
      </View>

      {/* Notifications List */}
      <View className="flex-1 px-4">
        {notifications && notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item, index) => {
              try {
                return item._id || `notification-${index}`;
              } catch (error) {
                return `notification-${index}`;
              }
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0074FF']}
                tintColor="#0074FF"
              />
            }
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingBottom: 100,
              flexGrow: 1
            }}
            style={{ flex: 1 }}
            nestedScrollEnabled={true}
            bounces={true}
            decelerationRate="normal"
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Settings Button */}
      {/* <View className="px-4 pb-6">
        <TouchableOpacity
          onPress={() => {
            try {
              router.push('/settings');
            } catch (error) {
              console.warn('Error navigating to settings:', error);
            }
          }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-4"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
              <Text className="text-gray-700 font-medium ml-3">
                Notification Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </View>
        </TouchableOpacity>
      </View> */}
    </View>
    );
}

