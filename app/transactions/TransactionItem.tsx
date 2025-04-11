import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from './index';

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
  const amountColor = type === 'withdrawal' ? 'text-red-500' : 'text-green-500';
  
  return (
    <TouchableOpacity 
      className="flex-row justify-between items-center py-4 border-b border-gray-100"
      onPress={onPress}
    >
      <View className="flex-1 pr-4">
        <Text className="text-lg font-semibold text-gray-800">{getTransactionTitle()}</Text>
        <Text className="text-gray-500">{getTransactionSubtitle()}</Text>
      </View>
      <Text className={`text-lg font-bold ${amountColor}`}>
        {formattedAmount()}
      </Text>
    </TouchableOpacity>
  );
};

export default TransactionItem; 