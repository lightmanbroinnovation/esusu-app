import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TransactionItem from './TransactionItem';
import TransactionFilter, { FilterOptions } from './TransactionFilter';
import { Transaction } from './types';

// Use a more consistent date format for cross-platform compatibility
const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`; // MM/DD/YYYY format
};

// Today's date
const today = new Date();
const todayString = formatDate(today);

// Yesterday's date
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayString = formatDate(yesterday);

// Generate a timestamp string
const formatTime = (): string => {
  return '12:03 PM'; // For demo, using fixed time
};

// Directly define transaction data
const directTransactions: Transaction[] = [
  // Today's transactions
  {
    id: '1',
    name: 'Aisha Bello',
    type: 'deposit',
    amount: 5000,
    timestamp: formatTime(),
    date: todayString
  },
  {
    id: '2',
    name: 'Ade Martins',
    type: 'withdrawal',
    amount: 10000,
    timestamp: formatTime(),
    date: todayString
  },
  {
    id: '3',
    name: 'Chioma',
    type: 'account_creation',
    amount: 50,
    timestamp: formatTime(),
    date: todayString
  },
  
  // Yesterday's transactions
  {
    id: '4',
    name: 'Aisha Bello',
    type: 'deposit',
    amount: 5000,
    timestamp: formatTime(),
    date: yesterdayString
  },
  {
    id: '5',
    name: 'Ade Martins',
    type: 'withdrawal',
    amount: 10000,
    timestamp: formatTime(),
    date: yesterdayString
  },
  {
    id: '6',
    name: 'Chioma',
    type: 'account_creation',
    amount: 50,
    timestamp: formatTime(),
    date: yesterdayString
  }
];

// Group transactions by date
const groupTransactionsByDate = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) {
    return {};
  }
  
  const grouped: Record<string, Transaction[]> = {};
  
  transactions.forEach(transaction => {
    const { date } = transaction;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(transaction);
  });
  
  return grouped;
};

const TransactionsScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  
  // Initialize with the direct transactions
  const [transactions, setTransactions] = useState<Transaction[]>(directTransactions);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(directTransactions);
  const [groupedTransactions, setGroupedTransactions] = useState<Record<string, Transaction[]>>(
    groupTransactionsByDate(directTransactions)
  );

  // Initialize transactions data (simulating API fetch)
  useEffect(() => {
    // For debugging on different platforms
    console.log(`Platform: ${Platform.OS}`);
    console.log("Initial transactions:", directTransactions.length);
    
    // Set the transactions
    setTransactions(directTransactions);
    setFilteredTransactions(directTransactions);
    setGroupedTransactions(groupTransactionsByDate(directTransactions));
  }, []);

  // Apply both search and filters
  useEffect(() => {
    // Filter transactions based on search query and active filters
    const filtered = transactions.filter(transaction => {
      // Search query filter (name or amount)
      const nameMatch = searchQuery 
        ? transaction.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const amountMatch = searchQuery 
        ? transaction.amount.toString().includes(searchQuery)
        : true;
      
      // Name filter
      const nameFilterMatch = activeFilters.name
        ? transaction.name.toLowerCase().includes(activeFilters.name.toLowerCase())
        : true;
      
      // Amount range filter
      const minAmountMatch = activeFilters.minAmount !== undefined
        ? transaction.amount >= activeFilters.minAmount
        : true;
      const maxAmountMatch = activeFilters.maxAmount !== undefined
        ? transaction.amount <= activeFilters.maxAmount
        : true;
      
      // Transaction type filter
      const typeMatch = activeFilters.transactionType && activeFilters.transactionType !== 'all'
        ? transaction.type === activeFilters.transactionType
        : true;
      
      return (nameMatch || amountMatch) && 
        nameFilterMatch && 
        minAmountMatch && 
        maxAmountMatch && 
        typeMatch;
    });
    
    setFilteredTransactions(filtered);
    const grouped = groupTransactionsByDate(filtered);
    setGroupedTransactions(grouped);
    
    console.log("Filtered transactions:", filtered.length);
    console.log("Grouped keys:", Object.keys(grouped));
  }, [searchQuery, activeFilters, transactions]);

  // Helper function to get consistent date heading
  const getDateHeading = useCallback((date: string) => {
    if (date === todayString) {
      return 'Today';
    } else if (date === yesterdayString) {
      return 'Yesterday';
    } else {
      return date;
    }
  }, [todayString, yesterdayString]);

  const navigateBack = () => {
    router.back();
  };

  const handleApplyFilter = (filters: FilterOptions) => {
    setActiveFilters(filters);
  };

  const hasActiveFilters = () => {
    return Object.keys(activeFilters).length > 0;
  };

  // Clear all filters and search
  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveFilters({});
  };

  // Force reload transactions
  const forceReloadTransactions = () => {
    setTransactions([...directTransactions]);
    setFilteredTransactions([...directTransactions]);
    setGroupedTransactions(groupTransactionsByDate(directTransactions));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 flex-1">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={navigateBack}
            className="bg-gray-100 p-2 rounded-full mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold flex-1 text-center mr-8">Activities</Text>
        </View>

        {/* Search and Filter Bar */}
        <View className="flex-row items-center mb-4">
          <View className="bg-[#F0F8FF] flex-row items-center px-4 py-2 rounded-xl flex-1 mr-2">
            <Ionicons name="search" size={20} color="#A0A0A0" />
            <TextInput
              className="flex-1 ml-2"
              placeholder="Search...."
              placeholderTextColor="#A0A0A0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {(searchQuery || hasActiveFilters()) && (
              <TouchableOpacity onPress={clearAllFilters}>
                <Ionicons name="close-circle" size={20} color="#A0A0A0" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            className="bg-gray-100 p-2 rounded-xl"
            onPress={() => setShowFilter(true)}
          >
            <Ionicons 
              name="options-outline" 
              size={24} 
              color={hasActiveFilters() ? "#0052CC" : "#000"} 
            />
          </TouchableOpacity>
        </View>

        {/* Platform Debug Info - only in development */}
        {__DEV__ && (
          <Text className="text-xs text-gray-400 mb-2">
            Platform: {Platform.OS} | Groups: {Object.keys(groupedTransactions).length}
          </Text>
        )}

        {/* Transactions list */}
        <ScrollView className="flex-1">
          {Object.keys(groupedTransactions).length === 0 ? (
            <View className="items-center justify-center p-8">
              <Text className="text-gray-500 text-lg">No transactions found</Text>
              
              {/* Add a button to manually display sample transactions */}
              <TouchableOpacity
                className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
                onPress={forceReloadTransactions}
              >
                <Text className="text-white font-semibold">Load Sample Transactions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {Object.keys(groupedTransactions).map(date => (
                <View key={date} className="mb-4">
                  <Text className="text-gray-400 text-lg mt-2 mb-2">
                    {getDateHeading(date)}
                  </Text>
                  
                  {groupedTransactions[date].map((transaction: Transaction) => (
                    <TransactionItem 
                      key={transaction.id} 
                      transaction={transaction}
                    />
                  ))}
                </View>
              ))}
            </>
          )}
          
          {/* Add some bottom padding */}
          <View className="h-20" />
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <TransactionFilter 
        visible={showFilter} 
        onClose={() => setShowFilter(false)}
        onApplyFilter={handleApplyFilter}
      />
    </SafeAreaView>
  );
};

export default TransactionsScreen; 