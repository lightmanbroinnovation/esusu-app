import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { fetchUserByPhone, addPinToUser } from "../../services/api"; // Import the API functions

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generate a random 4-digit PIN
  const generateTemporaryPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleContinue = async () => {
    // Validate phone number
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userData = await fetchUserByPhone(phone);
      let userWithPin = userData;
      
      // If user doesn't have a PIN, generate a temporary one and update the user
      if (!userData.pin) {
        try {
          const tempPin = generateTemporaryPin();
          Alert.alert(
            "Temporary PIN Generated",
            `A temporary PIN (${tempPin}) has been generated for your account. Please use it to login and change it in your profile settings.`,
            [{ text: "OK" }]
          );
          
          // Try to update the user with the new PIN
          userWithPin = await addPinToUser(userData.id, tempPin);
        } catch (pinError) {
          console.error("Error adding PIN:", pinError);
          // Even if updating fails, we can still proceed with the temporary PIN
          userWithPin = { ...userData, pin: generateTemporaryPin() };
        }
      }
      
      // Navigate to passcode screen with user data
      router.push({
        pathname: "/login/passcode",
        params: { 
          phone, 
          userId: userWithPin.id,
          pin: userWithPin.pin // Pass the user's PIN for verification
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message && error.message.includes("User not found")) {
        setError("User not found. Please register an account.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
        <View className="flex-row justify-between items-center mt-2">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
        </View>
        
        <View className="mt-6">
          <Text className="text-2xl font-bold text-[#0072CE] mb-2">
            Welcome Back!
          </Text>
          <Text className="text-base text-[#4F4F4F]">
            Log in to manage savings, track earnings, and grow your business.
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
              <Text className="text-base text-[#BDBDBD]">
                NGN
              </Text>
            </View>

            {/* Phone input */}
            <TextInput
              placeholder="Enter phone number"
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setError("");
              }}
              className="flex-1 text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
              placeholderTextColor="#BDBDBD"
            />
          </View>
          
          {/* Error message */}
          {error ? (
            <Text className="text-red-500 mt-2">{error}</Text>
          ) : null}
        </View>
        
        {/* Sign up text */}
        <Text className="text-[#4F4F4F] my-2">
          Don't have an account?{" "}
          <Text 
            className="text-[#0072CE] font-semibold"
            onPress={() => router.push("/signup")}
          >
            Sign up
          </Text>
        </Text>

        {/* Spacer to push button down */}
        <View className="flex-1 justify-end pb-4">
          {/* Continue Button */}
          <TouchableOpacity
            className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text className="text-white text-lg mr-2 font-semibold">
                  Continue
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
