import React, { useState, useEffect } from 'react';
import { FlatList, SafeAreaView, Text, View, TouchableOpacity, Modal, ActivityIndicator, RefreshControl, BackHandler, Platform, ToastAndroid, Dimensions } from 'react-native';
import UserCard from '../components/UserCard';
import Footer from '../components/Footer';
import RecentActivity from '../components/RecentActivity';
import { Ionicons } from "@expo/vector-icons";
import VerificationController from '../verification/VerificationController';
import { useRouter } from 'expo-router';
import { fetchUser, fetchMerchantDashboardAccount, fetchTransactionHistory } from '../../services/api';
import LatestTransactions from '../components/LatestTransactions';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthGuard } from '../../authGuard';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import { refreshAllUserData } from '../utils/dataRefresh';
import EsusuLoader from '../components/EsusuLoader';
import { useExitAppBackHandler } from '../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton


interface User {
  firstname: string;
  lastname: string;
  email: string;
  id: string;
  balance: string;
  weeklyEarnings: string;
  userImg?: string;
  businessLocation?: boolean;
  documentsVerified?: boolean;
  governmentid?: boolean;
  governmentID?: boolean;
}

// Dashboard item type for FlatList
interface DashboardItem {
  id: string;
  type: 'userCard' | 'newUser' | 'activity';
}

const HomeScreen = () => {
  const router = useRouter();
  const { width, height } = Dimensions.get('window');
  const [showVerification, setShowVerification] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use exit app back handler for dashboard
  useExitAppBackHandler();

  // Responsive sizing based on screen width
  const getResponsiveSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9; // Small phones
    } else if (width < 414) {
      return baseSize; // Medium phones
    } else {
      return baseSize * 1.1; // Large phones and tablets
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

        if (!isLoggedIn || !storedUserData) {
          // User is not logged in, redirect to login
          router.replace('/login');
          return;
        }

        // Set the initial user data from storage
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error('Error checking login status:', error);
        router.replace('/login');
      }
    };

    checkLoginStatus();
  }, []);

  // Replace fetchUserDetails with caching logic
  const fetchUserDetails = async (fromRefresh = false) => {
    setLoading(true);
    setError(null);
    if (fromRefresh) {
      await invalidateCache('dashboard_user');
    }
    try {
      const userData = await getCachedData('dashboard_user', async () => {
        const response = await fetchUser();
        if (response.status === 'Success' && response.data?.user) {
          return {
            firstname: response.data.user.firstName,
            lastname: response.data.user.lastName,
            id: response.data.user._id,
            email: response.data.user.email || '',
            balance: response.data.user.balance || '0',
            weeklyEarnings: response.data.user.weeklyEarnings || '0',
            userImg: response.data.user.userImg,
            transactions: response.data.user.transactions || [],
            // Add verification fields for KYB logic
            businessLocation: response.data.user.businessLocation,
            documentsVerified: response.data.user.documentsVerified,
            governmentid: response.data.user.governmentid,
            governmentID: response.data.user.governmentID,
          };
        } else {
          throw new Error('Invalid response format');
        }
      });
      setUserData(userData);
      setTransactions(userData.transactions);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      console.log('User data for dashboard/verification:', userData);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data comprehensively
      await refreshAllUserData();
      // Then fetch dashboard-specific data
      await fetchUserDetails(true);
    } catch (error) {
      console.log('Warning: Some data refresh failed:', error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        // Try to load from AsyncStorage first
        const cachedAccount = await AsyncStorage.getItem('merchantDashboardAccount');
        if (cachedAccount) {
          setAccountData(JSON.parse(cachedAccount));
        }
        // Always fetch fresh data in the background
        const response = await fetchMerchantDashboardAccount();
        console.log('Fetched merchant dashboard account:', response);
        if ((response.status === 'Success' || response.status === 'success') && response.data) {
          setAccountData(response.data);
          await AsyncStorage.setItem('merchantDashboardAccount', JSON.stringify(response.data));
        } else {
          setAccountData(null);
          await AsyncStorage.removeItem('merchantDashboardAccount');
        }
      } catch (error) {
        console.error('Error fetching merchant dashboard account:', error);
        setAccountData(null);
      }
    };
    fetchAccount();
  }, []);

  // Fetch transaction history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Try to load from AsyncStorage first
        const cachedHistory = await AsyncStorage.getItem('transactionHistory');
        if (cachedHistory) {
          const parsedHistory = JSON.parse(cachedHistory);
          console.log('Loaded cached transaction history:', parsedHistory);
          if (Array.isArray(parsedHistory)) {
            setTransactionHistory(parsedHistory);
          }
        }
        
        // Always fetch fresh data in the background
        const historyData = await fetchTransactionHistory();
        console.log('Fetched transaction history:', historyData);
        
        // Ensure we have an array
        if (Array.isArray(historyData)) {
          setTransactionHistory(historyData);
          // Cache the fresh data
          if (historyData.length > 0) {
            await AsyncStorage.setItem('transactionHistory', JSON.stringify(historyData));
          } else {
            await AsyncStorage.removeItem('transactionHistory');
          }
        } else {
          console.warn('Transaction history is not an array:', historyData);
          setTransactionHistory([]);
          await AsyncStorage.removeItem('transactionHistory');
        }
      } catch (error) {
        console.error('Error fetching transaction history:', error);
        setTransactionHistory([]);
        await AsyncStorage.removeItem('transactionHistory');
      }
    };
    fetchHistory();
  }, []);

  // Robust date parser for cross-platform compatibility
  function parseDateSafe(dateStr: string): Date {
    if (!dateStr) return new Date('');
    // Try ISO first
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    // Try MM/DD/YYYY or DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [m, d2, y] = dateStr.split('/');
      // Try MM/DD/YYYY
      d = new Date(`${y}-${m.padStart(2, '0')}-${d2.padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d;
      // Try DD/MM/YYYY
      d = new Date(`${y}-${d2.padStart(2, '0')}-${m.padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d;
    }
    // Fallback: return Invalid Date
    return new Date('');
  }

  // Helper function to format time from createdAt
  const formatTimeFromCreatedAt = (createdAt: string): string => {
    const date = parseDateSafe(createdAt);
    return !isNaN(date.getTime()) ? date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }) : '';
  };

  // Helper function to format date from createdAt
  const formatDateFromCreatedAt = (createdAt: string): string => {
    const date = parseDateSafe(createdAt);
    return !isNaN(date.getTime()) ? date.toLocaleDateString('en-US') : '';
  };

  // Format transaction history data to match transactions page structure
  const formatTransactionHistory = (rawHistory: any[]) => {
    if (!Array.isArray(rawHistory)) return [];
    
    return rawHistory.map((t, index) => {
      const rawDate = t.createdAt || t.date || '';
      const dateObj = parseDateSafe(rawDate);
      const isoDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : '';
      console.log('Raw transaction date:', rawDate, 'Parsed ISO:', isoDate);
      const converted = {
        id: t.id || index.toString(),
        name: t.description || t.name || 'Transaction', // Use description as name
        amount: Number(t.amount || 0),
        type: t.type === 'credit' ? 'deposit' : (t.type === 'debit' ? 'withdrawal' : t.type), // Map credit to deposit, debit to withdrawal
        createdAt: rawDate,
        date: isoDate,
        time: formatTimeFromCreatedAt(rawDate),
        timestamp: formatTimeFromCreatedAt(rawDate),
        status: t.status || 'completed'
      };
      return converted;
    });
  };

  // Create data array for FlatList
  const dashboardItems: DashboardItem[] = [
    { id: 'userCard', type: 'userCard' },
    { id: 'newUser', type: 'newUser' },
    { id: 'activity', type: 'activity' }
  ];

  const renderItem = ({ item }: { item: DashboardItem }) => {
    switch (item.type) {
      case 'userCard':
        return userData ? (
          <UserCard user={userData} accountData={accountData} disabled={false} />
        ) : null;
      case 'newUser':
        return (
          <TouchableOpacity 
            onPress={() => router.push("/contributor/add")}
            disabled={!userData} // Disable when no user data
            style={{ opacity: userData ? 1 : 0.5 }} // Visual feedback
          > 
            <View className='flex-row justify-center items-center p-4 rounded-2xl mt-6 bg-[#E5F1FF]' style={{
              padding: getResponsiveSize(16),
              marginTop: getResponsiveSize(24),
              borderRadius: getResponsiveSize(16)
            }}>
              <Ionicons name="person-add-outline" size={getResponsiveSize(24)} color="#0052CC" style={{ marginRight: getResponsiveSize(8) }} />
              <Text className="text-[#0052CC] font-medium" style={{ fontSize: getResponsiveSize(16) }}>New User</Text>
            </View>
          </TouchableOpacity>
        );
      case 'activity':
        const formattedHistory = formatTransactionHistory(transactionHistory);
        const hideKybBanner = !!(userData && userData.businessLocation && userData.documentsVerified && (userData.governmentid || userData.governmentID));
        return (
          <RecentActivity 
            onVerifyNow={() => router.push('/verification')} 
            transactionHistory={Array.isArray(formattedHistory) && formattedHistory.length > 0 ? formattedHistory.slice(0, 3) : []}
            onViewAllActivity={() => router.push({
              pathname: '/transactions',
              params: { transactionHistory: JSON.stringify(formattedHistory) }
            })}
            hideKybBanner={hideKybBanner}
            showVerificationNotification={!userData} // Show notification when no user data
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (!isLoggedIn) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, []);

  // Back button handling is now managed by useExitAppBackHandler hook

  if (loading) {
    return <EsusuLoader />;
  }

  // Always render the main layout, even if error
  return (
    <AuthGuard>
      <View className="flex-1 bg-gray-50">
        <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-4 mt-4" style={{ 
            paddingHorizontal: getResponsiveSize(16),
            marginTop: getResponsiveSize(16)
          }}>
            {/* Do not show error message/banner at all */}
            <FlatList
              data={dashboardItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: getResponsiveSize(10) }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </View>
          <Footer disabled={!userData} />
        </SafeAreaView>
        <Modal
          animationType="slide"
          transparent={false}
          visible={showVerification}
          onRequestClose={() => setShowVerification(false)}
        >
          <VerificationController onClose={() => setShowVerification(false)} />
        </Modal>
      </View>
    </AuthGuard>
  );
};

export default HomeScreen;
