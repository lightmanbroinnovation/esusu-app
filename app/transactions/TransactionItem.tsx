import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ViewStyle, 
  TextStyle, 
  TouchableOpacityProps 
} from 'react-native';
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
  const amountColor = type === 'withdrawal' ? styles.amountWithdrawal : styles.amountDeposit;
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{getTransactionTitle()}</Text>
        <Text style={styles.subtitle}>{getTransactionSubtitle()}</Text>
      </View>
      <Text style={[styles.amount, amountColor]}>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountWithdrawal: {
    color: '#EF4444',
  },
  amountDeposit: {
    color: '#10B981',
  },
});

export default TransactionItem; 