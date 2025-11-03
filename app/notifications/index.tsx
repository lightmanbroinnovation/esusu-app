import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  FlatList,
  StyleSheet
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
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading notifications</Text>
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
      style={[
        styles.notificationItem,
        item.isRead ? styles.notificationItemRead : styles.notificationItemUnread
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationTextContainer}>
          <Text style={[
            styles.notificationTitle,
            item.isRead ? styles.notificationTitleRead : styles.notificationTitleUnread
          ]}>
            {item.subject}
          </Text>
          <Text style={[
            styles.notificationText,
            item.isRead ? styles.notificationTextRead : styles.notificationTextUnread
          ]}>
            {item.text}
          </Text>
          <Text style={styles.notificationDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {!item.isRead && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        No Notifications
      </Text>
      <Text style={styles.emptyText}>
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handlePreviousPage}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0074FF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handlePreviousPage}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Centered Title and Badge */}
        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {/* {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
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
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )} */}
      </View>

      {/* Notifications List */}
      <View style={styles.listContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  markAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  notificationItemRead: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  notificationItemUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationTitleRead: {
    color: '#6B7280',
  },
  notificationTitleUnread: {
    color: '#111827',
  },
  notificationText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTextRead: {
    color: '#9CA3AF',
  },
  notificationTextUnread: {
    color: '#4B5563',
  },
  notificationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
});

