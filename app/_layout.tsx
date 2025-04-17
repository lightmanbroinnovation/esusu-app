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
import { Provider } from 'react-redux';
import { store } from './store/store';

import { LoadingProvider } from './context/LoadingContext';
import ConnectionStatus from './components/ConnectionStatus';
import NotificationToast from './components/NotificationToast';
import { prefetchData } from './utils/dataCaching';
import { fetchUser } from '../services/api';
import { PerformanceMonitor } from './utils/performanceMonitor';

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

// Font configuration
const FONTS = {
  ...FontAwesome.font,
  'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
  'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
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
  const router = useRouter();
  const pathname = usePathname();

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

  // Attempt to load resources before rendering the app
  const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      try {
        // Prefetch data if there is network connectivity
        if (isConnected) {
          try {
            await prefetchData({
              defaultData: async () => ({})
            });
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
              onPress={onLayoutRootView}
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
    <Provider store={store}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <LoadingProvider>
            <ConnectionStatus />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
            <NotificationToast />
            <PerformanceMonitor visible={__DEV__} />
          </LoadingProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
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

