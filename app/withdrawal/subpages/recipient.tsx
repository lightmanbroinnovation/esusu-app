import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Replace with Moti Skeleton

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Amount Display
  amountContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  balanceText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Form
  formContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: '#3B82F6',
  },
  formGroup: {
    marginBottom: 24,
  },
  
  // Fee Display
  feeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  feeText: {
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  feeLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeLoadingText: {
    color: '#4B5563',
    marginLeft: 8,
  },
  
  // Button
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#2563EB',
  },
  buttonDisabled: {
    backgroundColor: '#BFDBFE',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Skeleton
  skeletonContainer: {
    padding: 24,
  },
  skeletonItem: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  skeletonButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    marginTop: 32,
  },
});

interface BankDetails {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

const RecipientScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    accountName: '',
    bankName: '',
  });
  const [userDetails, setUserDetails] = useState<any>(null);
  const [amount, setAmount] = useState<string>('0');
  const [transferFee, setTransferFee] = useState<number>(0);
  const [feeLoading, setFeeLoading] = useState(false);

  useEffect(() => {
    loadUserDetails();
    // Set amount from params
    if (params.amount) {
      setAmount(params.amount as string);
    }
  }, [params.amount]);

  const loadUserDetails = async () => {
    try {
      const userData = await AsyncStorage.getItem('withdrawalUserData');
      if (userData) {
        setUserDetails(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const handleInputChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value,
    }));

    // Fetch transfer fee when bank name is entered
    if (field === 'bankName' && value.trim()) {
      fetchTransferFee(value.trim());
    }
  };

  // Helper to get transfer fee for a bank name
  const getTransferFee = async (bankName: string) => {
    const token = await AsyncStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    // First, we need to get the bank code from bank name
    // For now, we'll use a simple mapping or API call
    try {
      const res = await fetch(`https://esusu-server.onrender.com/api/account/fee/bank/${encodeURIComponent(bankName)}`, {
        method: 'GET',
        headers
      });
      const response = await res.json();
      console.log('Transfer fee response for bank name', bankName, ':', response);
      return response;
    } catch (error) {
      console.error('Error fetching transfer fee:', error);
      return { status: 'Error', message: 'Failed to fetch fee' };
    }
  };

  const fetchTransferFee = async (bankName: string) => {
    setFeeLoading(true);
    try {
      const feeResponse = await getTransferFee(bankName);
      if (feeResponse.status === 'Success' && feeResponse.data) {
        setTransferFee(feeResponse.data.transferFee || 0);
      } else {
        setTransferFee(0);
      }
    } catch (error) {
      console.error('Error fetching transfer fee:', error);
      setTransferFee(0);
    } finally {
      setFeeLoading(false);
    }
  };

  const validateForm = () => {
    if (!bankDetails.accountNumber || bankDetails.accountNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid account number');
      return false;
    }
    if (!bankDetails.accountName) {
      Alert.alert('Error', 'Please enter the account name');
      return false;
    }
    if (!bankDetails.bankName) {
      Alert.alert('Error', 'Please select a bank');
      return false;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Invalid withdrawal amount');
      return false;
    }
    if (userDetails && parseFloat(amount) > userDetails.balance) {
      Alert.alert('Error', 'Withdrawal amount cannot exceed your balance');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Save bank details to AsyncStorage
      await AsyncStorage.setItem('withdrawalBankDetails', JSON.stringify({
        ...bankDetails,
        amount
      }));
      
      // Navigate to OTP verification
      router.push({
        pathname: '/withdrawal/subpages/otp',
        params: { amount }
      });
    } catch (error) {
      console.error('Error saving bank details:', error);
      Alert.alert('Error', 'Failed to process bank details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.skeletonContainer}>
          {/* Amount Display Skeleton */}
          <View style={[styles.skeletonItem, {height: 120}]} />
          {/* Form Fields Skeleton */}
          {[1,2,3].map((_,i) => (
            <View key={i} style={styles.skeletonItem} />
          ))}
          {/* Continue Button Skeleton */}
          <View style={styles.skeletonButton} />
        </View>
      </ScrollView>
    );
  }
  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Withdrawal Amount</Text>
          <Text style={styles.amountText}>
            ₦{parseInt(amount).toLocaleString()}
          </Text>
          {userDetails && (
            <Text style={styles.balanceText}>
              Available balance: ₦{userDetails.balance.toLocaleString()}
            </Text>
          )}
        </View>
        
        {/* Form */}
        <View style={styles.formContainer}>
          {/* Account Number */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              value={bankDetails.accountNumber}
              onChangeText={(value) => handleInputChange('accountNumber', value)}
              keyboardType="numeric"
              maxLength={10}
              style={styles.input}
              placeholder="Enter account number"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          {/* Account Name */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Account Name</Text>
            <TextInput
              value={bankDetails.accountName}
              onChangeText={(value) => handleInputChange('accountName', value)}
              style={styles.input}
              placeholder="Enter account name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Fee Display */}
          <View style={styles.feeContainer}>
            {feeLoading ? (
              <View style={styles.feeLoading}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.feeLoadingText}>Calculating fee...</Text>
              </View>
            ) : transferFee > 0 ? (
              <View style={styles.feeContainer}>
                <Text style={styles.feeText}>
                  Transfer Fee: ₦{transferFee.toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Bank Name */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              value={bankDetails.bankName}
              onChangeText={(value) => handleInputChange('bankName', value)}
              style={styles.input}
              placeholder="Enter bank name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
        
        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading}
            style={[
              styles.button,
              loading ? styles.buttonDisabled : styles.buttonEnabled
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default RecipientScreen; 