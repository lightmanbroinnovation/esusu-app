import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme as useNativeColorScheme, ScrollView, View, Text, ActivityIndicator, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import "./global.css";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { usePathname, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LoadingProvider } from './context/LoadingContext';
import ConnectionStatus from './components/ConnectionStatus';
import { prefetchData } from './utils/dataCaching';
import { fetchUser } from '../services/api';
import { PerformanceMonitor, resetPerformanceMetrics } from './utils/performanceMonitor';

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
  initialRouteName: '(tabs)',
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Functional component cache
const FUNCTIONAL_COMPONENTS = {
  'dark': FontAwesome,
  'light': FontAwesome,
};

// Font cache
const FONTS = {
  ...FontAwesome.font,
};

// Preload assets to speed up initial render
const preloadAssets = async () => {
  try {
    const images = [
      require('../assets/images/icon.png'),
      require('../assets/images/Onboarding1.png'),
    ];
    
    // Preload images one by one with error handling
    for (const image of images) {
      try {
        await Asset.loadAsync(image);
      } catch (err) {
        console.log(`Failed to load image: ${err}`);
      }
    }
    
    // Get user ID for prefetching
    try {
      const userId = await Constants.installationId;
      if (userId) {
        // Prefetch common data
        await prefetchData({
          [`user_${userId}`]: () => fetchUser(userId),
        });
      }
    } catch (error) {
      console.log('Error prefetching user data:', error);
    }
  } catch (error) {
    console.log('Error in preloadAssets:', error);
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
  const [loaded, error] = useFonts(FONTS);
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isTryingToReconnect, setIsTryingToReconnect] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const lastActive = useRef(Date.now());
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Force hide splash screen after a timeout even if resources fail to load
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        SplashScreen.hideAsync().catch(e => console.log('Error hiding splash screen:', e));
        setIsReady(true);
      } catch (error) {
        console.log('Error in splash screen timeout:', error);
      }
    }, 3000); // 3 seconds timeout
    
    return () => clearTimeout(timeoutId);
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

  // App lock feature - track app state changes for inactivity
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    startInactivityTimer();

    // Check if user is logged in when component mounts
    checkAuthStatus();
    
    // Call preloadAssets but don't wait for it
    preloadAssets().catch(err => console.log('Error preloading assets:', err));

    return () => {
      subscription.remove();
      clearInactivityTimer();
    };
  }, []);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      setIsAppLocked(!!isLoggedIn); // Only lock if user is logged in
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  // Handle app state changes (background/foreground)
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App is going to background
      lastActive.current = Date.now();
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming to foreground
      const timeInactive = Date.now() - lastActive.current;
      if (timeInactive > 30000) { // 30 seconds
        lockApp();
      }
      startInactivityTimer();
    }
    appState.current = nextAppState;
  };

  // Start timer to track inactivity while app is in foreground
  const startInactivityTimer = () => {
    clearInactivityTimer();
    inactivityTimer.current = setTimeout(() => {
      lockApp();
    }, 30000); // 30 seconds
  };

  // Clear the inactivity timer
  const clearInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  };

  // Function to lock the app
  const lockApp = async () => {
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      setIsAppLocked(true);
      // Don't navigate if we're already on login/passcode page or app is not ready
      if (isReady && !pathname.includes('/login/passcode')) {
        // Store current route to return after auth
        await AsyncStorage.setItem('lastRoute', pathname);
        router.replace('/login/passcode');
      }
    }
  };

  // Reset inactivity timer on user interaction
  const resetInactivityTimer = () => {
    lastActive.current = Date.now();
    startInactivityTimer();
  };

  // Attempt to reconnect to the network
  const attemptReconnect = async () => {
    try {
      setIsTryingToReconnect(true);
      const state = await NetInfo.fetch();
      setIsConnected(!!state.isConnected);
    } catch (error) {
      console.error('Failed to check network status:', error);
    } finally {
      setIsTryingToReconnect(false);
    }
  };

  // Attempt to load resources before rendering the app
  const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      try {
        // Prefetch data if there is network connectivity
        if (isConnected) {
          try {
            await prefetchData();
          } catch (error) {
            console.log('Error prefetching data:', error);
          }
        }

        // Hide splash screen
        await SplashScreen.hideAsync();
        setIsReady(true);
      } catch (e) {
        console.warn('Error loading resources:', e);
        // Hide splash screen even if there's an error
        await SplashScreen.hideAsync();
        setIsReady(true);
      }
    }
  }, [loaded, isConnected]);

  // Ensure splash screen is hidden if fonts are loaded
  useEffect(() => {
    if (loaded) {
      onLayoutRootView();
    }
  }, [loaded, onLayoutRootView]);

  // Handle error loading fonts
  if (error) {
    console.warn('Error loading fonts:', error);
  }

  // If the app is not ready or fonts not loaded, show loading indicator
  if (!isReady || !loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6F3FF', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
          Esusu App
        </Text>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  // Handle no network connection
  if (!isConnected) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6F3FF', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
            No Internet Connection
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>
            Please check your connection and try again.
          </Text>
          {isTryingToReconnect ? (
            <ActivityIndicator size="small" color="#0066FF" />
          ) : (
            <TouchableOpacity
              onPress={attemptReconnect}
              style={{
                backgroundColor: '#0066FF',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  // The app is ready, return the main layout
  return (
    <SafeAreaProvider onLayout={onLayoutRootView} onTouchStart={resetInactivityTimer}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LoadingProvider>
          <ConnectionStatus />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
          <PerformanceMonitor visible={__DEV__} />
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

