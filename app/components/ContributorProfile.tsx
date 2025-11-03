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
  Alert,
  StyleSheet
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
        return '#16A34A';
      case 'withdrawal':
        return '#DC2626';
      default:
        return '#4B5563';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 40,
    },
    backButton: {
      backgroundColor: '#F3F4F6',
      padding: 8,
      borderRadius: 999,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    profileCard: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    },
    profileContent: {
      zIndex: 1,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 999,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
    },
    contributionsLabel: {
      color: '#FFFFFF',
      fontSize: 14,
      marginTop: 8,
    },
    contributionsValue: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: 'bold',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    depositButton: {
      backgroundColor: '#000000',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      flex: 1,
      marginRight: 8,
    },
    withdrawButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      flex: 1,
      marginLeft: 8,
    },
    buttonText: {
      color: '#FFFFFF',
      marginLeft: 8,
    },
    withdrawButtonText: {
      color: '#2563EB',
      marginLeft: 8,
    },
    noticeBox: {
      backgroundColor: '#EFF6FF',
      marginTop: 16,
      borderRadius: 8,
      padding: 16,
    },
    noticeTitle: {
      color: '#3B82F6',
      fontWeight: '500',
    },
    noticeText: {
      color: '#3B82F6',
      fontSize: 14,
    },
    detailsContainer: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      color: '#6B7280',
      fontSize: 14,
    },
    detailValue: {
      fontWeight: '500',
    },
    statusValue: {
      fontWeight: '500',
    },
    statusActive: {
      fontWeight: '500',
      color: '#16A34A',
    },
    statusPending: {
      fontWeight: '500',
      color: '#CA8A04',
    },
    statusInactive: {
      fontWeight: '500',
      color: '#DC2626',
    },
    activityContainer: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 16,
    },
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    activityTitle: {
      fontWeight: '600',
    },
    viewAllText: {
      color: '#2563EB',
    },
    activityList: {
      paddingVertical: 16,
    },
    activityEmptyText: {
      color: '#6B7280',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    activityItem: {
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    activityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    activityName: {
      fontWeight: '500',
    },
    activityAmount: {
      fontWeight: '600',
    },
    activityDate: {
      color: '#6B7280',
      fontSize: 14,
    },
    bottomButton: {
      padding: 16,
    },
    reminderButton: {
      backgroundColor: '#2563EB',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    reminderButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 18,
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      width: '83.333333%',
      padding: 24,
      position: 'relative',
    },
    modalTitle: {
      color: '#2563EB',
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      paddingBottom: 16,
      marginBottom: 16,
    },
    modalText: {
      textAlign: 'center',
      color: '#374151',
      fontSize: 16,
      marginBottom: 24,
    },
    modalBoldText: {
      fontWeight: '500',
    },
    modalCloseButton: {
      backgroundColor: '#2563EB',
      paddingVertical: 12,
      borderRadius: 16,
      position: 'absolute',
      bottom: -16,
      left: '30%',
      width: '40%',
    },
    modalCloseButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 8,
    },
    errorContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
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
  });

  // Loading state
  if (loading && !(params.firstName && params.lastName)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading contributor data...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !(params.firstName && params.lastName)) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="red" />
        <Text style={styles.errorText}>{error || "Failed to load contributor"}</Text>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={navigateBack}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {displayName}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
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
            <View style={styles.profileContent}>
              {/* Profile Image and Balance */}
              <View style={styles.profileHeader}>
                {imageSource ? (
                  <Image
                    source={imageSource}
                    style={styles.profileImage}
                    onError={(e) => {
                      console.error('Error loading image:', e.nativeEvent.error);
                      setImageLoadError(true);
                    }}
                  />
                ) : (
                  <View 
                    style={[styles.avatarPlaceholder, { backgroundColor: getAvatarColor() }]}
                  >
                    <Text style={styles.avatarText}>{getInitials()}</Text>
                  </View>
                )}
                <Text style={styles.contributionsLabel}>Total Contributions Made</Text>
                <Text style={styles.contributionsValue}>₦{mergedContributorData.depositAmount}</Text>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity onPress={handleDeposit} style={styles.depositButton}>
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={styles.buttonText}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.withdrawButton}
                  onPress={handleWithdraw}
                >
                  <Ionicons name="remove-circle-outline" size={20} color="#0066FF" />
                  <Text style={styles.withdrawButtonText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Agent Notice */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>Important Notice for Agents</Text>
            <Text style={styles.noticeText}>
              As an agent, you do not have access to withdraw or control a contributor's funds—only the 
              contributor can initiate payouts securely.
            </Text>
          </View>

          {/* Savings Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>{formatDate(mergedContributorData.startDate)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>{formatDate(mergedContributorData.endDate)}</Text>
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Frequency</Text>
                <Text style={styles.detailValue}>₦{mergedContributorData.depositAmount} {mergedContributorData.frequency}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Days Left</Text>
                <Text style={styles.detailValue}>
                  {calculateDaysLeft(mergedContributorData.startDate, mergedContributorData.endDate)} days
                </Text>
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Language</Text>
                <Text style={styles.detailValue}>{mergedContributorData.language}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[
                  styles.statusValue,
                  mergedContributorData.status === 'Active' ? styles.statusActive : 
                  mergedContributorData.status === 'Pending' ? styles.statusPending : 
                  styles.statusInactive
                ]}>
                  {mergedContributorData.status || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Recent Activity */}
          <View style={styles.activityContainer}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={navigateToTransactions}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            
            {/* Activity List */}
            {transactionsLoading ? (
              <ActivityIndicator size="small" color="#0066FF" />
            ) : transactions.length === 0 ? (
              <View style={styles.activityList}>
                <Text style={styles.activityEmptyText}>No transactions found</Text>
              </View>
            ) : (
              transactions.slice(0, 5).map((transaction) => (
                <View key={transaction.id} style={styles.activityItem}>
                  <View style={styles.activityRow}>
                    <Text style={styles.activityName}>{transaction.name}</Text>
                    <Text style={[styles.activityAmount, { color: getTransactionColor(transaction.type) }]}>
                      {getTransactionAmount(transaction)}
                    </Text>
                  </View>
                  <Text style={styles.activityDate}>{transaction.date} • {transaction.timestamp}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        
        {/* Bottom Button */}
        <View style={styles.bottomButton}>
          <TouchableOpacity 
            onPress={handleSendReminder}
            style={styles.reminderButton}
          >
            <Ionicons name="notifications-outline" size={22} color="white" />
            <Text style={styles.reminderButtonText}>Send Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Reminder Sent Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={reminderModalVisible}
          onRequestClose={closeReminderModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reminder Sent!</Text>
              <Text style={styles.modalText}>
                A reminder has been sent to <Text style={styles.modalBoldText}>{displayName}</Text> via SMS to not forget to contribute today.
              </Text>
              
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={closeReminderModal}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}; 