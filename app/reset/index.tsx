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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { getOtpByPhone } from "../../services/api";
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function ResetPasscode() {
  const router = useRouter();
  
  // Use back button handler for reset page
  useBackButtonHandler('/reset');
  
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState(params.phone as string || "");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [networkAvailable, setNetworkAvailable] = useState(true);

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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleContinue = async () => {
    // Validate phone
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send POST request to getOtp endpoint
      const res = await fetch('https://esusu-server.onrender.com/api/merchant/getOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone })
      });
      let data = null;
      let text = '';
      try {
        text = await res.text();
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('JSON parse error:', jsonErr, 'Response text:', text);
        setError('Server error: Invalid response format.');
        setLoading(false);
        return;
      }
      console.log('getOtp response:', data);
      // Navigate to OTP page, passing phone as param
      router.push({
        pathname: "/reset/otp",
        params: { phone }
      });
    } catch (error: any) {
      console.error("Reset error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    router.replace('/login');
  }

  if (loading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !phone) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No network. Please connect to the internet to load reset page.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        className="flex-1 bg-white px-6"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mt-4">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handlePreviousPage}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text className="font-semibold text-lg flex-1 text-center"></Text>
        </View>

        <View className="mt-8">
          <Text className="text-[24px] font-bold text-primaryText mb-2">
          Reset Your Passcode
          </Text>
          <Text className="text-base text-[#4F4F4F]">
          Enter your registered phone number to receive a reset code.
          </Text>
        </View>

        {/* Input */}
        <View className="mt-8">
          <Text className="text-sm text-[#4F4F4F] mb-1">Phone Number</Text>
          <View className="flex-row items-center">
            {/* NG Flag + Code */}
            <View
              style={{
                backgroundColor: "#F4F4F5",
              }}
              className="flex-row items-center mr-3 border border-[#E0E0E0] rounded-lg px-3 py-3"
            >
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
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setError("");
              }}
              style={{
                backgroundColor: "#F4F4F5",
              }}
              className="flex-1 text-base text-primaryText border border-[#E0E0E0] rounded-lg px-3 py-3"
              placeholderTextColor="#BDBDBD"
            />
          </View>
          
          {/* Error message */}
          {error ? (
            <Text className="text-red-500 mt-2">{error}</Text>
          ) : null}
        </View>

        {/* Login text */}
        {/* <Text className="text-[#4F4F4F] my-2">
          Remember your passcode?{" "}
          <Text 
            className="text-[#0072CE] font-semibold"
            onPress={() => router.push("/login")}
          >
            Login
          </Text>
        </Text> */}

        {/* Spacer to push button down */}
        <View className="flex-1 justify-end pb-4">
          {/* Continue Button */}
          {!isKeyboardVisible && ( // Hide button when keyboard is visible
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text className="text-white text-lg mr-2 font-semibold">Continue</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
