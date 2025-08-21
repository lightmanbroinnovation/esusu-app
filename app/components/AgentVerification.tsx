import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchUser } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import { fetchAgentVerificationData } from '../../services/api';
import EsusuLoader from './EsusuLoader';
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';

interface User {
  firstname: string;
  lastname: string;
  email: string;
  id: string;
  userImg?: string;
}

export default function AgentVerification() {
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('AgentVerification', 15);

  const router = useRouter();
  const params = useLocalSearchParams();
  const [userData, setUserData] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID from AsyncStorage when component mounts
  useEffect(() => {
    const getUserId = async () => {
      try {
        setLoading(true);
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          setError('User ID not found. Please log in again.');
          return;
        }
        
        setUserId(storedUserId);
        console.log('Retrieved user ID from storage:', storedUserId);
      } catch (error) {
        console.error('Error retrieving user ID:', error);
        setError('Failed to retrieve user ID. Please try again.');
      }
    };
    
    getUserId();
  }, []);

  // Fetch user details when userId is available
  useEffect(() => {
    if (!userId) return;
    
    const fetchUserDetails = async () => {
      try {
        console.log('Fetching user details for ID:', userId);
        const data = await fetchUser(userId);
        setUserData(data);
        console.log('User details fetched successfully:', data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to fetch user details. Please try again.');
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const navigateBack = () => {
    router.back();
  };

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

  const handleNext = () => {
    if (userData) {
      const agentName = `${userData.firstname} ${userData.lastname}`;
      const agentId = userData.id;

      // Log the image URLs we're passing
      console.log('AGENT VERIFICATION - IMAGE DATA:', JSON.stringify({
        photoUri: params.photoUri,
        imageUrl: params.imageUrl,
        isCloudinaryUrl: params.isCloudinaryUrl,
        allParams: params
      }));

      // Navigate to the savings plan setup screen with all parameters
      router.push({
        pathname: '/contributor/savings-plan',
        params: {
          agentName,
          agentId,
          firstName: params.firstName,
          lastName: params.lastName,
          phoneNumber: params.phoneNumber,
          ninNumber: params.ninNumber,
          language: params.language,
          photoUri: params.photoUri || '',
          imageUrl: params.imageUrl || '',
          isCloudinaryUrl: params.isCloudinaryUrl || 'false'
        }
      });
    }
  };

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
      const cached = await AsyncStorage.getItem('agent_verification');
      if (cached) {
        cacheData = JSON.parse(cached);
        setVerificationData(cacheData);
      }
    } catch {}
    
    if (!networkAvailable && cacheData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    if (fromRefresh) {
      await invalidateCache('agent_verification');
    }
    
    try {
      // Record the fetch attempt
      fetchGuard.recordFetch();
      
      const data = await getCachedData('agent_verification', fetchAgentVerificationData);
      setVerificationData(data);
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load verification data');
        setVerificationData(null);
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4">
          <TouchableOpacity 
            onPress={navigateBack}
            className="bg-gray-100 p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">Add New User</Text>
          <View style={{width: 40}} />
        </View>

        <View className="flex-1 px-4">
          {/* Title */}
          <Text className="text-3xl font-bold text-[#0052CC] mt-4">Confirm Your Identity</Text>
          <Text className="text-gray-700 mb-8 mt-2">
            Before completing this onboarding, we need to verify your identity as the agent responsible.
          </Text>
          
          {loading ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color="#0052CC" />
              <Text className="mt-4 text-gray-600">Loading your information...</Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-10">
              <Text className="text-red-500 text-center mb-4">{error}</Text>
              <TouchableOpacity 
                onPress={handleRetry}
                className="bg-blue-600 px-6 py-2 rounded-md"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form Fields */
            <View className="space-y-6">
              {/* Agent Name */}
              <View>
                <Text className="text-gray-700 mb-1">Agent Name</Text>
                <TextInput
                  value={userData ? `${userData.firstname} ${userData.lastname}` : ''}
                  className="bg-gray-100 p-4 rounded-xl"
                  editable={false}
                />
              </View>
              
              {/* Agent ID */}
              <View>
                <Text className="text-gray-700 mb-1">Agent ID</Text>
                <TextInput
                  value={userData ? userData.id : ''}
                  className="bg-gray-100 p-4 rounded-xl"
                  editable={false}
                />
              </View>
            </View>
          )}
        </View>
        
        {/* Bottom Button */}
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity 
            onPress={handleNext}
            className={`${userData ? 'bg-blue-600' : 'bg-gray-400'} p-4 rounded-xl items-center`}
            disabled={loading || !!error || !userData}
          >
            <Text className="text-white font-semibold text-lg">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}; 