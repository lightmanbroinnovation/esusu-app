import React from 'react';
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme as useNativeColorScheme, ScrollView } from 'react-native';
import "./global.css";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { LoadingProvider } from './context/LoadingContext';

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
  return useNativeColorScheme() ?? 'light';
}

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <LoadingProvider>
        <StatusBar style="auto" translucent />
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: 'white',
              },
              animation: 'slide_from_right'
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </LoadingProvider>
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

