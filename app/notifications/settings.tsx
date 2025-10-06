/**
 * Notification Settings Screen
 * Dedicated screen for managing notification preferences
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBackButtonHandler } from '../utils/backButtonHandler';
import { Storage, STORAGE_KEYS } from '../utils/secureStorage';
import { useNotifications } from '../context/NotificationContext';
import { usePerformanceMonitor } from '../utils/performanceOptimizer';

export default function NotificationSettings() {
  // Use back button handler for notification settings
  useBackButtonHandler('/notifications/settings');
  
  // Performance monitoring
  usePerformanceMonitor('NotificationSettingsScreen');

  const [settings, setSettings] = useState({
    transactionAlerts: true,
    securityAlerts: false,
    generalUpdates: false,
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
  });

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get notification context
  const { areNotificationsEnabled, requestNotificationPermission } = useNotifications();

  // Load notification settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const savedSettings = await Storage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, false);
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save notification settings
  const saveSettings = useCallback(async (newSettings: typeof settings) => {
    try {
      await Storage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, newSettings, false);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  }, []);

  // Toggle notification settings
  const toggleSwitch = useCallback((key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Handle push notification permission
  const handlePushNotificationToggle = useCallback(async (value: boolean) => {
    if (value && !areNotificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive push notifications.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // You can implement opening device settings here
              console.log('Open device settings');
            }}
          ]
        );
        return;
      }
    }
    
    toggleSwitch('pushNotifications');
  }, [areNotificationsEnabled, requestNotificationPermission, toggleSwitch]);

  // Initialize
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handlePreviousPage = () => {
    router.back();
  };

  const handleSaveAll = () => {
    Alert.alert(
      'Settings Saved',
      'Your notification preferences have been updated.',
      [{ text: 'OK' }]
    );
  };

  const handleResetToDefault = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all notification settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            const defaultSettings = {
              transactionAlerts: true,
              securityAlerts: false,
              generalUpdates: false,
              pushNotifications: true,
              emailNotifications: false,
              smsNotifications: false,
            };
            setSettings(defaultSettings);
            saveSettings(defaultSettings);
          }
        }
      ]
    );
  };

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
          <Text className="text-lg font-semibold">Notification Settings</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading settings...</Text>
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
        <Text className="text-lg font-semibold">Notification Settings</Text>
        <TouchableOpacity onPress={handleSaveAll} className="p-2">
          <Text className="text-blue-600 text-sm font-medium">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Push Notifications Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Push Notifications
          </Text>
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-semibold text-gray-900">
                  Push Notifications
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Receive notifications on your device
                </Text>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={handlePushNotificationToggle}
                trackColor={{ false: '#E5E7EB', true: '#0074FF' }}
                thumbColor="#fff"
              />
            </View>
            
            {!areNotificationsEnabled && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={16} color="#F59E0B" />
                  <Text className="text-xs text-yellow-800 ml-2 flex-1">
                    Notifications are disabled in your device settings. 
                    Enable them to receive push notifications.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Alert Types Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Alert Types
          </Text>
          <View className="bg-gray-50 rounded-xl p-4 space-y-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-semibold text-gray-900">
                  Transaction Alerts
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Get notified when contributions are deposited or withdrawn
                </Text>
              </View>
              <Switch
                value={settings.transactionAlerts}
                onValueChange={() => toggleSwitch('transactionAlerts')}
                trackColor={{ false: '#E5E7EB', true: '#0074FF' }}
                thumbColor="#fff"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-semibold text-gray-900">
                  Security Alerts
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Receive alerts for suspicious activities or login attempts
                </Text>
              </View>
              <Switch
                value={settings.securityAlerts}
                onValueChange={() => toggleSwitch('securityAlerts')}
                trackColor={{ false: '#E5E7EB', true: '#0074FF' }}
                thumbColor="#fff"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-semibold text-gray-900">
                  General Updates
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Stay informed about app updates, new features, and announcements
                </Text>
              </View>
              <Switch
                value={settings.generalUpdates}
                onValueChange={() => toggleSwitch('generalUpdates')}
                trackColor={{ false: '#E5E7EB', true: '#0074FF' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Communication Preferences Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Communication Preferences
          </Text>
          <View className="bg-gray-50 rounded-xl p-4 space-y-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-semibold text-gray-900">
                  Email Notifications
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Receive notifications via email
                </Text>
              </View>
              <Switch
                value={settings.emailNotifications}
                onValueChange={() => toggleSwitch('emailNotifications')}
                trackColor={{ false: '#E5E7EB', true: '#0074FF' }}
                thumbColor="#fff"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-semibold text-gray-900">
                  SMS Notifications
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Receive notifications via SMS
                </Text>
              </View>
              <Switch
                value={settings.smsNotifications}
                onValueChange={() => toggleSwitch('smsNotifications')}
                trackColor={{ false: '#E5E7EB', true: '#0074FF' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={handleResetToDefault}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh" size={20} color="#DC2626" />
              <Text className="text-red-700 font-medium ml-3">
                Reset to Default Settings
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#2563EB" />
              <Text className="text-blue-700 font-medium ml-3">
                View Notification History
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
