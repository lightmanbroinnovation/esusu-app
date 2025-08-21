export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration, Alert, ActivityIndicator, BackHandler, ScrollView } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { fetchUser, fetchUserByPhone } from '../../services/api';
import { getCachedData } from '../utils/dataCaching';
import { getDataInfo } from '../utils/clearAllData';
import { refreshAllUserData } from '../utils/dataRefresh';
import { sendNotification, NotificationTemplates } from '../services/notificationService';
import { useDisableBackHandler } from '../utils/backButtonHandler';
import { performHardLogout } from '../utils/logoutUtility';

export default function PasscodeScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(true); // State to toggle keypad visibility
  const [loading, setLoading] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [isFromLock, setIsFromLock] = useState<boolean>(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);
  const [showFingerprintModal, setShowFingerprintModal] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const phone = params.phone as string | undefined;
  const email = params.email as string | undefined;
  const loginMethod = params.loginMethod as 'phone' | 'email' | undefined;

  // Use disable back handler for passcode screen
  useDisableBackHandler();

  useEffect(() => {
    console.log("[Passcode] Screen loaded. Params:", params);
    // Check if this screen was opened due to app lock
    checkIfFromLock();
    
    // Check if we already have user data when coming from lock screen
    checkExistingSession();

    // Fetch and log cached user data (includes biometric status check)
    fetchAndLogCachedData();

    // Prevent going back if this is a locked session
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFromLock) {
        // Prevent going back when locked
        return true;
      }
      return false; // Allow default back behavior otherwise
    });

    return () => backHandler.remove();
  }, [isFromLock, isLoggingOut]);

  // Removed fallback biometric check since it's now handled in fetchAndLogCachedData

  useEffect(() => {
    // Check if PIN is complete (4 digits)
    if (pin.length === 4) {
      verifyPin();
    }
  }, [pin]);

  // Check if we should show fingerprint modal based on user data
  useEffect(() => {
    console.log('🔄 useEffect triggered - biometric status changed:', {
      isBiometricEnabled,
      showFingerprintModal,
      showKeypad
    });
    
    if (isBiometricEnabled) {
      console.log('✅ Biometric enabled, showing fingerprint modal');
      setShowFingerprintModal(true);
      setShowKeypad(false);
    } else {
      console.log('❌ Biometric disabled, showing keypad');
      setShowFingerprintModal(false);
      setShowKeypad(true);
    }
  }, [isBiometricEnabled]);

  // Removed direct fingerprint check since it's now handled in fetchAndLogCachedData

  // Add a debug effect to log state changes
  useEffect(() => {
    console.log('🔍 State change detected:', {
      isBiometricEnabled,
      showFingerprintModal,
      showKeypad
    });
    
    // Additional debug: Log the current biometric state
    if (isBiometricEnabled) {
      console.log('🎯 BIOMETRIC ENABLED - Should show fingerprint modal');
    } else {
      console.log('❌ BIOMETRIC DISABLED - Should show keypad');
    }
  }, [isBiometricEnabled, showFingerprintModal, showKeypad]);

  const fetchAndLogCachedData = async () => {
    try {
      console.log('🔍 Fetching and logging cached data...');
      
      // Get data info
      const dataInfo = await getDataInfo();
      console.log('📊 Data Info:', JSON.stringify(dataInfo, null, 2));
      
      // Try to get cached user data
      try {
        const cachedUserData = await getCachedData('userData', async () => {
          console.log('No cached user data found, fetching fresh...');
          return await fetchUser();
        });
        console.log('👤 Cached User Data:', JSON.stringify(cachedUserData, null, 2));
        
        // Specifically log biometric-related fields
        if (cachedUserData) {
          console.log('🔐 Biometric fields in cached user data:', {
            fingerprint: cachedUserData.fingerprint || cachedUserData.data?.user?.fingerprint,
            hasBiometric: cachedUserData.hasBiometric || cachedUserData.data?.user?.hasBiometric,
            biometricStatus: cachedUserData.biometricStatus || cachedUserData.data?.user?.biometricStatus
          });
          
          // Check if we have fingerprint data and update biometric status
          const hasFingerprint = cachedUserData.data?.user?.fingerprint === true;
          console.log('🎯 Fingerprint check result:', {
            hasFingerprint,
            fingerprintValue: cachedUserData.data?.user?.fingerprint,
            fingerprintType: typeof cachedUserData.data?.user?.fingerprint
          });
          
          if (hasFingerprint) {
            console.log('✅ Found fingerprint in cached data, checking device capability...');
            
            // Check device capability
            const [hasHardware, isEnrolled] = await Promise.all([
              LocalAuthentication.hasHardwareAsync(),
              LocalAuthentication.isEnrolledAsync()
            ]);
            
            console.log('📱 Device capability for fingerprint:', { hasHardware, isEnrolled });
            
            if (hasHardware && isEnrolled) {
              console.log('✅ Device capable, enabling biometric...');
              setIsBiometricEnabled(true);
            } else {
              console.log('❌ Device not capable of biometrics');
              setIsBiometricEnabled(false);
            }
          } else {
            console.log('❌ No fingerprint data found in cached user data');
            setIsBiometricEnabled(false);
          }
        }
      } catch (error) {
        console.log('❌ Error fetching cached user data:', error);
      }
      
      // Get all AsyncStorage keys and their values
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔑 All AsyncStorage Keys:', allKeys);
      
      // Log important keys
      const importantKeys = [
        'auth_token',
        'userId',
        'userPhone',
        'userData',
        'isLoggedIn',
        'fingerprint', // Changed from 'biometricEnabled' to 'fingerprint'
        'biometricStatus'
      ];
      
      for (const key of importantKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            console.log(`📝 ${key}:`, value);
            
            // Try to parse JSON for userData
            if (key === 'userData') {
              try {
                const parsedUserData = JSON.parse(value);
                console.log(`📝 ${key} (parsed):`, JSON.stringify(parsedUserData, null, 2));
                console.log(`🔐 ${key} biometric fields:`, {
                  fingerprint: parsedUserData.fingerprint || parsedUserData.data?.user?.fingerprint,
                  hasBiometric: parsedUserData.hasBiometric || parsedUserData.data?.user?.hasBiometric,
                  biometricStatus: parsedUserData.biometricStatus || parsedUserData.data?.user?.biometricStatus
                });
              } catch (parseError) {
                console.log(`❌ Error parsing ${key}:`, parseError);
              }
            }
          } else {
            console.log(`📝 ${key}: null/undefined`);
          }
        } catch (error) {
          console.log(`❌ Error reading ${key}:`, error);
        }
      }
      
      // Log cache keys
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      console.log('🗄️ Cache Keys:', cacheKeys);
      
      // Try to get some cached data
      for (const cacheKey of cacheKeys.slice(0, 3)) { // Only first 3 to avoid spam
        try {
          const cachedValue = await AsyncStorage.getItem(cacheKey);
          if (cachedValue) {
            const parsed = JSON.parse(cachedValue);
            console.log(`🗄️ ${cacheKey}:`, JSON.stringify(parsed, null, 2));
          }
        } catch (error) {
          console.log(`❌ Error reading cache ${cacheKey}:`, error);
        }
      }
      
      // Check biometric-specific storage
      console.log('🔐 Checking biometric-specific storage...');
      const biometricKeys = allKeys.filter(key => 
        key.toLowerCase().includes('biometric') || 
        key.toLowerCase().includes('fingerprint') ||
        key.toLowerCase().includes('auth')
      );
      console.log('🔐 Biometric-related keys:', biometricKeys);
      
      for (const key of biometricKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          console.log(`🔐 ${key}:`, value);
        } catch (error) {
          console.log(`❌ Error reading biometric key ${key}:`, error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in fetchAndLogCachedData:', error);
    }
  };

  // Removed checkBiometricStatus function - now handled in fetchAndLogCachedData

  // Check if we were redirected here from the lock function
  const checkIfFromLock = async () => {
    try {
      const [storedUserId, storedPhone] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userPhone')
      ]);
      
      if (storedUserId && storedPhone) {
        console.log("Found stored user session, retrieving PIN");
        setIsFromLock(true);
      } else {
        console.log("This is a normal login session");
        setIsFromLock(false);
      }
    } catch (error) {
      console.error("Error checking if from lock:", error);
    }
  };

  // Check if we already have a user session for the lock screen
  const checkExistingSession = async () => {
    // Skip session check if we're in the process of logging out
    if (isLoggingOut) {
      console.log("🔄 Skipping session check - logout in progress");
      return;
    }
    
    // If this is a lock screen and we don't have user ID and PIN from params
    if (!params.userId || !params.pin) {
      try {
        console.log("No user data in params, attempting to retrieve from storage");
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedPhone = await AsyncStorage.getItem('userPhone');
        
        // Allow login if phone param exists, even if no stored session
        if (phone || storedPhone) {
          // Proceed as normal
          return;
        } else {
          // Check if we're in the process of logging out (no auth token)
          const authToken = await AsyncStorage.getItem('auth_token');
          if (!authToken) {
            console.log("No auth token found, likely logging out - not redirecting");
            return;
          }
          
          console.warn("No stored user session or phone param found, redirecting to login");
          router.replace('/login');
        }
      } catch (error) {
        console.error("Error retrieving user session:", error);
        Alert.alert(
          "Session Error", 
          "Unable to retrieve your session information. Please log in again.",
          [{ text: "OK", onPress: () => router.replace('/login') }]
        );
      }
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const verifyPin = async (useFingerprint = false) => {
    setLoading(true);
    try {
      const loginValue = phone || email;
      const loginType = loginMethod || (phone ? 'phone' : 'email');
      
      console.log("[Passcode] verifyPin called with:", loginType, loginValue, "pin:", pin);
      
      if (!loginValue) {
        Alert.alert("Error", `Invalid ${loginType}. Please try again.`);
        setPin("");
        return;
      }
      
      if (loginType === 'phone' && (!phone || phone.length !== 11)) {
        Alert.alert("Error", "Invalid phone number. Please try again.");
        setPin("");
        return;
      }
      
      if (loginType === 'email' && !email) {
        Alert.alert("Error", "Invalid email address. Please try again.");
        setPin("");
        return;
      }
      
      // Call backend to login
      let response;
      if (useFingerprint) {
        response = await fetchUserByPhone(loginValue, { fingerprint: true });
      } else {
        response = await fetchUserByPhone(loginValue, pin);
      }
      console.log('[Passcode] Login Response:', response);

      if (response && response.data && response.data.token) {
        // Store auth token
        await AsyncStorage.setItem('auth_token', response.data.token);
        // Store user data
        if (phone) await AsyncStorage.setItem('userPhone', phone);
        if (email) await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        
        // If user data is included in response, store it
        if (response.data.user) {
          await AsyncStorage.setItem('userId', response.data.user._id);
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        }

        // Send device notification for login
        await sendNotification(
          NotificationTemplates.auth.login.title,
          NotificationTemplates.auth.login.body,
          NotificationTemplates.auth.login.type
        );

        console.log("[Passcode] Login successful, refreshing all data...");
        
        // Refresh all user data after successful login
        try {
          await refreshAllUserData();
          console.log("[Passcode] All data refreshed successfully");
        } catch (error) {
          console.log("[Passcode] Warning: Some data refresh failed:", error);
          // Continue with navigation even if refresh fails
        }
        
        // Navigate to dashboard
        router.replace('/dashboard');
      } else {
        console.log("[Passcode] Login failed, invalid response:", response);
        Vibration.vibrate(300);
        Alert.alert("Login Failed", "Incorrect passcode or credentials. Please try again.");
        setPin("");
      }
    } catch (error: any) {
      console.error("[Passcode] Error during login:", error);
      Vibration.vibrate(300);
      // Show error message from server if available, else fallback
      let errorMessage = "An error occurred. Please try again.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      dispatch(addNotification({
        type: 'error',
        title: 'Login Failed',
        body: errorMessage
      }));
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintAuth = async () => {
    try {
      setLoading(true);
      // Only require phone (not userId) for biometric auth
      const currentPhone = phone || await AsyncStorage.getItem('userPhone');
      if (!currentPhone) {
        console.error('Missing phone for biometric auth:', { currentPhone });
        throw new Error('User session not found');
      }
      // Check device capability
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync()
      ]);
      if (!hasHardware) {
        throw new Error("Your device doesn't support biometric authentication");
      }
      if (!isEnrolled) {
        throw new Error("No biometrics found. Please set up fingerprint authentication in your device settings.");
      }
      // Attempt biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate with fingerprint",
        fallbackLabel: "Use PIN",
        disableDeviceFallback: false
      });
      if (result.success) {
        console.log('Biometric authentication successful');
        // Save session and proceed
        await verifyPin(true); // Pass true to indicate fingerprint
      } else if (result.error === "user_cancel") {
        console.log('User cancelled biometric auth');
        setLoading(false);
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      console.error("Biometric auth error:", error);
      setLoading(false);
      
      // Show appropriate error message based on the error
      let errorMessage = "Please use your PIN instead.";
      if (error instanceof Error) {
        switch (error.message) {
          case "User session not found":
            errorMessage = "Please log in again to use biometric authentication.";
            break;
          case "Your device doesn't support biometric authentication":
          case "No biometrics found. Please set up fingerprint authentication in your device settings.":
            errorMessage = error.message;
            break;
          case "User data not found":
            errorMessage = "Unable to verify your account. Please use your PIN.";
            break;
          case "Biometric authentication failed":
            errorMessage = "Authentication failed. Please try again or use your PIN.";
            break;
          default:
            errorMessage = "An error occurred. Please use your PIN instead.";
        }
      }
      
      Alert.alert(
        "Authentication Error", 
        errorMessage,
        [{ text: "OK" }]
      );
    }
  };

  const handleSwitchAccount = async () => {
    try {
      console.log('🔄 User requested to switch account - performing hard logout...');
      
      // Show confirmation dialog
      Alert.alert(
        "Switch Account",
        "This will clear all data and return you to the login screen. Are you sure?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Switch Account",
            style: "destructive",
            onPress: async () => {
              try {
                setIsLoggingOut(true);
                console.log('🔄 Setting logout flag to prevent session checks...');
                
                // Perform hard logout to clear everything
                await performHardLogout();
              } catch (logoutError) {
                console.error('Hard logout failed:', logoutError);
                setIsLoggingOut(false);
                // Fallback: try to navigate to login page anyway
                try {
                  router.replace('/login');
                } catch (navError) {
                  console.error('Navigation failed:', navError);
                  Alert.alert("Error", "Failed to switch account. Please restart the app.");
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error during switch account:', error);
      Alert.alert("Error", "Failed to switch account. Please try again.");
    }
  };

  const showKeypadInstead = () => {
    setShowFingerprintModal(false);
    setShowKeypad(true);
  };

  const renderFingerprintModal = () => {
    return (
      <View className="absolute inset-0 bg-gray-500 bg-opacity-10 flex-1 z-30">
        <View className="flex-1 justify-end pb-0">
          <View className="bg-white rounded-t-3xl p-8 shadow-lg w-full">
            <View className="items-center">
              <TouchableOpacity
                onPress={handleFingerprintAuth}
                className="items-center"
                disabled={loading}
              >
                <MaterialIcons name="fingerprint" size={80} color="#0072CE" />
                {loading && (
                  <ActivityIndicator size="small" color="#0072CE" className="mt-2" />
                )}
              </TouchableOpacity>
              
              <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
                Use Fingerprint
              </Text>
              <Text className="text-gray-600 text-center mt-2 mb-6">
                Tap the fingerprint icon to authenticate
              </Text>
              
              <TouchableOpacity
                onPress={showKeypadInstead}
                className="py-3 px-6 bg-gray-100 rounded-xl"
                disabled={loading}
              >
                <Text className="text-gray-700 font-medium">Login with Passcode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderPinInputs = () => {
    return (
      <View className="flex-row justify-center space-x-8 mt-3 ">
        {[0, 1, 2, 3].map((i) => (
          <View 
            key={i}
            className="w-12 h-12 items-center justify-between mr-2 rounded-full border-2" 
            style={{
              borderColor: i < pin.length ? "#0072CE" : "#ccc",
              backgroundColor: i < pin.length ? "#0072CE" : "transparent",
            }}
          >
            {i < pin.length && (
              <View className="w-4 h-4 rounded-full bg-white" />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
    return (
      <View className="mt-10 space-y-8 w-full">
        {Array(4)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-around">
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                key ? (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      if (key === "⌫") {
                        handleBackspace();
                      } else {
                        handleKeyPress(key);
                      }
                    }}
                    className="w-20 h-20 bg-white justify-center items-center rounded-full"
                    style={{ 
                      opacity: loading ? 0.6 : 1,
                    }}
                    disabled={loading}
                  >
                    {key === "⌫" ? (
                      <Ionicons name="backspace-outline" size={28} color="#0072CE" />
                    ) : (
                      <Text className="text-3xl font-semibold text-[#0072CE]">{key}</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View key={`empty-${rowIndex}-${Math.random()}`} className="w-20 h-20" />
                )
              ))}
            </View>
          ))}
      </View>
    );
  };

    return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-20 pb-6">
        {/* Top section */}
        <View className="items-center">
          <Text className="text-2xl font-bold text-primaryText">Enter passcode</Text>
          <Text className="text-gray-500 mt-2 mb-16">Enter your passcode to log in</Text>

          {renderPinInputs()}

          {loading && (
            <ActivityIndicator size="large" color="#0072CE" className="mt-6" />
          )}

          <TouchableOpacity 
            className="mt-4"
            onPress={() => router.push({
              pathname: "/reset",
              params: { phone, email, loginMethod }
            })}
            disabled={loading}
          >
            <Text className="text-sm text-primaryText">Forgot passcode?</Text>
          </TouchableOpacity>
          
          {/* Show fingerprint option if available but not currently using it */}
          {isBiometricEnabled && (
            <TouchableOpacity 
              onPress={() => {
                setShowKeypad(false);
                setShowFingerprintModal(true);
              }} 
              className="mt-6 items-center"
              disabled={loading}
            >
              <MaterialIcons name="fingerprint" size={40} color="#0072CE" />
              <Text className="text-sm text-primaryText mt-1">Use fingerprint</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Keypad */}
        {showKeypad && renderKeypad()}

        {/* Switch Account */}
        <TouchableOpacity
          className="mt-8 mb-4 items-center"
          onPress={handleSwitchAccount}
          disabled={loading}
        >
          <Text className="text-base text-[#0072CE] font-semibold">Switch Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fingerprint Modal Overlay */}
      {showFingerprintModal && renderFingerprintModal()}
    </View>
  );
}
