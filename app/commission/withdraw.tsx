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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUser } from '../../services/api';

// Define the Account type to match the structure in user details
type Account = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
  createdAt: string;
};

// Define user details interface
interface UserDetails {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  balance?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  weeklyEarnings?: number;
  commissions?: any[];
  bankAccounts?: Account[];
}

const WithdrawScreen = () => {
  const router = useRouter();
  const [amount, setAmount] = useState('0');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user ID from AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          console.error('User ID not found in AsyncStorage');
          setError('User ID not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        setUserId(storedUserId);
        console.log('Retrieved user ID from storage:', storedUserId);
      } catch (error) {
        console.error('Error retrieving user ID:', error);
        setError('Failed to retrieve user ID');
        setLoading(false);
      }
    };
    
    getUserId();
  }, []);

  // Function to fetch user data
  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user details
      const userData = await fetchUser(userId);
      setUserDetails(userData);
      
      // Get bank accounts from user data
      if (userData.bankAccounts && userData.bankAccounts.length > 0) {
        setAccounts(userData.bankAccounts);
        
        // Set selected account to primary account or first account
        const primaryAccount = userData.bankAccounts.find((acc: Account) => acc.isPrimary);
        setSelectedAccount(primaryAccount || userData.bankAccounts[0]);
      } else {
        console.log('No bank accounts found in user data');
        setAccounts([]);
        setSelectedAccount(null);
      }
      
      console.log('User data fetched successfully');
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setError("Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        console.log('Screen focused, refetching user data');
        fetchUserData();
      }
      return () => {
        // Cleanup if needed
      };
    }, [userId])
  );
  
  const navigateBack = () => {
    router.back();
  };

  const navigateToAddBank = () => {
    router.push('/link-bank/add-bank' as any);
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
  
  const handleContinue = () => {
    // Check if a bank account is selected
    if (!selectedAccount) {
      Alert.alert('No Bank Account', 'Please add a bank account to continue.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Bank Account', onPress: navigateToAddBank }
      ]);
      return;
    }
    
    // Make sure we have user data and valid amount
    if (!userDetails) {
      Alert.alert('Error', 'User data not available. Please try again.');
      return;
    }
    
    const amountNum = Number(amount);
    if (amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than zero.');
      return;
    }
    
    const balance = userDetails.balance || 0;
    if (amountNum > balance) {
      Alert.alert('Insufficient Funds', 'You do not have enough balance to withdraw this amount.');
      return;
    }
    
    // Save withdrawal amount and selected account to AsyncStorage for the OTP screen
    Promise.all([
      AsyncStorage.setItem('withdrawAmount', amount),
      AsyncStorage.setItem('selectedAccount', JSON.stringify(selectedAccount))
    ]).then(() => {
      router.push('/commission/otp' as any);
    }).catch(error => {
      console.error('Error saving withdrawal data:', error);
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    });
  };

  // Helper function to get bank logo
  const getBankLogo = (bankName: string) => {
    const name = (bankName || '').toLowerCase();
    
    if (name.includes('first') || name.includes('firstbank')) {
      return require('../../assets/images/icon.png'); // Replace with actual First Bank logo
    } else if (name.includes('uba')) {
      return require('../../assets/images/icon.png'); // Replace with actual UBA logo
    } else if (name.includes('gtb') || name.includes('guaranty')) {
      return require('../../assets/images/icon.png'); // Replace with actual GTBank logo
    } else {
      return require('../../assets/images/icon.png'); // Default bank logo
    }
  };

  // Safely get balance with fallback value
  const userBalance = userDetails?.balance?.toLocaleString() || '0';

  // Determine if continue button should be enabled
  const isContinueEnabled = !loading && 
    Number(amount) > 0 && 
    userDetails && 
    selectedAccount && 
    Number(amount) <= (userDetails.balance || 0);

  return (
    <View className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 mt-2">
          <TouchableOpacity 
            onPress={navigateBack}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Withdraw</Text>
          <View className="w-10" />
        </View>
        
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0052CC" />
            <Text className="mt-4 text-gray-600">Loading your data...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <TouchableOpacity 
              onPress={() => router.replace('/commission')}
              className="bg-blue-600 px-6 py-2 rounded-md"
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 px-4">
            {/* Balance Section */}
            <View className="flex-row justify-center items-center my-2">
              <Text className="text-gray-700 text-base mr-2">Current Balance:</Text>
              <Text className="text-green-600 font-semibold text-base">₦{userBalance}</Text>
            </View>
            
            {/* Account Selection */}
            {accounts.length > 0 ? (
              <TouchableOpacity 
                className="bg-blue-50 rounded-xl p-4 mb-4"
                onPress={() => setShowAccountModal(true)}
              >
                <View className="flex-row justify-between items-center mt-1">
                  <View className="flex-row items-center space-x-8">
                    <Text className="text-gray-600 mr-4">To:</Text>
                    <Text className="text-lg font-semibold mr-2">
                      {selectedAccount?.accountName}
                    </Text>
                    {selectedAccount && (
                      <Image 
                        source={getBankLogo(selectedAccount.bankName)}
                        className="w-8 h-8 rounded"
                        style={{height: 30, width: 30}}
                      />
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={24} color="#000" />
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="card-outline" size={18} color="#0099FF" />
                  <Text className="text-blue-600 ml-2">
                  {selectedAccount?.bankName || 'Select Bank'}

                  </Text>
                  <Text className="text-blue-600 ml-2">
              

                    {selectedAccount?.accountNumber || ''}
                  </Text>
                  {selectedAccount?.isPrimary && (
                    <View className="bg-blue-100 rounded-full px-2 py-0.5 ml-2">
                      <Text className="text-blue-600 text-xs">Primary Account</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                className="bg-blue-50 rounded-xl p-4 mb-4 flex-row justify-between items-center"
                onPress={navigateToAddBank}
              >
                <View>
                  <Text className="text-lg font-semibold">Add Bank Account</Text>
                  <Text className="text-gray-600 mt-1">You need to add a bank account to withdraw</Text>
                </View>
                <Ionicons name="add-circle" size={32} color="#0074FF" />
              </TouchableOpacity>
            )}
            
            {/* Amount Entry */}
            <View className="items-center mb-6">
              <Text className="text-gray-600 text-lg mb-2">Enter Amount</Text>
              <Text className="text-3xl font-bold text-blue-950">
                {amount === '0' ? '0' : parseInt(amount).toLocaleString()}
              </Text>
              <View className="h-0.5 bg-gray-200 w-4/5 mt-2" />
            </View>
            
            {/* Quick Amounts */}
            <View className="flex-row justify-between mb-4">
              <TouchableOpacity 
                className="bg-gray-100 px-4 py-2 rounded-full"
                onPress={() => handleAmountSelection('5000')}
              >
                <Text className="text-gray-800">₦5,000</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-gray-100 px-4 py-2 rounded-full"
                onPress={() => handleAmountSelection('15000')}
              >
                <Text className="text-gray-800">₦15,000</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-gray-100 px-4 py-2 rounded-full"
                onPress={() => handleAmountSelection('25000')}
              >
                <Text className="text-gray-800">₦25,000</Text>
              </TouchableOpacity>
            </View>
            
            {/* Keypad */}
            <View className="w-full items-center">
              {/* Row 1 */}
              <View className="flex-row justify-around w-full my-4">
                <TouchableOpacity 
              className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"
              onPress={() => handleButtonPress('1')}
                >
                  <Text className="text-xl font-medium text-blue-950">1</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('2')}
                >
                  <Text className="text-xl font-medium text-blue-950">2</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('3')}
                >
                  <Text className="text-xl font-medium text-blue-950">3</Text>
                </TouchableOpacity>
              </View>
              
              {/* Row 2 */}
              <View className="flex-row justify-around w-full mb-6">
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('4')}
                >
                  <Text className="text-xl font-medium text-blue-950">4</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('5')}
                >
                  <Text className="text-xl font-medium text-blue-950">5</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('6')}
                >
                  <Text className="text-xl font-medium text-blue-950">6</Text>
                </TouchableOpacity>
              </View>
              
              {/* Row 3 */}
              <View className="flex-row justify-around w-full mb-6">
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('7')}
                >
                  <Text className="text-xl font-medium text-blue-950">7</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('8')}
                >
                  <Text className="text-xl font-medium text-blue-950">8</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('9')}
                >
                  <Text className="text-xl font-medium text-blue-950">9</Text>
                </TouchableOpacity>
              </View>
              
              {/* Row 4 */}
              <View className="flex-row justify-around w-full">
                <View className="w-16 h-16" />
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={() => handleButtonPress('0')}
                >
                  <Text className="text-xl font-medium text-blue-950">0</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                               className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center"

                  onPress={handleBackspace}
                >
                  <Ionicons name="backspace-outline" size={28} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Continue Button */}
            <View className="mt-10">
              <TouchableOpacity 
                className={`p-4 rounded-xl items-center ${isContinueEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                onPress={handleContinue}
                disabled={!isContinueEnabled}
              >
                <Text className="text-white font-semibold text-lg">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
      
      {/* Account Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAccountModal}
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-semibold">Select Account</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {accounts.length > 0 ? (
              accounts.map((account) => (
                <TouchableOpacity 
                  key={account.id}
                  className={`flex-row items-center p-4 rounded-xl mb-3 ${
                    selectedAccount?.id === account.id ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                  onPress={() => {
                    setSelectedAccount(account);
                    setShowAccountModal(false);
                  }}
                >
                  <Image 
                    source={getBankLogo(account.bankName)}
                    className="w-12 h-12 rounded-md mr-4"
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold">{account.bankName}</Text>
                    <Text className="text-gray-600">{account.accountName}</Text>
                    <Text className="text-gray-600">Account: {account.accountNumber}</Text>
                  </View>
                  {account.isPrimary && (
                    <View className="bg-blue-100 rounded-full px-2 py-1">
                      <Text className="text-blue-600 text-xs">Primary</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center py-6">
                <Text className="text-gray-500 mb-4">No bank accounts found</Text>
                <TouchableOpacity 
                  className="bg-blue-600 px-6 py-3 rounded-full"
                  onPress={() => {
                    setShowAccountModal(false);
                    navigateToAddBank();
                  }}
                >
                  <Text className="text-white font-medium">Add Bank Account</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {accounts.length > 0 && accounts.length < 2 && (
              <TouchableOpacity 
                className="mt-4 bg-blue-600 p-4 rounded-xl"
                onPress={() => {
                  setShowAccountModal(false);
                  navigateToAddBank();
                }}
              >
                <Text className="text-white font-semibold text-center">+ Add New Bank Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WithdrawScreen; 