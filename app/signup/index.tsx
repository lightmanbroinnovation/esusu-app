import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility

  useEffect(() => {
    // Add event listeners for keyboard show and hide
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    // Cleanup event listeners on unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <View
        className="flex-1 bg-white px-6"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mt-6">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text className="font-semibold">Step 1 of 4</Text>
        </View>

        <View className="mt-8">
          <Text className="text-2xl font-bold text-[#0072CE] mb-2">
            Let's Get Started!
          </Text>
          <Text className="text-base text-[#4F4F4F]">
            We'll send a verification code to your phone number to secure your account.
          </Text>
        </View>

        {/* Input */}
        <View className="mt-8">
          <Text className="text-sm text-[#4F4F4F] mb-1">Phone Number</Text>
          <View className="flex-row items-center">
            {/* NG Flag + Code */}
            <View className="flex-row items-center mr-3 border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]">
              <Image
                source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                style={{
                  width: 24,
                  height: 18,
                  borderRadius: 2,
                  marginRight: 6,
                }}
              />
              <Text className="text-base text-[#BDBDBD]">NGN</Text>
            </View>

            {/* Phone input */}
            <TextInput
              placeholder="Enter phone number"
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              className="flex-1 text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
              placeholderTextColor="#BDBDBD"
            />
          </View>
        </View>

        {/* Sign up text */}
        <Text className="text-[#4F4F4F] my-2">
          Already have an account?{" "}
          <Text className="text-[#0072CE] font-semibold">Login</Text>
        </Text>

        {/* Spacer to push button down */}
        <View className="flex-1 justify-end pb-4">
          {/* Continue Button */}
          {!isKeyboardVisible && ( // Hide button when keyboard is visible
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={() => router.push({ pathname: "/signup/otp", params: { phone } })} // Pass phone as a query parameter
            >
              <Text className="text-white text-lg mr-2 font-semibold">Signup</Text>
              <MaterialIcons name="arrow-forward" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
