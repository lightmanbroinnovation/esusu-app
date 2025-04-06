import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SecuritySetup() {
  const insets = useSafeAreaInsets();

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
        <TouchableOpacity className="bg-white py-4 rounded-lg mb-4">
          <Text className="text-center text-[#0072CE] font-semibold">
            Activate Now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="border border-white py-4 rounded-lg">
          <Text className="text-center text-white font-semibold">
            Skip for Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
