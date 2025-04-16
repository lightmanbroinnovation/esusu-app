import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { fetchCommissions, fetchUser } from '../../services/api'; // Import the fetchUser function
import TransactionFilter, { FilterOptions } from '../commission/TransactionFilter'; // Import the filter component
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for icons
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the CommissionTransaction type
interface CommissionTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  time: string;
}

const CommissionTransactions: React.FC = () => {
  const router = useRouter();
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]); // State to hold fetched commissions
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({}); // State for active filters
  const [showFilter, setShowFilter] = useState(false); // State to control filter modal visibility
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user ID from AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          console.error('User ID not found in AsyncStorage');
          setError('User ID not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        setUserId(storedUserId);
        console.log('Retrieved user ID from storage:', storedUserId);
      } catch (error) {
        console.error('Error retrieving user ID:', error);
        setError('Failed to retrieve user ID');
        setLoading(false);
      }
    };
    
    getUserId();
  }, []);

  // Fetch user details and commissions when userId is available
  useEffect(() => {
    if (!userId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user details to get commissions
        const userData = await fetchUser(userId);
        
        // Get commissions from user data or from dedicated API function
        const commissions = userData.commissions || await fetchCommissions(userId);
        setTransactions(commissions);
        
        console.log('User data and commissions fetched successfully');
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleRetry = () => {
    if (userId) {
      // Re-fetch data if userId is available
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch user details
          const userData = await fetchUser(userId);
          
          // Get commissions from user data or from dedicated API function
          const commissions = userData.commissions || await fetchCommissions(userId);
          setTransactions(commissions);
          
          console.log('User data and commissions fetched successfully');
        } catch (error) {
          console.error("Failed to fetch data:", error);
          setError("Failed to load data. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      // Retry getting userId from AsyncStorage
      const getUserId = async () => {
        try {
          setLoading(true);
          setError(null);
          const storedUserId = await AsyncStorage.getItem('userId');
          if (!storedUserId) {
            setError('User ID not found. Please log in again.');
            setLoading(false);
            return;
          }
          
          setUserId(storedUserId);
        } catch (error) {
          console.error('Error retrieving user ID:', error);
          setError('Failed to retrieve user ID. Please try again.');
          setLoading(false);
        }
      };
      
      getUserId();
    }
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

  // Apply filters to transactions
  const applyFilters = (transactions: CommissionTransaction[], filters: FilterOptions) => {
    return transactions.filter(transaction => {
      const matchesType = filters.transactionType && filters.transactionType !== 'all'
        ? transaction.type === filters.transactionType
        : true;

      const matchesMinAmount = filters.minAmount !== undefined
        ? transaction.amount >= filters.minAmount
        : true;

      const matchesMaxAmount = filters.maxAmount !== undefined
        ? transaction.amount <= filters.maxAmount
        : true;

      return matchesType && matchesMinAmount && matchesMaxAmount;
    });
  };

  // Apply search query to transactions
  const applySearch = (transactions: CommissionTransaction[], query: string) => {
    return transactions.filter(transaction => 
      transaction.type.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filteredTransactions = applyFilters(transactions, activeFilters); // Apply filters to transactions
  const searchedTransactions = applySearch(filteredTransactions, searchQuery); // Apply search to filtered transactions
  const groupedCommissions = groupCommissionsByDate(searchedTransactions); // Group the filtered and searched commissions


  const navigateBack = () => {
    router.back();
  };


  return (
    <View className="flex-1 bg-white">
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
          <View className="bg-[#F0F8FF] flex-row items-center px-4 py-2 rounded-xl flex-1 mr-2">
            <Ionicons name="search" size={20} color="#A0A0A0" />
            <TextInput
              className="flex-1 ml-2"
              placeholder="Search...."
              placeholderTextColor="#A0A0A0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {(searchQuery || Object.keys(activeFilters).length > 0) && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setActiveFilters({}); }}>
                <Ionicons name="close-circle" size={20} color="#A0A0A0" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity className="bg-gray-100 p-2 rounded-xl" onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={24} color={Object.keys(activeFilters).length > 0 ? "#0052CC" : "#000"} />
          </TouchableOpacity>
        </View>

        <TransactionFilter
          visible={showFilter}
          onClose={() => setShowFilter(false)}
          onApplyFilter={(filters) => {
            setActiveFilters(filters);
            setShowFilter(false);
          }}
        />
        
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
              {transactions.map(transaction => (
                <View key={transaction.id} className="mb-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium">{transaction.type}</Text>
                    <Text className={`font-semibold ${transaction.type === 'Withdrawn' ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.amount > 0 ? `₦${transaction.amount.toLocaleString()}` : `-₦${Math.abs(transaction.amount).toLocaleString()}`}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">{transaction.date} {transaction.time}</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default CommissionTransactions;