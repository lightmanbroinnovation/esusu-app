import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 999,
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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0052CC',
    marginTop: 16,
  },
  subtitle: {
    color: '#374151',
    marginBottom: 32,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#4B5563',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formContainer: {
    marginTop: 24,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  bottomButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonEnabled: {
    backgroundColor: '#2563EB',
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
});

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
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={navigateBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New User</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>Confirm Your Identity</Text>
          <Text style={styles.subtitle}>
            Before completing this onboarding, we need to verify your identity as the agent responsible.
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0052CC" />
              <Text style={styles.loadingText}>Loading your information...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                onPress={handleRetry}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form Fields */
            <View style={styles.formContainer}>
              {/* Agent Name */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Agent Name</Text>
                <TextInput
                  value={userData ? `${userData.firstname} ${userData.lastname}` : ''}
                  style={styles.textInput}
                  editable={false}
                />
              </View>
              
              {/* Agent ID */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Agent ID</Text>
                <TextInput
                  value={userData ? userData.id : ''}
                  style={styles.textInput}
                  editable={false}
                />
              </View>
            </View>
          )}
        </View>
        
        {/* Bottom Button */}
        <View style={styles.bottomButton}>
          <TouchableOpacity 
            onPress={handleNext}
            style={[
              styles.nextButton,
              userData ? styles.nextButtonEnabled : styles.nextButtonDisabled
            ]}
            disabled={loading || !!error || !userData}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}; 