import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchContributors, fetchContributorTransactions, fetchContributorById } from '../../services/api';
import { Contributor } from '../contributors/ContributorsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from './EsusuLoader';
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';

// Define Transaction interface
interface Transaction {
  id: string;
  name: string;
  type: 'deposit' | 'withdrawal' | 'account_creation';
  amount: number;
  timestamp: string;
  date: string;
}

interface ContributorProfileProps {
  contributorId: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  phoneNumber?: string;
  depositAmount?: string;
  balance?: string;
  frequency?: string;
  status?: string;
}

export default function ContributorProfile() {
  const [contributorData, setContributorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('ContributorProfile', 15);

  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Use props or fallback to API data
  const displayName = contributor ? 
    `${contributor.firstName} ${contributor.lastName}` : 
    (params.firstName && params.lastName) ? 
    `${params.firstName} ${params.lastName}` : 
    'Contributor';
  
  // Ensure we have a valid URL for the image
  const getValidImageUri = (uri?: string) => {
    if (!uri || imageLoadError) {
      // Return null to indicate we should render a fallback UI instead
      return null;
    }
    
    // Handle file:// URIs properly
    if (uri.startsWith('file://')) {
      return { uri };
    }
    
    // Handle http/https URLs
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return { uri };
    }
    
    // If it's just a path without protocol, assume it's a file path
    return { uri: `file://${uri}` };
  };
  
  // Process the image URI to ensure it's valid
  const imageSource = getValidImageUri(params.imageUrl as string || contributor?.photoUri);

  // Generate initials for the fallback avatar
  const getInitials = () => {
    const first = params.firstName as string || contributor?.firstName || '';
    const last = params.lastName as string || contributor?.lastName || '';
    
    const firstInitial = first.length > 0 ? first[0].toUpperCase() : '';
    const lastInitial = last.length > 0 ? last[0].toUpperCase() : '';
    
    return `${firstInitial}${lastInitial}`;
  };

  // Get a random background color based on the contributor's name
  const getAvatarColor = () => {
    const name = `${params.firstName as string || contributor?.firstName || ''}${params.lastName as string || contributor?.lastName || ''}`;
    if (!name) return '#3b82f6'; // Default blue if no name
    
    // Generate a consistent color based on name
    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colors = [
      '#3b82f6', // blue-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
      '#ec4899', // pink-500
      '#06b6d4', // cyan-500
    ];
    
    return colors[charSum % colors.length];
  };

  // Log the image source being used for debugging
  useEffect(() => {
    console.log('Using image source:', JSON.stringify(imageSource));
  }, [imageSource]);

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
      const cached = await AsyncStorage.getItem('contributor_profile');
      if (cached) {
        cacheData = JSON.parse(cached);
        setContributorData(cacheData);
      }
    } catch {}
    
    if (!networkAvailable && cacheData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    if (fromRefresh) {
      await invalidateCache('contributor_profile');
    }
    
    try {
      // Record the fetch attempt
      fetchGuard.recordFetch();
      
      const data = await getCachedData('contributor_profile', () => fetchContributorById(params.contributorId as string));
      setContributorData(data);
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load contributor profile');
        setContributorData(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only fetch data once on mount
    if (!fetchGuard.isInitialized()) {
      fetchData();
    }
  }, []);

  // Fetch transactions for the contributor
  useEffect(() => {
    const getTransactions = async () => {
      if (!params.contributorId) return;
      
      setTransactionsLoading(true);
      try {
        const transactionData = await fetchContributorTransactions(params.contributorId);
        setTransactions(transactionData);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setTransactionsLoading(false);
      }
    };

    getTransactions();
  }, [params.contributorId]);

  const navigateBack = () => {
  router.push('/dashboard');
  };

  const navigateToTransactions = () => {
    router.push({
      pathname: '/contributor/transactions',
      params: { 
        contributorId: params.contributorId,
        contributorName: displayName
      }
    });
  };

  const handleDeposit = () => {
    if (contributor) {
      const userDetails = {
        userDataString: JSON.stringify({
          id: contributor.id,
          firstname: contributor.firstName,
          lastname: contributor.lastName,
          phonenumber: contributor.phoneNumber,
          balance: contributor.depositAmount,
          imageUrl: contributor.photoUri || null // Allow null for fallback to icon
        })
      };

      router.push({
        pathname: '/deposit/subpages/amt-deposit',
        params: userDetails
      });
    } else {
      Alert.alert("Error", "Contributor data is not available.");
    }
  };

  const handleWithdraw = () => {
    if (contributor) {
      const userDetails = {
        userDataString: JSON.stringify({
          id: contributor.id,
          firstname: contributor.firstName,
          lastname: contributor.lastName,
          phonenumber: contributor.phoneNumber,
          balance: contributor.balance || contributor.depositAmount,
          imageUrl: contributor.photoUri || null
        })
      };

      router.push({
        pathname: '/withdrawal/subpages/withdrawal-type',
        params: userDetails
      });
    } else {
      Alert.alert("Error", "Contributor data is not available.");
    }
  };

  const handleSendReminder = () => {
    setReminderModalVisible(true);
  };

  const closeReminderModal = () => {
    setReminderModalVisible(false);
  };

  // Format date in a human-readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calculate days left between start and end date
  const calculateDaysLeft = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    if (today > end) return 0;
    
    const timeDiff = end.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Get transaction amount with appropriate format
  const getTransactionAmount = (transaction: Transaction) => {
    const prefix = transaction.type === 'withdrawal' ? '-' : '+';
    return `${prefix}₦${transaction.amount.toLocaleString()}`;
  };

  // Get transaction color based on type
  const getTransactionColor = (type: string) => {
    switch(type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Loading state
  if (loading && !(params.firstName && params.lastName)) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="mt-2">Loading contributor data...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !(params.firstName && params.lastName)) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Ionicons name="alert-circle" size={48} color="red" />
        <Text className="mt-2 text-red-500">{error || "Failed to load contributor"}</Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
          onPress={navigateBack}
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Create a merged data object that uses props when available and falls back to API data
  const mergedContributorData = {
    firstName: params.firstName || contributor?.firstName || '',
    lastName: params.lastName || contributor?.lastName || '',
    photoUri: typeof imageSource === 'string' ? imageSource : imageSource?.uri,
    depositAmount: contributor?.depositAmount || 0,
    startDate: contributor?.startDate || new Date().toISOString(),
    endDate: contributor?.endDate || new Date().toISOString(),
    frequency: contributor?.frequency || 'daily',
    language: contributor?.language || 'English',
    status: contributor?.status || 'active'
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 mt-2">
        {/* Header */}
        <View className="flex-row items-center mb-4 mt-10">
          <TouchableOpacity onPress={navigateBack} className="bg-gray-100 p-2 rounded-full mr-4">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">
            {displayName}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1">
          {/* Profile Card */}
          <View className="bg-blue-600 rounded-xl p-4 relative overflow-hidden">
            {/* Background Image */}
            <Image
              source={require('../../assets/images/Onboarding1.png')}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                opacity: 0.3,
                borderRadius: 12
              }}
              resizeMode="cover"
            />
            
            {/* Content */}
            <View style={{ zIndex: 1 }}>
              {/* Profile Image and Balance */}
              <View className="items-center mb-4">
                {imageSource ? (
                  <Image
                    source={imageSource}
                    className="w-20 h-20 rounded-full"
                    onError={(e) => {
                      console.error('Error loading image:', e.nativeEvent.error);
                      setImageLoadError(true);
                    }}
                  />
                ) : (
                  <View 
                    className="w-20 h-20 rounded-full items-center justify-center"
                    style={{ backgroundColor: getAvatarColor() }}
                  >
                    <Text className="text-white text-xl font-bold">{getInitials()}</Text>
                  </View>
                )}
                <Text className="text-white text-sm mt-2">Total Contributions Made</Text>
                <Text className="text-white text-3xl font-bold">₦{mergedContributorData.depositAmount}</Text>
              </View>
              
              {/* Action Buttons */}
              <View className="flex-row justify-between">
                <TouchableOpacity onPress={handleDeposit} className="bg-black rounded-lg flex-row items-center justify-center px-6 py-3 flex-1 mr-2">
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text className="text-white ml-2">Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-white rounded-lg flex-row items-center justify-center px-6 py-3 flex-1 ml-2"
                  onPress={handleWithdraw}
                >
                  <Ionicons name="remove-circle-outline" size={20} color="#0066FF" />
                  <Text className="text-blue-600 ml-2">Withdraw</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Agent Notice */}
          <View className="bg-blue-50 mt-4 rounded-lg p-4">
            <Text className="text-blue-500 font-medium">Important Notice for Agents</Text>
            <Text className="text-blue-500 text-sm">
              As an agent, you do not have access to withdraw or control a contributor's funds—only the 
              contributor can initiate payouts securely.
            </Text>
          </View>

          {/* Savings Details */}
          <View className="mx-4 mt-4">
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Start Date</Text>
                <Text className="font-medium">{formatDate(mergedContributorData.startDate)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">End Date</Text>
                <Text className="font-medium">{formatDate(mergedContributorData.endDate)}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Frequency</Text>
                <Text className="font-medium">₦{mergedContributorData.depositAmount} {mergedContributorData.frequency}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Days Left</Text>
                <Text className="font-medium">
                  {calculateDaysLeft(mergedContributorData.startDate, mergedContributorData.endDate)} days
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Language</Text>
                <Text className="font-medium">{mergedContributorData.language}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Status</Text>
                <Text className={`font-medium ${
                  mergedContributorData.status === 'Active' ? 'text-green-600' : 
                  mergedContributorData.status === 'Pending' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {mergedContributorData.status || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Recent Activity */}
          <View className="mx-4 mt-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold">Recent Activity</Text>
              <TouchableOpacity onPress={navigateToTransactions}>
                <Text className="text-blue-600">View all</Text>
              </TouchableOpacity>
            </View>
            
            {/* Activity List */}
            {transactionsLoading ? (
              <ActivityIndicator size="small" color="#0066FF" />
            ) : transactions.length === 0 ? (
              <View className="py-4">
                <Text className="text-gray-500 text-center italic">No transactions found</Text>
              </View>
            ) : (
              transactions.slice(0, 5).map((transaction) => (
                <View key={transaction.id} className="mb-3 pb-2 border-b border-gray-100">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-medium">{transaction.name}</Text>
                    <Text className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {getTransactionAmount(transaction)}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">{transaction.date} • {transaction.timestamp}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        
        {/* Bottom Button */}
        <View className="p-4">
          <TouchableOpacity 
            onPress={handleSendReminder}
            className="bg-blue-600 p-4 rounded-xl items-center flex-row justify-center"
          >
            <Ionicons name="notifications-outline" size={22} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">Send Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Reminder Sent Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={reminderModalVisible}
          onRequestClose={closeReminderModal}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white rounded-xl w-10/12 p-6 relative">
              <Text className="text-blue-600 text-2xl font-bold text-center border-b border-gray-200 pb-4 mb-4">Reminder Sent!</Text>
              <Text className="text-center text-gray-700 text-base mb-6">
                A reminder has been sent to <Text className="font-medium">{displayName}</Text> via SMS to not forget to contribute today.
              </Text>
              
              {/* Close Button */}
              <TouchableOpacity 
                className="bg-blue-600 py-3 rounded-2xl absolute -bottom-[16px] left-[30%] "
                style={{ width: '40%' }} // Adjust width and height as needed
                onPress={closeReminderModal}
              >
                <Text className="text-white font-semibold text-center ">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}; 