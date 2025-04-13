import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
    <View className="mt-4">
      <View className="flex-row justify-between items-center">
        <Text className="font-semibold text-base">Recent Activity</Text>
        <TouchableOpacity onPress={onViewAllActivity}>
          <Text className="text-blue-600 text-sm">View all</Text>
        </TouchableOpacity>
      </View>
      {latestTransactions.length === 0 ? (
        <View className="bg-white py-10 rounded-xl mt-2 flex-row items-center"
        style={{  height: 220 }}
        >
            <View>

          <Text className="text-gray-400 text-lg font-medium text-center">No Recent Transactions</Text>
          <Text className="text-gray-400 text-sm text-center mt-2 px-4">
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

export default LatestTransactions;
