import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
    <View className="flex-1 bg-white">
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
        <ScrollView className="px-4 flex-1">
          <View className="flex-row items-center mt-12 mb-4">
            <TouchableOpacity 
              onPress={navigateBack}
              className="bg-gray-100 p-2 rounded-full mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold flex-1 text-center mr-8">Commissions</Text>
          </View>
          <View className="flex-row items-center mb-4">
            <View className="bg-[#F0F8FF] flex-row items-center px-4 py-2 rounded-xl flex-1">
              <Ionicons name="search" size={20} color="#A0A0A0" />
              <TextInput
                className="flex-1 ml-2"
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
            <View className="flex-1 items-center justify-center py-10">
              <ActivityIndicator size="large" color="#0052CC" />
              <Text className="mt-4 text-gray-600">Loading your commission data...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-red-500 text-center mb-4">{error}</Text>
              <TouchableOpacity 
                onPress={handleRetry}
                className="bg-blue-600 px-6 py-2 rounded-md"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : searchedTransactions.length === 0 ? (
            <View className="bg-white py-10 rounded-xl mt-2">
              <Text className="text-gray-400 text-lg font-medium text-center">No Commission Transactions</Text>
              <Text className="text-gray-400 text-sm text-center mt-2 px-4">
                It looks like you haven't made any commission transactions yet.
              </Text>
            </View>
          ) : (
            Object.entries(groupedCommissions).map(([date, transactions]) => (
              <View key={date} className="mb-4">
                <Text className="text-gray-500 mb-2">{date}</Text>
                {transactions.map((transaction, index) => {
                  const title = (transaction.title ?? '').trim().toLowerCase();
                  const isDebit = title === 'debit';
                  const isCredit = title === 'credit';
                  return (
                    <TouchableOpacity
                      key={`${transaction.id}-${index}`}
                      className="mb-4"
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
                      <View className="flex-row justify-between items-center">
                        <Text className="font-medium">{transaction.description ?? transaction.type}</Text>
                        <Text className={`font-semibold ${isDebit ? 'text-red-600' : isCredit ? 'text-green-600' : 'text-gray-600'}`}>
                          {isDebit
                            ? `-₦${Math.abs(transaction.amount).toLocaleString()}`
                            : isCredit
                            ? `+₦${transaction.amount.toLocaleString()}`
                            : `₦${transaction.amount.toLocaleString()}`}
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-sm">{transaction.date} {transaction.time}</Text>
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