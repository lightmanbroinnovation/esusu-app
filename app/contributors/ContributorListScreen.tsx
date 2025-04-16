import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Contributor } from './ContributorsScreen';
import { fetchContributors } from '../../services/api';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';


const ContributorListScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Extract duration and contributorIds from params
  const duration = params.duration as string || "Unknown";
  
  // Parse contributorIds from the URL parameters
  let contributorIds: string[] = [];
  if (params.contributorIds) {
    if (typeof params.contributorIds === 'string') {
      contributorIds = params.contributorIds.split(',');
    } else if (Array.isArray(params.contributorIds)) {
      contributorIds = params.contributorIds;
    }
  }

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch contributors when user ID is available
  useEffect(() => {
    if (!userId) return;
    
    const getContributors = async () => {
      try {
        console.log('Fetching contributors for agent ID:', userId);
        const allContributors = await fetchContributors(userId);
        
        // Filter contributors based on their IDs
        const filteredContributors = allContributors.filter((contributor: Contributor) => 
          contributorIds.includes(contributor.id)
        );
        
        setContributors(filteredContributors);
        setError(null);
      } catch (err) {
        console.error("Error fetching contributors:", err);
        setError("Failed to load contributors.");
      } finally {
        setLoading(false);
      }
    };

    getContributors();
  }, [userId, contributorIds]);

  // Handle retry button press
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Try to fetch the user ID again
    const getUserId = async () => {
      try {
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
  };

  // Helper function to get status color based on contributor status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'overdue':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Add this function to handle contributor selection
  const handleContributorPress = async (contributor: Contributor) => {
    try {
      // Store complete contributor data in AsyncStorage for profile page to access
      await AsyncStorage.setItem('selectedContributor', JSON.stringify(contributor));
      
      // Navigate to profile with more complete data
      router.push({
        pathname: '/contributor/profile',
        params: { 
          contributorId: contributor.id,
          firstName: contributor.firstName,
          lastName: contributor.lastName,
          phoneNumber: contributor.phoneNumber || '',
          depositAmount: contributor.depositAmount?.toString() || '',
          frequency: contributor.frequency || '',
          photoUri: contributor.photoUri || '',
          status: contributor.status || 'active'
        }
      });
    } catch (error) {
      console.error('Error navigating to profile:', error);
      Alert.alert('Error', 'Could not open contributor profile');
    }
  };
  
  // Filter contributors based on search query
  const filteredContributors = contributors.filter(contributor => {
    const fullName = `${contributor.firstName} ${contributor.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <View className="flex-1 bg-white">
        <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      {/* Header */}
      <View className="flex-row items-center mt-2 justify-between px-4 pb-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-100 p-2 rounded-full mr-4">
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
        <Text className="text-xl font-semibold">Commission</Text>
        <TouchableOpacity onPress={() => setShowStatusModal(true)}>
          <Ionicons name="help-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 h-10 ml-2 text-gray-800"
            placeholder="Search by name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contributors list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0052CC" />
          <Text className="mt-4 text-gray-600">Loading contributors...</Text>
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
        <FlatList
          data={filteredContributors}
          keyExtractor={(item) => item.id}
          renderItem={({ item: contributor }) => (
            <TouchableOpacity 
              className="flex-row items-center border-b border-gray-200 pb-4 mb-4 bg-white p-2" 
              onPress={() => handleContributorPress(contributor)}
            >
              <Image
                source={{ uri: contributor.photoUri }}
                style={{ width: 60, height: 60, borderRadius: 30 }}
                className="mr-3"
              />
              <View className="flex-1">
                <Text className="text-lg font-bold">{contributor.firstName} {contributor.lastName}</Text>
                <View className="flex-row justify-between mt-1">
                  <View>
                    <Text className="text-gray-500">Balance</Text>
                    <Text className="font-semibold">₦{contributor.depositAmount}</Text>
                  </View>
                  <View>
                    <Text className="text-gray-500">Next Due Date</Text>
                    <Text className="font-semibold">{new Date(contributor.startDate).toLocaleDateString('en-GB')}</Text>
                  </View>
                  <View>
                    <Text className="text-gray-500">Status</Text>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(contributor.status || 'unknown')}`}>
                      <Text className="text-center">{contributor.status || 'Unknown'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-4">
              {searchQuery.length > 0 
                ? `No contributors found matching "${searchQuery}"`
                : "No contributors found for this duration."}
            </Text>
          }
          onRefresh={handleRetry}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Status indicators modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showStatusModal}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white w-4/5 rounded-lg p-6">
            <Text className="text-2xl font-bold text-blue-500 mb-4 text-center">Coded Status Indicators</Text>
            <View className="border-t border-gray-200 pt-4">
              <View className="flex-row items-center mb-4">
                <View className="w-4 h-4 rounded-full bg-green-500 mr-3" />
                <View>
                  <Text className="text-lg font-semibold">Active</Text>
                  <Text className="text-gray-600">Recently contributed</Text>
                </View>
              </View>
              
              <View className="flex-row items-center mb-4">
                <View className="w-4 h-4 rounded-full bg-yellow-500 mr-3" />
                <View>
                  <Text className="text-lg font-semibold">Pending</Text>
                  <Text className="text-gray-600">Due for contribution</Text>
                </View>
              </View>
              
              <View className="flex-row items-center mb-8">
                <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
                <View>
                  <Text className="text-lg font-semibold">Pending</Text>
                  <Text className="text-gray-600">Missed contributions</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              className="bg-blue-600 py-3 rounded-2xl absolute -bottom-[16px] left-[30%]"
              style={{ width: '40%' }}
              onPress={() => setShowStatusModal(false)}
            >
              <Text className="text-white font-semibold text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ContributorListScreen;