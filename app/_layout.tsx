import React, { useState, useCallback, useEffect } from 'react';
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme as useNativeColorScheme, ScrollView, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
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
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isTryingToReconnect, setIsTryingToReconnect] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

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

    return () => clearTimeout(splashTimeout);
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

  // If the app is not ready, return null as the splash screen is still visible
  if (!isReady) {
    return null;
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
              onPress={() => {
                setIsTryingToReconnect(true);
                NetInfo.fetch().then(state => {
                  setIsConnected(!!state.isConnected);
                  setIsTryingToReconnect(false);
                });
              }}
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
      <SafeAreaProvider>
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

