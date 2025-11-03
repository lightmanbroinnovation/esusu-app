import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, FlatList, SafeAreaView, Modal, ActivityIndicator, Alert, ScrollView, RefreshControl, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Footer from '../components/Footer';
import { getCustomers, fetchGroupedContributors, fetchGroupedContributorPhotos } from '../../services/api';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from '../components/EsusuLoader';
import NetInfo from '@react-native-community/netinfo';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';
import { useBackButtonHandler } from '../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton

// Define the Contributor type
export interface Contributor {
  id: string;
  agentName: string;
  agentId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  ninNumber: string;
  language: string;
  depositAmount: string;
  frequency: string;
  startDate: string;
  endDate: string;
  durationValue: number;
  photoUri: string;
  status?: string; // Added status field
  balance?: string; // Added balance field
}

// Define a union type for frequency keys
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'Other';

const fetchContributorsData = async () => {
  try {
    console.log('Fetching grouped contributor photos');
    const groups = await fetchGroupedContributorPhotos();
    console.log('Raw groups data:', JSON.stringify(groups, null, 2));
    
    // Transform the response to { daily: [photoUri, ...], weekly: [...], monthly: [...] }
    const transformed: { [key: string]: string[] } = {};
    const titles: { [key: string]: string } = {};
    
    ['daily', 'weekly', 'monthly'].forEach(group => {
      if (groups[group] && groups[group].contributors) {
        // Extract photo URLs from contributors
        transformed[group] = groups[group].contributors
          .filter((c: any) => c.photo && c.photo.trim() !== '')
          .map((c: any) => c.photo);
        titles[group] = groups[group].title || group.charAt(0).toUpperCase() + group.slice(1);
      } else {
        transformed[group] = [];
        titles[group] = group.charAt(0).toUpperCase() + group.slice(1);
      }
    });
    
    console.log('Transformed data:', JSON.stringify(transformed, null, 2));
    return { transformed, titles };
  } catch (error: any) {
    if (error.response) {
      console.error('Server error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from server:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw new Error("Unable to load contributor photos. Please try again later.");
  }
};

export default function ContributorsScreen() {
  const [groupedPhotos, setGroupedPhotos] = useState<Record<string, string[]>>({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [groupTitles, setGroupTitles] = useState<Record<string, string>>({
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('ContributorsScreen', 15);

  const router = useRouter();
  
  // Use back button handler for contributors screen
  useBackButtonHandler('/contributors');
  const dispatch = useDispatch();
  const [allContributors, setAllContributors] = useState<Contributor[]>([]);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [currentDuration, setCurrentDuration] = useState<string>('');

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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

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
    let cacheData: Record<string, any[]> | null = null;
    
    try {
      const cached = await AsyncStorage.getItem('contributors_data');
      if (cached) {
        cacheData = JSON.parse(cached);
        // Set groupedPhotos and groupTitles from cache if possible
        if (cacheData && typeof cacheData === 'object' && 'transformed' in cacheData && 'titles' in cacheData && 
            Array.isArray((cacheData as any).transformed.daily) && Array.isArray((cacheData as any).transformed.weekly) && Array.isArray((cacheData as any).transformed.monthly)) {
          // New cache format
          setGroupedPhotos((cacheData as any).transformed);
          setGroupTitles((cacheData as any).titles);
        } else {
          // Old cache format
          const transformed: Record<string, string[]> = {};
          const titles: Record<string, string> = {};
          (['daily', 'weekly', 'monthly'] as const).forEach(group => {
            if (cacheData && cacheData[group]) {
              const groupData: any = cacheData[group];
              if (Array.isArray(groupData)) {
                // Old cache format: array of contributors
                transformed[group] = groupData.map((c: any) => c.photo);
              } else if (typeof groupData === 'object' && groupData !== null && Array.isArray((groupData as any).contributors)) {
                // New cache format: object with contributors array
                transformed[group] = (groupData as any).contributors.map((c: any) => c.photo);
              } else {
                transformed[group] = [];
              }
            } else {
              transformed[group] = [];
            }
            titles[group] = group.charAt(0).toUpperCase() + group.slice(1);
          });
          setGroupedPhotos(transformed);
          setGroupTitles(titles);
        }
      }
    } catch {}
    
    if (!networkAvailable && cacheData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    if (fromRefresh) {
      await invalidateCache('contributors_data');
    }
    
    try {
      // Record the fetch attempt
      fetchGuard.recordFetch();
      
      const data = await getCachedData('contributors_data', fetchContributorsData);
      console.log('Fetched data:', JSON.stringify(data, null, 2));
      
      if (data && typeof data === 'object' && 'transformed' in data && 'titles' in data && 
          Array.isArray((data as any).transformed.daily) && Array.isArray((data as any).transformed.weekly) && Array.isArray((data as any).transformed.monthly)) {
        // New format: data contains transformed and titles
        setGroupedPhotos((data as any).transformed);
        setGroupTitles((data as any).titles);
      } else {
        // Fallback for old format
        const transformed: Record<string, string[]> = {};
        const titles: Record<string, string> = {};
        (['daily', 'weekly', 'monthly'] as const).forEach(group => {
          if (data && typeof data === 'object' && group in data) {
            const groupData: any = (data as any)[group];
            if (Array.isArray(groupData)) {
              // Old format: array of contributors
              transformed[group] = groupData.map((c: any) => c.photo);
            } else if (typeof groupData === 'object' && groupData !== null && Array.isArray((groupData as any).contributors)) {
              // New format: object with contributors array
              transformed[group] = (groupData as any).contributors.map((c: any) => c.photo);
            } else {
              transformed[group] = [];
            }
          } else {
            transformed[group] = [];
          }
          titles[group] = group.charAt(0).toUpperCase() + group.slice(1);
        });
        setGroupedPhotos(transformed);
        setGroupTitles(titles);
      }
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load contributors data.');
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

  const navigateBack = () => {
    router.back();
  };

  const navigateToContributorList = () => {
    const contributorIds = allContributors.map((contributor) => contributor.id); // Extract contributor IDs
    const duration = "12 Months"; // Example duration
    router.push({
      pathname: '/contributors/ContributorListScreen',
      params: { contributorIds, duration }, // Pass contributorIds and duration as params
    });
  };

  // Reminder modal functions
  const openReminderModal = async (duration: string) => {
    setCurrentDuration(duration);
    setReminderModalVisible(true);
    const name = duration.charAt(0).toUpperCase() + duration.slice(1);
    await sendNotification(
      NotificationTemplates.contributor.reminder(name).title,
      NotificationTemplates.contributor.reminder(name).body,
      NotificationTemplates.contributor.reminder(name).type
    );
  };

  const closeReminderModal = () => {
    setReminderModalVisible(false);
  };

  // Get dynamic reminder message based on duration
  const getReminderMessage = () => {
    switch (currentDuration.toLowerCase()) {
      case 'daily':
        return 'A reminder has been sent to all daily contributors via SMS to not forget to contribute today.';
      case 'weekly':
        return 'A reminder has been sent to all weekly contributors via SMS to not forget to contribute this week.';
      case 'monthly':
        return 'A reminder has been sent to all monthly contributors via SMS to not forget to contribute this month.';
      case 'yearly':
        return 'A reminder has been sent to all yearly contributors via SMS to not forget to contribute this year.';
      default:
        return `A reminder has been sent to all ${currentDuration} contributors via SMS to not forget to contribute.`;
    }
  };

  // Define titles and descriptions based on frequency
  const frequencyDetails: Record<Frequency, { title: string; description: string }> = {
    daily: {
      title: "Daily Contributors",
      description: "Contributors who save every day.",
    },
    weekly: {
      title: "Weekly Contributors",
      description: "Contributors who save every week.",
    },
    monthly: {
      title: "Monthly Contributors",
      description: "Contributors who save once a month.",
    },
    yearly: {
      title: "Yearly Contributors",
      description: "Contributors who save once a year.",
    },
    Other: {
      title: "Other Contributors",
      description: "Contributors with unspecified frequency.",
    },
  };

  const handleCardPress = (duration: string) => {
    const filteredContributors = allContributors
      .filter(contributor => contributor.frequency === duration);

    console.log("Navigating to ContributorListScreen with Duration:", duration);
    console.log("Filtered Contributors:", filteredContributors);

    router.push({
      pathname: '/contributors/ContributorListScreen',
      params: { duration }
    });
  };

  const frequencyTypes = Object.keys(frequencyDetails) as Frequency[];

  // Subtitles for each group
  const groupSubtitles: { [key: string]: string } = {
    daily: 'Contributors who save every day.',
    weekly: 'Contributors who save every week.',
    monthly: 'Contributors who save once a month',
    yearly: 'Contributors who save once a year.'
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: '#4B5563',
    },
    retryButton: {
      marginTop: 16,
      padding: 12,
      backgroundColor: '#3B82F6',
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#FFFFFF',
    },
    scrollContent: {
      flex: 1,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
      borderRadius: 999,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      flex: 1,
    },
    card: {
      backgroundColor: '#232335',
      borderRadius: 24,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    cardTitle: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    cardSubtitle: {
      color: '#B0B0C3',
      fontSize: 15,
      marginBottom: 16,
    },
    photosRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    photoImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: '#EEEEEE',
    },
    photoOverlay: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2D2D44',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    photoOverlayText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    reminderButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    reminderButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
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
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  if (loading) {
    return <EsusuLoader />;
  }

  // Do NOT show a 'no network' error. Always display the contributors data, even if offline.
  // Only show error if there is truly no data to display (e.g., error and no contributors at all)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header with Back Arrow */}
          <View style={styles.header}>
            <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contributor</Text>
          </View>
      
          {/* Grouped Contributor Cards */}
          {['daily', 'weekly', 'monthly', 'yearly'].map(group => (
              <TouchableOpacity 
              key={group}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/contributors/ContributorListScreen', params: { group } })}
              style={{
                backgroundColor: '#232335',
                borderRadius: 24,
                padding: 20,
                marginBottom: 24,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
                {groupTitles[group] || group.charAt(0).toUpperCase() + group.slice(1) + ' Contributors'}
              </Text>
              <Text style={{ color: '#B0B0C3', fontSize: 15, marginBottom: 16 }}>
                {groupSubtitles[group] || ''}
              </Text>
              <View style={styles.photosRow}>
                {(groupedPhotos[group] || []).slice(0, 8).map((photoUri, idx) => (
                  <Image 
                    key={idx}
                    source={{ uri: photoUri }}
                    style={[
                      styles.photoImage,
                      { marginLeft: idx === 0 ? 0 : -14 }
                    ]}
                  />
                ))}
                {(groupedPhotos[group] || []).length > 8 && (
                  <View style={[styles.photoOverlay, { marginLeft: -14 }]}>
                    <Text style={styles.photoOverlayText}>
                      +{(groupedPhotos[group] || []).length - 8}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity 
                style={styles.reminderButton}
                onPress={e => {
                  e.stopPropagation();
                  openReminderModal(group);
                }}
              >
                <Ionicons name="notifications" size={22} color="#5FF3E2" style={{ marginRight: 8 }} />
                <Text style={styles.reminderButtonText}>Send Reminder</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <Footer />

      {/* Reminder Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={reminderModalVisible} 
        onRequestClose={closeReminderModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Reminder Sent!
            </Text>
            <Text style={styles.modalText}>
              {getReminderMessage()}
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
    </SafeAreaView>
  );
};
