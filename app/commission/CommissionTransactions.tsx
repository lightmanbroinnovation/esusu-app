import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
// No API imports needed
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for icons
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from '../components/EsusuLoader';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Replace with Moti Skeleton
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';
import { useBackButtonHandler } from '../utils/backButtonHandler';

// Define the CommissionTransaction type
interface CommissionTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  time: string;
  title?: string;
  description?: string;
}

const fetchCommissionTransactionsData = async (params: any) => {
  // If you have an API call for commission transactions, place it here
  // Otherwise, just return params as data
  return params;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    paddingHorizontal: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 999,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
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
  searchBox: {
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateText: {
    color: '#6B7280',
    marginBottom: 8,
  },
  transactionItem: {
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDescription: {
    fontWeight: '500',
  },
  transactionAmount: {
    fontWeight: '600',
  },
  transactionAmountDebit: {
    color: '#DC2626',
  },
  transactionAmountCredit: {
    color: '#16A34A',
  },
  transactionAmountDefault: {
    color: '#4B5563',
  },
  transactionDate: {
    color: '#6B7280',
    fontSize: 14,
  },
});

const CommissionTransactions: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Use back button handler for commission transactions page
  useBackButtonHandler('/commission/CommissionTransactions');
  
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('CommissionTransactionsScreen', 15);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (fromRefresh = false) => {
    // Check if we can fetch data
    if (!fromRefresh && !fetchGuard.canFetch()) {
      console.log('🚨 Data fetch blocked by guard');
      return;
    }

    // Check render guard
    if (!renderGuard.checkRender()) {
      console.log('🚨 Render blocked by guard');
      return;
    }

    setLoading(true);
    setError(null);
    let cacheData = null;
    try {
      const cached = await AsyncStorage.getItem('commission_transactions');
      if (cached) {
        cacheData = JSON.parse(cached);
        if (cacheData.transactions) {
          const parsed = JSON.parse(cacheData.transactions);
          setTransactions(Array.isArray(parsed) ? parsed : []);
        } else {
          setTransactions([]);
        }
      }
    } catch {}
    if (!networkAvailable && cacheData) {
      setLoading(false);
      return;
    }
    if (fromRefresh) {
      await invalidateCache('commission_transactions');
    }
    try {
      // Record the fetch attempt
      fetchGuard.recordFetch();
      const data = await getCachedData('commission_transactions', () => fetchCommissionTransactionsData(params));
      if (data.transactions) {
        const parsed = JSON.parse(data.transactions as string);
        setTransactions(Array.isArray(parsed) ? parsed : []);
      } else {
        setTransactions([]);
      }
      setError(null);
    } catch (e) {
      if (!cacheData) {
        setError('Failed to load transactions.');
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.transactions]);

  const onRefresh = async () => {
    setLoading(true);
    await fetchData(true);
    setLoading(false);
  };

  if (loading) {
    return <EsusuLoader />;
  }

  const handleRetry = () => {
    setLoading(true);
    try {
      if (params.transactions) {
        const parsed = JSON.parse(params.transactions as string);
        setTransactions(Array.isArray(parsed) ? parsed : []);
      } else {
        setTransactions([]);
      }
      setError(null);
    } catch (e) {
      setError('Failed to load transactions.');
      setTransactions([]);
    }
    setLoading(false);
  };

  // Function to group commissions by date
  const groupCommissionsByDate = (transactions: CommissionTransaction[]) => {
    return transactions.reduce((acc, transaction) => {
      const dateKey = transaction.date; // Use the date as the key
      if (!acc[dateKey]) {
        acc[dateKey] = []; // Initialize an array for this date if it doesn't exist
      }
      acc[dateKey].push(transaction); // Push the transaction into the corresponding date array
      return acc;
    }, {} as Record<string, CommissionTransaction[]>);
  };

  // Only search by type or amount
  const searchedTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    const typeMatch = transaction.type.toLowerCase().includes(searchQuery.toLowerCase());
    const amountMatch = transaction.amount.toString().includes(searchQuery);
    return typeMatch || amountMatch;
  });
  const groupedCommissions = groupCommissionsByDate(searchedTransactions);


  const navigateBack = () => {
    router.back();
  };


  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 48 }}>
          {/* Search Bar Skeleton */}
          <View style={{ width: '100%', height: 48, borderRadius: 24, marginBottom: 24, backgroundColor: '#E5E7EB' }} />
          {/* Transaction List Skeleton */}
          {[1,2,3,4,5].map((item, index) => (
            <View key={`skeleton-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB' }} />
              <View style={{ marginLeft: 16 }}>
                <View style={{ width: 120, height: 16, borderRadius: 4, marginBottom: 6, backgroundColor: '#E5E7EB' }} />
                <View style={{ width: 80, height: 14, borderRadius: 4, backgroundColor: '#E5E7EB' }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={navigateBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Commissions</Text>
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#A0A0A0" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by type or amount..."
                placeholderTextColor="#A0A0A0"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#A0A0A0" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0052CC" />
              <Text style={styles.loadingText}>Loading your commission data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                onPress={handleRetry}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : searchedTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Commission Transactions</Text>
              <Text style={styles.emptySubtitle}>
                It looks like you haven't made any commission transactions yet.
              </Text>
            </View>
          ) : (
            Object.entries(groupedCommissions).map(([date, transactions]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateText}>{date}</Text>
                {transactions.map((transaction, index) => {
                  const title = (transaction.title ?? '').trim().toLowerCase();
                  const isDebit = title === 'debit';
                  const isCredit = title === 'credit';
                  const amountColor = isDebit ? styles.transactionAmountDebit : isCredit ? styles.transactionAmountCredit : styles.transactionAmountDefault;
                  return (
                    <TouchableOpacity
                      key={`${transaction.id}-${index}`}
                      style={styles.transactionItem}
                      onPress={() => {
                        // Navigate to receipt page with transaction data
                        router.push({
                          pathname: '/receipt',
                          params: {
                            transaction: JSON.stringify(transaction),
                          },
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionRow}>
                        <Text style={styles.transactionDescription}>{transaction.description ?? transaction.type}</Text>
                        <Text style={[styles.transactionAmount, amountColor]}>
                          {isDebit
                            ? `-₦${Math.abs(transaction.amount).toLocaleString()}`
                            : isCredit
                            ? `+₦${transaction.amount.toLocaleString()}`
                            : `₦${transaction.amount.toLocaleString()}`}
                        </Text>
                      </View>
                      <Text style={styles.transactionDate}>{transaction.date} {transaction.time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default CommissionTransactions;