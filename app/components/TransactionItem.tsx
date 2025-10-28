import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Transaction } from './types';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const router = useRouter();
  const { name, type, amount, time } = transaction;

  // Format the amount with the Nigerian Naira symbol (₦)
  const formattedAmount = () => {
    const nairaSymbol = '₦';

    // For withdrawals, add a minus sign
    if (type === 'withdrawal') {
      return `-${nairaSymbol}${Math.abs(amount).toLocaleString()}`;
    }
    // For deposits and other transactions, show a positive amount with Naira symbol
    else {
      return `${nairaSymbol}${amount.toLocaleString()}`;
    }
  };

  const getTransactionTitle = () => {
    if (type === 'account_creation') {
      return "New Account Created";
    }
    return name;
  };

  const getTransactionSubtitle = () => {
    if (type === 'deposit') {
      return `Deposit at ${time}`;
    } else if (type === 'withdrawal') {
      return `Withdrawal at ${time}`;
    } else if (type === 'account_creation') {
      return `for ${name} at ${time}`;
    } else {
      return `${type} at ${time}`;
    }
  };

  // Determine text color based on transaction type
  const amountColorClass = type === 'withdrawal' ? 'text-red-500' : 'text-green-500';

  const handlePress = () => {
    // Navigate to receipt page with transaction data
    router.push({
      pathname: '/receipt',
      params: {
        transaction: JSON.stringify(transaction),
      },
    });

    // Call custom onPress if provided
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      className="flex-row justify-between items-center py-4 px-4 bg-white border-b border-gray-100"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="flex-1 pr-4">
        <Text
          className="text-base font-semibold text-gray-800 mb-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getTransactionTitle()}
        </Text>
        <Text
          className="text-sm text-gray-500"
          numberOfLines={1}
        >
          {getTransactionSubtitle()}
        </Text>
      </View>
      <Text className={`text-base font-bold ${amountColorClass}`}>
        {formattedAmount()}
      </Text>
    </TouchableOpacity>
  );
};

export default TransactionItem; 