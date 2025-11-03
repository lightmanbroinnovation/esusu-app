import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  SectionList,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchContributorTransactions } from '../../services/api';
import StatusBarAdapter from '../components/StatusBarAdapter';
import NetInfo from '@react-native-community/netinfo';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import { useBackButtonHandler } from '../utils/backButtonHandler';
// Removed TransactionFilter import

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

// Transaction Item component
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  const router = useRouter();
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
  const amountColor = type === 'withdrawal' ? '#EF4444' : '#16A34A';

  const transactionStyles = StyleSheet.create({
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    itemLeft: {
      flex: 1,
      paddingRight: 16,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
    },
    itemSubtitle: {
      color: '#6B7280',
      fontSize: 14,
    },
    itemAmount: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  const handlePress = () => {
    // Navigate to receipt page with transaction data
    router.push({
      pathname: '/receipt',
      params: {
        transaction: JSON.stringify(transaction),
      },
    });
  };

  return (
    <TouchableOpacity
      style={transactionStyles.item}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={transactionStyles.itemLeft}>
        <Text
          style={transactionStyles.itemTitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getTransactionTitle()}
        </Text>
        <Text
          style={transactionStyles.itemSubtitle}
          numberOfLines={1}
        >
          {getTransactionSubtitle()}
        </Text>
      </View>
      <Text style={[transactionStyles.itemAmount, { color: amountColor }]}>
        {formattedAmount()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#F0F8FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },
  sectionHeader: {
    color: '#9CA3AF',
    fontSize: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#EF4444',
  },
  goBackButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyTitle: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
});

export default function ContributorTransactionsScreen() {
  const router = useRouter();
  
  // Use back button handler for contributor transactions
  useBackButtonHandler('/contributor/transactions');
  
  const params = useLocalSearchParams();
  const contributorId = params.contributorId as string;
  const contributorName = params.contributorName as string;
  const memoizedRecentContributions = React.useMemo(() => {
    return params.recentContributions
      ? JSON.parse(params.recentContributions as string)
      : null;
  }, [params.recentContributions]);

  const [searchQuery, setSearchQuery] = useState('');
  // Removed filter modal state

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (memoizedRecentContributions && Array.isArray(memoizedRecentContributions)) {
      // Map the raw contributions to the Transaction interface
      const mapped = memoizedRecentContributions.map((item: any) => ({
        id: item._id || item.id,
        name: contributorName || '', // or item.name if available
        type: item.type,
        amount: item.amount,
        timestamp: item.createdAt,
        date: formatDate(new Date(item.createdAt)),
      }));
      setTransactions(mapped);
      setLoading(false);
    } else {
      fetchTransactionsData();
    }
    // Only run this effect when contributorId or memoizedRecentContributions changes
  }, [contributorId, memoizedRecentContributions]);

  const fetchTransactionsData = async (fromRefresh = false) => {
    if (!contributorId) {
      setError("No contributor ID provided");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    setError(null);
    if (fromRefresh) {
      await invalidateCache(`contributor_transactions_${contributorId}`);
    }
    try {
      const response = await getCachedData(
        `contributor_transactions_${contributorId}`,
        () => fetchContributorTransactions(contributorId)
      );
      if (response && Array.isArray(response)) {
        setTransactions(response);
        setError(null);
      } else if (response && response.data && Array.isArray(response.data)) {
        setTransactions(response.data);
        setError(null);
      } else {
        setError('Failed to load transactions');
      }
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactionsData(true);
  };

  // Apply search filter only when searchQuery or transactions changes
  useEffect(() => {
    // Filter by name or amount (as string)
    const filtered = transactions.filter(transaction => {
      if (!searchQuery) return true;
      const nameMatch = transaction.name.toLowerCase().includes(searchQuery.toLowerCase());
      const amountMatch = transaction.amount.toString().includes(searchQuery);
      return nameMatch || amountMatch;
    });
    setFilteredTransactions(filtered);
    setGroupedTransactions(groupTransactionsByDate(filtered));
  }, [searchQuery, transactions]);

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

  // Removed filter logic

  const clearAllFilters = () => {
    setSearchQuery('');
  };

  // Render section header
  // Show date and time in section header (Today, Yesterday, or MM/DD/YYYY)
  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>
      {getDateHeading(section.title)}
    </Text>
  );

  // Render transaction item
  // Show time next to date in subtitle
  const renderItem = ({ item }: { item: Transaction }) => {
    const dateObj = new Date(item.timestamp);
    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return <TransactionItem transaction={{ ...item, timestamp: `${item.date} ${timeString}` }} />;
  };

  // Render search component
  const renderSearchHeader = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#A0A0A0" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or amount..."
          placeholderTextColor="#A0A0A0"
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
          keyboardType="default"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearAllFilters}>
            <Ionicons name="close-circle" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Transactions</Text>
      <Text style={styles.emptyText}>
        No transactions found for this contributor.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={navigateBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Transactions
            </Text>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066FF" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : error && transactions.length === 0 && !isConnected ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="red" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.goBackButton}
                onPress={navigateBack}
              >
                <Text style={styles.goBackButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SectionList
              sections={groupedTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              ListHeaderComponent={renderSearchHeader}
              ListEmptyComponent={renderEmptyComponent}
              onRefresh={handleRefresh}
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

        {/* Filter Modal removed */}
      </SafeAreaView>
    </View>
  );
} 