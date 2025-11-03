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
  StyleSheet,
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
    <Modal 
      visible={true} 
      transparent 
      animationType="fade" 
      onRequestClose={handleClose}
    >
      {/* Overlay */}
      <Pressable 
        style={styles.overlay} 
        onPress={handleClose}
      >
        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0074FF" />
            </View>
          )}
          
          {/* Large Bank Logo */}
          <View style={styles.bankLogoContainer}>
            <Image
              source={getBankLogo(bank.bankName)}
              style={styles.bankLogo}
              resizeMode="cover"
            />
          </View>

          {/* Bank Name */}
          <Text style={styles.label}>Bank name</Text>
          <Text style={styles.value}>
            {bank.bankName || bank.bankCode || 'Unknown Bank'}
          </Text>

          {/* Account Name */}
          <Text style={styles.label}>Account Name</Text>
          <Text style={[styles.value, styles.trackingWide]}>
            {bank.accountName || 'N/A'}
          </Text>

          {/* Account Number */}
          <Text style={styles.label}>Account Number</Text>
          <Text style={[styles.value, styles.trackingWide]}>
            {bank.accountNumber || 'N/A'}
          </Text>

          {/* Set as Primary Account */}
          <View style={styles.primaryAccountContainer}>
            <View>
              <Text style={styles.primaryAccountText}>Set as Primary Account</Text>
              <Text style={styles.primaryAccountSubtext}>
                This will be your default withdrawal account.
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#0074FF" }}
              thumbColor="#FFFFFF"
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
            style={[styles.removeButton, loading && styles.disabledButton]}
          >
            <Text style={styles.removeButtonText}>Remove Settlement Account</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 40,
  },
  bankLogoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'white',
    alignSelf: 'center',
    marginTop: -64,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bankLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackingWide: {
    letterSpacing: 1.5,
  },
  primaryAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  primaryAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  primaryAccountSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
