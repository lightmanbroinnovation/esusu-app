import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TransactionItem from './TransactionItem';
import TransactionFilter, { FilterOptions } from './TransactionFilter';
import { Transaction } from './types';
import { getUserTransactions } from './transactionData';
import StatusBarAdapter from './StatusBarAdapter';

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
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<Record<string, Transaction[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch transactions from db.json
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const userId = "62f2"; // Replace with the actual user ID you want to fetch
        const fetchedTransactions = await getUserTransactions(userId);
        setTransactions(fetchedTransactions);
        setFilteredTransactions(fetchedTransactions);
        setGroupedTransactions(groupTransactionsByDate(fetchedTransactions));
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);

  // Apply both search and filters
  useEffect(() => {
    const filtered = transactions.filter(transaction => {
      const nameMatch = searchQuery 
        ? transaction.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const amountMatch = searchQuery 
        ? transaction.amount.toString().includes(searchQuery)
        : true;
      
      const nameFilterMatch = activeFilters.name
        ? transaction.name.toLowerCase().includes(activeFilters.name.toLowerCase())
        : true;
      
      const minAmountMatch = activeFilters.minAmount !== undefined
        ? transaction.amount >= activeFilters.minAmount
        : true;
      const maxAmountMatch = activeFilters.maxAmount !== undefined
        ? transaction.amount <= activeFilters.maxAmount
        : true;
      
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

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveFilters({});
  };

  const forceReloadTransactions = async () => {
    try {
      setLoading(true);
      const fetchedTransactions = await getUserTransactions("62f2");
      setTransactions(fetchedTransactions);
      setFilteredTransactions(fetchedTransactions);
      setGroupedTransactions(groupTransactionsByDate(fetchedTransactions));
    } catch (error) {
      console.error("Error reloading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark" />
      <SafeAreaView className="flex-1">
        <View className="p-4 flex-1 mt-10">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity 
              onPress={navigateBack}
              className="bg-gray-100 p-2 rounded-full mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold flex-1 text-center mr-8">Activities</Text>
          </View>

          {/* Transactions list */}
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }} // Add padding for footer
          >
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
            {Object.keys(groupedTransactions).length === 0 ? (
              <View className="bg-white py-10 rounded-xl mt-2">
                <Text className="text-gray-400 text-lg font-medium text-center">No Recent Activities</Text>
                <Text className="text-gray-400 text-sm text-center mt-2 px-4">
                  It looks like you haven't made any transactions. Once you start, your activity will appear here.
                </Text>
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
          </ScrollView>
        </View>

        {/* Filter Modal */}
        <TransactionFilter 
          visible={showFilter} 
          onClose={() => setShowFilter(false)}
          onApplyFilter={handleApplyFilter}
        />
      </SafeAreaView>
    </View>
  );
};

export default TransactionsScreen; 