/**
 * Environment Configuration
 * Centralized configuration management for the Esusu app
 */

import Constants from 'expo-constants';

interface EnvironmentConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_UPLOAD_PRESET: string;
  CLOUDINARY_UPLOAD_FOLDER: string;
  APP_NAME: string;
  APP_VERSION: string;
  DEBUG_MODE: boolean;
  ENABLE_BIOMETRIC: boolean;
  ENABLE_OFFLINE_MODE: boolean;
  ENABLE_ANALYTICS: boolean;
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID: string;
  FIREBASE_VAPID_KEY: string;
}

// Default configuration
const defaultConfig: EnvironmentConfig = {
  API_BASE_URL: 'https://esusu-server.onrender.com/api/merchant',
  API_TIMEOUT: 15000,
  CLOUDINARY_CLOUD_NAME: 'daskmqzyy',
  CLOUDINARY_API_KEY: '829652354354175',
  CLOUDINARY_API_SECRET: 'KaM9eff0roQcE8AF61mBGaEo090',
  CLOUDINARY_UPLOAD_PRESET: 'f1quj50x',
  CLOUDINARY_UPLOAD_FOLDER: 'esusu_assets',
  APP_NAME: 'Esusu',
  APP_VERSION: '1.0.0',
  DEBUG_MODE: __DEV__,
  ENABLE_BIOMETRIC: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_ANALYTICS: false,
  FIREBASE_API_KEY: 'your-firebase-api-key',
  FIREBASE_AUTH_DOMAIN: 'your-project.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'your-project-id',
  FIREBASE_STORAGE_BUCKET: 'your-project.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: '123456789',
  FIREBASE_APP_ID: '1:123456789:web:abcdef',
  FIREBASE_MEASUREMENT_ID: 'G-XXXXXXXXXX',
  FIREBASE_VAPID_KEY: 'your-vapid-key',
};

// Get configuration from environment variables or use defaults
const getConfig = (): EnvironmentConfig => {
  const config = { ...defaultConfig };
  
  // Override with environment variables if available
  if (Constants.expoConfig?.extra) {
    const extra = Constants.expoConfig.extra;
    Object.keys(config).forEach(key => {
      if (extra[key] !== undefined) {
        (config as any)[key] = extra[key];
      }
    });
  }
  
  return config;
};

export const ENV = getConfig();

// Validation function
export const validateConfig = (): boolean => {
  const requiredFields = [
    'API_BASE_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_UPLOAD_PRESET'
  ];
  
  const missingFields = requiredFields.filter(field => !ENV[field as keyof EnvironmentConfig]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required environment variables:', missingFields);
    return false;
  }
  
  console.log('✅ Environment configuration validated');
  return true;
};

// Secure configuration getter (masks sensitive data in logs)
export const getSecureConfig = () => {
  return {
    ...ENV,
    CLOUDINARY_API_SECRET: ENV.CLOUDINARY_API_SECRET ? '***MASKED***' : undefined,
  };
};

export default ENV;
