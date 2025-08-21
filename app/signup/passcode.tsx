export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Alert,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { completeBasicSignup } from "../../services/api";
import { useDisableBackHandler } from '../utils/backButtonHandler';

interface PasscodeParams {
  phone?: string;
  phoneNumber?: string;
  verificationCode?: string;
  gmail?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
}

export default function PasscodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber || params.phone;
  const email = params.email;
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Use disable back handler for passcode screen
  useDisableBackHandler();

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

  const handleKeyPress = (digit: string) => {
    if (isConfirming) {
      if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + digit);
      }
    } else {
      if (pin.length < 4) {
      setPin(pin + digit);
      }
    }
  };

  const handleBackspace = () => {
    if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const renderPinInputs = () => {
    const currentPin = isConfirming ? confirmPin : pin;
    const maxLength = 4;

    return (
      <View className="flex-row justify-center space-x-4 mb-8">
        {Array.from({ length: maxLength }, (_, index) => (
          <View
            key={index}
            className={`w-12 h-12 border-2 rounded-lg items-center justify-center ${
              index < currentPin.length ? "border-[#0072CE] bg-[#0072CE]" : "border-gray-300"
            }`}
            style={{
              width: getResponsiveSize(48),
              height: getResponsiveSize(48),
              borderRadius: getResponsiveSize(8),
              borderWidth: getResponsiveSize(2)
            }}
          >
            {index < currentPin.length && (
              <View
                className="w-3 h-3 rounded-full bg-white"
                style={{
                  width: getResponsiveSize(12),
                  height: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(6)
                }}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const digits = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace']
    ];

    return (
      <View className="px-6">
        {digits.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-center space-x-4 mb-4">
            {row.map((digit, digitIndex) => (
                <TouchableOpacity
                key={digitIndex}
                className={`w-16 h-16 rounded-full items-center justify-center ${
                  digit === 'backspace' ? 'bg-gray-200' : digit === '' ? 'bg-transparent' : 'bg-gray-100'
                }`}
                style={{
                  width: getResponsiveSize(64),
                  height: getResponsiveSize(64),
                  borderRadius: getResponsiveSize(32)
                }}
                onPress={() => {
                  if (digit === 'backspace') {
                    handleBackspace();
                  } else if (digit !== '') {
                    handleKeyPress(digit);
                  }
                }}
                disabled={digit === ''}
              >
                {digit === 'backspace' ? (
                  <Ionicons name="backspace-outline" size={getResponsiveSize(24)} color="#666" />
                ) : digit !== '' ? (
                  <Text className="text-2xl font-semibold text-gray-800" style={{ fontSize: getResponsiveSize(24) }}>
                    {digit}
                  </Text>
                ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </View>
    );
  };

  const handleSubmit = async () => {
    if (isConfirming) {
      if (confirmPin.length !== 4) {
        Vibration.vibrate(100);
        setMessageWithTimeout("Please enter a 4-digit PIN", "error", 3000);
        return;
      }

      if (pin === confirmPin) {
        setLoading(true);
        try {
          const userData = {
            phone: phoneNumber || '',
            email: email || '',
            firstName: params.firstName || '',
            lastName: params.lastName || '',
            dob: params.dob || '',
            pin: pin
          };

          console.log('Submitting user data:', userData);

                     const response = await completeBasicSignup(userData.phone, userData.email, Number(userData.pin));
          
          if (response.status === "Success") {
            setMessageWithTimeout("Registration successful! Redirecting to login...", "info", 2000);
            setTimeout(() => {
              router.replace("/login");
            }, 2000);
          } else {
            setMessageWithTimeout(response.data?.message || response.message || "Could not complete signup. Please try again.", "error", 4000);
          }
        } catch (error) {
          console.error("Error during basic signup:", error);
          const err: any = error;
          if (err && typeof err === 'object') {
            if (err.response && err.response.data && err.response.data.message) {
              setMessageWithTimeout(err.response.data.message, "error", 4000);
            } else if (err.message) {
              setMessageWithTimeout(err.message, "error", 4000);
            } else {
              setMessageWithTimeout("Failed to complete signup. Please check your network and try again.", "error", 4000);
            }
          } else if (typeof err === 'string') {
            setMessageWithTimeout(err, "error", 4000);
          } else {
            setMessageWithTimeout("Failed to complete signup. Please check your network and try again.", "error", 4000);
          }
        } finally {
          setLoading(false); // Stop loading
        }
      } else {
        Vibration.vibrate(100);
        setMessageWithTimeout("Passcodes do not match. Please try again.", "error", 4000);
        setConfirmPin("");
      }
    } else {
      if (pin.length !== 4) {
        Vibration.vibrate(100);
        setMessageWithTimeout("Please enter a 4-digit PIN", "error", 3000);
        return;
      }
      setIsConfirming(true);
      setMessageWithTimeout("Please confirm your PIN", "info", 3000);
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
        <View className="flex-1 px-6 justify-between pb-10" style={{
          paddingHorizontal: getResponsiveSize(24),
          paddingBottom: getResponsiveSize(40)
        }}>
      {/* Top section */}
      {/* Header */}
          <View className="flex-row justify-between items-center" style={{ marginTop: getResponsiveSize(64), marginBottom: getResponsiveSize(32) }}>
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.back()}
              style={{ padding: getResponsiveSize(8) }}
        >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
        </TouchableOpacity>
            <Text className="font-semibold" style={{ fontSize: getResponsiveSize(16) }}>Step 3 of 4</Text>
      </View>
      <View className="items-center">
            <Text className="text-2xl font-bold text-primaryText" style={{ fontSize: getResponsiveSize(24) }}>
          {isConfirming ? "Confirm passcode" : "Create passcode"}
        </Text>
            <Text className="text-gray-500 mt-2 mb-16" style={{ 
              fontSize: getResponsiveSize(16),
              marginTop: getResponsiveSize(8),
              marginBottom: getResponsiveSize(64),
              textAlign: 'center'
            }}>
          {isConfirming
            ? "Re-enter your PIN to make sure it's correct."
            : "Set a 4-digit PIN to protect your account"}
        </Text>

        {message && (
              <View style={{ 
                marginBottom: getResponsiveSize(16), 
                padding: getResponsiveSize(12), 
                backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF', 
                borderRadius: getResponsiveSize(8),
                width: '100%'
              }}>
                <Text style={{ 
                  color: messageType === 'error' ? '#D92D20' : '#0072CE', 
                  textAlign: 'center',
                  fontSize: getResponsiveSize(14)
                }}>{message}</Text>
          </View>
        )}

        {renderPinInputs()}
      </View>

      {/* Keypad */}
      {renderKeypad()}

      {/* Next or Complete Registration Button */}
          <View className="pb-4" style={{ paddingBottom: getResponsiveSize(16) }}>
        <TouchableOpacity
          className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
          onPress={handleSubmit}
          disabled={loading} // Disable button when loading
              style={{
                paddingVertical: getResponsiveSize(16),
                borderRadius: getResponsiveSize(8),
                opacity: loading ? 0.7 : 1
              }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
                <Text className="text-white text-lg mr-2 font-semibold" style={{ fontSize: getResponsiveSize(18) }}>
              {isConfirming ? "Complete Registration" : "Next"}
            </Text>
          )}
              {!loading && <MaterialIcons name="arrow-forward" size={getResponsiveSize(18)} color="white" />}
        </TouchableOpacity>
      </View>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}