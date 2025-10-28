import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme as useNativeColorScheme, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import "./global.css";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { usePathname, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { setToken } from './store/slices/notificationSlice';
import * as Application from 'expo-application';

import { LoadingProvider } from './context/LoadingContext';
import { NotificationProvider } from './context/NotificationContext';
import ConnectionStatus from './components/ConnectionStatus';
import NotificationToast from './components/NotificationToast';
import { PerformanceMonitor } from './utils/performanceMonitor';
import { useAuth, AuthProvider } from './context/AuthContext';
import { getCachedData } from './utils/dataCaching';


// Create a wrapper component to disable scrollbars instead of modifying ScrollView directly
export const NoScrollbarScrollView = ({ children, ...props }: React.ComponentProps<typeof ScrollView>) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    showsHorizontalScrollIndicator={false}
    {...props}
  >
    {children}
  </ScrollView>
);

// Define a local useColorScheme hook
function useColorScheme(): 'light' | 'dark' {
  const nativeColorScheme = useNativeColorScheme();
  return nativeColorScheme ?? 'light';
}

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  console.warn("SplashScreen.preventAutoHideAsync() failed");
});

// Font configuration
const FONTS = {
  ...FontAwesome.font,
  'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
  'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
};

// Preload essential assets
const preloadAssets = async () => {
  try {
    const images = [
      require('../assets/images/icon.png'),
      require('../assets/images/Onboarding1.png'),
    ];
    
    // Load images in parallel for better performance
    await Promise.all(images.map(image => Asset.loadAsync(image)));
    
    return true;
  } catch (error) {
    console.log('Error in preloadAssets:', error);
    return false;
  }
};

// Fallback component for slow connections
function ConnectionIssueScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6F3FF', padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
        Connection Issue
      </Text>
      <Text style={{ textAlign: 'center', marginBottom: 20 }}>
        Seems like you have a slow internet connection. We're trying to load the app...
      </Text>
      <ActivityIndicator size="large" color="#0074FF" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <RootLayoutWithAuth />
      </AuthProvider>
    </Provider>
  );
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0072CE',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return null;
    }
    
    // Get project ID from app configuration
    let projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    
    // Fallback to get project ID from app.json if not found in Constants
    if (!projectId) {
      try {
        const appConfig = require('../app.json');
        projectId = appConfig?.expo?.extra?.eas?.projectId;
      } catch (error) {
        console.warn('Could not load app.json:', error);
      }
    }
    
    // Final fallback to get project ID from native app ID
    if (!projectId) {
      try {
        projectId = Application.applicationId;
      } catch (error) {
        console.warn('Could not get application ID:', error);
      }
    }
    
    if (!projectId) {
      console.warn('Project ID not found in app configuration. Push notifications may not work correctly.');
      // Continue without project ID - some platforms might work without it
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = tokenData.data;
      console.log('Expo push token:', token);
      
      // Save the token to your backend
      if (token) {
        // Save to Redux store if needed
        store.dispatch(setToken(token));
        
        // If you need to save to your backend, you can make an API call here
        // Example: await api.savePushToken(token);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

function RootLayoutWithAuth() {
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isTryingToReconnect, setIsTryingToReconnect] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [checkedCache, setCheckedCache] = useState(false);
  const [hasCache, setHasCache] = useState(true);

  // Set a maximum time for splash screen to be visible (failsafe)
  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      console.log('Splash screen timeout reached, hiding splash screen');
      try {
        SplashScreen.hideAsync();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to hide splash screen:', error);
      }
    }, 5000); // 5 second timeout

    // Register for push notifications
    const registerPushNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
        }
      } catch (error) {
        console.error('Error registering for push notifications:', error);
      }
    };

    registerPushNotifications();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      // Handle notification tap here if needed
    });

    // Clean up on unmount
    return () => {
      clearTimeout(splashTimeout);
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Check for network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
      if (!state.isConnected) {
        console.log('No network connection detected.');
      } else if (state.isConnected && !isConnected) {
        console.log('Network connection restored.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  // Preload assets
  useEffect(() => {
    async function loadAssets() {
      const loaded = await preloadAssets();
      setAssetsLoaded(loaded);
    }
    
    loadAssets();
  }, []);

  // Hide splash screen when everything is ready
  useEffect(() => {
    if (fontsLoaded && assetsLoaded) {
      console.log('Fonts and assets loaded, preparing to hide splash screen');
      
      // Add a small delay to ensure everything is rendered properly
      setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
          setIsReady(true);
          console.log('Splash screen hidden successfully');
        } catch (error) {
          console.error('Error hiding splash screen:', error);
          setIsReady(true); // Still set ready even if there's an error
        }
      }, 100);
    }
  }, [fontsLoaded, assetsLoaded]);

  // Check for cache for the current page if offline
  useEffect(() => {
    if (!isConnected) {
      // Use the pathname as the cache key (customize as needed)
      const cacheKey = pathname.replace(/^\//, '').replace(/\//g, '_') || 'index';
      getCachedData(cacheKey, async () => null)
        .then(data => {
          setHasCache(!!data);
          setCheckedCache(true);
        })
        .catch(() => {
          setHasCache(false);
          setCheckedCache(true);
        });
    } else {
      setCheckedCache(true);
      setHasCache(true);
    }
  }, [isConnected, pathname]);

  // Redirect logic if offline and no cache
  useEffect(() => {
    if (!isConnected && checkedCache && !hasCache) {
      if (user) {
        if (pathname !== '/login/passcode') {
          router.replace('/login/passcode');
        }
      } else {
        // If no user found in storage and offline with no cache, redirect to login page
        if (pathname !== '/login' && !pathname.startsWith('/login')) {
          router.replace('/login');
        }
      }
    }
  }, [isConnected, checkedCache, hasCache, user, pathname]);

  // If the app is not ready, return null as the splash screen is still visible
  if (!isReady) {
    return null;
  }

  // Remove the old no-network screen logic, as we now handle it with redirects

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LoadingProvider>
          <NotificationProvider>
            <ConnectionStatus />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
            <NotificationToast />
            <PerformanceMonitor visible={__DEV__} />
          </NotificationProvider>
        </LoadingProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Handle errors that might occur during rendering
export function ErrorBoundary(props: { error: Error }) {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="error" options={{ title: 'Error' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

