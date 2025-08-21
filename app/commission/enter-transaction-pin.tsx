import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { transferToBank } from '../../services/api';
import NetInfo from '@react-native-community/netinfo';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';

export default function EnterTransactionPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [networkAvailable, setNetworkAvailable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(null);
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
    console.log('Params in enter-transaction-pin:', params);
    if (pin.length !== 4) {
      Vibration.vibrate(100);
      setError("Please enter your 4-digit transaction pin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        amount: params.amount || '',
        bankCode: params.bankCode || '',
        accountNumber: params.accountNumber || '',
        beneficiaryName: params.beneficiaryName || '',
        transactionPin: pin
      };
      if (params.sessionId) {
        payload.sessionId = params.sessionId;
      }
      console.log('TransferToBank Payload:', payload);
      const response = await transferToBank(payload);
      console.log('Transfer to Bank API Response:', response);
      if (response.status === 'Success') {
        await sendNotification(
          NotificationTemplates.transaction.withdrawal(payload.amount).title,
          NotificationTemplates.transaction.withdrawal(payload.amount).body,
          NotificationTemplates.transaction.withdrawal(payload.amount).type
        );
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.replace('/dashboard');
        }, 2000);
      } else {
        setError(response.message || 'Failed to complete transfer.');
      }
    } catch (error) {
      const err: any = error;
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('Failed to complete transfer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 px-6 justify-between pt-10 pb-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mt-6">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-center flex-1">Enter Transaction Pin</Text>
      </View>
      {!networkAvailable && (
        <View style={{ marginTop: 10, marginBottom: 10 }}>
          <Text style={{ color: 'red', textAlign: 'center' }}>
            You are offline. Some features may be unavailable.
          </Text>
        </View>
      )}
      {error && (
        <View className="bg-red-100 border border-red-400 rounded-lg p-4 mt-6 mb-2">
          <Text className="text-red-700 text-center font-semibold">{error}</Text>
        </View>
      )}
      {success && (
        <View className="bg-green-100 border border-green-400 rounded-lg p-4 mt-6 mb-2">
          <Text className="text-green-700 text-center font-semibold">Transfer successful! Redirecting to dashboard...</Text>
        </View>
      )}
      <View className="items-center">
        <Text className="text-2xl font-bold text-primaryText mt-4 mb-2">
          Enter your Transaction Pin
        </Text>
        <Text className="text-gray-500 mb-12">
          Please input your 4-digit transaction pin to continue.
        </Text>
        {renderPinInputs()}
      </View>
      {renderKeypad()}
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
              Continue
            </Text>
          )}
          {!loading && <MaterialIcons name="arrow-forward" size={18} color="white" />}
        </TouchableOpacity>
      </View>
    </View>
    </ScrollView>
  );
} 