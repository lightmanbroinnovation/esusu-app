import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ImageBackground, Dimensions, StyleSheet } from "react-native";
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
  const windowWidth = Dimensions.get('window').width;
  
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
      <View style={styles.splashContainer}>
        <Image
          source={require("../assets/images/icon.png")}
          style={[styles.splashImage, { width: windowWidth * 0.28, height: windowWidth * 0.28 }]}
        />
      </View>
    );
  }

  // Always show onboarding/main content, even if offline
  return (
    <ImageBackground
      source={require("../assets/images/Onboarding1.png")}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
      resizeMode="cover"
    >
      {/* Overlay */}
      <View style={styles.overlay} />
      {/* Content */}
      <View style={[styles.content, {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
            tintColor="white"
          />
          <Text style={styles.logoText}>esusu</Text>
        </View>
        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.mainTitle}>
            Earn More,{"\n"}Empower Your{"\n"}Community
          </Text>
          <Text style={styles.description}>
            Turn your POS terminal into more than just transactions. Help customers
            save securely while earning commissions on every deposit.
          </Text>
        </View>
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.loginButtonText}>LOG IN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
            <Text style={styles.signupButtonText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#e6f0fb',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  splashImage: {
    resizeMode: 'contain',
  },
  backgroundImage: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,

  },
  backgroundImageStyle: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    opacity: 0.8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0072CE',
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  logo: {
    width: 96,
    height: 48,
  },
  logoText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '600',
    marginLeft: -24,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  description: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.8,
    paddingHorizontal: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 16,
  },
  loginButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'white',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  signupButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#0072CE',
    fontWeight: '600',
  },
});
