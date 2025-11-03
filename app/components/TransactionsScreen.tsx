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
  RefreshControl,
  StyleSheet
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
import { fetchTransactions } from '../../services/api';
import EsusuLoader from './EsusuLoader';
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';
import { useBackButtonHandler } from '../utils/backButtonHandler';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterButton: {
    padding: 8,
    borderRadius: 999,
  },
  filterButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  filterButtonInactive: {
    backgroundColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
  },
  clearSearchText: {
    color: '#2563EB',
    fontWeight: '500',
  },
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#4B5563',
  },
});

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
              id: t.id || index.toString(),
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
    <View style={styles.searchHeader}>
      {/* Header with back button and title */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activities</Text>
        <TouchableOpacity 
          onPress={() => setShowFilter(true)}
          style={[
            styles.filterButton,
            hasActiveFilters() ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters() ? '#0052CC' : '#666'} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
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
        <View style={styles.activeFiltersRow}>
          <Text style={styles.activeFiltersText}>Active filters:</Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyText}>
        {searchQuery || hasActiveFilters() 
          ? 'No transactions found matching your search' 
          : 'No transactions yet'}
      </Text>
      {(searchQuery || hasActiveFilters()) && (
        <TouchableOpacity onPress={clearAllFilters} style={styles.clearSearchButton}>
          <Text style={styles.clearSearchText}>Clear search & filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
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
      <SafeAreaView style={styles.container}>
        <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
        {renderSearchHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>
            Unable to load transactions.{'\n'}Please try again later.
          </Text>
          <TouchableOpacity 
            onPress={() => window.location.reload()} 
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
        {renderSearchHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0052CC" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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