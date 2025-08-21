import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import type { Bank as BankType } from '../types';

interface Bank extends BankType {
  bankCode?: string;
}

interface BankCardProps {
  bank: Bank;
  isPrimary?: boolean;
  onPress: () => void;
}

export default function BankCard({ bank, isPrimary, onPress }: { bank: Bank; isPrimary?: boolean; onPress: () => void }) {
  // Helper function to get bank logo based on bank name
  const getBankLogo = (bankName: string) => {
    const name = bankName?.toLowerCase() || '';
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
      className="border border-gray-100 rounded-2xl px-6 py-6 mt-6 bg-white shadow-sm"
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      {/* Bank Logo */}
      <View className="w-16 h-16 rounded-full bg-white shadow items-center justify-center mr-4" style={{ overflow: 'hidden' }}>
        <Image 
          source={getBankLogo(bank.bankName || bank.bankCode || 'Unknown Bank')}
          className="w-14 h-14"
          resizeMode="cover"
        />
      </View>
      {/* Bank Info */}
      <View style={{ flex: 1 }}>
        <Text className="font-bold text-lg text-gray-900 mb-1">{bank.bankName || bank.bankCode || 'Unknown Bank'}</Text>
        <Text className="text-gray-700 text-base mb-1 tracking-widest">{bank.accountNumber || 'N/A'}</Text>
        <Text className="text-gray-500 text-base">{bank.accountName || 'N/A'}</Text>
      </View>
      {/* Default Badge */}
      {isPrimary && (
        <View className="bg-[#E5F1FF] px-4 py-1 rounded-full ml-2">
          <Text className="text-[#0074FF] text-xs font-semibold">Default</Text>
        </View>
      )}
    </Pressable>
  );
}
