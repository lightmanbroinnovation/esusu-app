export const options = {
  headerShown: false, // Hide the header
};

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Vibration } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Correct import
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries

export default function PasscodeScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(false); // State to toggle keypad visibility
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams(); // Retrieve the phone number from query params

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const renderPinInputs = () => {
    return (
      <View className="flex-row items-center justify-center space-x-4 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setShowKeypad(true)} // Show keypad when clicked
            className="w-12 h-12 text-center mr-2 justify-center items-center border rounded-lg"
            style={{
              borderColor: i < pin.length ? "#0072CE" : "#ccc",
              backgroundColor: "#F4F4F5",
            }}
          >
            <Text className="text-xl font-bold text-[#0072CE]">{pin[i] || ""}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "✓"];
    return (
      <View className="mt-10 space-y-4 w-full">
        {Array(4)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-between">
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (key === "x") handleBackspace();
                    else if (key === "✓") {
                      if (pin.length === 4) {
                        alert("Passcode entered: " + pin);
                      } else {
                        Vibration.vibrate(100);
                      }
                    } else {
                      handleKeyPress(key);
                    }
                  }}
                  className="w-20 h-20 bg-white justify-center items-center"
                >
                  {key === "x" ? (
                    <Ionicons name="backspace-outline" size={30} color="#0072CE" /> // Delete icon
                  ) : key === "✓" ? (
                    <MaterialIcons name="check-circle" size={30} color="#0072CE" /> // Enter icon
                  ) : (
                    <Text className="text-3xl font-semibold text-[#0072CE]">{key}</Text> // Regular number keys
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white px-4">
      {/* Back Button */}
      <View className="flex-row items-center mt-10 p-4">
      <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
          <Text className="text-xl font-bold flex-1 text-center mr-8">Withdraw</Text>
        </View>

      {/* Main Content */}
      <View className="flex-1 mt-8">
        <Text className="text-[24px] font-bold text-center text-primaryText">OTP Verification</Text>
        <Text className="text-gray-500 text-center mt-2 mb-6">
        Enter the OTP sent to your registered phone number to complete your withdrawal.
        </Text>

        {renderPinInputs()}

        <TouchableOpacity className="mt-2 text-center">
          <Text className="text-primaryText text-xl text-center">Resend Code</Text>
        </TouchableOpacity>
     
        <View className="flex-1 justify-end pb-4">
          {/* Continue Button */}
          <TouchableOpacity
            className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
            onPress={() =>
              router.push({
                pathname: "/signup/userData",
                params: { phone, pin }, // Pass both phone and pin to the next page
              })
            }
          >
            <Text className="text-white text-lg mr-2 font-semibold">Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Keypad */}
      {showKeypad && renderKeypad()}
    </View>
  );
}