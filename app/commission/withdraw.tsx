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
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from '../components/EsusuLoader';
import NetInfo from '@react-native-community/netinfo';
// No API import needed

// Define the Account type to match the structure in user details
type Account = {
  id: string;
  bankName: string;
  bankCode: string;
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

// Helper to verify bank details
const verifyBankDetails = async (bankCode: string, accountNumber: string) => {
  const token = await AsyncStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const res = await fetch('https://esusu-server.onrender.com/api/verification/safehaven/name-enquiry', {
    method: 'POST',
    headers,
    body: JSON.stringify({ bankCode, accountNumber })
  });
  return res.json();
};

const fetchWithdrawData = async (params: any) => {
  // If you have an API call for withdraw data, place it here
  // Otherwise, just return params as data
  return params;
};

const WithdrawScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [amount, setAmount] = useState('0');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [commission, setCommission] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (fromRefresh = false) => {
    setLoading(true);
    setError(null);
    let cacheData = null;
    try {
      const cached = await AsyncStorage.getItem('commission_withdraw');
      if (cached) {
        cacheData = JSON.parse(cached);
        // Set your state from cache if needed
        const comm = cacheData.commission ? Number(cacheData.commission) : 0;
        setCommission(comm);
        let accountsArr: Account[] = [];
        if (cacheData.settlementAccounts) {
          const parsed = JSON.parse(cacheData.settlementAccounts as string);
          accountsArr = Array.isArray(parsed) ? parsed : [];
        }
        setAccounts(accountsArr);
        setSelectedAccount(accountsArr.length > 0 ? accountsArr[0] : null);
      }
    } catch {}
    if (!networkAvailable && cacheData) {
      setLoading(false);
      return;
    }
    if (fromRefresh) {
      await invalidateCache('commission_withdraw');
    }
    try {
      const data = await getCachedData('commission_withdraw', () => fetchWithdrawData(params));
      const comm = params.commission ? Number(params.commission) : 0;
      setCommission(comm);
      let accountsArr: Account[] = [];
      if (params.settlementAccounts) {
        const parsed = JSON.parse(params.settlementAccounts as string);
        accountsArr = Array.isArray(parsed) ? parsed : [];
      }
      setAccounts(accountsArr);
      setSelectedAccount(accountsArr.length > 0 ? accountsArr[0] : null);
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load withdrawal data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.commission, params.settlementAccounts]);

  const onRefresh = async () => {
    setLoading(true);
    await fetchData(true);
    setLoading(false);
  };

  if (loading) {
    return <EsusuLoader />;
  }
  
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
  
  const handleContinue = async () => {
    setMessage(null);
    setMessageType(null);
    if (!selectedAccount) {
      setMessage('Please add a bank account to continue.');
      setMessageType('error');
      return;
    }
    const amountNum = Number(amount);
    if (amountNum < 50) {
      setMessage('Minimum withdrawal amount is ₦500.');
      setMessageType('error');
      return;
    }
    if (amountNum > commission) {
      setMessage('You do not have enough balance to withdraw this amount.');
      setMessageType('error');
      return;
    }
    setVerifying(true);
    try {
      const verifyRes = await verifyBankDetails(selectedAccount.bankCode, selectedAccount.accountNumber);
      console.log('Bank verification response:', verifyRes);
      if (verifyRes.status === 'Success' && verifyRes.data) {
        // Navigate to enter-transaction-pin.tsx with required params
        router.push({
          pathname: '/commission/enter-transaction-pin',
          params: {
            amount: amountNum,
            bankCode: selectedAccount.bankCode,
            accountNumber: selectedAccount.accountNumber,
            beneficiaryName: verifyRes.data.accountName,
            sessionId: verifyRes.data.sessionId
          }
        });
      } else {
        setMessage(verifyRes.message || 'Bank verification failed.');
        setMessageType('error');
      }
    } catch (e) {
      setMessage('Failed to verify bank details. Please try again.');
      setMessageType('error');
    } finally {
      setVerifying(false);
    }
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

  // Use commission as balance
  const userBalance = commission.toLocaleString();

  // Determine if continue button should be enabled
  const isContinueEnabled = !loading && 
    Number(amount) > 0 && 
    selectedAccount && 
    Number(amount) <= commission;

  return (
    <View className="flex-1 bg-white">
      {message && (
        <View style={{ margin: 16, padding: 12, backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF', borderRadius: 8 }}>
          <Text style={{ color: messageType === 'error' ? '#D92D20' : '#0072CE', textAlign: 'center' }}>{message}</Text>
        </View>
      )}
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 mt-2">
          <TouchableOpacity onPress={navigateBack} className=" p-2 rounded-full">
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          <Text className="text-lg font-semibold">Withdraw</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 px-4">
          {/* Balance Section */}
          <View className="flex-row justify-center items-center my-2">
            <Text className="text-gray-700 text-base mr-2">Current Balance:</Text>
            <Text className="text-green-600 font-semibold text-base">
              {commission !== undefined && commission !== null ? `₦${userBalance}` : <Text style={{color:'#A9A8AF'}}>--</Text>}
            </Text>
          </View>
          {/* Account Selection */}
          {accounts && accounts.length > 0 ? (
            <TouchableOpacity className="bg-blue-50 rounded-xl p-4 mb-4" onPress={() => setShowAccountModal(true)}>
            <View className="flex-row justify-between items-center mt-1">
                  <View className="flex-row items-center space-x-8">
                    <Text className="text-gray-600 mr-4">To:</Text>
                <Text className="text-lg font-semibold mr-2">
                    {selectedAccount?.accountName || ''}
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
            <TouchableOpacity className="bg-blue-50 rounded-xl p-4 mb-4 flex-row justify-between items-center" onPress={navigateToAddBank}>
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
            <TouchableOpacity className="bg-gray-100 px-4 py-2 rounded-full" onPress={() => handleAmountSelection('5000')}>
              <Text className="text-gray-800">₦5,000</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-100 px-4 py-2 rounded-full" onPress={() => handleAmountSelection('15000')}>
              <Text className="text-gray-800">₦15,000</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-100 px-4 py-2 rounded-full" onPress={() => handleAmountSelection('25000')}>
              <Text className="text-gray-800">₦25,000</Text>
            </TouchableOpacity>
          </View>
          {/* Keypad */}
          <View className="w-full items-center">
            {/* Row 1 */}
            <View className="flex-row justify-around w-full my-4">
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('1')}>
                  <Text className="text-xl font-medium text-blue-950">1</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('2')}>
                  <Text className="text-xl font-medium text-blue-950">2</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('3')}>
                  <Text className="text-xl font-medium text-blue-950">3</Text>
              </TouchableOpacity>
            </View>
            
            {/* Row 2 */}
            <View className="flex-row justify-around w-full mb-6">
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('4')}>
                  <Text className="text-xl font-medium text-blue-950">4</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('5')}>
                  <Text className="text-xl font-medium text-blue-950">5</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('6')}>
                  <Text className="text-xl font-medium text-blue-950">6</Text>
              </TouchableOpacity>
            </View>
            
            {/* Row 3 */}
            <View className="flex-row justify-around w-full mb-6">
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('7')}>
                  <Text className="text-xl font-medium text-blue-950">7</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('8')}>
                  <Text className="text-xl font-medium text-blue-950">8</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('9')}>
                  <Text className="text-xl font-medium text-blue-950">9</Text>
              </TouchableOpacity>
            </View>
            
            {/* Row 4 */}
            <View className="flex-row justify-around w-full">
              <View className="w-16 h-16" />
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={() => handleButtonPress('0')}>
                  <Text className="text-xl font-medium text-blue-950">0</Text>
                </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center" onPress={handleBackspace}>
                  <Ionicons name="backspace-outline" size={28} color="#374151" />
              </TouchableOpacity>
              </View>
            </View>
            
            {/* Continue Button */}
            <View className="mt-10">
              <TouchableOpacity 
                className={`p-4 rounded-xl items-center ${isContinueEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                onPress={handleContinue}
                disabled={!isContinueEnabled || verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
                    className={`flex-row items-center p-4 rounded-xl mb-3 ${selectedAccount?.id === account.id ? 'bg-blue-50' : 'bg-gray-50'}`}
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
      </SafeAreaView>
    </View>
  );
};

export default WithdrawScreen; 