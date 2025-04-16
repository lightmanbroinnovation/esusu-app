export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries

// Define interfaces for type safety
interface RegistrationParams {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  idImage?: string;
  cacImage?: string;
  verification_data_string?: string;
  bvn?: string;
  [key: string]: string | undefined; // Index signature for dynamic access
}

export default function PasscodeScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [confirmPin, setConfirmPin] = useState<string>(""); // State for the confirmed PIN
  const [isConfirming, setIsConfirming] = useState<boolean>(false); // State to toggle between "Enter PIN" and "Confirm PIN"
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const registrationParams = params as unknown as RegistrationParams;

  // Log params when component mounts
  useEffect(() => {
    console.log('===== PASSCODE SCREEN - RECEIVED DATA =====');
    console.log('Params received from document screen:', JSON.stringify({
      ...registrationParams,
      idImage: registrationParams.idImage ? String(registrationParams.idImage).substring(0, 30) + "..." : "missing",
      cacImage: registrationParams.cacImage ? String(registrationParams.cacImage).substring(0, 30) + "..." : "missing",
    }, null, 2));
    console.log('==========================================');
  }, []);

  const handleKeyPress = (digit: string) => {
    if (!isConfirming && pin.length < 4) {
      setPin(pin + digit);
    } else if (isConfirming && confirmPin.length < 4) {
      setConfirmPin(confirmPin + digit);
    }
  };

  const handleBackspace = () => {
    if (!isConfirming) {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const renderPinInputs = () => {
    const currentPin = isConfirming ? confirmPin : pin;
    return (
      <View className="flex-row justify-center space-x-8 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <TextInput
            key={i}
            value={currentPin[i] || ""}
            editable={false}
            className="w-12 h-12 text-center mr-2 p-1 text-xl text-primaryText font-bold border rounded-lg"
            style={{
              borderColor: i < currentPin.length ? "#0072CE" : "#ccc",
              backgroundColor: i < currentPin.length ? "#ffffff" : "#F4F4F5",
            }}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    return (
      <View className="mt-10 space-y-8 w-full">
        {Array(3)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-between">
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleKeyPress(key)}
                  className="w-20 h-20 bg-white justify-center items-center"
                >
                  <Text className="text-3xl font-semibold text-[#0072CE]">{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        {/* Last row with "x" and "0" */}
        <View className="flex-row justify-between">
          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleBackspace}
            className="w-20 h-20 bg-white justify-center items-center"
          >
            <Ionicons name="backspace-outline" size={30} color="#0072CE" /> {/* Delete icon */}
          </TouchableOpacity>

          {/* Zero Button */}
          <TouchableOpacity
            onPress={() => handleKeyPress("0")}
            className="w-20 h-20 bg-white justify-center items-center"
          >
            <Text className="text-3xl font-semibold text-[#0072CE]">0</Text>
          </TouchableOpacity>

          {/* Placeholder for alignment */}
          <View className="w-20 h-20" />
        </View>
      </View>
    );
  };

  const handleSubmit = () => {
    if (!isConfirming) {
      if (pin.length === 4) {
        setIsConfirming(true); // Move to confirm PIN step
        setConfirmPin(""); // Clear confirm PIN field
      } else {
        Vibration.vibrate(100);
        alert("Please enter a 4-digit passcode.");
      }
    } else {
      if (confirmPin === pin) {
        // Make sure we have all the required data before proceeding
        const passcodeData: RegistrationParams & { pin: string } = {
          ...registrationParams, // Include data from the previous page
          pin, // Add the confirmed PIN
        };

        console.log('===== PASSCODE SCREEN - PASSING DATA =====');
        console.log('Final passcode data prepared:', JSON.stringify({
          ...passcodeData,
          pin: passcodeData.pin,
          idImage: passcodeData.idImage ? String(passcodeData.idImage).substring(0, 30) + "..." : "missing",
          cacImage: passcodeData.cacImage ? String(passcodeData.cacImage).substring(0, 30) + "..." : "missing",
        }, null, 2));
        
        // Check if we have all the required fields for registration
        const requiredFields = ['firstname', 'lastname', 'email', 'phone', 'pin'] as const;
        const missingFields = requiredFields.filter(field => !passcodeData[field]);
        
        if (missingFields.length > 0) {
          console.warn('Missing required fields:', missingFields);
          alert(`Missing required fields: ${missingFields.join(', ')}`);
          return;
        }
        
        console.log('==========================================');

        // Navigate to the success page with the combined data
        router.push({
          pathname: "/signup/security",
          params: passcodeData, // Pass all data to the next page
        });
      } else {
        Vibration.vibrate(100);
        alert("Passcodes do not match. Please try again.");
        setConfirmPin(""); // Reset confirm PIN field
      }
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-between pb-10">
      {/* Top section */}
      {/* Header */}
      <View className="flex-row justify-between items-center mt-6">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
        <Text className="font-semibold">Step 4 of 4</Text>
      </View>
      <View className="items-center">
        <Text className="text-2xl font-bold text-primaryText">
          {isConfirming ? "Confirm passcode" : "Create passcode"}
        </Text>
        <Text className="text-gray-500 mt-2 mb-16">
          {isConfirming
            ? "Re-enter your PIN to make sure it's correct."
            : "Set a 4-digit PIN to protect your account"}
        </Text>

        {renderPinInputs()}
      </View>

      {/* Keypad */}
      {renderKeypad()}

      {/* Next or Complete Registration Button */}
      <View className="pb-4">
        <TouchableOpacity
          className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
          onPress={handleSubmit}
        >
          <Text className="text-white text-lg mr-2 font-semibold">
            {isConfirming ? "Complete Registration" : "Next"}
          </Text>
          <MaterialIcons name="arrow-forward" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}