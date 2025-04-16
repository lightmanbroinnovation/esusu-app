export const options = {
  headerShown: false, // Hide the header
};
;
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Vibration, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // Correct import
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUser } from "../../services/api";

export default function OTPScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(false); // State to toggle keypad visibility
  const [withdrawAmount, setWithdrawAmount] = useState<string>("0");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Fetch user ID and withdrawal amount from AsyncStorage
  useEffect(() => {
    const getData = async () => {
      try {
        const [storedUserId, storedAmount] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('withdrawAmount')
        ]);
        
        if (!storedUserId) {
          console.error('User ID not found in AsyncStorage');
          Alert.alert('Error', 'User ID not found. Please try again.');
        } else {
          setUserId(storedUserId);
        }
        
        if (storedAmount) {
          setWithdrawAmount(storedAmount);
        }
      } catch (error) {
        console.error('Error retrieving data from AsyncStorage:', error);
        Alert.alert('Error', 'Failed to load necessary data. Please try again.');
      }
    };
    
    getData();
  }, []);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      Vibration.vibrate(100);
      Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP.');
      return;
    }

    if (!userId || !withdrawAmount) {
      Alert.alert('Error', 'Unable to process withdrawal. Missing required information.');
      return;
    }

    setLoading(true);
    
    try {
      // In a real app, you would validate the OTP with your backend here
      // For this demo, we'll simulate a successful OTP verification
      
      // Simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After successful OTP verification, you would process the withdrawal
      // Here we'll just navigate to the success screen
      router.replace('/commission/success');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
      setLoading(false);
    }
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
            <Text className="text-xl font-bold text-[#0072CE]">{pin[i] ? "•" : ""}</Text>
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
                        handleSubmit();
                      } else {
                        Vibration.vibrate(100);
                      }
                    } else {
                      handleKeyPress(key);
                    }
                  }}
                  className="w-20 h-20 bg-white justify-center items-center"
                  disabled={loading}
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

  // Format the amount for display
  const formattedAmount = Number(withdrawAmount).toLocaleString();

  return (
    <View className="flex-1 bg-white px-4">
      {/* Back Button */}
      <View className="flex-row items-center mt-10 p-4">
      <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
          <Text className="text-xl font-bold flex-1 text-center mr-8">Withdraw</Text>
        </View>

      {/* Main Content */}
      <View className="flex-1 mt-8">
        <Text className="text-[24px] font-bold text-center text-primaryText">OTP Verification</Text>
        <Text className="text-gray-500 text-center mt-2 mb-2">
        Enter the OTP sent to your registered phone number to complete your withdrawal.
        </Text>
        
        {/* Amount Display */}
        <View className="bg-blue-50 py-4 px-6 rounded-xl mb-4">
          <Text className="text-center text-gray-600">Withdrawal Amount</Text>
          <Text className="text-center text-[20px] font-bold text-blue-600">₦{formattedAmount}</Text>
        </View>

        {renderPinInputs()}

        <TouchableOpacity className="mt-2 text-center" disabled={loading}>
          <Text className="text-primaryText text-xl text-center">Resend Code</Text>
        </TouchableOpacity>
     
        <View className="flex-1 justify-end pb-4">
          {/* Continue Button */}
          <TouchableOpacity
            className={`flex-row justify-center items-center py-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-[#0072CE]'}`}
            onPress={handleSubmit}
            disabled={loading || pin.length !== 4}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
            ) : null}
            <Text className="text-white text-lg mr-2 font-semibold">
              {loading ? 'Processing...' : 'Complete Withdrawal'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Keypad */}
      {showKeypad && renderKeypad()}
    </View>
  );
}