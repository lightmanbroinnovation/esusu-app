export const options = {
  headerShown: false,
};

import { View, Text, Image, TouchableOpacity, ImageBackground, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // Import useRouter

export default function Index() {
  const insets = useSafeAreaInsets();
  const router = useRouter(); // Initialize the router

  return (
    <ImageBackground
      source={require("../assets/images/Onboarding1.png")} // Replace with your background image path
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
      resizeMode="cover"
    >
      {/* Overlay for solid background color */}
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#0072CE', opacity: 0.8 }} />

      {/* Content */}
      <View className="flex-1">
        {/* Logo */}
        <View className="flex-row items-center justify-center mt-8">
          <Image
            source={require("../assets/images/icon.png")} // <-- Update with actual logo path
            resizeMode="contain"
            className="w-24 h-12"
            tintColor={"white"}
            width={120}
          />
          <Text className="text-white text-4xl font-semibold -ml-6">esusu</Text>
        </View>

        {/* Main text */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-3xl font-bold text-center leading-snug">
            Earn More,{"\n"}Empower Your{"\n"}Community
          </Text>
          <Text className="text-white text-base text-center mt-4 opacity-80">
            Turn your POS terminal into more than just transactions. Help customers
            save securely while earning commissions on every deposit.
          </Text>
        </View>

        {/* Buttons */}
        <View className="flex-row justify-between mb-10 space-x-4 px-6">
          <TouchableOpacity
            className="flex-1 border border-white py-3 mr-2 rounded-2xl items-center"
            onPress={() => router.push("/login")} // Navigate to the login page
          >
            <Text className="text-white font-semibold">LOG IN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white py-3 rounded-2xl items-center"
            onPress={() => router.push("/signup")} // Navigate to the signup page
          >
            <Text className="text-[#0072CE] font-semibold">SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
