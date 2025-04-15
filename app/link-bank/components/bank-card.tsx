import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import type { Bank } from '../types';

interface BankCardProps {
  bank: Bank;
  isPrimary?: boolean;
  onPress: () => void;
}

export default function BankCard({ bank, isPrimary, onPress }: BankCardProps) {
  // Helper function to get bank logo based on bank name
  const getBankLogo = (bankName: string) => {
    const name = bankName.toLowerCase();
    
    // Using project's asset images for common banks
    if (name.includes('first bank') || name.includes('firstbank')) {
      return require('../../assets/images/icon.png'); // Replace with actual First Bank logo
    } else if (name.includes('uba')) {
      return require('../../assets/images/icon.png'); // Replace with actual UBA logo
    } else if (name.includes('zenith')) {
      return require('../../assets/images/icon.png'); // Replace with actual Zenith Bank logo
    } else if (name.includes('gtb') || name.includes('guaranty')) {
      return require('../../assets/images/icon.png'); // Replace with actual GTBank logo
    } else {
      // Default bank icon
      return require('../../assets/images/icon.png');
    }
  };

  // Format account number to display only last 4 digits if needed
  const formatAccountNumber = (accNum: string) => {
    if (accNum && accNum.length >= 10) {
      return accNum;
    }
    return accNum;
  };

  return (
    <Pressable 
      onPress={onPress} 
      className="border border-gray-100 rounded-xl px-5 py-5 mt-4 bg-white shadow-sm"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-xl overflow-hidden mr-4">
            <Image 
              source={getBankLogo(bank.bankName)}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          
          <View>
            <Text className="font-bold text-lg">{bank.bankName}</Text>
            <Text className="text-gray-700 mt-1">{formatAccountNumber(bank.accountNumber)}</Text>
            <Text className="text-gray-500 mt-1 text-sm">{bank.accountName}</Text>
          </View>
        </View>
        
        {isPrimary && (
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-green-600 text-xs font-medium">Default</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
