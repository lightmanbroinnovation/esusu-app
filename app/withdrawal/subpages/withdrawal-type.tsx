import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBackButtonHandler } from '../../utils/backButtonHandler';

interface ContributorAccount {
  _id: string;
  settlementBalance: number;
  id: string;
}
interface Contributor {
  _id: string;
  firstName: string;
  lastName: string;
  photo?: string;
}
interface UserData {
  contributorAccount: ContributorAccount;
  contributor: Contributor;
}

const WithdrawalTypeScreen = () => {
  const router = useRouter();
  
  // Use back button handler for withdrawal type page
  useBackButtonHandler('/withdrawal/subpages/withdrawal-type');
  
  const params = useLocalSearchParams();
  const phoneNumberParam = params.phoneNumber as string | undefined;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [amount, setAmount] = useState('0');
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.userDataString) {
      try {
        const parsedData = JSON.parse(params.userDataString as string);
        setUserData(parsedData);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, [params.userDataString]);

  const handleNumberPress = (num: string) => {
    setAmount(prev => {
      if (prev === '0') {
        return num;
      }
      // Handle '00' special case
      if (num === '00') {
        return prev === '0' ? '0' : prev + '00';
      }
      return prev + num;
    });
    if (error) setError(null);
  };

  const handleBackspace = () => {
    setAmount(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
    if (error) setError(null);
  };

  const handleDone = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!userData) return;
    const settlementBalance = userData.contributorAccount.settlementBalance || 0;
    if (parseFloat(amount) > settlementBalance) {
      setError(`You cannot withdraw more than ₦${settlementBalance.toLocaleString()}`);
      return;
    }
    try {
      // Save withdrawal amount and user details
      await AsyncStorage.setItem('withdrawalAmount', amount);
      await AsyncStorage.setItem('withdrawalUserData', JSON.stringify(userData));
      // Navigate to recepient.tsx with phoneNumber and amount
      router.push({
        pathname: '/withdrawal/subpages/recepient',
        params: {
          phoneNumber: phoneNumberParam || (userData.contributor as any)?.phoneNumber || userData.contributorAccount.id || '',
          amount
        }
      });
    } catch (error) {
      console.error('Error saving withdrawal data:', error);
    }
  };

  const handleOptionSelect = async (type: 'cash' | 'transfer') => {
    try {
      await AsyncStorage.setItem('withdrawalType', type);
      if (type === 'transfer') {
        router.push({
          pathname: '/withdrawal/subpages/recipient',
          params: { amount }
        });
      } else {
        router.push({
          pathname: '/withdrawal/subpages/otp',
          params: { amount }
        });
      }
    } catch (error) {
      console.error('Error saving withdrawal type:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center pt-4 justify-between px-4 mt-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Withdraw</Text>
        <View className="w-10" />
      </View>

      {/* User Card */}
      {userData && (
        <View className="mx-4 mt-6 p-4 bg-[#F8FAFC] rounded-2xl flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            {userData.contributor.photo ? (
              <Image
                source={{ uri: userData.contributor.photo }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                <Text className="text-lg font-semibold">
                  {userData.contributor.firstName[0]}
                </Text>
              </View>
            )}
            <View>
              <Text className="text-lg font-semibold">{userData.contributor.firstName}</Text>
              <Text className="text-gray-600">{userData.contributor.lastName}</Text>
            </View>
          </View>
          <View>
            <Text className="text-sm text-gray-500">Settlement Balance</Text>
            <Text className="text-lg font-semibold">₦{userData.contributorAccount.settlementBalance?.toLocaleString() || '0'}</Text>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View className="mx-4 mt-4 p-4 bg-red-50 rounded-2xl border border-red-200">
          <Text className="text-sm text-red-600 font-medium mb-1">Unable to Process</Text>
          <Text className="text-red-700">{error}</Text>
        </View>
      )}

      {/* Amount Display */}
      <View className="items-center mt-8">
        <Text className="text-gray-500 mb-2">Enter Amount</Text>
        <Text className="text-5xl font-semibold">₦{parseInt(amount).toLocaleString()}</Text>
      </View>

      {/* Quick Amount Buttons */}
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity 
          onPress={() => setAmount('5000')}
          className="px-6 py-2 rounded-full bg-gray-100"
        >
          <Text>₦5,000</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setAmount('15000')}
          className="px-6 py-2 rounded-full bg-gray-100"
        >
          <Text>₦15,000</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setAmount('25000')}
          className="px-6 py-2 rounded-full bg-gray-100"
        >
          <Text>₦25,000</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-between px-4 mt-8">
        {/* Keypad */}
        <View className="mt-8">
          {/* Row 1 */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => handleNumberPress('1')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress('2')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress('3')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">3</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => handleNumberPress('4')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">4</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress('5')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress('6')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">6</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => handleNumberPress('7')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">7</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress('8')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">8</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress('9')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">9</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4 */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => handleNumberPress('00')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">00</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress('0')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBackspace}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="backspace-outline" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Done Button */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={handleDone}
            disabled={!amount || amount === '0'}
            className={`p-4 rounded-xl ${
              !amount || amount === '0' ? 'bg-blue-300' : 'bg-blue-600'
            } items-center`}
          >
            <Text className="text-white font-medium text-base">Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Withdrawal Options Modal */}
      {showOptions && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white m-4 p-6 rounded-2xl w-[90%]">
            <Text className="text-xl font-semibold mb-4">Select Withdrawal Method</Text>
            
            <TouchableOpacity
              onPress={() => handleOptionSelect('cash')}
              className="flex-row items-center p-4 border border-gray-200 rounded-xl mb-3"
            >
              <Ionicons name="cash-outline" size={24} color="#0066FF" className="mr-3" />
              <Text className="text-lg">Cash Withdrawal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOptionSelect('transfer')}
              className="flex-row items-center p-4 border border-gray-200 rounded-xl mb-4"
            >
              <Ionicons name="card-outline" size={24} color="#0066FF" className="mr-3" />
              <Text className="text-lg">Bank Transfer</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowOptions(false)}
              className="bg-gray-100 p-4 rounded-xl"
            >
              <Text className="text-center text-gray-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default WithdrawalTypeScreen; 