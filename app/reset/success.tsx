export const options = {
  headerShown: false, // Hide the header
};

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  // Get phone from params for login
  const phone = params.phone as string;

  const handleGoToLogin = () => {
    // Show success notification
    dispatch(addNotification({
      type: 'success',
      title: 'Passcode Reset Complete',
      body: 'Your passcode has been reset successfully. Please log in with your new passcode.'
    }));

    // Replace the entire navigation stack with the login screen
    // This prevents users from going back to the reset flow
    router.replace({
      pathname: "/login",
      params: { phone }
    });
  };

  return (
    <View
      className="flex-1 bg-white px-6 items-center justify-center"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Success animation or icon */}
      <View className="items-center mb-8">
        <MaterialIcons name="check-circle" size={120} color="#0072CE" />
      </View>

      {/* Success message */}
      <Text className="text-2xl font-bold text-primaryText text-center mb-4">
        Passcode Reset Successfully!
      </Text>
      <Text className="text-base text-gray-600 text-center mb-12">
        Your passcode has been reset successfully. You can now log in with your new passcode.
      </Text>

      {/* Go to login button */}
      <TouchableOpacity
        className="bg-[#0072CE] w-full py-4 rounded-lg"
        onPress={handleGoToLogin}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Go to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
