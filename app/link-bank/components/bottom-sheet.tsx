import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBank } from "../context/bank-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUser } from "../../../services/api";
import * as Clipboard from 'expo-clipboard';

interface Bank {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary?: boolean;
  bankCode?: string;
}

export default function BankBottomSheet({
  bank,
  onClose,
}: {
  bank: Bank;
  onClose: () => void;
}) {
  const { banks, primaryBankId, isLoading, error, refreshBanks } = useBank();
  const [loading, setLoading] = useState(false);
  const [isPrimary, setIsPrimary] = useState(bank.isPrimary || false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => {
      console.log('User ID from AsyncStorage:', id);
      if (id) setUserId(id);
    });
  }, []);

  const handleClose = () => {
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", "Text copied to clipboard.");
  };

  const handleSetPrimary = async (value: boolean) => {
    if (!userId) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    setLoading(true);
    try {
      setIsPrimary(value);
      const updatedBanks = banks.map(item => ({
        ...item,
        isPrimary: item.id === bank.id ? value : false
      }));
      await updateUser(userId, { bankAccounts: updatedBanks });
      
      // Invalidate settlement accounts cache to force refetch
      try {
        const { invalidateCache } = await import('../../utils/dataCaching');
        await invalidateCache('settlement_accounts');
        console.log('Settlement accounts cache invalidated after setting primary bank');
      } catch (cacheError) {
        console.error('Error invalidating settlement accounts cache:', cacheError);
      }
      
      await refreshBanks();
      if (value) {
        Alert.alert("Success", "This account has been set as your primary account");
      }
    } catch (error) {
      console.error("Error updating primary account:", error);
      setIsPrimary(!value);
      Alert.alert("Error", "Failed to update account status");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBank = async () => {
    console.log('handleRemoveBank called');
    console.log('Bank prop:', bank);
    console.log('Bank ID:', bank.id);
    console.log('User ID:', userId);
    if (!userId) {
      console.log('User ID not found, showing error alert');
      Alert.alert("Error", "User not logged in");
      return;
    }

    console.log('Proceeding with account removal for bank:', bank.id);
    setLoading(true);
    try {
      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Sending PATCH request to delete account:', bank.id);
      // Send PATCH request to delete settlement account
      const response = await fetch('https://esusu-server.onrender.com/api/account/settlement-accounts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: bank.id,
        }),
      });

      console.log('API response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Settlement account deleted successfully:', data);

      // Invalidate settlement accounts cache to force refetch
      try {
        const { invalidateCache } = await import('../../utils/dataCaching');
        await invalidateCache('settlement_accounts');
        console.log('Settlement accounts cache invalidated after removing bank');
      } catch (cacheError) {
        console.error('Error invalidating settlement accounts cache:', cacheError);
      }

      // Refresh banks list from server to update cache
      await refreshBanks();

      // Close the bottom sheet
      handleClose();

      // Show success confirmation popup
      Alert.alert(
        "Account Removed",
        "The settlement account has been successfully removed from your account.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error removing settlement account:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to remove settlement account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get bank logo based on bank name
  const getBankLogo = (bankName: string) => {
    const name = bankName?.toLowerCase() || '';
    if (name.includes('first bank') || name.includes('firstbank')) {
      return require('../../assets/images/icon.png');
    } else if (name.includes('uba')) {
      return require('../../assets/images/icon.png');
    } else if (name.includes('zenith')) {
      return require('../../assets/images/icon.png');
    } else if (name.includes('gtb') || name.includes('guaranty')) {
      return require('../../assets/images/icon.png');
    } else {
      return require('../../assets/images/icon.png');
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={handleClose}>
      {/* Overlay */}
      <Pressable className="flex-1 bg-black/60 items-center" onPress={handleClose}>
        {/* Bottom Sheet */}
        <View className="absolute bg-white rounded-t-[40px] p-6 w-full bottom-0 items-center" style={{ paddingBottom: 32 }}>
          {loading && (
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/10 z-10 justify-center items-center rounded-xl">
              <ActivityIndicator size="large" color="#0074FF" />
            </View>
          )}
          
          {/* Large Bank Logo */}
          <View className="w-24 h-24 rounded-full bg-white shadow items-center justify-center -mt-16 mb-4" style={{ overflow: 'hidden' }}>
            <Image
              source={getBankLogo(bank.bankName)}
              className="w-20 h-20"
              resizeMode="cover"
            />
          </View>

          {/* Bank Name */}
          <Text className="text-gray-500 text-base mb-1">Bank name</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-4">{bank.bankName || bank.bankCode || 'Unknown Bank'}</Text>

          {/* Account Number */}
          <Text className="text-gray-500 text-base mb-1">Account Name</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-4 tracking-widest">{bank.accountName || 'N/A'}</Text>
          {/* Account Number */}

          <Text className="text-gray-500 text-base mb-1">Account Number</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-4 tracking-widest">{bank.accountNumber || 'N/A'}</Text>

          {/* Set as Primary Account */}
          <View className="flex-row justify-between items-center w-full py-5 mb-2">
            <View>
              <Text className="text-base font-semibold text-gray-800">Set as Primary Account</Text>
              <Text className="text-gray-500 text-sm mt-1">This will be your default withdrawal account.</Text>
            </View>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#0074FF" }}
              thumbColor={isPrimary ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#E0E0E0"
              onValueChange={handleSetPrimary}
              value={isPrimary}
              disabled={loading}
            />
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => {
              console.log('Remove button pressed');
              handleRemoveBank();
            }}
            disabled={loading}
            className="bg-red-100 py-4 rounded-2xl mt-8 w-full"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            <Text className="text-red-500 font-bold text-center text-lg">Remove Settlement Account</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
