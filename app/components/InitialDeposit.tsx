import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const InitialDeposit = () => {
  const router = useRouter();
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const navigateBack = () => {
    router.back();
  };

  const handleCompleteRegistration = () => {
    if (!depositAmount.trim()) {
      Alert.alert('Required Field', 'Please enter a deposit amount');
      return;
    }

    // Show success and navigate to dashboard or contributor list
    Alert.alert(
      'Success!',
      'Contributor has been added successfully.',
      [
        {
          text: 'OK',
          onPress: () => router.push('/dashboard')
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 flex-1">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            onPress={navigateBack}
            className="bg-gray-100 p-2 rounded-full mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold flex-1 text-center mr-8">Initial Deposit</Text>
        </View>

        <ScrollView className="flex-1">
          {/* Progress Indicator */}
          <View className="flex-row justify-between mb-6">
            <View className="flex-1 items-center">
              <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
                <Ionicons name="checkmark" size={18} color="#fff" />
              </View>
              <Text className="text-xs mt-1 text-blue-600">Personal Info</Text>
            </View>
            <View className="flex-1 items-center">
              <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
                <Ionicons name="checkmark" size={18} color="#fff" />
              </View>
              <Text className="text-xs mt-1 text-blue-600">Savings Plan</Text>
            </View>
            <View className="flex-1 items-center">
              <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white font-bold">3</Text>
              </View>
              <Text className="text-xs mt-1 text-blue-600">Initial Deposit</Text>
            </View>
          </View>

          {/* Main Content */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-2">Collect Initial Deposit</Text>
            <Text className="text-gray-500 mb-4">
              Collect the first deposit from the contributor to activate their account
            </Text>
            
            {/* Deposit Amount */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Deposit Amount (₦)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-lg"
                placeholder="Enter amount"
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
            </View>
            
            {/* Payment Method */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Payment Method</Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity 
                  className={`flex-1 border rounded-lg p-3 items-center ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Ionicons name="cash-outline" size={24} color={paymentMethod === 'cash' ? '#0072CE' : '#666'} />
                  <Text className={paymentMethod === 'cash' ? 'text-blue-600 mt-1' : 'text-gray-500 mt-1'}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`flex-1 border rounded-lg p-3 items-center ${paymentMethod === 'transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onPress={() => setPaymentMethod('transfer')}
                >
                  <Ionicons name="card-outline" size={24} color={paymentMethod === 'transfer' ? '#0072CE' : '#666'} />
                  <Text className={paymentMethod === 'transfer' ? 'text-blue-600 mt-1' : 'text-gray-500 mt-1'}>Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`flex-1 border rounded-lg p-3 items-center ${paymentMethod === 'pos' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onPress={() => setPaymentMethod('pos')}
                >
                  <Ionicons name="card" size={24} color={paymentMethod === 'pos' ? '#0072CE' : '#666'} />
                  <Text className={paymentMethod === 'pos' ? 'text-blue-600 mt-1' : 'text-gray-500 mt-1'}>POS</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Confirmation */}
            <View className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <Text className="text-blue-800 mb-2">
                <Ionicons name="information-circle" size={18} /> Important
              </Text>
              <Text className="text-blue-800">
                Please ensure you've collected the payment before confirming. 
                This will activate the contributor's account and create their first transaction.
              </Text>
            </View>

            {/* Receipt Options */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Receipt Options</Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity className="flex-1 border border-gray-300 rounded-lg p-3 items-center flex-row justify-center">
                  <Ionicons name="print-outline" size={20} color="#666" />
                  <Text className="text-gray-500 ml-2">Print</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 border border-gray-300 rounded-lg p-3 items-center flex-row justify-center">
                  <Ionicons name="share-social-outline" size={20} color="#666" />
                  <Text className="text-gray-500 ml-2">Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Action Button */}
        <View className="pt-4 border-t border-gray-200">
          <TouchableOpacity 
            className="bg-blue-600 p-4 rounded-xl items-center"
            onPress={handleCompleteRegistration}
          >
            <Text className="text-white font-semibold text-lg">Complete Registration</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default InitialDeposit; 