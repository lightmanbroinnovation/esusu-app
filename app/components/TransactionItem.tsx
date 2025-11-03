import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
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
  const amountColor = type === 'withdrawal' ? '#EF4444' : '#10B981';

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
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text
          style={styles.title}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getTransactionTitle()}
        </Text>
        <Text
          style={styles.subtitle}
          numberOfLines={1}
        >
          {getTransactionSubtitle()}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {formattedAmount()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionItem; 