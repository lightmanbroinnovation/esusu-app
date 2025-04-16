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
import { useRouter } from 'expo-router';
import StatusBarAdapter from '../../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  balance?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  weeklyEarnings?: number;
  commissions?: any[];
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
  const [amount, setAmount] = useState('0');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



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
    const amountNum = Number(amount);
  
    if (amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than zero.');
      return;
    }
  
  
    // Save withdrawal amount to AsyncStorage
    AsyncStorage.setItem('depositAmount', amount)
      .then(() => {
          router.push('/deposit/subpages/bank-deposit'); 
      })
      .catch(error => {
        console.error('Error depositing:', error);
        Alert.alert('Error', 'Failed to process deposit. Please try again.');
      });
  };

  const accounts: Account[] = [
    {
      bank: 'First Bank',
      accountNumber: '2345678901',
      firstName: 'Adebowale',
      lastName: 'Adebimpe',
      image: require('../../assets/images/user-withdraw.png'),
      balance: 12000,
    }
  ];



  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 mt-4">
          <TouchableOpacity
            onPress={navigateBack}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Deposit</Text>
          <View className="w-10" />
        </View>

        {/* i would fetch user details immediately we get the workflow again */}

        {/* user details card */}
        <View className='mt-6'>
          {accounts.map((item) => (
            //Black,  i am filtering with account number here since there can only be one account number
            <View key={item.accountNumber} className='bg-[#F2F8FF] border border-1 border-[#CCE3FF] mx-[1rem] p-5 rounded-[16px] flex flex-row items-start justify-between'>
              <View className='left flex flex-row items-center gap-3'>
                <Image source={item.image} className='w-[55px] h-[55px]' />
                <View>
                  <Text className='text-base font-semibold mb-1'>{item.firstName}</Text>
                  <Text>{item.lastName}</Text>
                </View>
              </View>

              <View className='right'>
                <Text className='text-gray-300 text-[10px] capitalize mb-1'>current balance</Text>
                <Text className='text-base font-semibold'>₦{item.balance}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-1 items-center justify-center mt-16">
          <View className="flex-1 px-4">
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
                  <Ionicons name="backspace-outline" size={28} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Continue Button */}
            <View className="mt-10">
              <TouchableOpacity
                className='p-4 rounded-xl items-center bg-blue-600'
                onPress={handleContinue}
              // disabled={!isContinueEnabled}
              >
                <Text className="text-white font-semibold text-lg">Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default AmtDeposit;

