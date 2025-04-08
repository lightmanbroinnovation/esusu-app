export const options = {
  headerShown: false, // Hide the header
};

import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries

export default function PasscodeScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(false); // State to toggle keypad visibility
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleFingerprintAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate with fingerprint",
      fallbackLabel: "Use PIN",
    });

    if (result.success) {
      alert("Authenticated successfully!");
      router.push("/dashboard/index"); // Optional navigation
    } else {
      alert("Authentication failed");
    }
  };

  const renderPinInputs = () => {
    return (
      <View className="flex-row justify-center space-x-8 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <TextInput
            key={i}
            value={pin[i] || ""}
            editable={false}
            className="w-12 h-12 text-center mr-2 p-1 text-xl text-primaryText font-bold border rounded-lg"
            style={{
              borderColor: i < pin.length ? "#0072CE" : "#ccc",
              backgroundColor: i < pin.length ? "#ffffff" : "#F4F4F5",
         
            }}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "✓"];
    return (
      <View className="mt-10 space-y-8 w-full">
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
                        // router.push("/home");
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
    <View className="flex-1 bg-white px-6 justify-between pt-20 pb-10">
      {/* Top section */}
      <View className="items-center">
        <Text className="text-2xl font-bold text-primaryText">Enter passcode</Text>
        <Text className="text-gray-500 mt-2 mb-16">Enter your passcode to log in</Text>

        {renderPinInputs()}

        <TouchableOpacity className="mt-2"
          onPress={() => router.push("/reset/otp")}>
          <Text className="text-sm text-primaryText">Forgot passcode?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFingerprintAuth} className="mt-6 items-center">
          <MaterialIcons name="fingerprint" size={40} color="#0072CE" /> {/* Icon */}
          <Text className="text-sm text-primaryText mt-1">Use fingerprint</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-2"
          onPress={() => setShowKeypad(true)} // Show keypad when "Use PIN" is selected
        >
          <Text className="text-sm text-primaryText">Use PIN</Text>
        </TouchableOpacity>

      </View>

      {/* Keypad */}
      {showKeypad && renderKeypad()}
    </View>
  );
}
