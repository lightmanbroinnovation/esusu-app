export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Vibration, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { updatePasscode } from "../../services/api";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function PasscodeScreen() {
  const router = useRouter();
  
  // Use back button handler for reset passcode page
  useBackButtonHandler('/reset/passcode');
  
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [confirmPin, setConfirmPin] = useState<string>(""); // State for the confirmed PIN
  const [isConfirming, setIsConfirming] = useState<boolean>(false); // State to toggle between "Enter PIN" and "Confirm PIN"
  const [loading, setLoading] = useState<boolean>(false);
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // Get params from previous screen
  const phone = params.phone as string;

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

  // Check if PIN is complete
  useEffect(() => {
    if (pin.length === 4 && !isConfirming) {
      // Auto-advance to confirm PIN when first PIN is complete
      setTimeout(() => {
        setIsConfirming(true);
      }, 500);
    }
  }, [pin]);

  // Check if confirmation PIN is complete
  useEffect(() => {
    if (confirmPin.length === 4 && isConfirming) {
      // Auto-check PINs when confirmation is complete
      handlePinConfirmation();
    }
  }, [confirmPin]);

  const handlePinConfirmation = () => {
    if (confirmPin === pin) {
      // PINs match, save the new PIN
      savePIN();
    } else {
      // PINs don't match
      Vibration.vibrate(300);
      Alert.alert(
        "PINs Don't Match",
        "The PINs you entered don't match. Please try again.",
        [{ text: "OK", onPress: () => {
          setPin("");
          setConfirmPin("");
          setIsConfirming(false);
        }}]
      );
    }
  };

  const savePIN = async () => {
    setLoading(true);
    try {
      // Send POST request to change-password endpoint
      const res = await fetch('https://esusu-server.onrender.com/api/merchant/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassCode: String(pin) })
      });
      let data = null;
      let text = '';
      try {
        text = await res.text();
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('JSON parse error:', jsonErr, 'Response text:', text);
        dispatch(addNotification({
          type: 'error',
          title: 'Update Failed',
          body: 'Server error: Invalid response format.'
        }));
        setLoading(false);
        Alert.alert(
          "Error",
          "Server error: Invalid response format.",
          [{ text: "OK" }]
        );
        return;
      }
      console.log('change-password response:', data);
      if (data && data.status === 'Success') {
        dispatch(addNotification({
          type: 'success',
          title: 'Passcode Updated',
          body: 'Your passcode has been updated successfully.'
        }));
        setTimeout(() => {
          setLoading(false);
          router.push({
            pathname: "/reset/success",
            params: { phone }
          });
        }, 1000);
      } else {
        dispatch(addNotification({
          type: 'error',
          title: 'Update Failed',
          body: data?.message || 'There was an error saving your new passcode. Please try again.'
        }));
        setLoading(false);
        Alert.alert(
          "Error",
          data?.message || "There was an error saving your new PIN. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error saving PIN:", error);
      // Show error notification
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        body: 'There was an error saving your new passcode. Please try again.'
      }));
      setLoading(false);
      Alert.alert(
        "Error",
        "There was an error saving your new PIN. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const renderPinInputs = () => {
    const currentPin = isConfirming ? confirmPin : pin;
    return (
      <View className="flex-row justify-center space-x-8 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <View 
            key={i}
            className="w-12 h-12 items-center justify-center rounded-full border-2" 
            style={{
              borderColor: i < currentPin.length ? "#0072CE" : "#ccc",
              backgroundColor: i < currentPin.length ? "#0072CE" : "transparent",
            }}
          >
            {i < currentPin.length && (
              <View className="w-4 h-4 rounded-full bg-white" />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
    return (
      <View className="mt-10 space-y-8 w-full">
        {Array(4)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-around">
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                key ? (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      if (key === "⌫") {
                        handleBackspace();
                      } else {
                        handleKeyPress(key);
                      }
                    }}
                    className="w-20 h-20 bg-white justify-center items-center rounded-full"
                    style={{ 
                      opacity: loading ? 0.6 : 1,
                    }}
                    disabled={loading}
                  >
                    {key === "⌫" ? (
                      <Ionicons name="backspace-outline" size={28} color="#0072CE" />
                    ) : (
                      <Text className="text-3xl font-semibold text-[#0072CE]">{key}</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View key={`empty-${rowIndex}-${Math.random()}`} className="w-20 h-20" />
                )
              ))}
            </View>
          ))}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white px-6 justify-between pt-20 pb-10">
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={() => {
            if (isConfirming) {
              setIsConfirming(false);
              setConfirmPin("");
            } else {
              router.back();
            }
          }}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text className="font-semibold">Step 3 of 3</Text>
      </View>

      {/* Top section */}
      <View className="items-center mt-8">
        <Text className="text-2xl font-bold text-primaryText">
          {isConfirming ? "Confirm Passcode" : "Create New Passcode"}
        </Text>
        <Text className="text-gray-500 mt-2 mb-16">
          {isConfirming 
            ? "Re-enter the passcode to confirm" 
            : "Enter a 4-digit passcode for your account"
          }
        </Text>

        {renderPinInputs()}

        {loading && (
          <ActivityIndicator size="large" color="#0072CE" className="mt-6" />
        )}
      </View>

      {/* Keypad */}
      {renderKeypad()}
    </View>
  );
}