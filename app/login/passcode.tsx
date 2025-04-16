export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration, Alert, ActivityIndicator } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PasscodeScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(true); // State to toggle keypad visibility
  const [loading, setLoading] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Extract needed params
  const userPin = params.pin as string;
  const userId = params.userId as string;
  const phone = params.phone as string;

  useEffect(() => {
    // Check if PIN is complete (4 digits)
    if (pin.length === 4) {
      verifyPin();
    }
  }, [pin]);

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
    
    // Simulate API call delay
    setTimeout(() => {
      if (pin === userPin) {
        // Successful login - save user ID to AsyncStorage
        console.log("PIN verification successful, saving session...");
        saveUserSession(userId, phone);
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
    }, 1000);
  };

  const saveUserSession = async (userId: string, phone: string) => {
    try {
      console.log(`Saving user session: userId=${userId}, phone=${phone}`);
      
      // Save user session data
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userPhone', phone);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      
      console.log('User session saved successfully, navigating to dashboard');
      
      // Use a short timeout to ensure AsyncStorage completes before navigation
      setTimeout(async () => {
        try {
          console.log('Attempting to navigate after successful authentication');
          // Check if we have a stored route to return to after authentication
          const lastRoute = await AsyncStorage.getItem('lastRoute');
          if (lastRoute && lastRoute !== '/login/passcode') {
            console.log(`Returning to previous route: ${lastRoute}`);
            router.replace(lastRoute);
            // Clear the stored route
            await AsyncStorage.removeItem('lastRoute');
          } else {
            // Default to dashboard if no stored route
            console.log('No stored route found, navigating to dashboard');
            router.replace('/dashboard');
          }
        } catch (navError) {
          console.error('Navigation error:', navError);
          Alert.alert('Navigation Error', 'Failed to navigate. Please try again.');
          setLoading(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error saving user session:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
      setLoading(false);
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
        saveUserSession(userId, phone);
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
      <View className="flex-row justify-center space-x-8 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <View 
            key={i}
            className="w-12 h-12 items-center justify-center rounded-full border-2" 
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
