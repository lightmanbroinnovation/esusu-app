import React from "react";
import { View, Text, Image, TouchableOpacity, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Success() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="flex-1 items-center bg-white px-4"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
        <View className=" flex-1 items-start p-0"
        >

      <ImageBackground
        source={require("../assets/images/success.png")} // Replace with the actual path to your background image
        className="flex-1 justify-center items-center w-full "
        resizeMode="contain"
        style={{ height: 460 }} // Adjust padding for top and bottom

      >
        <Image
          source={require("../assets/images/check.png")} // Replace with the actual path to your check image
          className="w-28 h-28 mb-4"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold text-center text-primary mb-2"
        style={{ color: '#0072CE' }} // Adjust the color as needed
        >
          You’re All Set!
        </Text>
        <Text className="text-center text-gray-600 px-4">
          Your Esusu POS Operator account has been successfully created. Start
          earning by helping customers save today!
        </Text>
      </ImageBackground>
        </View>
      <TouchableOpacity
        className="w-full bg-[#0072CE] py-4 rounded-lg mb-6"
        onPress={() => router.push("/signup/security")}
      >
        <Text className="text-white font-bold text-center">Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}
