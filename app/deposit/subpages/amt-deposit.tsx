import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import StatusBarAdapter from '../../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchContributorByPhone } from '../../../services/api';

// Define the Account type
type Account = {
  bank: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  image: any;
  balance: number;
};

// Define user details interface
interface UserDetails {
  id: string;
  firstname?: string;
  firstName?: string; 
  lastname?: string;
  lastName?: string;
  email?: string;
  phonenumber?: string;
  phoneNumber?: string;
  phone?: string;
  balance?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  weeklyEarnings?: number;
  commissions?: any[];
  imageUrl?: string;
}

const RadioButton = ({ label, value, selected, onSelect }: any) => {
  const isSelected = selected === value;

  return (
    <TouchableOpacity
      onPress={() => onSelect(isSelected ? null : value)}
      className="flex flex-row items-center mb-2"
    >
      <View
        className={`w-4 h-4 rounded-full border-2 mr-3 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
          } items-center justify-center`}
      >
        {isSelected && (
          <View className="w-3 h-3 rounded-full bg-blue-500" />
        )}
      </View>
      <Text className="text-base font-medium text-gray-700">{label}</Text>
    </TouchableOpacity>
  );
};

const AmtDeposit = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [amount, setAmount] = useState('0');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // Load contributor data asynchronously
  useEffect(() => {
    const initializeData = async () => {
      try {
        // If we have data in params, use it
        if (params.userDataString) {
          const contributorData = JSON.parse(params.userDataString as string);
          console.log('Parsed contributor data:', contributorData);
          
          setUserDetails({
            id: contributorData.id,
            firstname: contributorData.firstname || contributorData.firstName || '',
            lastname: contributorData.lastname || contributorData.lastName || '',
            email: contributorData.email || '',
            phonenumber: contributorData.phonenumber || contributorData.phone || params.phone as string,
            balance: contributorData.balance || 0,
            imageUrl: contributorData.photoUri || '',
          });
          setLoadingData(false);
          return; // Exit if we successfully loaded from params
        }

        // If no data in params, try to load from API
        await loadContributorData();
      } catch (err) {
        console.error("Error in initialization:", err);
        setError("Failed to load contributor details");
      } finally {
        setLoadingData(false);
      }
    };

    initializeData();
  }, []);

  // Load contributor data from API
  const loadContributorData = async () => {
    try {
      // Get the logged-in user ID and searched phone
      const [agentId, phoneNumber] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('lastSearchedPhone') || params.phone
      ]);
      
      if (!agentId) {
        throw new Error("User must be logged in");
      }
      
      if (!phoneNumber) {
        throw new Error("No phone number provided");
      }
      
      console.log('Fetching contributor data for:', { agentId, phoneNumber });
      
      // Fetch contributor data
      const contributorData = await fetchContributorByPhone(agentId, phoneNumber as string);
      
      if (!contributorData) {
        throw new Error("Contributor not found");
      }
      
      console.log('Received contributor data:', contributorData);
      
      // Format and set the contributor data
      setUserDetails({
        id: contributorData.id,
        firstname: contributorData.firstname || contributorData.firstName || '',
        lastname: contributorData.lastname || contributorData.lastName || '',
        email: contributorData.email || '',
        phonenumber: contributorData.phonenumber || contributorData.phoneNumber || contributorData.phone || '',
        balance: contributorData.balance || 0,
        imageUrl: contributorData.photoUri || '',
      });
      
      // Clear loading state
      await AsyncStorage.removeItem('isLoadingContributor');
    } catch (error: any) {
      console.error("Error loading contributor data:", error);
      setError(error.message || "Failed to load contributor details");
      throw error; // Re-throw to be caught by the caller
    }
  };

  const navigateBack = () => {
    router.back();
  };

  const handleAmountSelection = (value: string) => {
    setAmount(value);
  };

  const handleButtonPress = (digit: string) => {
    if (amount === '0') {
      setAmount(digit);
    } else {
      setAmount(amount + digit);
    }
  };

  const handleBackspace = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount('0');
    }
  };

  const handleContinue = async () => {
    const amountNum = Number(amount);
  
    if (amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than zero.');
      return;
    }
  
    if (!userDetails?.id) {
      Alert.alert('Error', 'Contributor details not found.');
      return;
    }

    setIsLoading(true);
    try {
      // Save deposit data to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('depositAmount', amount),
        AsyncStorage.setItem('depositContributorId', userDetails.id),
        AsyncStorage.setItem('depositContributorData', JSON.stringify(userDetails)),
        AsyncStorage.setItem('userImage', userDetails.imageUrl || '')
      ]);
      
      router.push('/deposit/subpages/bank-deposit');
    } catch (error) {
      console.error('Error saving deposit data:', error);
      Alert.alert('Error', 'Failed to process deposit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mt-6">
        <TouchableOpacity
          onPress={navigateBack}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Deposit</Text>
        <View className="w-10" />
      </View>

      {/* User details card */}
      {userDetails ? (
        <View className="mx-4 mt-6 p-4 bg-[#F8FAFC] rounded-2xl flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            {userDetails.imageUrl ? (
              <Image 
                source={{ uri: userDetails.imageUrl }} 
                className="w-12 h-12 rounded-full" 
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                <Text className="text-lg font-semibold">
                  {userDetails.firstname?.[0] || ''}
                </Text>
              </View>
            )}
            <View>
              <Text className="text-lg font-semibold">{userDetails.firstname}</Text>
              <Text className="text-gray-600">{userDetails.lastname}</Text>
            </View>
          </View>
          <View>
            <Text className="text-sm text-gray-500">Current Balance</Text>
            <Text className="text-lg font-semibold">₦{userDetails.balance ? userDetails.balance.toLocaleString() : '0'}</Text>
          </View>
        </View>
      ) : error ? (
        <View className='bg-red-50 border border-red-200 mx-4 p-4 rounded-xl'>
          <Text className='text-red-500'>{error}</Text>
        </View>
      ) : (
        <View className='flex items-center justify-center mx-4 p-4'>
          <ActivityIndicator color="#0072CE" />
          <Text className='text-sm text-gray-500 mt-2'>Loading user details...</Text>
        </View>
      )}

      {/* Amount Display */}
      <View className="items-center mt-8">
        <Text className="text-gray-500 mb-2">Enter Amount</Text>
        <Text className="text-5xl font-semibold">₦{parseInt(amount).toLocaleString()}</Text>
      </View>

      <View className="flex-1 justify-between px-4 mt-8">
        {/* Quick Amounts */}
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity
            className="px-6 py-2 rounded-full bg-gray-100"
            onPress={() => handleAmountSelection('5000')}
          >
            <Text>₦5,000</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="px-6 py-2 rounded-full bg-gray-100"
            onPress={() => handleAmountSelection('15000')}
          >
            <Text>₦15,000</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="px-6 py-2 rounded-full bg-gray-100"
            onPress={() => handleAmountSelection('30000')}
          >
            <Text>₦30,000</Text>
          </TouchableOpacity>
        </View>

        {/* Keypad */}
        <View className="mt-8">
          {/* Row 1 */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => handleButtonPress('1')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('2')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('3')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">3</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => handleButtonPress('4')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">4</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('5')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('6')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">6</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => handleButtonPress('7')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">7</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('8')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">8</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('9')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">9</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4 */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => handleButtonPress('00')}
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
            >
              <Text className="text-xl font-medium">00</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('0')}
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

        {/* Continue Button */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={handleContinue}
            className={`p-4 rounded-xl ${parseInt(amount) > 0 ? 'bg-blue-600' : 'bg-blue-300'} items-center`}
            disabled={parseInt(amount) <= 0 || isLoading || loadingData}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-medium text-base ml-2">Processing...</Text>
              </View>
            ) : (
              <Text className="text-white font-medium text-base">Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AmtDeposit;

