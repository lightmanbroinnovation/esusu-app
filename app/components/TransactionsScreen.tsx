import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  SectionList,
  ListRenderItemInfo,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TransactionItem from './TransactionItem';
import TransactionFilter, { FilterOptions } from './TransactionFilter';
import { Transaction } from './types';
import { getUserTransactions } from './transactionData';
import StatusBarAdapter from './StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    return [];
  }
  
  const grouped: Record<string, Transaction[]> = {};
  
  transactions.forEach(transaction => {
    const { date } = transaction;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(transaction);
  });
  
  // Convert to SectionList format
  return Object.keys(grouped).map(date => ({
    title: date,
    data: grouped[date]
  })).sort((a, b) => {
    // Sort sections by date (newest first)
    const dateA = new Date(a.title.split('/').reverse().join('-'));
    const dateB = new Date(b.title.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });
};

const TransactionsScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user ID from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          console.log('User ID fetched from AsyncStorage:', storedUserId);
        } else {
          console.warn('No user ID found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching user ID from AsyncStorage:', error);
      }
    };
    
    fetchUserId();
  }, []);

  // Fetch transactions from db.json
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) return; // Don't fetch if userId is not available yet
      
      try {
        const fetchedTransactions = await getUserTransactions(userId);
        setTransactions(fetchedTransactions);
        setFilteredTransactions(fetchedTransactions);
        setGroupedTransactions(groupTransactionsByDate(fetchedTransactions));
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchTransactions();
  }, [userId]); // Re-fetch when userId changes

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
    setGroupedTransactions(groupTransactionsByDate(filtered));
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
    if (!userId) return;
    
    setRefreshing(true);
    try {
      const fetchedTransactions = await getUserTransactions(userId);
      setTransactions(fetchedTransactions);
      setFilteredTransactions(fetchedTransactions);
      setGroupedTransactions(groupTransactionsByDate(fetchedTransactions));
    } catch (error) {
      console.error("Error reloading transactions:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderSearchHeader = () => (
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
  );

  const renderEmptyComponent = () => (
    <View className="bg-white py-10 rounded-xl mt-2">
      <Text className="text-gray-400 text-lg font-medium text-center">No Recent Activities</Text>
      <Text className="text-gray-400 text-sm text-center mt-2 px-4">
        It looks like you haven't made any transactions. Once you start, your activity will appear here.
      </Text>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text className="text-gray-400 text-lg mt-2 mb-2">
      {getDateHeading(section.title)}
    </Text>
  );

  const renderItem = ({ item }: ListRenderItemInfo<Transaction>) => (
    <TransactionItem 
      key={item.id} 
      transaction={item}
    />
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="px-4 flex-1 mt-4">
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
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0052CC" />
              <Text className="mt-4 text-gray-600">Loading activities...</Text>
            </View>
          ) : (
            <SectionList
              sections={groupedTransactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              ListHeaderComponent={renderSearchHeader}
              ListEmptyComponent={renderEmptyComponent}
              onRefresh={forceReloadTransactions}
              refreshing={refreshing}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ 
                paddingBottom: 80,
                flexGrow: groupedTransactions.length === 0 ? 1 : undefined 
              }}
            />
          )}
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