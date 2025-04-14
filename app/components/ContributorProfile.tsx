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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchContributors, fetchContributorTransactions } from '../../services/api';
import { Contributor } from '../contributors/ContributorsScreen';

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
}

const ContributorProfile = ({ contributorId, firstName: propFirstName, lastName: propLastName, imageUrl: propImageUrl }: ContributorProfileProps) => {
  const router = useRouter();
  
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Use props or fallback to API data
  const displayName = contributor ? 
    `${contributor.firstName} ${contributor.lastName}` : 
    (propFirstName && propLastName) ? 
    `${propFirstName} ${propLastName}` : 
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
  const imageSource = getValidImageUri(propImageUrl || contributor?.photoUri);

  // Generate initials for the fallback avatar
  const getInitials = () => {
    const first = propFirstName || contributor?.firstName || '';
    const last = propLastName || contributor?.lastName || '';
    
    const firstInitial = first.length > 0 ? first[0].toUpperCase() : '';
    const lastInitial = last.length > 0 ? last[0].toUpperCase() : '';
    
    return `${firstInitial}${lastInitial}`;
  };

  // Get a random background color based on the contributor's name
  const getAvatarColor = () => {
    const name = `${propFirstName || contributor?.firstName || ''}${propLastName || contributor?.lastName || ''}`;
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

  useEffect(() => {
    const getContributorData = async () => {
      try {
        // If we already have first name, last name, and image from props,
        // we can skip the API call or set loading to false
        if (propFirstName && propLastName && propImageUrl) {
          setLoading(false);
          // We can still fetch the other details in the background
        }
        
        // Fetch all contributors 
        const contributors = await fetchContributors("62f2");
        // Find the selected contributor by ID
        const selectedContributor = contributors.find(
          (c: Contributor) => c.id === contributorId
        );
        
        if (selectedContributor) {
          setContributor(selectedContributor);
        } else {
          // Only show error if we don't have prop data to display
          if (!(propFirstName && propLastName)) {
            setError("Contributor not found");
          }
        }
      } catch (err) {
        console.error("Error fetching contributor:", err);
        // Only show error if we don't have prop data to display
        if (!(propFirstName && propLastName)) {
          setError("Failed to load contributor data");
        }
      } finally {
        setLoading(false);
      }
    };

    if (contributorId) {
      getContributorData();
    } else {
      // Only show error if we don't have prop data to display
      if (!(propFirstName && propLastName)) {
        setError("No contributor ID provided");
      }
      setLoading(false);
    }
  }, [contributorId, propFirstName, propLastName, propImageUrl]);

  // Fetch transactions for the contributor
  useEffect(() => {
    const getTransactions = async () => {
      if (!contributorId) return;
      
      setTransactionsLoading(true);
      try {
        const transactionData = await fetchContributorTransactions(contributorId);
        setTransactions(transactionData);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setTransactionsLoading(false);
      }
    };

    getTransactions();
  }, [contributorId]);

  const navigateBack = () => {
  router.push('/dashboard');
  };

  const navigateToTransactions = () => {
    router.push({
      pathname: '/contributor/transactions',
      params: { 
        contributorId,
        contributorName: displayName
      }
    });
  };

  const handleDeposit = () => {
    console.log('Make a deposit');
  };

  const handleWithdraw = () => {
    console.log('Withdraw funds');
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
  if (loading && !(propFirstName && propLastName)) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="mt-2">Loading contributor data...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !(propFirstName && propLastName)) {
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
  const contributorData = {
    firstName: propFirstName || contributor?.firstName || '',
    lastName: propLastName || contributor?.lastName || '',
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
          <View className="bg-blue-600 rounded-xl p-4">
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
              <Text className="text-white text-3xl font-bold">₦{contributorData.depositAmount}</Text>
            </View>
            
            {/* Action Buttons */}
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="bg-black rounded-lg flex-row items-center justify-center px-6 py-3 flex-1 mr-2"
                onPress={handleDeposit}
              >
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
                <Text className="font-medium">{formatDate(contributorData.startDate)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">End Date</Text>
                <Text className="font-medium">{formatDate(contributorData.endDate)}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Frequency</Text>
                <Text className="font-medium">₦{contributorData.depositAmount} {contributorData.frequency}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Days Left</Text>
                <Text className="font-medium">
                  {calculateDaysLeft(contributorData.startDate, contributorData.endDate)} days
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Language</Text>
                <Text className="font-medium">{contributorData.language}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Status</Text>
                <Text className={`font-medium ${
                  contributorData.status === 'Active' ? 'text-green-600' : 
                  contributorData.status === 'Pending' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {contributorData.status || 'N/A'}
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

export default ContributorProfile; 