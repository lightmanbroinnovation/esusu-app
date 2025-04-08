import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function UserData() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, pin } = useLocalSearchParams(); // Retrieve phone and pin from query params

  // State for input fields
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // State to track keyboard visibility
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  // Function to handle form submission
  const handleSubmit = () => {
    const userData = {
      phone,
      pin,
      firstname,
      lastname,
      email,
      business,
      address,
      city,
      state,
    };

    // Navigate to the next page with the user data
    router.push({
      pathname: "/signup/document",
      params: userData, // Pass all user data to the next page
    });
  };

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
        <View className="flex-row justify-between items-center mt-6">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text className="font-semibold">Step 2 of 4</Text>
        </View>

        <ScrollView className="mt-8" showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View>
            <Text className="text-[24px] font-bold text-primaryText mb-2">
              Tell Us About You
            </Text>
            <Text className="text-base text-[#4F4F4F]">
              Help us set up your profile with a few basic details.
            </Text>
          </View>

          {/* Input Fields */}
          <View className="mt-6 space-y-4">
            {/* Firstname */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">First Name</Text>
              <TextInput
                value={firstname}
                onChangeText={setFirstname}
                placeholder="Enter your first name"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-inputBg"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Lastname */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Last Name</Text>
              <TextInput
                value={lastname}
                onChangeText={setLastname}
                placeholder="Enter your last name"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Email */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Business */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Business</Text>
              <TextInput
                value={business}
                onChangeText={setBusiness}
                placeholder="Enter your business name"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Address */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            <View className="flex-row justify-between">
              {/* City */}
              <View className="my-2 flex-1 mr-2">
                <Text className="text-[#4F4F4F] mb-2">City</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter your city"
                  className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                  style={{
                    backgroundColor: "#F4F4F5",
                  }}
                />
              </View>

              {/* State */}
              <View className="my-2 flex-1">
                <Text className="text-[#4F4F4F] mb-2">State</Text>
                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="Enter your state"
                  className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                  style={{
                    backgroundColor: "#F4F4F5",
                  }}
                />
              </View>
            </View>
          </View>

          {/* Spacer to push button down */}
          <View className="h-16" />
        </ScrollView>

        {/* Continue Button */}
        <View className="pb-4">
          {!isKeyboardVisible && (
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleSubmit} // Use handleSubmit to pass data to the next page
            >
              <Text className="text-white text-lg mr-2 font-semibold">Continue</Text>
              <MaterialIcons name="arrow-forward" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
