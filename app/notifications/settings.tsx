import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Dimensions,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBackButtonHandler } from '../utils/backButtonHandler';
import { fetchMerchantNotificationSettings, updateMerchantNotificationSettings } from '../../services/api';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationSettings() {
  // Use back button handler for notification settings
  useBackButtonHandler('/notifications/settings');

  // Performance monitoring
  // usePerformanceMonitor('NotificationSettingsScreen');

  const { width, height } = Dimensions.get('window');
  const router = useRouter();

  // Responsive sizing based on screen width
  const getResponsiveSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9; // Small phones
    } else if (width < 414) {
      return baseSize; // Medium phones
    } else {
      return baseSize * 1.1; // Large phones and tablets
    }
  };

  const [settings, setSettings] = useState({
    notifications: {
      transactionAlert: true,
      securityAlert: false,
      generatUpdates: false,
    },
    communicationPreferences: {
      email: false,
      sms: false,
    },
    pushNotifications: true,
  });

  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get notification context
  const { areNotificationsEnabled, requestNotificationPermission } = useNotifications();

  // Notification items with icons and descriptions
  const alertItems = [
    {
      key: 'transactionAlert',
      title: 'Transaction Alerts',
      description: 'Get notified when contributions are deposited or withdrawn',
      icon: 'card-outline'
    },
    {
      key: 'securityAlert',
      title: 'Security Alerts',
      description: 'Receive alerts for suspicious activities or login attempts',
      icon: 'shield-checkmark-outline'
    },
    {
      key: 'generatUpdates',
      title: 'General Updates',
      description: 'Stay informed about app updates, new features, and announcements',
      icon: 'information-circle-outline'
    },
  ];

  const communicationItems = [
    {
      key: 'email',
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: 'mail-outline'
    },
    {
      key: 'sms',
      title: 'SMS Notifications',
      description: 'Receive notifications via SMS',
      icon: 'chatbubble-outline'
    },
  ];

  // Load notification settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const apiSettings = await fetchMerchantNotificationSettings();

      // Map API response to component state
      const mappedSettings = {
        notifications: {
          transactionAlert: apiSettings.notifications?.transactionAlert ?? true,
          securityAlert: apiSettings.notifications?.securityAlert ?? false,
          generatUpdates: apiSettings.notifications?.generatUpdates ?? false,
        },
        communicationPreferences: {
          email: apiSettings.communicationPreferences?.email ?? false,
          sms: apiSettings.communicationPreferences?.sms ?? false,
        },
        pushNotifications: true, // Push notifications are handled separately
      };

      setSettings(prev => ({ ...prev, ...mappedSettings }));
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // Fallback to default settings if API fails
      const defaultSettings = {
        notifications: {
          transactionAlert: true,
          securityAlert: false,
          generatUpdates: false,
        },
        communicationPreferences: {
          email: false,
          sms: false,
        },
        pushNotifications: true,
      };
      setSettings(prev => ({ ...prev, ...defaultSettings }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Save notification settings
  const saveSettings = useCallback(async (newSettings: typeof settings) => {
    try {
      // Map component state to API format
      const apiPayload = {
        notifications: {
          transactionAlert: newSettings.notifications.transactionAlert,
          securityAlert: newSettings.notifications.securityAlert,
          generatUpdates: newSettings.notifications.generatUpdates,
        },
        communicationPreferences: {
          email: newSettings.communicationPreferences.email,
          sms: newSettings.communicationPreferences.sms,
        }
      };

      await updateMerchantNotificationSettings(apiPayload);
      setSettings(newSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  }, []);

  // Toggle notification settings
  const toggleSwitch = useCallback((key: string) => {
    let newSettings;

    if (key === 'pushNotifications') {
      // Handle push notifications separately
      newSettings = { ...settings, [key]: !settings[key] };
    } else if (key in settings.notifications) {
      // Handle notification settings
      newSettings = {
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: !settings.notifications[key as keyof typeof settings.notifications]
        }
      };
    } else if (key in settings.communicationPreferences) {
      // Handle communication preferences
      newSettings = {
        ...settings,
        communicationPreferences: {
          ...settings.communicationPreferences,
          [key]: !settings.communicationPreferences[key as keyof typeof settings.communicationPreferences]
        }
      };
    } else {
      return; // Unknown key
    }

    setSettings(newSettings);
    setHasChanges(true);
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

  const handleSaveAll = async () => {
    if (isSaving) return; // Prevent multiple clicks

    try {
      setIsSaving(true);
      // Actual save operation - now handled automatically in toggleSwitch
      await saveSettings(settings);

      Alert.alert(
        'Settings Saved',
        'Your notification preferences have been updated.',
        [{ text: 'OK' }]
      );
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
              notifications: {
                transactionAlert: true,
                securityAlert: false,
                generatUpdates: false,
              },
              communicationPreferences: {
                email: false,
                sms: false,
              },
              pushNotifications: true,
            };
            setSettings(defaultSettings);
            saveSettings(defaultSettings);
            setHasChanges(true);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" /> */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handlePreviousPage}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notification Settings</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" /> */}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handlePreviousPage}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ paddingHorizontal: getResponsiveSize(16), paddingTop: getResponsiveSize(24) }}>

          {/* Alert Types Section */}
          <View style={{ marginBottom: getResponsiveSize(32) }}>
            <Text style={{
              fontSize: getResponsiveSize(12),
              fontWeight: '600',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: getResponsiveSize(16)
            }}>
              Alert Types
            </Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: getResponsiveSize(16),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: '#F3F4F6',
              overflow: 'hidden'
            }}>
              {alertItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: getResponsiveSize(18),
                    paddingVertical: getResponsiveSize(20),
                    borderBottomWidth: index !== alertItems.length - 1 ? 1 : 0,
                    borderBottomColor: '#F3F4F6'
                  }}
                  onPress={() => toggleSwitch(item.key as keyof typeof settings)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: getResponsiveSize(48),
                      height: getResponsiveSize(48),
                      borderRadius: getResponsiveSize(12),
                      backgroundColor: '#EFF6FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: getResponsiveSize(16)
                    }}>
                      <Ionicons name={item.icon as any} size={22} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: getResponsiveSize(16),
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: getResponsiveSize(2)
                      }}>
                        {item.title}
                      </Text>
                      <Text style={{
                        fontSize: getResponsiveSize(14),
                        color: '#6B7280',
                        lineHeight: getResponsiveSize(18)
                      }}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.notifications[item.key as keyof typeof settings.notifications]}
                    onValueChange={() => toggleSwitch(item.key)}
                    trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Communication Preferences Section */}
          <View style={{ marginBottom: getResponsiveSize(32) }}>
            <Text style={{
              fontSize: getResponsiveSize(12),
              fontWeight: '600',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: getResponsiveSize(16)
            }}>
              Communication Preferences
            </Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: getResponsiveSize(16),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: '#F3F4F6',
              overflow: 'hidden'
            }}>
              {communicationItems.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: getResponsiveSize(24),
                    paddingVertical: getResponsiveSize(20),
                    borderBottomWidth: index !== communicationItems.length - 1 ? 1 : 0,
                    borderBottomColor: '#F3F4F6'
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: getResponsiveSize(48),
                      height: getResponsiveSize(48),
                      borderRadius: getResponsiveSize(12),
                      backgroundColor: '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: getResponsiveSize(16)
                    }}>
                      <Ionicons name={item.icon as any} size={22} color="#6B7280" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: getResponsiveSize(16),
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: getResponsiveSize(2)
                      }}>
                        {item.title}
                      </Text>
                      <Text style={{
                        fontSize: getResponsiveSize(14),
                        color: '#6B7280',
                        lineHeight: getResponsiveSize(18)
                      }}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.communicationPreferences[item.key as keyof typeof settings.communicationPreferences]}
                    onValueChange={() => toggleSwitch(item.key)}
                    trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                  />
                </View>
              ))}

              {/* Push Notification Warning */}
              {settings.pushNotifications && !areNotificationsEnabled && (
                <View style={{
                  marginHorizontal: getResponsiveSize(24),
                  marginVertical: getResponsiveSize(16),
                  backgroundColor: '#FEF3C7',
                  borderWidth: 1,
                  borderColor: '#F59E0B',
                  borderRadius: getResponsiveSize(8),
                  padding: getResponsiveSize(12)
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="warning" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
                    <Text style={{
                      fontSize: getResponsiveSize(12),
                      color: '#92400E',
                      marginLeft: getResponsiveSize(8),
                      flex: 1,
                      lineHeight: getResponsiveSize(16)
                    }}>
                      Notifications are disabled in your device settings. Enable them to receive push notifications.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Push Notifications Section */}
          <View style={{ marginBottom: getResponsiveSize(32) }}>
            <Text style={{
              fontSize: getResponsiveSize(12),
              fontWeight: '600',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: getResponsiveSize(16)
            }}>
              Device Notifications
            </Text>
            <View style={{
              backgroundColor: 'white',
              borderRadius: getResponsiveSize(16),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: '#F3F4F6',
              overflow: 'hidden'
            }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: getResponsiveSize(24),
                  paddingVertical: getResponsiveSize(20),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: getResponsiveSize(48),
                    height: getResponsiveSize(48),
                    borderRadius: getResponsiveSize(12),
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: getResponsiveSize(16)
                  }}>
                    <Ionicons name="phone-portrait-outline" size={22} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: getResponsiveSize(16),
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: getResponsiveSize(2)
                    }}>
                      Push Notifications
                    </Text>
                    <Text style={{
                      fontSize: getResponsiveSize(14),
                      color: '#6B7280',
                      lineHeight: getResponsiveSize(18)
                    }}>
                      Receive notifications on your device
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={handlePushNotificationToggle}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                />
              </View>
            </View>
          </View>

          {/* Actions Section */}
          <View style={{ marginBottom: getResponsiveSize(32) }}>
            <TouchableOpacity
              onPress={handleResetToDefault}
              style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: getResponsiveSize(12),
                padding: getResponsiveSize(16),
                marginBottom: getResponsiveSize(16)
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: getResponsiveSize(40),
                  height: getResponsiveSize(40),
                  borderRadius: getResponsiveSize(8),
                  backgroundColor: '#DC2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: getResponsiveSize(12)
                }}>
                  <Ionicons name="refresh" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: getResponsiveSize(16),
                    fontWeight: '600',
                    color: '#DC2626'
                  }}>
                    Reset to Default Settings
                  </Text>
                  <Text style={{
                    fontSize: getResponsiveSize(14),
                    color: '#7F1D1D',
                    marginTop: getResponsiveSize(2)
                  }}>
                    This will reset all preferences to default values
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={{
                backgroundColor: '#EFF6FF',
                borderWidth: 1,
                borderColor: '#BFDBFE',
                borderRadius: getResponsiveSize(12),
                padding: getResponsiveSize(16)
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: getResponsiveSize(40),
                  height: getResponsiveSize(40),
                  borderRadius: getResponsiveSize(8),
                  backgroundColor: '#3B82F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: getResponsiveSize(12)
                }}>
                  <Ionicons name="notifications" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: getResponsiveSize(16),
                    fontWeight: '600',
                    color: '#1E40AF'
                  }}>
                    View Notification History
                  </Text>
                  <Text style={{
                    fontSize: getResponsiveSize(14),
                    color: '#1E3A8A',
                    marginTop: getResponsiveSize(2)
                  }}>
                    See all your past notifications and activity
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Save Button at Bottom */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingHorizontal: getResponsiveSize(24),
        paddingVertical: getResponsiveSize(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10
      }}>
        <TouchableOpacity
          onPress={handleSaveAll}
          disabled={isSaving}
          style={{
            backgroundColor: isSaving ? '#9CA3AF' : '#3B82F6',
            borderRadius: getResponsiveSize(12),
            paddingVertical: getResponsiveSize(16),
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row'
          }}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="white" style={{ marginRight: getResponsiveSize(8) }} />
              <Text style={{
                fontSize: getResponsiveSize(16),
                fontWeight: '600',
                color: 'white'
              }}>
                Saving...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="white" />
              <Text style={{
                fontSize: getResponsiveSize(16),
                fontWeight: '600',
                color: 'white',
                marginLeft: getResponsiveSize(8)
              }}>
                Save Changes
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
});

