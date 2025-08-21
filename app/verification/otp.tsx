export const options = {
  headerShown: false, // Hide the header
};

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Vibration, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Correct import
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { validateIdentity } from "../../services/api";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

export default function PasscodeScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(false); // State to toggle keypad visibility
  const [loading, setLoading] = useState(false); // Add loading state
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams(); // Retrieve the phone number from query params
  const dispatch = useDispatch();

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleVerify = async () => {
    if (pin.length === 4) {
      setLoading(true);
      try {
        const response = await validateIdentity({ otp: pin });
        
        if (response.status === 'Success') {
          dispatch(addNotification({
            type: 'success',
            title: 'Verification Successful',
            body: 'Your identity has been verified successfully.'
          }));
          
          router.push({
            pathname: "/verification/index",
            params: { phone, verificationCode: pin },
          });
        } else {
          throw new Error('Verification failed');
        }
      } catch (error) {
        console.error('Error in verification:', error);
        dispatch(addNotification({
          type: 'error',
          title: 'Verification Failed',
          body: 'There was an error verifying your code. Please try again.'
        }));
        Vibration.vibrate(100);
      } finally {
        setLoading(false);
      }
    } else {
      Vibration.vibrate(100);
      dispatch(addNotification({
        type: 'error',
        title: 'Invalid Code',
        body: 'Please enter the complete verification code.'
      }));
    }
  };

  const renderPinInputs = () => {
    return (
      <View className="flex-row space-x-4 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setShowKeypad(true)} // Show keypad when clicked
            className="w-12 h-12 text-center mr-2 justify-center items-center border rounded-lg"
            style={{
              borderColor: i < pin.length ? "#0072CE" : "#ccc",
              backgroundColor: "#F4F4F5",
            }}
          >
            <Text className="text-xl font-bold text-[#0072CE]">{pin[i] || ""}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "✓"];
    return (
      <View className="mt-10 space-y-2 w-full">
        {Array(4)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-between">
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (key === "x") handleBackspace();
                    else if (key === "✓") handleVerify();
                    else handleKeyPress(key);
                  }}
                  className="w-14 h-14 bg-white justify-center items-center"
                >
                  {key === "x" ? (
                    <Ionicons name="backspace-outline" size={30} color="#0072CE" /> // Delete icon
                  ) : key === "✓" ? (
                    <MaterialIcons name="check-circle" size={30} color="#0072CE" /> // Enter icon
                  ) : (
                    <Text className="text-3xl font-semibold text-[#0072CE]">{key}</Text> // Regular number keys
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View className="flex-1 px-6 pb-10" style={{ paddingBottom: insets.bottom }}>
        {/* Back Button */}
        <View className="flex-row items-center justify-between mt-6 mb-4">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text className="ml-4 font-semibold">Step 1 of 4</Text>
        </View>

        {/* Main Content */}
        <View className="flex-1 mt-8">
          <Text className="text-[24px] font-bold text-primaryText">Enter Verification Code</Text>
          <Text className="text-gray-500 mt-2 mb-6">
            Check your messages for a 4-digit code sent to your number
          </Text>

          {renderPinInputs()}

          <TouchableOpacity className="mt-2">
            <Text className="text-[#4F4F4F]">Resend Code</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text className="text-[#4F4F4F] my-2">
              Already have an account?{" "}
              <Text className="text-[#0072CE] font-semibold">Login</Text>
            </Text>
          </TouchableOpacity>

          {/* Spacer to push button down */}
          <View className="flex-1" />

          {/* Continue Button */}
          <View className="mt-4 mb-4">
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleVerify}
              disabled={loading} // Disable button when loading
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-lg mr-2 font-semibold">Verify and Continue</Text>
              )}
              {!loading && <MaterialIcons name="arrow-forward" size={18} color="white" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Keypad */}
        {showKeypad && (
          <View className="mt-auto">
            {renderKeypad()}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}