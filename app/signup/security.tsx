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
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, { paddingHorizontal: getResponsiveSize(24) }]}>
            {/* Header */}
            <View style={[styles.header, { marginBottom: getResponsiveSize(24) }]}>
              <TouchableOpacity
                style={[styles.backButton, { padding: getResponsiveSize(8) }]}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { fontSize: getResponsiveSize(16) }]}>Security Setup</Text>
            </View>
            
            <View style={[styles.titleContainer, { marginTop: getResponsiveSize(16) }]}>
              <Text style={[styles.mainTitle, { fontSize: getResponsiveSize(24) }]}>
                Secure Your Account
              </Text>
              <Text style={[styles.subtitle, { fontSize: getResponsiveSize(16) }]}>
                Set up biometric authentication for quick and secure access to your account.
              </Text>
            </View>

            {message && (
              <View style={[
                styles.messageContainer, 
                { 
                  marginTop: getResponsiveSize(16),
                  marginBottom: getResponsiveSize(16),
                  padding: getResponsiveSize(12),
                  backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF',
                  borderRadius: getResponsiveSize(8)
                }
              ]}>
                <Text style={[
                  styles.messageText,
                  { 
                    color: messageType === 'error' ? '#D92D20' : '#0072CE',
                    fontSize: getResponsiveSize(14)
                  }
                ]}>
                  {message}
                </Text>
              </View>
            )}

            {/* Biometric Setup Section */}
            <View style={[styles.biometricSection, { marginTop: getResponsiveSize(32) }]}>
              <View style={[styles.biometricHeader, { marginBottom: getResponsiveSize(32) }]}>
                <View style={[
                  styles.fingerprintIconContainer,
                  {
                    width: getResponsiveSize(96),
                    height: getResponsiveSize(96),
                    borderRadius: getResponsiveSize(48),
                    marginBottom: getResponsiveSize(16)
                  }
                ]}>
                  <MaterialCommunityIcons 
                    name="fingerprint" 
                    size={getResponsiveSize(48)} 
                    color="white" 
                  />
                </View>
                <Text style={[styles.biometricTitle, { fontSize: getResponsiveSize(18) }]}>
                  Biometric Authentication
                </Text>
                <Text style={[styles.biometricSubtitle, { fontSize: getResponsiveSize(14) }]}>
                  Use your fingerprint or face ID to quickly and securely access your account
                </Text>
              </View>

              {isChecking ? (
                <View style={[styles.loadingContainer, { paddingVertical: getResponsiveSize(32) }]}>
                  <ActivityIndicator size="large" color="#0072CE" />
                  <Text style={[styles.loadingText, { 
                    marginTop: getResponsiveSize(16),
                    fontSize: getResponsiveSize(14)
                  }]}>
                    Checking biometric availability...
                  </Text>
                </View>
              ) : isBiometricAvailable ? (
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        paddingVertical: getResponsiveSize(16),
                        borderRadius: getResponsiveSize(8),
                        opacity: isActivating ? 0.7 : 1
                      }
                    ]}
                    onPress={activateBiometric}
                    disabled={isActivating}
                  >
                    {isActivating ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={[styles.primaryButtonText, { fontSize: getResponsiveSize(16) }]}>
                          Setting up biometric...
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.primaryButtonText, { fontSize: getResponsiveSize(16) }]}>
                        Activate Biometric Login
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      {
                        paddingVertical: getResponsiveSize(16),
                        borderRadius: getResponsiveSize(8)
                      }
                    ]}
                    onPress={skipBiometric}
                  >
                    <Text style={[styles.secondaryButtonText, { fontSize: getResponsiveSize(16) }]}>
                      Skip for Now
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.unavailableContainer, { paddingVertical: getResponsiveSize(32) }]}>
                  <Ionicons name="warning-outline" size={getResponsiveSize(48)} color="#FF6B35" />
                  <Text style={[styles.unavailableText, { 
                    marginTop: getResponsiveSize(16),
                    fontSize: getResponsiveSize(14)
                  }]}>
                    Biometric authentication is not available on this device. You can still use your PIN to access your account.
                  </Text>
                  
                  <TouchableOpacity 
                    style={[
                      styles.continueButton,
                      {
                        paddingVertical: getResponsiveSize(16),
                        paddingHorizontal: getResponsiveSize(32),
                        borderRadius: getResponsiveSize(8),
                        marginTop: getResponsiveSize(24)
                      }
                    ]}
                    onPress={skipBiometric}
                  >
                    <Text style={[styles.continueButtonText, { fontSize: getResponsiveSize(16) }]}>
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

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: 16,
  },
  mainTitle: {
    fontWeight: 'bold',
    color: '#0072CE',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4F4F4F',
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  messageText: {
    textAlign: 'center',
  },
  biometricSection: {
    flex: 1,
  },
  biometricHeader: {
    alignItems: 'center',
  },
  fingerprintIconContainer: {
    backgroundColor: '#0072CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
  },
  biometricSubtitle: {
    textAlign: 'center',
    color: '#4B5563',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#4B5563',
  },
  buttonGroup: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#0072CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0072CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0072CE',
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unavailableContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  unavailableText: {
    textAlign: 'center',
    color: '#4B5563',
  },
  continueButton: {
    backgroundColor: '#0072CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
