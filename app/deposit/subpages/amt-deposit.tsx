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
import { fetchContributorDetailsForDeposit, fetchMerchantDashboardAccount, creditContributorAccount } from '../../../services/api';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../../components/EsusuLoader';
import { sendNotification, NotificationTemplates } from '../../services/notificationService';
import { getCachedData, invalidateCache } from '../../utils/dataCaching';
import { useDataFetchGuard, useRenderGuard } from '../../utils/dataFetchGuard';
import { useBackButtonHandler } from '../../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton

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
  photo?: string;
  depositAmount?: number;
  nextDepositDate?: string;
}

// Define merchant dashboard data interface
interface MerchantDashboardData {
  balance?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  // Add other dashboard fields as needed
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

export default function AmtDepositScreen() {
  const router = useRouter();
  
  // Use back button handler for deposit amount page
  useBackButtonHandler('/deposit/subpages/amt-deposit');
  
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('AmtDepositScreen', 15);

  const params = useLocalSearchParams();
  const [amount, setAmount] = useState('0');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [merchantDashboardData, setMerchantDashboardData] = useState<MerchantDashboardData | null>(null);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Load contributor data asynchronously
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load merchant dashboard data to get user balance
        await loadMerchantDashboardData();
        
        // If we have data in params, use it
        if (params.userDataString) {
          const contributorData = JSON.parse(params.userDataString as string);
          console.log('Parsed contributor data:', contributorData);
          
          // Handle the new response structure
          if (contributorData.contributorAccount && contributorData.contributor) {
            setUserDetails({
              id: contributorData.contributorAccount._id || contributorData.contributorAccount.id,
              firstname: contributorData.contributor.firstName || '',
              lastname: contributorData.contributor.lastName || '',
              email: contributorData.contributor.email || '',
              phonenumber: params.phone as string,
              balance: contributorData.contributorAccount.balance || 0,
              imageUrl: contributorData.contributor.photo || '',
              depositAmount: contributorData.contributorAccount.depositAmount || 0,
              nextDepositDate: contributorData.contributorAccount.nextDepositDate || '',
            });
          } else {
            // Fallback for old data structure
          setUserDetails({
            id: contributorData.id,
            firstname: contributorData.firstname || contributorData.firstName || '',
            lastname: contributorData.lastname || contributorData.lastName || '',
            email: contributorData.email || '',
            phonenumber: contributorData.phonenumber || contributorData.phone || params.phone as string,
            balance: contributorData.balance || 0,
            imageUrl: contributorData.photoUri || '',
          });
          }
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

  // Load merchant dashboard data to get user balance
  const loadMerchantDashboardData = async () => {
    try {
      const dashboardData = await fetchMerchantDashboardAccount();
      console.log('Merchant Dashboard Data:', dashboardData);
      
      if (dashboardData && dashboardData.data) {
        setMerchantDashboardData(dashboardData.data);
        console.log('User Balance from Dashboard:', dashboardData.data.balance);
      }
    } catch (error) {
      console.error('Error loading merchant dashboard data:', error);
    }
  };

  // Load contributor data from API (fallback method)
  const loadContributorData = async () => {
    try {
      // Get the phone number from params or storage
      const phoneNumber = params.phone as string;
      
      if (!phoneNumber) {
        throw new Error("No phone number provided");
      }
      
      console.log('Fetching contributor data for phone:', phoneNumber);
      
      // Fetch contributor data using the new API endpoint
      const contributorData = await fetchContributorDetailsForDeposit(phoneNumber);
      
      if (!contributorData) {
        throw new Error("Contributor not found");
      }
      
      console.log('Received contributor data:', contributorData);
      
      // Handle the new response structure
      if (contributorData.contributorAccount && contributorData.contributor) {
        setUserDetails({
          id: contributorData.contributorAccount._id || contributorData.contributorAccount.id,
          firstname: contributorData.contributor.firstName || '',
          lastname: contributorData.contributor.lastName || '',
          email: contributorData.contributor.email || '',
          phonenumber: contributorData.contributor.phoneNumber || contributorData.contributor.phone || phoneNumber,
          balance: contributorData.contributorAccount.balance || 0,
          imageUrl: contributorData.contributor.photo || '',
          depositAmount: contributorData.contributorAccount.depositAmount || 0,
          nextDepositDate: contributorData.contributorAccount.nextDepositDate || '',
        });
      } else {
        // Fallback for old data structure
      setUserDetails({
          id: contributorData.id || contributorData._id,
        firstname: contributorData.firstname || contributorData.firstName || '',
        lastname: contributorData.lastname || contributorData.lastName || '',
        email: contributorData.email || '',
          phonenumber: contributorData.phonenumber || contributorData.phoneNumber || contributorData.phone || phoneNumber,
        balance: contributorData.balance || 0,
          imageUrl: contributorData.photoUri || contributorData.imageUrl || '',
      });
      }
    } catch (error: any) {
      console.error("Error loading contributor data:", error);
      setError(error.message || "Failed to load contributor details");
      throw error; // Re-throw to be caught by the caller
    }
  };

  const navigateBack = () => {
    // Try to go back, but if not possible, go to dashboard
    try {
    router.back();
    } catch (e) {
      router.replace('/dashboard');
    }
  };

  const handleAmountSelection = (value: string) => {
    setAmount(value);
    // Clear error when user starts entering a new amount
    if (error) {
      setError(null);
    }
  };

  const handleButtonPress = (digit: string) => {
    if (amount === '0') {
      setAmount(digit);
    } else {
      setAmount(amount + digit);
    }
    // Clear error when user starts entering a new amount
    if (error) {
      setError(null);
    }
  };

  const handleBackspace = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount('0');
    }
    // Clear error when user starts entering a new amount
    if (error) {
      setError(null);
    }
  };

  const handleContinue = async () => {
    const amountNum = Number(amount);
  
    if (amountNum <= 0) {
      setError('Please enter an amount greater than zero.');
      return;
    }
  
    if (!userDetails?.id) {
      setError('Contributor details not found.');
      return;
    }

    // Validate amount against required deposit amount
    if (userDetails.depositAmount && amountNum < userDetails.depositAmount) {
      setError(`Please enter at least ₦${userDetails.depositAmount.toLocaleString()} as required for this deposit.`);
      return;
    }

    // Validate amount against user balance
    if (merchantDashboardData?.balance && amountNum > merchantDashboardData.balance) {
      setError(`Your account balance is ₦${merchantDashboardData.balance.toLocaleString()}. Please enter an amount within your available balance.`);
      return;
    }

    // Validate amount against required deposit amount (if greater)
    if (userDetails.depositAmount && amountNum > userDetails.depositAmount) {
      setError(`The required deposit amount is ₦${userDetails.depositAmount.toLocaleString()}. Please enter the exact required amount.`);
      return;
    }

    // Clear any previous errors
    setError(null);

    setIsLoading(true);
    try {
      // Log the data being sent to the server
      console.log('Sending deposit to server:', {
        phoneNumber: userDetails.phonenumber,
        amount: amountNum,
        userDetails: userDetails
      });
      // Save deposit data to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('depositAmount', amount),
        AsyncStorage.setItem('depositContributorId', userDetails.id),
        AsyncStorage.setItem('depositContributorData', JSON.stringify(userDetails)),
        AsyncStorage.setItem('userImage', userDetails.imageUrl || ''),
        AsyncStorage.setItem('merchantDashboardData', JSON.stringify(merchantDashboardData))
      ]);
      
      // Call the creditContributorAccount API
      const creditResponse = await creditContributorAccount(userDetails.phonenumber, amountNum);
      
      // If credit API is successful, navigate to success screen
      if (creditResponse && creditResponse.status === 'Success') {
        // Save deposit amount for success screen
        await AsyncStorage.setItem('depositAmount', amount);
        // Device notification for deposit
        await sendNotification(
          NotificationTemplates.transaction.deposit(amount).title,
          NotificationTemplates.transaction.deposit(amount).body,
          NotificationTemplates.transaction.deposit(amount).type
        );
        router.push('/deposit/subpages/success');
      } else {
        throw new Error('Credit operation failed');
      }
    } catch (error) {
      console.error('Error saving deposit data:', error);
      const err: any = error;
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('Failed to process deposit. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !userDetails) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text>No network. Please connect to the internet to load contributor data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mt-4">
        <TouchableOpacity
          onPress={navigateBack}
          className="w-10 h-10  items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">Deposit</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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

        {/* Required Deposit Amount */}
        {userDetails?.depositAmount && (
          <View className="mx-4 mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <Text className="text-sm text-blue-600 font-medium mb-1">Required Deposit Amount</Text>
            <Text className="text-xl font-bold text-blue-800">₦{userDetails.depositAmount.toLocaleString()}</Text>
            {userDetails.nextDepositDate && (
              <Text className="text-xs text-blue-600 mt-1">
                Next deposit due: {new Date(userDetails.nextDepositDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Error Messages */}
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

        <View className="px-4 mt-8">
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
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View className="px-4 pb-4">
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
    </SafeAreaView>
  );
};

