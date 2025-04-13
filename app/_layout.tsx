import React from 'react';
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import "./global.css";

// This is the root layout that wraps all screens in your app
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

// Handle errors that might occur during rendering
export function ErrorBoundary(props: { error: Error }) {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="error" options={{ title: 'Error' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

