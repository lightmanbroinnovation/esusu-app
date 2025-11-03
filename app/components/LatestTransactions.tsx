import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TransactionItem from './TransactionItem'; // Ensure this path is correct
import { Transaction } from './types';
import { useRouter } from 'expo-router'; // Import useRouter

interface LatestTransactionsProps {
  transactions: Transaction[];
}

const LatestTransactions: React.FC<LatestTransactionsProps> = ({ transactions }) => {
  const router = useRouter(); // Get the router instance

  // Get the latest 10 transactions
  const latestTransactions = transactions.slice(-10).reverse(); // Reverse to show the latest first

  // Function to handle viewing all activity
  const onViewAllActivity = () => {
    router.push('/transactions'); // Navigate to the transactions screen
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Recent Activity</Text>
        <TouchableOpacity onPress={onViewAllActivity}>
          <Text style={styles.viewAllText}>View all</Text>
        </TouchableOpacity>
      </View>
      {latestTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View>
            <Text style={styles.emptyTitle}>No Recent Transactions</Text>
            <Text style={styles.emptySubtitle}>
              It looks like you haven't made any transactions yet.
            </Text>
          </View>
        </View>
      ) : (
        latestTransactions.map(transaction => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: '600',
    fontSize: 16,
  },
  viewAllText: {
    color: '#2563EB',
    fontSize: 14,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  emptyTitle: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
});

export default LatestTransactions;
