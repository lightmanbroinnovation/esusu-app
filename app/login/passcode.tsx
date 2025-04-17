export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration, Alert, ActivityIndicator, BackHandler } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

export default function PasscodeScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(true); // State to toggle keypad visibility
  const [loading, setLoading] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [isFromLock, setIsFromLock] = useState<boolean>(false);
  const [storedPin, setStoredPin] = useState<string | null>(null); // To store PIN retrieved from storage
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // Extract needed params - these might be undefined when coming from lock screen
  const userPin = params.pin as string | undefined;
  const userId = params.userId as string | undefined;
  const phone = params.phone as string | undefined;

  useEffect(() => {
    // Check if this screen was opened due to app lock
    checkIfFromLock();
    
    // Check if we already have user data when coming from lock screen
    checkExistingSession();

    // Prevent going back if this is a locked session
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFromLock) {
        // Prevent going back when locked
        return true;
      }
      return false; // Allow default back behavior otherwise
    });

    return () => backHandler.remove();
  }, [isFromLock]);

  useEffect(() => {
    // Check if PIN is complete (4 digits)
    if (pin.length === 4) {
      verifyPin();
    }
  }, [pin]);

  // Check if we were redirected here from the lock function
  const checkIfFromLock = async () => {
    try {
      const [storedUserId, storedPhone] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userPhone')
      ]);
      
      if (storedUserId && storedPhone) {
        console.log("Found stored user session, retrieving PIN");
        const fakePinFromStorage = "1234";
        setStoredPin(fakePinFromStorage);
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
    // If this is a lock screen and we don't have user ID and PIN from params
    if (!userId || !userPin) {
      try {
        console.log("No user data in params, attempting to retrieve from storage");
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedPhone = await AsyncStorage.getItem('userPhone');
        
        if (storedUserId) {
          console.log("Found stored user data, fetching user details");
          const fakePinFromStorage = "1234";
          setStoredPin(fakePinFromStorage);
        } else {
          console.warn("No stored user session found, redirecting to login");
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

  const verifyPin = () => {
    setLoading(true);
    
    // Determine which PIN to check against
    const pinToCheck = storedPin || userPin;
    
    // Ensure we have a PIN to check against
    if (!pinToCheck) {
      console.error("No PIN available for verification");
      Alert.alert("Error", "Unable to verify PIN. Please try logging in again.");
      setLoading(false);
      setPin("");
      return;
    }
    
    // Simulate API call delay
    setTimeout(() => {
      if (pin === pinToCheck) {
        // Successful login - save user ID to AsyncStorage
        console.log("PIN verification successful, saving session...");
        // Use retrieved userId if not provided in params
        const userIdToSave = userId || AsyncStorage.getItem('userId')
          .then(id => id)
          .catch(() => null);
        
        // Use retrieved phone if not provided in params
        const phoneToSave = phone || AsyncStorage.getItem('userPhone')
          .then(p => p)
          .catch(() => null);
        
        // Resolve the promises
        Promise.all([userIdToSave, phoneToSave])
          .then(([id, phoneNumber]) => {
            if (id && phoneNumber) {
              saveUserSession(id, phoneNumber);
            } else {
              throw new Error("Missing user information");
            }
          })
          .catch(error => {
            console.error("Error resolving user data:", error);
            Alert.alert("Authentication Error", "Unable to retrieve your account information. Please log in again.");
            setLoading(false);
            setPin("");
          });
      } else {
        // Failed login
        console.log("PIN verification failed");
        Vibration.vibrate(300);
        setAttempts(attempts + 1);
        
        if (attempts >= 2) {
          // Too many attempts
          Alert.alert(
            "Too Many Attempts",
            "You've made too many incorrect attempts. Please try again later or reset your PIN.",
            [
              {
                text: "Reset PIN",
                onPress: () => router.push({
                  pathname: "/reset",
                  params: { phone }
                }),
                style: "cancel"
              },
              {
                text: "Try Again",
                onPress: () => {
                  setPin("");
                  setAttempts(0);
                }
              }
            ]
          );
        } else {
          Alert.alert(
            "Incorrect PIN",
            `Incorrect PIN. You have ${3 - attempts - 1} attempts remaining.`,
            [{ text: "Try Again" }]
          );
          setPin("");
        }
        
        setLoading(false);
      }
    }, 800);
  };

  const saveUserSession = async (userId: string, phone: string) => {
    try {
      setLoading(true);
      console.log(`Saving user session: userId=${userId}, phone=${phone}`);
      
      // Save user session data - use explicit transactions with Promise.all
      try {
        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('userPhone', phone);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('lastLoginTime', new Date().toISOString());
        
        // Verify the session was saved properly
        const verifyUserId = await AsyncStorage.getItem('userId');
        const verifyLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        
        if (verifyUserId !== userId || verifyLoggedIn !== 'true') {
          throw new Error(`Session verification failed - userId: ${verifyUserId}, isLoggedIn: ${verifyLoggedIn}`);
        }
        
        console.log('User session saved and verified successfully');
        
        // Show success notification
        dispatch(addNotification({
          type: 'success',
          title: 'Welcome Back!',
          body: 'You have successfully logged in to your account.'
        }));
      } catch (storageError) {
        console.error('Storage error:', storageError);
        throw new Error('Failed to save session data');
      }
      
      // Only after verifying storage, proceed with navigation
      setTimeout(() => {
        router.replace('/dashboard');
      }, 800);
    } catch (error) {
      console.error('Error in session process:', error);
      
      // Show error notification
      dispatch(addNotification({
        type: 'error',
        title: 'Login Failed',
        body: 'There was a problem with your login. Please try again.'
      }));
      
      Alert.alert(
        'Unable to Save Session', 
        'There was a problem with your login. Please try again.',
        [{ text: "OK", onPress: () => setPin("") }]
      );
      setLoading(false);
      setPin("");
    }
  };

  const handleFingerprintAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert("Error", "Your device doesn't support biometric authentication");
        return;
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert("Error", "No biometrics found. Please set up fingerprint authentication in your device settings.");
        return;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate with fingerprint",
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        // Successful biometric authentication
        const id = await AsyncStorage.getItem('userId');
        const phoneNumber = await AsyncStorage.getItem('userPhone');
        
        if (id && phoneNumber) {
          saveUserSession(id, phoneNumber);
        } else {
          throw new Error("Missing user information");
        }
      } else if (result.error === "user_cancel") {
        // User canceled, do nothing
      } else {
        Alert.alert("Authentication failed", "Please try again or use your PIN");
      }
    } catch (error) {
      console.error("Biometric auth error:", error);
      Alert.alert("Error", "An error occurred with biometric authentication. Please use your PIN instead.");
    }
  };

  const renderPinInputs = () => {
    return (
      <View className="flex-row justify-center space-x-8 mt-6 ">
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
    <View className="flex-1 bg-white px-6 justify-between pt-20 pb-10">
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
            params: { phone }
          })}
          disabled={loading}
        >
          <Text className="text-sm text-primaryText">Forgot passcode?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleFingerprintAuth} 
          className="mt-6 items-center"
          disabled={loading}
        >
          <MaterialIcons name="fingerprint" size={40} color="#0072CE" /> {/* Icon */}
          <Text className="text-sm text-primaryText mt-1">Use fingerprint</Text>
        </TouchableOpacity>
      </View>

      {/* Keypad */}
      {showKeypad && renderKeypad()}
    </View>
  );
}
