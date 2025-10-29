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
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TransactionItem from './TransactionItem';
import TransactionFilter, { FilterOptions } from '../transactions/TransactionFilter';
import { Transaction } from './types';
import { getUserTransactions } from '../transactions/transactionData';
import StatusBarAdapter from './StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
// import { fetchTransactions } from '../../services/api';
import EsusuLoader from './EsusuLoader';
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';
import { useBackButtonHandler } from '../utils/backButtonHandler';

// Helper function to format date for grouping (just the day)
const getDayFromDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Helper function to format time from createdAt
const formatTimeFromCreatedAt = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper function to format date from createdAt
const formatDateFromCreatedAt = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.toLocaleDateString('en-US');
};

// Group transactions by day
const groupTransactionsByDay = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  const grouped: Record<string, Transaction[]> = {};
  
  transactions.forEach(transaction => {
    const day = getDayFromDate(transaction.createdAt || transaction.date);
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(transaction);
  });
  
  // Convert to SectionList format and sort by date
  return Object.keys(grouped).map(day => ({
    title: day,
    data: grouped[day].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return dateB.getTime() - dateA.getTime(); // Newest first
    })
  })).sort((a, b) => {
    // Sort sections by day (Today, Yesterday, then by date)
    const dayOrder = { 'Today': 0, 'Yesterday': 1 };
    const orderA = dayOrder[a.title as keyof typeof dayOrder] ?? 2;
    const orderB = dayOrder[b.title as keyof typeof dayOrder] ?? 2;
    return orderA - orderB;
  });
};

interface TransactionsScreenProps {
  initialTransactionHistory?: any[];
}

export default function TransactionsScreen({ initialTransactionHistory }: TransactionsScreenProps) {
  const router = useRouter();
  
  // Use back button handler for transactions screen
  useBackButtonHandler('/transactions');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('TransactionsScreen', 15);

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
      try {
        // If initialTransactionHistory is provided, use it
        if (initialTransactionHistory && initialTransactionHistory.length > 0) {
          console.log('Using initial transaction history:', initialTransactionHistory);
          // Convert the API format to the expected Transaction format
          const convertedTransactions = initialTransactionHistory.map((t, index) => {
            console.log(`Converting transaction ${index}:`, { 
              originalType: t.type, 
              amount: t.amount, 
              description: t.description 
            });
            
            const converted = {
              id: t.id || t._id|| index.toString(),
              name: t.description || t.name || 'Transaction',
              amount: Number(t.amount || 0),
              type: [
                'credit', 'deposit', 'CREDIT', 'Deposit'
              ].includes(String(t.type).toLowerCase()) ? 'deposit'
                : [
                  'debit', 'withdrawal', 'DEBIT', 'Withdrawal'
                ].includes(String(t.type).toLowerCase()) ? 'withdrawal'
                : t.type, // Map credit to deposit, debit to withdrawal
              createdAt: t.createdAt || t.date,
              date: formatDateFromCreatedAt(t.createdAt || t.date),
              time: formatTimeFromCreatedAt(t.createdAt || t.date),
              timestamp: formatTimeFromCreatedAt(t.createdAt || t.date),
              status: t.status || 'completed'
            };
            
            console.log(`Converted to:`, { 
              type: converted.type, 
              amount: converted.amount, 
              name: converted.name 
            });
            
            return converted;
          });
          setTransactions(convertedTransactions);
          setFilteredTransactions(convertedTransactions);
          setGroupedTransactions(groupTransactionsByDay(convertedTransactions));
          setLoading(false);
          return;
        }

        if (!userId) {
          console.log('No userId available yet, skipping transaction fetch');
          return; // Don't fetch if userId is not available yet
        }
        
        console.log('Fetching transactions for userId:', userId);
        const fetchedTransactions = await getUserTransactions(userId);
        console.log('Fetched transactions:', fetchedTransactions);
        setTransactions(fetchedTransactions);
        setFilteredTransactions(fetchedTransactions);
        setGroupedTransactions(groupTransactionsByDay(fetchedTransactions));
      } catch (error) {
        console.error("Error fetching transactions:", error);
        // Set empty arrays on error to prevent crashes
        setTransactions([]);
        setFilteredTransactions([]);
        setGroupedTransactions([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    
    fetchTransactions();
  }, [userId, initialTransactionHistory]); // Re-fetch when userId or initialTransactionHistory changes

  // Apply both search and filters
  useEffect(() => {
    try {
      const filtered = transactions.filter(transaction => {
        // Search by name (primary search)
        const nameMatch = searchQuery 
          ? transaction.name.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        
        // Search by amount (secondary search)
        const amountMatch = searchQuery 
          ? transaction.amount.toString().includes(searchQuery)
          : true;
        
        // Filter by name (if filter is set)
        const nameFilterMatch = activeFilters.name
          ? transaction.name.toLowerCase().includes(activeFilters.name.toLowerCase())
          : true;
        
        // Filter by amount range
        const minAmountMatch = activeFilters.minAmount !== undefined
          ? transaction.amount >= activeFilters.minAmount
          : true;
        const maxAmountMatch = activeFilters.maxAmount !== undefined
          ? transaction.amount <= activeFilters.maxAmount
          : true;
        
        // Filter by transaction type
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
      setGroupedTransactions(groupTransactionsByDay(filtered));
    } catch (error) {
      console.error('Error applying filters:', error);
      // Set empty arrays on error to prevent crashes
      setFilteredTransactions([]);
      setGroupedTransactions([]);
    }
  }, [searchQuery, activeFilters, transactions]);

  const navigateBack = () => {
    router.back();
  };

  const handleApplyFilter = (filters: FilterOptions) => {
    console.log('Applying filters:', filters);
    setActiveFilters(filters);
  };

  const hasActiveFilters = () => {
    return Object.keys(activeFilters).length > 0 && 
           Object.values(activeFilters).some(value => value !== undefined && value !== 'all');
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
      setGroupedTransactions(groupTransactionsByDay(fetchedTransactions));
    } catch (error) {
      console.error("Error reloading transactions:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderSearchHeader = () => (
    <View className="bg-white px-4 py-3 border-b border-gray-100">
      {/* Header with back button and title */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={navigateBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Activities</Text>
        <TouchableOpacity 
          onPress={() => setShowFilter(true)}
          className={`p-2 rounded-full ${hasActiveFilters() ? 'bg-blue-100' : 'bg-gray-100'}`}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters() ? '#0052CC' : '#666'} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-900"
          placeholder="Search...."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Active filters indicator */}
      {hasActiveFilters() && (
        <View className="flex-row items-center mt-2">
          <Text className="text-sm text-gray-600 mr-2">Active filters:</Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text className="text-sm text-blue-600 font-medium">Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyComponent = () => (
    <View className="flex-1 justify-center items-center py-20">
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text className="text-gray-500 text-lg mt-4 text-center">
        {searchQuery || hasActiveFilters() 
          ? 'No transactions found matching your search' 
          : 'No transactions yet'}
      </Text>
      {(searchQuery || hasActiveFilters()) && (
        <TouchableOpacity onPress={clearAllFilters} className="mt-4">
          <Text className="text-blue-600 font-medium">Clear search & filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View className="bg-gray-50 px-4 py-2">
      <Text className="text-sm font-medium text-gray-600">
        {section.title}
      </Text>
    </View>
  );

  const renderItem = ({ item }: ListRenderItemInfo<Transaction>) => (
    <TransactionItem transaction={item} />
  );

  // Error boundary - if transactions array is undefined or null, show error
  if (!transactions || !Array.isArray(transactions)) {
    console.error('Transactions data is invalid:', transactions);
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
        {renderSearchHeader()}
        <View className="flex-1 justify-center items-center">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-gray-600 text-center">
            Unable to load transactions.{'\n'}Please try again later.
          </Text>
          <TouchableOpacity 
            onPress={() => window.location.reload()} 
            className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
        {renderSearchHeader()}
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0052CC" />
          <Text className="mt-4 text-gray-600">Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      {renderSearchHeader()}
      
      <SectionList
        sections={groupedTransactions}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: 20 
        }}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={refreshing}
        onRefresh={forceReloadTransactions}
        stickySectionHeadersEnabled={false}
      />

      <TransactionFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilter={handleApplyFilter}
        activeFilters={activeFilters}
      />
    </SafeAreaView>
  );
}; 