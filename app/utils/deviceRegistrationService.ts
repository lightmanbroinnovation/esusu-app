import { DeviceUtils, DeviceInfo } from '../utils/deviceUtils';
import { registerDevice } from '../../services/api';

export class DeviceRegistrationService {
  /**
   * Initialize device registration when app starts
   */
  static async initializeDeviceRegistration(): Promise<void> {
    try {
      console.log('🚀 Initializing device registration...');

      // Get current device information
      const currentDeviceInfo = await DeviceUtils.getCurrentDeviceInfo();
      console.log('📱 Current device info:', currentDeviceInfo);

      // Get stored device information
      const storedDeviceInfo = await DeviceUtils.getStoredDeviceInfo();

      // Check if we should register the device
      if (DeviceUtils.shouldRegisterDevice(storedDeviceInfo, currentDeviceInfo)) {
        console.log('📱 Device info changed or not found, registering with server...');

        // Register device with server
        const registrationResult = await registerDevice(currentDeviceInfo);

        if (registrationResult.success !== false) {
          // Store the current device info for future comparisons
          await DeviceUtils.storeDeviceInfo(currentDeviceInfo);
          console.log('✅ Device registered and info stored successfully');
        } else {
          console.warn('⚠️ Device registration failed, but continuing app flow');
        }
      } else {
        console.log('📱 Device info unchanged, no registration needed');
      }
    } catch (error) {
      console.error('❌ Error during device registration initialization:', error);
      // Don't throw error to avoid breaking app startup
    }
  }

  /**
   * Force re-registration of device (useful for testing or manual updates)
   */
  static async forceDeviceRegistration(): Promise<void> {
    try {
      console.log('🔄 Force registering device...');

      const currentDeviceInfo = await DeviceUtils.getCurrentDeviceInfo();

      const registrationResult = await registerDevice(currentDeviceInfo);

      if (registrationResult.success !== false) {
        await DeviceUtils.storeDeviceInfo(currentDeviceInfo);
        console.log('✅ Device force-registered successfully');
      }
    } catch (error) {
      console.error('❌ Error during force device registration:', error);
      throw error;
    }
  }

  /**
   * Get current device info (for debugging/testing)
   */
  static async getCurrentDeviceInfo(): Promise<DeviceInfo> {
    return await DeviceUtils.getCurrentDeviceInfo();
  }
}
