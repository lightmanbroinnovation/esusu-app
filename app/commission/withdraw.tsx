import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  const [showKeypad, setShowKeypad] = useState(false);
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
  
  const accounts = [
    { bank: 'First Bank', accountNumber: '1234567890', agent: 'AjoMarket Agent', isPrimary: true, image: require('../../assets/images/icon.png') },
    { bank: 'UBA', accountNumber: '1234567870', agent: 'AjoMarket Agent', isPrimary: false, image: require('../../assets/images/icon.png') },
  ];
  
  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "✓"];
    return (
      <View className=" space-y-4 w-full">
        {Array(4).fill(null).map((_, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-between">
            {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  if (key === "x") handleBackspace();
                  else if (key === "✓") {
                    if (amount.length > 0) {
                      alert("Amount entered: " + amount);
                    }
                  } else {
                    handleButtonPress(key);
                  }
                }}
                className="w-20 h-20 bg-white justify-center items-center"
              >
                {key === "x" ? (
                  <Ionicons name="backspace-outline" size={30} color="#0072CE" />
                ) : key === "✓" ? (
                  <MaterialIcons name="check-circle" size={30} color="#0072CE" />
                ) : (
                  <Text className="text-3xl font-semibold text-[#0072CE]">{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center p-4">
          <TouchableOpacity 
            onPress={navigateBack}
            className="bg-gray-100 p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold flex-1 text-center mr-8">Withdraw</Text>
        </View>
        
        <ScrollView className="flex-1 px-4">
          {/* Current Balance */}
          <View className="flex-row justify-center space-x-4 items-center my-4">
            <Text className="text-gray-600 text-lg">Current Balance:</Text>
            <Text className="text-green-600 p-2 bg-green-100 rounded-xl font-bold">₦50,000</Text>
          </View>
          
          {/* Bank Info Selection */}
          <TouchableOpacity 
            className="bg-blue-50 rounded-xl p-4 mb-6"
            onPress={() => setShowAccountModal(true)}
          >
            <View className="flex-row justify-between items-center">
              <View>
                <View className='flex-row items-center my-2'>

                <Text className="text-gray-500 mr-2">To:</Text>
                <Text className="text-lg font-semibold mr-2">{selectedAccount ? selectedAccount.agent : 'Select an account'}</Text>
                <Image 
                    source={selectedAccount ? selectedAccount.image : require('../../assets/images/icon.png')}
                    style={{ width: 40, height: 30 }}
                  />
                </View>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="person" size={16} color="#0066FF" />
                  <Text className="text-blue-600 ml-1">{selectedAccount ? selectedAccount.accountNumber : ''}</Text>
                  {selectedAccount && selectedAccount.isPrimary && (
                    <View className="bg-blue-100 rounded px-2 py-0.5 ml-2">
                      <Text className="text-blue-600 text-xs">Primary Account</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-down" size={24} color="#000" />
            </View>
          </TouchableOpacity>
          
          {/* Amount Input */}
          <View className="items-center mb-6">
            <Text className="text-xl text-gray-600 mb-4">Enter Amount</Text>
            <Text className="text-4xl font-bold">{parseInt(amount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace('NGN', '₦')}</Text>
          </View>
          
          {/* Quick Amount Selection */}
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity 
              className="bg-gray-100 px-6 py-3 rounded-full"
              onPress={() => handleAmountSelection('5000')}
            >
              <Text className="font-medium">₦5,000</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-gray-100 px-6 py-3 rounded-full"
              onPress={() => handleAmountSelection('15000')}
            >
              <Text className="font-medium">₦15,000</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-gray-100 px-6 py-3 rounded-full"
              onPress={() => handleAmountSelection('25000')}
            >
              <Text className="font-medium">₦25,000</Text>
            </TouchableOpacity>
          </View>
          
          {/* Render Keypad */}
          {renderKeypad()}

        </ScrollView>
        
        {/* Bottom Button */}
        <View className="p-4">
          <TouchableOpacity 
            className="bg-blue-600 py-4 rounded-xl items-center"
            onPress={handleContinue}
          >
            <Text className="text-white font-semibold text-lg">Next</Text>
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
        <View className="flex-1 bg-black/50 justify-end items-center">
          <View className="bg-white mx-4 rounded-t-2xl p-6 shadow-md w-full">
            <Text className="text-blue-600 text-2xl font-bold mb-4">Select Account</Text>
            <Text className="text-gray-600 mb-4">You have (2) accounts linked with Esusu</Text>
            
            {accounts.map((account, index) => (
              <TouchableOpacity 
                key={index} 
                className="border-b border-gray-200 py-4 flex-row items-center"
                onPress={() => {
                  setSelectedAccount(account);
                  setShowAccountModal(false);
                }}
              >
                <Image source={account.image} style={{ width: 32, height: 32 }} />
                <View className="flex-1">
                  <Text className="text-lg font-semibold">{account.bank}</Text>
                  <Text className="text-gray-600">{account.accountNumber}</Text>
                  <Text className="text-gray-500">{account.agent}</Text>
                  {account.isPrimary && (
                    <View className="bg-blue-100 rounded px-2 py-0.5 mt-1">
                      <Text className="text-blue-600 text-xs">Primary Account</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WithdrawScreen; 