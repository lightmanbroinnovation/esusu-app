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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Replace with Moti Skeleton

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
      <ScrollView className="flex-1 bg-white">
        {/* TODO: Replace with Moti Skeleton */}
        <View style={{ padding: 24 }}>
          {/* Amount Display Skeleton */}
          <View style={{ width: '100%', height: 48, borderRadius: 12, marginBottom: 24 }} />
          {/* Form Fields Skeleton */}
          {[1,2,3].map((_,i) => (
            <View key={i} style={{ width: '100%', height: 48, borderRadius: 12, marginBottom: 24 }} />
          ))}
          {/* Continue Button Skeleton */}
          <View style={{ width: '100%', height: 48, borderRadius: 24, marginTop: 32 }} />
        </View>
      </ScrollView>
    );
  }
  return (
    <ScrollView className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 mt-10 pt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Bank Details</Text>
          <View className="w-10" />
        </View>
        {/* Amount Display */}
        <View className="mx-4 mt-6 p-4 bg-[#F8FAFC] rounded-2xl">
          <Text className="text-sm text-gray-500">Withdrawal Amount</Text>
          <Text className="text-2xl font-semibold">
6{parseInt(amount).toLocaleString()}</Text>
          {userDetails && (
            <Text className="text-xs text-gray-500 mt-1">
              Available balance: 
6{userDetails.balance.toLocaleString()}
            </Text>
          )}
        </View>
        {/* Form */}
        <View className="px-4 mt-8">
          {/* Account Number */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2">Account Number</Text>
            <TextInput
              value={bankDetails.accountNumber}
              onChangeText={(value) => handleInputChange('accountNumber', value)}
              keyboardType="numeric"
              maxLength={10}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="Enter account number"
            />
          </View>
          {/* Account Name */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2">Account Name</Text>
            <TextInput
              value={bankDetails.accountName}
              onChangeText={(value) => handleInputChange('accountName', value)}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="Enter account name"
            />
          </View>

          {/* Fee Display */}
          <View className="items-center mb-4">
            {feeLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#0074FF" />
                <Text className="text-gray-600 ml-2">Calculating fee...</Text>
              </View>
            ) : transferFee > 0 ? (
              <View className="bg-blue-50 rounded-lg px-4 py-2">
                <Text className="text-blue-800 text-sm">
                  Transfer Fee: ₦{transferFee.toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Bank Name */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2">Bank Name</Text>
            <TextInput
              value={bankDetails.bankName}
              onChangeText={(value) => handleInputChange('bankName', value)}
              className="border border-gray-300 rounded-xl px-4 py-3"
              placeholder="Enter bank name"
            />
          </View>
        </View>
        {/* Continue Button */}
        <View className="px-4 mt-8">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading}
            className={`py-4 rounded-full ${
              loading ? 'bg-blue-300' : 'bg-blue-600'
            } items-center`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-medium text-base">Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default RecipientScreen; 