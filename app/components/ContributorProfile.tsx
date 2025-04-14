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
import { fetchContributors } from '../../services/api';
import { Contributor } from '../contributors/ContributorsScreen';

interface ContributorProfileProps {
  contributorId: string;
}

const ContributorProfile = ({ contributorId }: ContributorProfileProps) => {
  const router = useRouter();
  
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const getContributorData = async () => {
      try {
        // Fetch all contributors 
        const contributors = await fetchContributors("62f2");
        // Find the selected contributor by ID
        const selectedContributor = contributors.find(
          (c: Contributor) => c.id === contributorId
        );
        
        if (selectedContributor) {
          setContributor(selectedContributor);
        } else {
          setError("Contributor not found");
        }
      } catch (err) {
        console.error("Error fetching contributor:", err);
        setError("Failed to load contributor data");
      } finally {
        setLoading(false);
      }
    };

    if (contributorId) {
      getContributorData();
    } else {
      setError("No contributor ID provided");
      setLoading(false);
    }
  }, [contributorId]);

  const navigateBack = () => {
    router.back();
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

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="mt-2">Loading contributor data...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !contributor) {
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

  return (
    <SafeAreaView className="flex-1 bg-white">
    <View className="flex-1 px-4 mt-2">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={navigateBack} className="bg-gray-100 p-2 rounded-full mr-4">
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">
            {contributor.firstName} {contributor.lastName}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1">
          {/* Profile Card */}
          <View className="bg-blue-600 rounded-xl p-4">
            {/* Profile Image and Balance */}
            <View className="items-center mb-4">
              <Image 
                source={{ uri: contributor.photoUri }}
                className="w-20 h-20 rounded-full"
              />
              <Text className="text-white text-sm mt-2">Total Contributions Made</Text>
              <Text className="text-white text-3xl font-bold">₦{contributor.depositAmount}</Text>
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
                <Text className="font-medium">{formatDate(contributor.startDate)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">End Date</Text>
                <Text className="font-medium">{formatDate(contributor.endDate)}</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Frequency</Text>
                <Text className="font-medium">₦{contributor.depositAmount} {contributor.frequency}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Days Left</Text>
                <Text className="font-medium">
                  {calculateDaysLeft(contributor.startDate, contributor.endDate)}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Language</Text>
                <Text className="font-medium">{contributor.language}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Status</Text>
                <Text className={`font-medium ${
                  contributor.status === 'Active' ? 'text-green-600' : 
                  contributor.status === 'Pending' ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {contributor.status}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Recent Activity */}
          <View className="mx-4 mt-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold">Recent Activity</Text>
              <TouchableOpacity>
                <Text className="text-blue-600">View all</Text>
              </TouchableOpacity>
            </View>
            
            {/* Activity List */}
            <View className="mb-3">
              <View className="flex-row justify-between items-center">
                <Text className="font-medium">Deposited</Text>
                <Text className="text-green-600 font-semibold">₦5,000</Text>
              </View>
              <Text className="text-gray-500 text-sm">14 March 2025 12:03 AM</Text>
            </View>
            
            <View className="mb-3">
              <View className="flex-row justify-between items-center">
                <Text className="font-medium">Withdraw</Text>
                <Text className="text-red-600 font-semibold">-₦10,000</Text>
              </View>
              <Text className="text-gray-500 text-sm">10 March 2025 12:03 AM</Text>
            </View>
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
                A reminder has been sent to <Text className="font-medium">{contributor.firstName} {contributor.lastName}</Text> via SMS to not forget to contribute today.
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