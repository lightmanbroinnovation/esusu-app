import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Footer from './Footer';
import { fetchCommissions, fetchUser } from '../../services/api'; // Import the fetchUser function
import StatusBarAdapter from './StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the CommissionTransaction type
interface CommissionTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  time: string;
}

// Define user details interface
interface UserDetails {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  balance?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  weeklyEarnings?: number;
  userImg?: string;
  commissions?: CommissionTransaction[];
}

const CommissionScreen = () => {
  const router = useRouter();
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [commissionTransactions, setCommissionTransactions] = useState<CommissionTransaction[]>([]); // Specify the type
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // Fetch user ID from AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          console.error('User ID not found in AsyncStorage');
          setError('User ID not found. Please log in again.');
          return;
        }
        
        setUserId(storedUserId);
        console.log('Retrieved user ID from storage:', storedUserId);
      } catch (error) {
        console.error('Error retrieving user ID:', error);
        setError('Failed to retrieve user ID');
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
        
        // Fetch user details
        const userData = await fetchUser(userId);
        setUserDetails(userData);
        
        // Get commissions from user data or from dedicated API function
        const commissions = userData.commissions || await fetchCommissions(userId);
        setCommissionTransactions(commissions);
        
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
          setUserDetails(userData);
          
          // Get commissions from user data or from dedicated API function
          const commissions = userData.commissions || await fetchCommissions(userId);
          setCommissionTransactions(commissions);
          
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

  const navigateBack = () => {
    router.back();
  };
  
  const handleWithdraw = () => {
    router.push('/commission/withdraw' as any);
  };
  
  const viewAllTransactions = () => {
    router.push('/commission/CommissionTransactions'); // Adjusted to remove transactions from the push
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

  const groupedCommissions = groupCommissionsByDate(commissionTransactions); // Group the commissions

  // Determine financial values with defaults
  const balance = userDetails?.balance || 0;
  const totalDeposit = userDetails?.totalDeposit || 0;
  const totalWithdraw = userDetails?.totalWithdraw || 0;
  const weeklyEarnings = userDetails?.weeklyEarnings || 0;

  return (
    <View className="flex-1 bg-white">
       <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />

      <SafeAreaView className="flex-1">
        <View className="flex-1 mt-2">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 mb-4">
            <TouchableOpacity 
              onPress={navigateBack}
              className="bg-gray-100 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            
            <Text className="text-2xl font-bold">Commission</Text>
            
            <TouchableOpacity 
              className="bg-gray-100 p-2 rounded-full"
              onPress={() => setShowRatesModal(true)}
            >
              <Ionicons name="help-circle-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0052CC" />
              <Text className="mt-4 text-gray-600">Loading your commission data...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-red-500 text-center mb-4">{error}</Text>
              <TouchableOpacity 
                onPress={handleRetry}
                className="bg-blue-600 px-6 py-2 rounded-md"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 0 }} // Add padding for footer
            >
              {/* Commission Card */}
              <View className="bg-blue-600 mx-4 rounded-xl p-6">
                {/* Profile Image and Balance */}
                <View className="items-center mb-4">
                  <View className="w-20 h-20 rounded-full bg-blue-300 items-center justify-center mb-3">
                    <Image 
                      source={userDetails?.userImg ? { uri: userDetails.userImg } : require('../../assets/images/icon.png')}
                      className="w-16 h-16 rounded-full"
                    />
                  </View>
                  <Text className="text-white text-sm">Your available balance is</Text>
                  <Text className="text-white text-3xl font-bold">₦{balance.toLocaleString()}</Text>
                  
                  {/* Earned this week tag */}
                  <View className="flex-row bg-white/20 rounded-full px-3 py-1 mt-2">
                    <Text className="text-white">+₦{weeklyEarnings.toLocaleString()}</Text>
                    <Text className="text-white ml-1">earned this week!</Text>
                  </View>
                </View>
                
                {/* Total deposits and withdrawals */}
                <View className="flex-row justify-between mb-4">
                  <View>
                    <Text className="text-white/80 text-sm">Total deposits done</Text>
                    <Text className="text-white font-medium">₦{totalDeposit.toLocaleString()}</Text>
                  </View>
                  <View>
                    <Text className="text-white/80 text-sm">Total withdraw done</Text>
                    <Text className="text-white font-medium">₦{totalWithdraw.toLocaleString()}</Text>
                  </View>
                </View>
                
                {/* Withdraw Button */}
                <TouchableOpacity 
                  className="bg-white py-3 rounded-xl items-center mt-2"
                  onPress={handleWithdraw}
                >
                  <Text className="text-blue-600 font-semibold text-lg">Withdraw</Text>
                </TouchableOpacity>
                
                {/* Commission payout notice */}
                <Text className="text-white/80 text-sm text-center mt-3">
                  Your commission will be paid out every Friday
                </Text>
              </View>
              
              <View className="mx-4 mt-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-gray-500">Recents</Text>
                  <TouchableOpacity onPress={viewAllTransactions}>
                    <Text className="text-blue-600">View all</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Grouped Transactions */}
              {commissionTransactions.length === 0 ? (
                <View className="bg-white py-10 rounded-xl mt-2">
                  <Text className="text-gray-400 text-lg font-medium text-center">No Commission Transactions</Text>
                  <Text className="text-gray-400 text-sm text-center mt-2 px-4">
                    It looks like you haven't made any commission transactions yet.
                  </Text>
                </View>
              ) : (
                Object.entries(groupedCommissions).map(([date, transactions]) => (
                  <View key={date} className="mx-4 mt-2">
                    <Text className="text-gray-500 mb-4">{date}</Text>
                    {transactions.map((transaction) => (
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
          )}
        </View>
        <Footer />
      </SafeAreaView>
      
      {/* Commission Rates Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRatesModal}
        onRequestClose={() => setShowRatesModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white mx-4 rounded-xl p-8 shadow-md w-11/12">
            {/* Commission Rates Content */}
            <Text className="text-blue-600 text-2xl font-bold mb-4">Commission Rates</Text>
            
            <View className="border-b border-gray-200 pb-4 mb-4">
              <Text className="text-xl font-semibold">New Customer</Text>
              <Text className="text-gray-600">₦100 per registration</Text>
            </View>
            
            <View className="border-b border-gray-200 pb-4 mb-4">
              <Text className="text-xl font-semibold">Deposit Commission</Text>
              <Text className="text-gray-600">1% of all deposit amounts</Text>
            </View>
            
            <View className="border-b border-gray-200 pb-4 mb-4">
              <Text className="text-xl font-semibold">Withdrawal Policy</Text>
              <Text className="text-gray-600">Free (no commission)</Text>
            </View>
            
            <View className="pb-4">
              <Text className="text-xl font-semibold">Bonus</Text>
              <Text className="text-gray-600">₦500 bonus for every 10 active customers</Text>
            </View>
            
            <TouchableOpacity 
              className="bg-blue-600 py-3 rounded-2xl absolute -bottom-[16px] left-[30%] "
              style={{ width: '40%' }} // Adjust width and height as needed
              onPress={() => setShowRatesModal(false)}
            >
              <Text className="text-white font-semibold text-center ">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CommissionScreen; 