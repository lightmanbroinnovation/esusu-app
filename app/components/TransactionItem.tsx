import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Transaction } from './types';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const { name, type, amount, timestamp } = transaction;
  
  // Format the amount with the Nigerian Naira symbol (₦)
  const formattedAmount = () => {
    const nairaSymbol = '₦';
    
    // For withdrawals, add a minus sign
    if (type === 'withdrawal') {
      return `-${nairaSymbol}${Math.abs(amount).toLocaleString()}`;
    }
    // For deposits, show a positive amount with Naira symbol
    else if (type === 'deposit') {
      return `${nairaSymbol}${amount.toLocaleString()}`;
    }
    // For account creations, show the commission amount
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
      return `Deposit at ${timestamp}`;
    } else if (type === 'withdrawal') {
      return `Withdrawal at ${timestamp}`;
    } else {
      return `for ${name} at ${timestamp}`;
    }
  };
  
  // Determine text color based on transaction type
  const amountColorClass = type === 'withdrawal' ? 'text-red-500' : 'text-green-500';
  
  // Platform specific styling to ensure consistent rendering
  const containerClass = Platform.OS === 'web' 
    ? 'flex-row justify-between items-center py-4 border-b border-gray-100' 
    : 'flex-row justify-between items-center py-4 border-b border-gray-200';
  
  return (
    <TouchableOpacity 
      className={containerClass}
      onPress={onPress}
      style={{ 
        marginBottom: 2, // Ensure some space between items on all platforms
      }}
    >
      <View className="flex-1 pr-4">
        <Text 
          className="text-base font-semibold text-gray-800"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getTransactionTitle()}
        </Text>
        <Text 
          className="text-gray-500 text-sm"
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