import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ImageBackground, Dimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useExitAppBackHandler } from './utils/backButtonHandler';

export default function Index() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Use exit app back handler for main index page
  useExitAppBackHandler();

  useEffect(() => {
    let splashTimeout: NodeJS.Timeout | undefined;
    const checkFirstTime = async () => {
      try {
        const [phone, token] = await Promise.all([
          AsyncStorage.getItem('userPhone'),
          AsyncStorage.getItem('auth_token')
        ]);
        // Only redirect to passcode if there is both a phone and a valid token
        if (phone && token) {
          router.replace({ pathname: '/login/passcode', params: { phone } });
          return;
        }
      } catch (e) {
        // Ignore error, show onboarding
      }
      setCheckingSession(false);
      splashTimeout = setTimeout(() => setShowSplash(false), 1800); // Show splash for ~1.8s
    };
    checkFirstTime();
    return () => {
      if (splashTimeout) clearTimeout(splashTimeout);
    };
  }, [router]);

  if (checkingSession || showSplash) {
    // Responsive splash screen
    return (
      <View style={{ flex: 1, backgroundColor: '#e6f0fb', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
        <Image
          source={require("../assets/images/icon.png")}
          style={{ width: Dimensions.get('window').width * 0.28, height: Dimensions.get('window').width * 0.28, resizeMode: 'contain' }}
        />
      </View>
    );
  }

  // Always show onboarding/main content, even if offline
  return (
    <ImageBackground
      source={require("../assets/images/Onboarding1.png")}
      className="flex-1"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        width: '100%',
        height: '100%'
      }}
      resizeMode="cover"
    >
      {/* Overlay */}
      <View className="absolute inset-0 bg-[#0072CE] opacity-80" />
      {/* Content */}
      <View className="flex-1">
        {/* Logo */}
        <View className="flex-row items-center justify-center mt-8">
          <Image
            source={require("../assets/images/icon.png")}
            className="w-24 h-12"
            resizeMode="contain"
            tintColor="white"
          />
          <Text className="text-white text-4xl font-semibold -ml-6">esusu</Text>
        </View>
        {/* Main Content */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-3xl font-bold text-center leading-10">
            Earn More,{"\n"}Empower Your{"\n"}Community
          </Text>
          <Text className="text-white text-base text-center mt-4 opacity-80 px-6">
            Turn your POS terminal into more than just transactions. Help customers
            save securely while earning commissions on every deposit.
          </Text>
        </View>
        {/* Buttons */}
        <View className="flex-row justify-between px-6 mb-10 gap-4">
          <TouchableOpacity className="flex-1 border border-white py-3 rounded-2xl items-center" onPress={() => router.push('/login')}>
              <Text className="text-white font-semibold">LOG IN</Text>
            </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white py-3 rounded-2xl items-center" onPress={() => router.push('/signup')}>
              <Text className="text-[#0072CE] font-semibold">SIGN UP</Text>
            </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
