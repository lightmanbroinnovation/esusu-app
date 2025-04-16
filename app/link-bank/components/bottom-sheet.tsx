import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBank } from "../context/bank-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUser } from "../../../services/api";

interface Bank {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function BankBottomSheet({
  bank,
  onClose,
}: {
  bank: Bank;
  onClose: () => void;
}) {
  const { banks, primaryBankId, refreshBanks } = useBank();
  const [loading, setLoading] = useState(false);
  const [isPrimary, setIsPrimary] = useState(bank.isPrimary || false);
  const [userId, setUserId] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Get user ID from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => {
      if (id) setUserId(id);
    });
  }, []);

  useEffect(() => {
    // Slide up when modal opens
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleSetPrimary = async (value: boolean) => {
    if (!userId) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    setLoading(true);
    try {
      setIsPrimary(value);
      
      // Update all bank accounts to set primary status
      const updatedBanks = banks.map(item => ({
        ...item,
        isPrimary: item.id === bank.id ? value : false
      }));
      
      // Update user with new bank accounts
      await updateUser(userId, { bankAccounts: updatedBanks });
      
      // Refresh the bank accounts list
      await refreshBanks();
      
      if (value) {
        Alert.alert("Success", "This account has been set as your primary account");
      }
    } catch (error) {
      console.error("Error updating primary account:", error);
      setIsPrimary(!value); // Revert switch if failed
      Alert.alert("Error", "Failed to update account status");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBank = async () => {
    if (!userId) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    Alert.alert(
      "Remove Bank Account",
      "Are you sure you want to remove this bank account?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Filter out the bank to be removed
              const updatedBanks = banks.filter(item => item.id !== bank.id);
              
              // If removing the primary account, set a new primary if available
              if (bank.isPrimary && updatedBanks.length > 0) {
                updatedBanks[0].isPrimary = true;
              }
              
              // Update user with new bank accounts
              await updateUser(userId, { bankAccounts: updatedBanks });
              
              // Refresh and close
              await refreshBanks();
              handleClose();
            } catch (error) {
              console.error("Error removing bank account:", error);
              Alert.alert("Error", "Failed to remove bank account");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={true} transparent animationType="none" onRequestClose={handleClose}>
      {/* Overlay */}
      <View className="flex-1 bg-black/60">
        {/* Close Button */}
        <TouchableOpacity
          onPress={handleClose}
          className="absolute top-10 right-5 z-20"
          disabled={loading}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Sliding Sheet */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
          }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6"
        >
          {loading && (
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/10 z-10 justify-center items-center rounded-t-[32px]">
              <ActivityIndicator size="large" color="#0074FF" />
            </View>
          )}
          
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
          
          <View className="mb-4 py-4">
            <Text className="text-gray-500 text-sm">Bank Name</Text>
            <Text className="text-lg font-semibold mt-2">{bank.bankName}</Text>
          </View>

          <View className="h-[1px] w-full bg-gray-200"></View>

          <View className="mb-4 py-4">
            <Text className="text-gray-500 text-sm">Account Number</Text>
            <Text className="text-lg font-semibold mt-2">{bank.accountNumber}</Text>
          </View>
          
          <View className="h-[1px] w-full bg-gray-200"></View>
          
          <View className="mb-4 py-4">
            <Text className="text-gray-500 text-sm">Account Name</Text>
            <Text className="text-lg font-semibold mt-2">{bank.accountName}</Text>
          </View>

          <View className="h-[1px] w-full bg-gray-200"></View>

          <View className="flex-row justify-between items-center py-6">
            <View>
              <Text className="text-base font-medium">Set as Primary Account</Text>
              <Text className="text-gray-500 text-xs mt-1">This will be your default withdrawal account.</Text>
            </View>
            <Switch
              value={isPrimary}
              onValueChange={handleSetPrimary}
              disabled={loading}
            />
          </View>

          <TouchableOpacity
            onPress={handleRemoveBank}
            className="bg-red-100 px-4 py-4 rounded-xl mt-4"
            disabled={loading}
          >
            <Text className="text-red-600 text-center text-base font-semibold">Remove Account</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
