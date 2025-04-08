import React from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { registerUser } from "../../services/api"; // Import the registerUser function

export default function SecuritySetup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams(); // Retrieve all data passed from the previous page

  const handleSecuritySetup = async (isVerified: boolean) => {
    const userData = {
      ...params, // Include all data from previous pages
      isVerified, // Add the isVerified field
    };

    try {
      // Send userData to the /users endpoint using registerUser
      const response = await registerUser(userData);
      Alert.alert("User Registered", "User information saved successfully!");
      console.log("User registered:", response);

      // Navigate to the dashboard or success page
      router.push("/dashboard/index"); // Optional navigation
    } catch (error) {
      Alert.alert("Error", "Failed to register user. Please try again.");
      console.error("Registration error:", error);
    }
  };

  return (
    <View
      className="flex-1 items-center justify-between bg-[#0072CE] px-6"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-1 justify-center items-center">
        <View className="w-44 h-44 justify-center items-center mb-6">
          <Image
            source={require("../assets/images/security.png")} // Replace with actual path to fingerprint image
            className="w-32 h-24"
            resizeMode="contain"
          />
        </View>
        <Text className="text-white text-4xl font-bold text-center mb-2">
          Secure & Fast Login
        </Text>
        <Text className="text-white text-center px-4">
          Use your fingerprint for quick and secure access to your account.
        </Text>
      </View>

      <View className="w-full mb-8">
        {/* Activate Now Button */}
        <TouchableOpacity
          className="bg-white py-4 rounded-lg mb-4"
          onPress={() => handleSecuritySetup(true)} // Set isVerified to true
        >
          <Text className="text-center text-[#0072CE] font-semibold">
            Activate Now
          </Text>
        </TouchableOpacity>

        {/* Skip for Now Button */}
        <TouchableOpacity
          className="border border-white py-4 rounded-lg"
          onPress={() => handleSecuritySetup(false)} // Set isVerified to false
        >
          <Text className="text-center text-white font-semibold">
            Skip for Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
