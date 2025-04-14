import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StatusBarAdapter from '../components/StatusBarAdapter';

// Define the Account type
type Account = {
  bank: string;
  accountNumber: string;
  agent: string;
  isPrimary: boolean;
  image: any; // Adjust the type as necessary for your image
};

const WithdrawScreen = () => {
  const router = useRouter();
  const [amount, setAmount] = useState('0');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
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
  
  const handleContinue = () => {
    router.push('/commission/otp' as any);
  };
  
  const accounts: Account[] = [
    { 
      bank: 'First Bank', 
      accountNumber: '2345678901', 
      agent: 'AjoMarket Agent', 
      isPrimary: true, 
      image: require('../../assets/images/icon.png') 
    },
    { 
      bank: 'UBA', 
      accountNumber: '8765432109', 
      agent: 'AjoMarket Agent', 
      isPrimary: false, 
      image: require('../../assets/images/icon.png') 
    },
  ];
  
  // Set default account
  React.useEffect(() => {
    if (!selectedAccount && accounts.length > 0) {
      const primaryAccount = accounts.find(acc => acc.isPrimary) || accounts[0];
      setSelectedAccount(primaryAccount);
    }
  }, []);

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
        
        <View className="flex-1 px-4">
          {/* Balance Section */}
          <View className="flex-row justify-center items-center my-2">
            <Text className="text-gray-700 text-base mr-2">Current Balance:</Text>
            <Text className="text-green-600 font-semibold text-base">₦50,000</Text>
          </View>
          
          {/* Account Selection */}
          <TouchableOpacity 
            className="bg-blue-50 rounded-xl p-4 mb-4"
            onPress={() => setShowAccountModal(true)}
          >
            <View className="flex-row justify-between items-center mt-1">
              <View className="flex-row items-center">
            <Text className="text-gray-600 mr-2">To:</Text>
                <Text className="text-lg font-semibold mr-2">
                  {selectedAccount?.agent || 'AjoMarket Agent'}
                </Text>
                {selectedAccount && (
                  <Image 
                    source={selectedAccount.image}
                    className="w-8 h-8 rounded"
                    style={{height: 30, width: 30}}
                  />
                )}
              </View>
              <Ionicons name="chevron-down" size={24} color="#000" />
            </View>
            <View className="flex-row items-center mt-2">
              <Ionicons name="person" size={18} color="#0099FF" />
              <Text className="text-blue-600 ml-2">
                {selectedAccount?.accountNumber || '2345678901'}
              </Text>
              {selectedAccount?.isPrimary && (
                <View className="bg-blue-100 rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-blue-600 text-xs">Primary Account</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
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
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('1')}
              >
                <Text className="text-3xl font-medium text-blue-950">1</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('2')}
              >
                <Text className="text-3xl font-medium text-blue-950">2</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('3')}
              >
                <Text className="text-3xl font-medium text-blue-950">3</Text>
              </TouchableOpacity>
            </View>
            
            {/* Row 2 */}
            <View className="flex-row justify-around w-full mb-6">
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('4')}
              >
                <Text className="text-3xl font-medium text-blue-950">4</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('5')}
              >
                <Text className="text-3xl font-medium text-blue-950">5</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('6')}
              >
                <Text className="text-3xl font-medium text-blue-950">6</Text>
              </TouchableOpacity>
            </View>
            
            {/* Row 3 */}
            <View className="flex-row justify-around w-full mb-6">
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('7')}
              >
                <Text className="text-3xl font-medium text-blue-950">7</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('8')}
              >
                <Text className="text-3xl font-medium text-blue-950">8</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('9')}
              >
                <Text className="text-3xl font-medium text-blue-950">9</Text>
              </TouchableOpacity>
            </View>
            
            {/* Row 4 */}
            <View className="flex-row justify-around w-full">
              <View className="w-16 h-16" />
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={() => handleButtonPress('0')}
              >
                <Text className="text-3xl font-medium text-blue-950">0</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-16 h-16 items-center justify-center"
                onPress={handleBackspace}
              >
                <View className="w-10 h-10  border-blue-950 rounded-full items-center justify-center">
                  <Text className="text-2xl text-blue-950">⌫</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Next Button */}
        <View className="p-4">
          <TouchableOpacity 
            className="bg-blue-600 py-4 rounded-xl items-center"
            onPress={handleContinue}
          >
            <Text className="text-white font-semibold text-lg">Next</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Account Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAccountModal}
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-blue-600 text-2xl font-bold mb-2">Select Account</Text>
            <Text className="text-gray-600 mb-6">You have (2) account linked with Esusu</Text>
            
            {accounts.map((account, index) => (
              <TouchableOpacity 
                key={index} 
                className={`py-4 flex-row items-center ${index < accounts.length - 1 ? 'border-b border-gray-200' : ''}`}
                onPress={() => {
                  setSelectedAccount(account);
                  setShowAccountModal(false);
                }}
              >
                <View className="flex-1">
                  <Text className="text-xl font-semibold">{account.bank}</Text>
                  <Text className="text-gray-700">{account.accountNumber}</Text>
                  <Text className="text-gray-500">{account.agent}</Text>
                  {account.isPrimary && (
                    <View className="bg-blue-100 rounded px-2 py-0.5 mt-1 self-start">
                      <Text className="text-blue-600 text-xs">Primary Account</Text>
                    </View>
                  )}
                </View>
                <Image 
                  source={account.image}
                  className="w-12 h-12 rounded"
                  style={{height: 30, width: 30}}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WithdrawScreen; 