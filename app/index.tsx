import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ImageBackground, Dimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useExitAppBackHandler } from './utils/backButtonHandler';

export default function Index() {
  console.log('🟢 Index component rendering - Expo Router found this route!');
  
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
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        width: '100%',
        height: '100%'
      }}
      resizeMode="cover"
    >
      {/* Overlay */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0072CE',
        opacity: 0.8
      }} />
      {/* Content */}
      <View style={{ flex: 1 }}>
        {/* Logo */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 32
        }}>
          <Image
            source={require("../assets/images/icon.png")}
            style={{ width: 96, height: 48 }}
            resizeMode="contain"
            tintColor="white"
          />
          <Text style={{
            color: 'white',
            fontSize: 36,
            fontWeight: '600',
            marginLeft: -24
          }}>esusu</Text>
        </View>
        {/* Main Content */}
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{
            color: 'white',
            fontSize: 30,
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 40
          }}>
            Earn More,{"\n"}Empower Your{"\n"}Community
          </Text>
          <Text style={{
            color: 'white',
            fontSize: 16,
            textAlign: 'center',
            marginTop: 16,
            opacity: 0.8,
            paddingHorizontal: 24
          }}>
            Turn your POS terminal into more than just transactions. Help customers
            save securely while earning commissions on every deposit.
          </Text>
        </View>
        {/* Buttons */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          marginBottom: 40
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: 'white',
              paddingVertical: 12,
              borderRadius: 16,
              alignItems: 'center',
              marginRight: 8
            }}
            onPress={() => router.push('/login')}
          >
            <Text style={{
              color: 'white',
              fontWeight: '600'
            }}>LOG IN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'white',
              paddingVertical: 12,
              borderRadius: 16,
              alignItems: 'center',
              marginLeft: 8
            }}
            onPress={() => router.push('/signup')}
          >
            <Text style={{
              color: '#0072CE',
              fontWeight: '600'
            }}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
