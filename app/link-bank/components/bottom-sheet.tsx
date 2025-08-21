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
    if (!userId) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    Alert.alert(
      "Remove Bank Account",
      "Are you sure you want to remove this bank account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const updatedBanks = banks.filter(item => item.id !== bank.id);
              if (bank.isPrimary && updatedBanks.length > 0) {
                updatedBanks[0].isPrimary = true;
              }
              await updateUser(userId, { bankAccounts: updatedBanks });
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
            onPress={handleRemoveBank}
            disabled={loading}
            className="bg-red-100 py-4 rounded-2xl mt-8 w-full"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            <Text className="text-red-500 font-bold text-center text-lg">Remove</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
