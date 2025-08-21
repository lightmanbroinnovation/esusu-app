import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  ImageBackground,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Footer from './Footer';
import { fetchAccountCommission } from '../../services/api'; // Import the new API function
import StatusBarAdapter from './StatusBarAdapter';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from './EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton

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

const fetchCommissionData = async () => {
  return await fetchAccountCommission();
};

const CommissionScreen = () => {
  const router = useRouter();
  
  // Use back button handler for commission screen
  useBackButtonHandler('/commission');
  
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [commission, setCommission] = useState<number>(0);
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settlementAccounts, setSettlementAccounts] = useState<any[]>([]);
  const [commissionRaw, setCommissionRaw] = useState<number>(0); // for passing

  const fetchData = async (fromRefresh = false) => {
    setLoading(true);
    setError(null);
    if (fromRefresh) {
      await invalidateCache('commission_data');
    }
    try {
      const response = await getCachedData('commission_data', fetchCommissionData);
      if (response && response.status === 'Success' && response.data) {
        setCommission(response.data.commission || 0);
        setCommissionRaw(response.data.commission || 0);
        setTransactions(Array.isArray(response.data.transactions) ? response.data.transactions : []);
        setSettlementAccounts(Array.isArray(response.data.settlementAccounts) ? response.data.settlementAccounts : []);
      } else {
        setError('Failed to load commission data.');
      }
    } catch (err: any) {
      console.error('Commission data fetch error:', err);
      
      // Set fallback values to prevent crashes
      setCommission(0);
      setCommissionRaw(0);
      setTransactions([]);
      setSettlementAccounts([]);
      
      // Show user-friendly error message
      if (err.message) {
        setError(err.message);
      } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error - please check your internet connection and try again.');
      } else {
        setError('Failed to load commission data. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = () => {
    fetchData();
  };

  const navigateBack = () => {
    router.back();
  };

  const handleWithdraw = () => {
    router.push({
      pathname: '/commission/withdraw',
      params: {
        commission: commissionRaw,
        settlementAccounts: JSON.stringify(settlementAccounts)
      }
    });
  };

  const viewAllTransactions = () => {
    router.push({
      pathname: '/commission/CommissionTransactions',
      params: {
        transactions: JSON.stringify(transactions)
      }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  if (loading) {
    return <EsusuLoader />;
  }

  // Always render the main layout, even if error
  return (
    <View className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 mt-4">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 mb-4">
            <TouchableOpacity 
              onPress={navigateBack}
              className=" p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-bold">Commission</Text>
            <TouchableOpacity 
              className="bg-gray-100 p-2 rounded-full"
              onPress={() => setShowRatesModal(true)}
            >
              <Ionicons name="help-circle-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {/* Show error as a banner, not as a full screen */}
          {error && (
            <View className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <View className="flex-row items-center mb-2">
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                <Text className="text-red-800 font-medium ml-2">Connection Error</Text>
              </View>
              <Text className="text-red-700 text-sm mb-3">{error}</Text>
              <TouchableOpacity 
                onPress={handleRetry}
                className="bg-red-600 px-4 py-2 rounded-md self-start"
              >
                <Text className="text-white font-semibold text-sm">Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            {/* Commission Card */}
            <ImageBackground
              source={require('../../assets/images/Onboarding1.png')}
              style={{
                marginHorizontal: 16,
                borderRadius: 24,
                overflow: 'hidden',
                minHeight: 200
              }}
              imageStyle={{
                opacity: 0.3,
                borderRadius: 24
              }}
              resizeMode="cover"
            >
              <View className="bg-blue-600 p-6" style={{ minHeight: 200 }}>
                {/* Content */}
                <View style={{ position: 'relative' }}>
                {/* Profile Image and Balance */}
                <View className="items-center mb-4">
                  <View className="w-20 h-20 rounded-full bg-blue-300 items-center justify-center mb-3">
                    <Image 
                      source={require('../../assets/images/icon.png')}
                      className="w-16 h-16 rounded-full"
                    />
                  </View>
                  <Text className="text-white text-sm">Your available balance is</Text>
                  <Text className="text-white text-3xl font-bold">₦{commission ? commission.toLocaleString() : '--'}</Text>
                  {/* Earned this week tag */}
                  <View className="flex-row bg-white/20 rounded-full px-3 py-1 mt-2">
                    <Text className="text-white">+₦{commission ? commission.toLocaleString() : '--'}</Text>
                    <Text className="text-white ml-1">earned this week!</Text>
                  </View>
                </View>
                
                {/* Total deposits and withdrawals */}
                {/* <View className="flex-row justify-between mb-4">
                  <View>
                    <Text className="text-white/80 text-sm">Total deposits done</Text>
                    <Text className="text-white font-medium">₦{commission.toLocaleString()}</Text>
                  </View>
                  <View>
                    <Text className="text-white/80 text-sm">Total withdraw done</Text>
                    <Text className="text-white font-medium">₦{commission.toLocaleString()}</Text>
                  </View>
                </View> */}
                
                {/* Withdraw Button */}
                <TouchableOpacity 
                  className="bg-white py-3 rounded-xl items-center mt-2"
                  onPress={handleWithdraw}
                >
                  <Text className="text-blue-600 font-semibold text-lg">Withdraw</Text>
                </TouchableOpacity>
                
                {/* Commission payout notice */}
                {/* <Text className="text-white/80 text-sm text-center mt-3">
                  Your commission will be paid out every Friday
                </Text> */}
              </View>
            </View>
            </ImageBackground>
            
            <View className="mx-4 mt-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-500">Recents</Text>
                <TouchableOpacity onPress={viewAllTransactions}>
                  <Text className="text-blue-600">View all</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Display latest 3 transactions as recents */}
            {transactions.length === 0 ? (
              <View className="bg-white py-10 rounded-xl mt-2">
                <Text className="text-gray-400 text-lg font-medium text-center">No Commission Transactions</Text>
                <Text className="text-gray-400 text-sm text-center mt-2 px-4">
                  It looks like you haven't made any commission transactions yet.
                </Text>
              </View>
            ) : (
              transactions.slice(0, 3).map((transaction: any) => {
                const title = (transaction.title || '').trim().toLowerCase();
                const isDebit = title === 'debit';
                const isCredit = title === 'credit';
                return (
                  <View key={transaction._id || transaction.id} className="mx-4 mt-2 mb-2">
                    <View className="flex-row justify-between items-center">
                      <Text className="font-medium">{transaction.description || transaction.type}</Text>
                      <Text
                        className={`font-semibold ${isDebit ? 'text-red-600' : isCredit ? 'text-green-600' : 'text-gray-600'}`}
                      >
                        {isDebit
                          ? `-₦${Math.abs(transaction.amount).toLocaleString()}`
                          : isCredit
                          ? `+₦${transaction.amount.toLocaleString()}`
                          : `₦${transaction.amount.toLocaleString()}`}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-sm">{transaction.date || transaction.createdAt} {transaction.time || ''}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
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