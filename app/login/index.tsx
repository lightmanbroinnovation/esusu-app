import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries


export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");

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
        <View className=" flex-row justify-between items-center mt-6">
            <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={28}  />
            </TouchableOpacity>
        </View>
        <View className="mt-8">
          <Text className="text-[24px] font-bold text-primaryText mb-2">
            Welcome Back!
          </Text>
          <Text className="text-base text-[#4F4F4F]">
            Log in to manage savings, track earnings, and grow your business.
          </Text>
        </View>

        {/* Input */}
        <View className="mt-8">
          <Text className="text-sm text-[#4F4F4F] mb-1">Phone Number</Text>
          <View className="flex-row items-center ">
            {/* NG Flag + Code */}
            <View className="flex-row items-center mr-3 border border-[#E0E0E0] rounded-lg px-3 py-3 bg-inputBg"
                     style={{
                        backgroundColor: "#F4F4F5",
                      }}>
              
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
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              className="flex-1 text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#e4e1e1]"
              placeholderTextColor="#BDBDBD"
              style={{
                backgroundColor: "#F4F4F5",
              }}
            />
          </View>
        </View>
          {/* Sign up text */}
          <Text className=" text-[#4F4F4F] my-2">
            Don’t have an account?{" "}
            <Text className="text-primaryText font-semibold">Sign up</Text>
          </Text>

        {/* Spacer to push button down */}
        <View className="flex-1 justify-end pb-4">

          {/* Continue Button */}
          <TouchableOpacity
            className="flex-row justify-center  items-center bg-[#0072CE] py-4 rounded-lg"
            onPress={() => router.push("/login/passcode")}
          >
            <Text className="text-white text-lg mr-2 font-semibold">
              Continue
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color="white" /> {/* Arrow icon */}

          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
