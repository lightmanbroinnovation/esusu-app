export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Correct import
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { verifyOtp } from '../../services/api'; // Add this import if not present
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function PasscodeScreen() {
  const router = useRouter();
  
  // Use back button handler for signup OTP page
  useBackButtonHandler('/signup/otp');
  
  const { width, height } = Dimensions.get('window');
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(false); // State to toggle keypad visibility
  const [loading, setLoading] = useState(false); // Add loading state
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(240); // 4 minutes in seconds
  const [canResend, setCanResend] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber || params.phone;
  const email = params.email;

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

  // Timer effect for resend functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(240); // Reset to 4 minutes
    setMessageWithTimeout("Verification code resent successfully!", "info", 4000);
    
    // TODO: Implement actual resend API call here
    console.log("Resending verification code...");
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleVerify = async () => {
    if (pin.length === 6) {
      setLoading(true); // Start loading
      try {
        // Call the server to verify the OTP
        const response = await verifyOtp(phoneNumber, pin);
        console.log('OTP verify response:', response);
        if (response.status === 'Success') {
          setMessageWithTimeout(response.data?.message || response.message || 'Verification successful!', 'info', 4000);
                  // Proceed to next step after a short delay
        setTimeout(() => {
          router.push({
            pathname: "/signup/passcode",
            params: { phoneNumber, email, verificationCode: pin },
          });
        }, 1000);
        } else {
          setMessageWithTimeout(response.data?.message || response.message || 'Invalid verification code.', 'error', 4000);
        }
      } catch (error) {
        console.error('OTP verify error:', error);
        const err: any = error;
        if (err && typeof err === 'object') {
          if (err.response && err.response.data && err.response.data.message) {
            setMessageWithTimeout(err.response.data.message, 'error', 4000);
          } else if (err.message) {
            setMessageWithTimeout(err.message, 'error', 4000);
          } else {
            setMessageWithTimeout('Could not connect to the server. Please try again.', 'error', 4000);
          }
        } else if (typeof err === 'string') {
          setMessageWithTimeout(err, 'error', 4000);
        } else {
          setMessageWithTimeout('Could not connect to the server. Please try again.', 'error', 4000);
        }
      } finally {
        setLoading(false);
      }
    } else {
      Vibration.vibrate(100);
      setMessageWithTimeout("Please enter the complete verification code", "info", 4000);
    }
  };

  const renderPinInputs = () => {
    return (
      <View className="flex-row justify-center space-x-4 mt-6" style={{ marginTop: getResponsiveSize(24) }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setShowKeypad(true)} // Show keypad when clicked
            className="w-12 h-12 text-center mr-2 justify-center items-center border rounded-lg"
            style={{
              width: getResponsiveSize(48),
              height: getResponsiveSize(48),
              borderColor: i < pin.length ? "#0072CE" : "#ccc",
              backgroundColor: "#F4F4F5",
              borderRadius: getResponsiveSize(8),
              marginRight: getResponsiveSize(8)
            }}
          >
            <Text className="text-xl font-bold text-[#0072CE]" style={{ fontSize: getResponsiveSize(20) }}>{pin[i] || ""}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "✓"];
    return (
      <View className="mt-10 space-y-2 w-full" style={{ marginTop: getResponsiveSize(40) }}>
        {Array(4)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-between" style={{ marginBottom: getResponsiveSize(8) }}>
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (key === "x") handleBackspace();
                    else if (key === "✓") handleVerify();
                    else handleKeyPress(key);
                  }}
                  className="w-14 h-14 bg-white justify-center items-center"
                  style={{
                    width: getResponsiveSize(56),
                    height: getResponsiveSize(56),
                    borderRadius: getResponsiveSize(28)
                  }}
                >
                  {key === "x" ? (
                    <Ionicons name="backspace-outline" size={getResponsiveSize(30)} color="#0072CE" /> // Delete icon
                  ) : key === "✓" ? (
                    <MaterialIcons name="check-circle" size={getResponsiveSize(30)} color="#0072CE" /> // Enter icon
                  ) : (
                    <Text className="text-3xl font-semibold text-[#0072CE]" style={{ fontSize: getResponsiveSize(30) }}>{key}</Text> // Regular number keys
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </View>
    );
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
        <View
          className="flex-1 px-6 pb-10"
          style={{
            paddingBottom: insets.bottom + getResponsiveSize(40),
            paddingHorizontal: getResponsiveSize(24)
          }}
        >
        {/* Back Button */}
          <View className="flex-row items-center justify-between mt-12 mb-4" style={{
            marginTop: getResponsiveSize(48),
            marginBottom: getResponsiveSize(16)
          }}>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
              style={{ padding: getResponsiveSize(8) }}
          >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
          </TouchableOpacity>
            <Text className="ml-4 font-semibold" style={{ fontSize: getResponsiveSize(16) }}>Step 2 of 4</Text>
        </View>

        {/* Main Content */}
          <View className="flex-1 mt-8" style={{ marginTop: getResponsiveSize(32) }}>
            <Text className="text-[24px] font-bold text-primaryText" style={{ fontSize: getResponsiveSize(24) }}>Enter Verification Code</Text>
            <Text className="text-gray-500 mt-2 mb-6" style={{
              fontSize: getResponsiveSize(16),
              marginTop: getResponsiveSize(8),
              marginBottom: getResponsiveSize(24)
            }}>
              Check your messages for a 6-digit code sent to your number
            </Text>

            {/* Verification Code Info */}
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" style={{
              backgroundColor: '#E5F1FF',
              borderColor: '#0072CE',
              padding: getResponsiveSize(16),
              marginBottom: getResponsiveSize(24),
              borderRadius: getResponsiveSize(8)
            }}>
              <Text className="text-blue-800 font-bold text-center mb-2" style={{
                color: '#1E40AF',
                fontSize: getResponsiveSize(16),
                marginBottom: getResponsiveSize(8)
              }}>
                ⚠️ IMPORTANT: Code Expires in 4 Minutes
              </Text>
              <Text className="text-blue-700 text-center text-sm" style={{
                color: '#1E40AF',
                fontSize: getResponsiveSize(14)
              }}>
                Use <Text className="font-bold">347*359*6#</Text> to quickly check your verification code
              </Text>
            </View>

          {message && (
              <View style={{
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

          {renderPinInputs()}

          {/* Resend Code Section */}
          <View className="mt-4 items-center" style={{ marginTop: getResponsiveSize(16) }}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendCode}>
                <Text className="text-[#0072CE] font-semibold" style={{ fontSize: getResponsiveSize(14) }}>
                  Resend Code
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="items-center">
                <Text className="text-[#4F4F4F] text-sm" style={{ fontSize: getResponsiveSize(12) }}>
                  Resend code in
                </Text>
                <Text className="text-[#0072CE] font-bold text-lg" style={{ fontSize: getResponsiveSize(18) }}>
                  {formatTime(resendTimer)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity>
              <Text className="text-[#4F4F4F] my-2" style={{
                fontSize: getResponsiveSize(14),
                marginVertical: getResponsiveSize(8)
              }}>
              Already have an account?{" "}
              <Text className="text-[#0072CE] font-semibold">Login</Text>
            </Text>
          </TouchableOpacity>

          {/* Spacer to push button down */}
          <View className="flex-1" />

          {/* Continue Button */}
            <View className="mt-4 mb-4" style={{
              marginTop: getResponsiveSize(16),
              marginBottom: getResponsiveSize(16)
            }}>
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleVerify}
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
                  <Text className="text-white text-lg mr-2 font-semibold" style={{ fontSize: getResponsiveSize(18) }}>Verify and Continue</Text>
              )}
                {!loading && <MaterialIcons name="arrow-forward" size={getResponsiveSize(18)} color="white" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Keypad */}
        {showKeypad && (
            <View className="mt-auto" style={{ marginTop: 'auto' }}>
            {renderKeypad()}
          </View>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}