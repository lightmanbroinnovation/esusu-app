import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { setTransactionPin } from '../../services/api';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';

export default function TransactionPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // New state for success message
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
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
            <Ionicons name="backspace-outline" size={30} color="#0072CE" />
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

  const handleSubmit = async () => {
    if (!isConfirming) {
      if (pin.length === 4) {
        setIsConfirming(true);
        setConfirmPin("");
      } else {
        Vibration.vibrate(100);
        Alert.alert("Invalid Transaction Pin", "Please enter a 4-digit transaction pin.");
      }
    } else {
      if (confirmPin === pin) {
        setLoading(true);
        try {
          const response = await setTransactionPin(pin);
          console.log('Transaction Pin API Response:', response);
          if (response.status === "Success") {
            setSuccess(true);
            setTimeout(() => {
              setSuccess(false);
              router.replace('/dashboard');
            }, 2000);
          } else {
            Alert.alert("Failed", response.message || "Could not set transaction pin. Please try again.");
          }
        } catch (error) {
          Alert.alert("Error", "Failed to set transaction pin. Please check your network and try again.");
        } finally {
          setLoading(false);
        }
      } else {
        Vibration.vibrate(100);
        Alert.alert("Pin Mismatch", "Pins do not match. Please try again.");
        setConfirmPin("");
      }
    }
  };

  if (loading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !pin) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No network. Please connect to the internet to load transaction pin page.</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 px-6 justify-between pb-10">
      {/* Top section */}
      {/* Header */}
      <View className="flex-row justify-between items-center mt-16">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
          <Text className="font-semibold text-lg flex-1 text-center">Set Transaction Pin</Text>
      </View>
      {success && (
        <View className="bg-green-100 border border-green-400 rounded-lg p-4 mt-6 mb-2">
          <Text className="text-green-700 text-center font-semibold">Transaction pin set successfully! Redirecting to dashboard...</Text>
        </View>
      )}
      <View className="items-center">
        <Text className="text-2xl font-bold text-primaryText">
          {isConfirming ? "Confirm Transaction Pin" : "Create Transaction Pin"}
        </Text>
        <Text className="text-gray-500 mt-2 mb-16">
          {isConfirming
            ? "Re-enter your transaction pin to make sure it's correct."
            : "Set a 4-digit transaction pin for secure transactions."}
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
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-lg mr-2 font-semibold">
              {isConfirming ? "Set Pin" : "Next"}
            </Text>
          )}
          {!loading && <MaterialIcons name="arrow-forward" size={18} color="white" />}
        </TouchableOpacity>
      </View>
    </View>
    </ScrollView>
  );
} 