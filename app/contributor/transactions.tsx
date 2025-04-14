import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchContributorTransactions } from '../../services/api';
import StatusBarAdapter from '../components/StatusBarAdapter';
import TransactionFilter, { FilterOptions } from '../components/TransactionFilter';

// Define Transaction interface
interface Transaction {
  id: string;
  name: string;
  type: 'deposit' | 'withdrawal' | 'account_creation';
  amount: number;
  timestamp: string;
  date: string;
}

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

// Transaction Item component
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
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
  const amountColorClass = type === 'withdrawal' ? 'text-red-500' : 'text-green-500';
  
  return (
    <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
      <View className="flex-1 pr-4">
        <Text 
          className="text-base font-semibold text-gray-800"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getTransactionTitle()}
        </Text>
        <Text 
          className="text-gray-500 text-sm"
          numberOfLines={1}
        >
          {getTransactionSubtitle()}
        </Text>
      </View>
      <Text className={`text-base font-bold ${amountColorClass}`}>
        {formattedAmount()}
      </Text>
    </View>
  );
};

export default function ContributorTransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const contributorId = params.contributorId as string;
  const contributorName = params.contributorName as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<Record<string, Transaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions for the contributor
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!contributorId) {
        setError("No contributor ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedTransactions = await fetchContributorTransactions(contributorId);
        setTransactions(fetchedTransactions);
        setFilteredTransactions(fetchedTransactions);
        setGroupedTransactions(groupTransactionsByDate(fetchedTransactions));
      } catch (err) {
        console.error("Error fetching contributor transactions:", err);
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [contributorId]);

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

  return (
    <View className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="p-4 flex-1 ">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity 
              onPress={navigateBack}
              className="bg-gray-100 p-2 rounded-full mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-xl font-bold flex-1 text-center mr-8">
              Transactions
            </Text>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0066FF" />
              <Text className="mt-2 text-gray-600">Loading transactions...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="alert-circle" size={48} color="red" />
              <Text className="mt-2 text-red-500">{error}</Text>
              <TouchableOpacity 
                className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
                onPress={navigateBack}
              >
                <Text className="text-white">Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Search and Filter */}
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

              {/* Transactions list */}
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
              >
                {Object.keys(groupedTransactions).length === 0 ? (
                  <View className="bg-white py-10 rounded-xl mt-2">
                    <Text className="text-gray-400 text-lg font-medium text-center">No Transactions</Text>
                    <Text className="text-gray-400 text-sm text-center mt-2 px-4">
                      No transactions found for this contributor.
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
            </>
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
} 