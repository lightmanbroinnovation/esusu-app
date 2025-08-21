import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useBackButtonHandler } from '../utils/backButtonHandler';

interface SecurityParams {
  phone?: string;
  pin?: string;
  userId?: string;
  bvn?: string;
  cacImageUrl?: string;
}

export default function SecurityScreen() {
  const router = useRouter();
  
  // Use back button handler for signup security page
  useBackButtonHandler('/signup/security');
  
  const params = useLocalSearchParams() as SecurityParams;
  const { width, height } = Dimensions.get('window');
  
  // Responsive sizing based on screen width
  const getResponsiveSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9; // Small phones
    } else if (width < 414) {
      return baseSize; // Medium phones
    } else {
      return baseSize * 1.1; // Large phones and tablets
    }
  };
  
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Helper function to set message with auto-clear
  const setMessageWithTimeout = (msg: string, type: 'error' | 'info', timeoutMs: number = 4000) => {
    // Clear any existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }
    
    setMessage(msg);
    setMessageType(type);
    
    // Set new timeout to clear message
    const timeout = setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, timeoutMs);
    
    setMessageTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, [messageTimeout]);
  
  useEffect(() => {
    checkBiometricAvailability();
    // Log received data when component mounts
    console.log('===== SECURITY SCREEN - RECEIVED DATA =====');
    console.log('Phone:', params.phone);
    console.log('PIN:', params.pin);
    console.log('User ID:', params.userId);
    console.log('BVN:', params.bvn);
    console.log('CAC Image URL:', params.cacImageUrl);
    console.log('==========================================');
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setIsChecking(true);
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      setIsBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const activateBiometric = async () => {
    try {
      setIsActivating(true);
      setMessage(null);
      setMessageType(null);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to activate biometric login',
        fallbackLabel: 'Use PIN instead',
        disableDeviceFallback: false,
      });
      if (result.success) {
        // Send POST to set-fingerprint endpoint
        const res = await fetch('https://esusu-server.onrender.com/api/merchant/set-fingerprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: true })
        });
        let data = null;
        let text = '';
        try {
          text = await res.text();
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.error('Full response object:', res);
          console.error('JSON parse error:', jsonErr, 'Response text:', text);
          setMessageWithTimeout('Server error: Invalid response format.', 'error', 4000);
          setIsActivating(false);
          return;
        }
        if (data && data.message) {
          setMessageWithTimeout(data.message, 'info', 4000);
        }
        router.replace('./success');
      } else {
        setMessageWithTimeout("We couldn't authenticate you using biometrics. Please try again or skip for now.", 'error', 4000);
      }
    } catch (error) {
      const err: any = error;
      if (err && err.message) {
        setMessageWithTimeout(err.message, 'error', 4000);
      } else {
        setMessageWithTimeout('An error occurred while setting up biometric authentication.', 'error', 4000);
      }
    } finally {
      setIsActivating(false);
    }
  };

  const skipBiometric = async () => {
    try {
      setMessage(null);
      setMessageType(null);
      router.replace('./success');
    } catch (error) {
      console.error('Error navigating to success screen:', error);
      Alert.alert(
        "Navigation Error",
        "There was a problem accessing the success page. Please try again.",
        [{
          text: "OK",
          onPress: () => router.replace('./success')
        }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-6" style={{ paddingHorizontal: getResponsiveSize(24) }}>
            {/* Header */}
            <View className="flex-row justify-between items-center" style={{ marginBottom: getResponsiveSize(24) }}>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.back()}
                style={{ padding: getResponsiveSize(8) }}
              >
                <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
              </TouchableOpacity>
              <Text className="font-semibold" style={{ fontSize: getResponsiveSize(16) }}>Security Setup</Text>
            </View>
            
            <View style={{ marginTop: getResponsiveSize(16) }}>
              <Text className="text-2xl font-bold text-[#0072CE] mb-2" style={{ fontSize: getResponsiveSize(24) }}>
                Secure Your Account
              </Text>
              <Text className="text-base text-[#4F4F4F]" style={{ fontSize: getResponsiveSize(16) }}>
                Set up biometric authentication for quick and secure access to your account.
              </Text>
            </View>

            {message && (
              <View style={{ 
                marginTop: getResponsiveSize(16), 
                marginBottom: getResponsiveSize(16), 
                padding: getResponsiveSize(12), 
                backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF', 
                borderRadius: getResponsiveSize(8) 
              }}>
                <Text style={{ 
                  color: messageType === 'error' ? '#D92D20' : '#0072CE', 
                  textAlign: 'center',
                  fontSize: getResponsiveSize(14)
                }}>{message}</Text>
              </View>
            )}

            {/* Biometric Setup Section */}
            <View style={{ marginTop: getResponsiveSize(32) }}>
              <View className="items-center mb-8" style={{ marginBottom: getResponsiveSize(32) }}>
                <View 
                  className="w-24 h-24 rounded-full bg-[#0072CE] items-center justify-center mb-4"
                  style={{
                    width: getResponsiveSize(96),
                    height: getResponsiveSize(96),
                    borderRadius: getResponsiveSize(48),
                    marginBottom: getResponsiveSize(16)
                  }}
                >
                  <MaterialCommunityIcons 
                    name="fingerprint" 
                    size={getResponsiveSize(48)} 
                    color="white" 
                  />
                </View>
                <Text className="text-lg font-semibold text-center mb-2" style={{ fontSize: getResponsiveSize(18) }}>
                  Biometric Authentication
                </Text>
                <Text className="text-center text-gray-600 px-4" style={{ fontSize: getResponsiveSize(14) }}>
                  Use your fingerprint or face ID to quickly and securely access your account
                </Text>
              </View>

              {isChecking ? (
                <View className="items-center py-8" style={{ paddingVertical: getResponsiveSize(32) }}>
                  <ActivityIndicator size="large" color="#0072CE" />
                  <Text className="mt-4 text-gray-600" style={{ 
                    marginTop: getResponsiveSize(16),
                    fontSize: getResponsiveSize(14)
                  }}>
                    Checking biometric availability...
                  </Text>
                </View>
              ) : isBiometricAvailable ? (
                <View className="space-y-4">
                  <TouchableOpacity
                    className="bg-[#0072CE] rounded-lg py-4 items-center"
                    onPress={activateBiometric}
                    disabled={isActivating}
                    style={{
                      paddingVertical: getResponsiveSize(16),
                      borderRadius: getResponsiveSize(8),
                      opacity: isActivating ? 0.7 : 1
                    }}
                  >
                    {isActivating ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white font-semibold ml-2" style={{ fontSize: getResponsiveSize(16) }}>
                          Setting up biometric...
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white font-semibold" style={{ fontSize: getResponsiveSize(16) }}>
                        Activate Biometric Login
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="border border-[#0072CE] rounded-lg py-4 items-center"
                    onPress={skipBiometric}
                    style={{
                      paddingVertical: getResponsiveSize(16),
                      borderRadius: getResponsiveSize(8)
                    }}
                  >
                    <Text className="text-[#0072CE] font-semibold" style={{ fontSize: getResponsiveSize(16) }}>
                      Skip for Now
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="items-center py-8" style={{ paddingVertical: getResponsiveSize(32) }}>
                  <Ionicons name="warning-outline" size={getResponsiveSize(48)} color="#FF6B35" />
                  <Text className="text-center text-gray-600 mt-4 px-4" style={{ 
                    marginTop: getResponsiveSize(16),
                    fontSize: getResponsiveSize(14)
                  }}>
                    Biometric authentication is not available on this device. You can still use your PIN to access your account.
                  </Text>
                  
                  <TouchableOpacity 
                    className="bg-[#0072CE] rounded-lg py-4 px-8 mt-6"
                    onPress={skipBiometric}
                    style={{
                      paddingVertical: getResponsiveSize(16),
                      paddingHorizontal: getResponsiveSize(32),
                      borderRadius: getResponsiveSize(8),
                      marginTop: getResponsiveSize(24)
                    }}
                  >
                    <Text className="text-white font-semibold" style={{ fontSize: getResponsiveSize(16) }}>
                      Continue with PIN
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
      </View>
    </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
