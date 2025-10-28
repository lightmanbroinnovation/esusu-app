import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DeviceInfo {
  deviceId: string;
  deviceType: string;
  platform: string;
  appVersion: string;
  location?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  expoToken?: string;
}

export class DeviceUtils {
  private static readonly DEVICE_INFO_KEY = 'device_info';

  /**
   * Get current device information
   */
  static async getCurrentDeviceInfo(): Promise<DeviceInfo> {
    try {
      const deviceInfo: DeviceInfo = {
        deviceId: this.getDeviceId(),
        deviceType: this.getDeviceType(),
        platform: this.getPlatform(),
        appVersion: this.getAppVersion(),
      };

      // Get location data (optional, might fail)
      try {
        const locationData = await this.getLocationData();
        deviceInfo.location = locationData.location;
        deviceInfo.city = locationData.city;
        deviceInfo.latitude = locationData.latitude;
        deviceInfo.longitude = locationData.longitude;
      } catch (locationError) {
        console.warn('Could not get location data:', locationError);
      }

      // Get Expo push token (optional, might fail)
      try {
        const expoToken = await this.getExpoPushToken();
        deviceInfo.expoToken = expoToken;
      } catch (tokenError) {
        console.warn('Could not get Expo push token:', tokenError);
      }

      return deviceInfo;
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  /**
   * Get stored device information from AsyncStorage
   */
  static async getStoredDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      const stored = await AsyncStorage.getItem(this.DEVICE_INFO_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored device info:', error);
      return null;
    }
  }

  /**
   * Store device information in AsyncStorage
   */
  static async storeDeviceInfo(deviceInfo: DeviceInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(this.DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
    } catch (error) {
      console.error('Error storing device info:', error);
      throw error;
    }
  }

  /**
   * Check if device info should be registered/updated
   */
  static shouldRegisterDevice(storedInfo: DeviceInfo | null, currentInfo: DeviceInfo): boolean {
    if (!storedInfo) {
      // No stored info, should register
      return true;
    }

    // Check if any critical info has changed
    return (
      storedInfo.deviceId !== currentInfo.deviceId ||
      storedInfo.deviceType !== currentInfo.deviceType ||
      storedInfo.platform !== currentInfo.platform ||
      storedInfo.appVersion !== currentInfo.appVersion ||
      storedInfo.expoToken !== currentInfo.expoToken ||
      storedInfo.latitude !== currentInfo.latitude ||
      storedInfo.longitude !== currentInfo.longitude ||
      storedInfo.city !== currentInfo.city
    );
  }

  /**
   * Get device ID
   */
  private static getDeviceId(): string {
    // Try to use modelName as primary identifier, fallback to deviceName, then deviceType with timestamp
    return Device.modelName || Device.deviceName || `${Device.deviceType}-${Date.now()}`;
  }

  /**
   * Get device type (phone, tablet, etc.)
   */
  private static getDeviceType(): string {
    const deviceType = Device.deviceType || 'unknown';

    // Normalize device types
    if (deviceType === 1) return 'phone';
    if (deviceType === 2) return 'tablet';
    if (deviceType === 3) return 'desktop';
    if (deviceType === 4) return 'tv';

    return deviceType.toString();
  }

  /**
   * Get platform (ios/android/web)
   */
  private static getPlatform(): string {
    return Device.osName?.toLowerCase() || 'unknown';
  }

  /**
   * Get app version
   */
  private static getAppVersion(): string {
    return Constants.expoConfig?.version || '1.0.0';
  }

  /**
   * Get location data (city, coordinates)
   */
  private static async getLocationData(): Promise<{
    location: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Try to get city name from coordinates (reverse geocoding)
      try {
        const address = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const city = address[0]?.city || address[0]?.region || 'Unknown';

        return {
          location: `${latitude},${longitude}`,
          city,
          latitude,
          longitude,
        };
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
        return {
          location: `${latitude},${longitude}`,
          latitude,
          longitude,
        };
      }
    } catch (error) {
      console.warn('Location access failed:', error);
      return {
        location: 'unknown',
      };
    }
  }

  /**
   * Get Expo push token
   */
  private static async getExpoPushToken(): Promise<string | undefined> {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.warn('Failed to get Expo push token:', error);
      return undefined;
    }
  }
}
