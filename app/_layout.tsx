import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import "./global.css";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
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
  // Log that RootLayout is rendering - helps debug if this is being called
  console.log('🔵 RootLayout rendering - this means entry point is working');
  
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
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isTryingToReconnect, setIsTryingToReconnect] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // CRITICAL: Router hooks MUST be called unconditionally (React rules)
  // These will be available once Stack mounts and creates the router context
  const router = useRouter();
  const pathname = usePathname();

  // Safely get user from auth context - handle null case
  const authContext = useAuth();
  const user = authContext?.user ?? null;
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
    notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
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
const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
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

  // CRITICAL: isReady starts as true (set in useState above)
  // This ensures Stack mounts on first render, allowing Expo Router to discover routes
  // Log that we're ready for debugging
  useEffect(() => {
    console.log('🚀 Expo Router initialized - Stack should be mounted, routes discovered');
  }, []);

  // Separate effect to handle splash screen hiding based on fonts/assets
  useEffect(() => {
    // Hide splash screen after a brief delay to show native splash
    const hideSplash = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 500);
    
    // Aggressive timeout as backup
    const loadTimeout = setTimeout(() => {
      console.log('⚠️ Load timeout reached - ensuring splash hidden');
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);

    // Fonts and assets can load in background - don't block route rendering
    // Hide splash when fonts/assets are ready, but routes should already be working
    if (fontsLoaded && assetsLoaded) {
      console.log('✅ Fonts and assets loaded');
      clearTimeout(loadTimeout);
      clearTimeout(hideSplash);
      SplashScreen.hideAsync().catch(() => {});
    }

    // Handle font errors gracefully
    if (fontError) {
      console.warn('⚠️ Font loading error, proceeding anyway:', fontError);
      clearTimeout(loadTimeout);
      clearTimeout(hideSplash);
      SplashScreen.hideAsync().catch(() => {});
    }

    return () => {
      clearTimeout(hideSplash);
      clearTimeout(loadTimeout);
    };
  }, [fontsLoaded, assetsLoaded, fontError]);

  // Check for cache for the current page if offline
  // Safely access router/pathname - may not be ready immediately
  useEffect(() => {
    // Only proceed if router is ready and we have a valid pathname
    if (!isReady || !pathname || pathname === '') return;
    
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
  }, [isConnected, pathname, isReady]);

  // Redirect logic if offline and no cache
  // Only run when router is ready
  useEffect(() => {
    // Wait for router to be ready before attempting navigation
    if (!isReady || !pathname || pathname === '') return;
    
    if (!isConnected && checkedCache && !hasCache) {
      try {
        if (user) {
          if (pathname !== '/login/passcode') {
            router.replace('/login/passcode' as any);
          }
        } else {
          // If no user found in storage and offline with no cache, redirect to login page
          if (pathname !== '/login' && !pathname.startsWith('/login')) {
            router.replace('/login' as any);
          }
        }
      } catch (error) {
        console.warn('Navigation error (router not ready yet):', error);
        // Router will retry on next render
      }
    }
  }, [isConnected, checkedCache, hasCache, user, pathname, router, isReady]);

  // CRITICAL: Always render the Stack component IMMEDIATELY
  // Expo Router requires the Stack to be mounted BEFORE it can discover routes
  // Don't block Stack rendering with loading states - let it initialize routes first
  console.log('🔵 RootLayoutWithAuth rendering - isReady:', isReady, 'pathname:', pathname);
  
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <LoadingProvider>
          <NotificationProvider>
            {/* Render Stack IMMEDIATELY - don't wait for anything */}
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
            {/* Only show loading indicator if Stack is ready but fonts/assets are loading */}
            {/* This ensures routes are discovered BEFORE we show loading overlay */}
            {!isReady && (
              <View style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: '#E6F3FF', 
                justifyContent: 'center', 
                alignItems: 'center',
                zIndex: 9999,
                pointerEvents: 'box-none' // Allow touches to pass through after routes load
              }}>
                <ActivityIndicator size="large" color="#0072CE" />
              </View>
            )}
            <ConnectionStatus />
            <NotificationToast />
            <PerformanceMonitor visible={__DEV__} />
          </NotificationProvider>
        </LoadingProvider>
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Handle errors that might occur during rendering
export function ErrorBoundary(props: { error: Error }) {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#000' }}>
          Application Error
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
          {props.error?.message || 'An unexpected error occurred'}
        </Text>
        <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
          Please restart the app or contact support if the problem persists.
        </Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

