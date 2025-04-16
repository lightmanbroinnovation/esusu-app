import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, SafeAreaView, Modal, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Footer from '../components/Footer';
import { fetchContributors } from '../../services/api';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

// Define a union type for frequency keys
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'Other';

const ContributorsScreen = () => {
  const router = useRouter();
  const [allContributors, setAllContributors] = useState<Contributor[]>([]); // Store all contributors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
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

  // Fetch contributors when user ID is available
  useEffect(() => {
    if (!userId) return;
    
    const getContributors = async () => {
      try {
        console.log('Fetching contributors for agent ID:', userId);
        const contributors = await fetchContributors(userId);
        setAllContributors(contributors);
        setError(null);
      } catch (error) {
        console.error("Error fetching contributors:", error);
        setError("Unable to load contributors. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    getContributors();
  }, [userId]);

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
  const openReminderModal = (duration: string) => {
    setCurrentDuration(duration);
    setReminderModalVisible(true);
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
    const contributorIds = allContributors
      .filter(contributor => contributor.frequency === duration)
      .map(contributor => contributor.id); // Extract IDs

    console.log("Navigating to ContributorListScreen with Duration:", duration); // Log duration
    console.log("Contributor IDs:", contributorIds); // Log contributor IDs

    // Pass the selected duration and contributor IDs to the next page
    router.push({
      pathname: '/contributors/ContributorListScreen',
      params: { duration, contributorIds }, // Ensure this is structured correctly
    });
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4 mt-2">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={navigateBack} className="bg-gray-100 p-2 rounded-full mr-4">
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold flex-1 text-center mr-8">Commissions</Text>
          </View>
      
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0052CC" />
              <Text className="mt-4 text-gray-600">Loading contributors...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-red-500 text-center mb-4">{error}</Text>
              <TouchableOpacity 
                onPress={handleRetry}
                className="bg-blue-600 px-6 py-2 rounded-md"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }} // Add padding for footer
            >
              {Object.keys(frequencyDetails).map((duration) => {
                const { title, description } = frequencyDetails[duration as Frequency];
                const totalCount = allContributors.filter(contributor => contributor.frequency === duration).length; // Get total count for this duration
                return (
                  <TouchableOpacity
                    key={duration}
                    onPress={() => handleCardPress(duration)}
                    className="bg-primaryCard rounded-xl p-4 mb-4"
                  >
                    <Text className="text-lg font-semibold text-white">{title}</Text>
                    <Text className="text-white mb-2">{description}</Text>
                    <View className="flex-row mb-2 items-center">
                      {allContributors.filter(contributor => contributor.frequency === duration).slice(0, 3).map((contributor, index) => (
                        <View key={index} style={{ position: 'relative', marginLeft: index > 0 ? -15 : 0 }}>
                          <Image 
                            source={{ uri: contributor.photoUri }}
                            style={{ width: 40, height: 40, borderRadius: 20 }} 
                            className="rounded-full border border-white"
                          />
                        </View>
                      ))}
                      {totalCount > 3 && (
                        <Text className="text-white ml-2">+{totalCount - 3}</Text> // Show remaining count
                      )}
                    </View>
                    <TouchableOpacity 
                      className="bg-blue-600 p-2 rounded-lg mt-2 flex-row items-center justify-center"
                      onPress={() => openReminderModal(duration)}
                    >
                      <MaterialIcons name="notifications" size={20} color="#fff" />
                      <Text className="text-white text-center ml-2">Send Reminder</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
        <Footer />
      </SafeAreaView>

      {/* Reminder Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={reminderModalVisible} 
        onRequestClose={closeReminderModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl w-10/12 p-6 relative">
            <Text className="text-blue-600 text-2xl font-bold text-center border-b border-gray-200 pb-4 mb-4">
              Reminder Sent!
            </Text>
            <Text className="text-center text-gray-700 text-base mb-6">
              {getReminderMessage()}
            </Text>
            {/* Close Button */}
            <TouchableOpacity 
              className="bg-blue-600 py-3 rounded-2xl absolute -bottom-[16px] left-[30%]"
              style={{ width: '40%' }}
              onPress={closeReminderModal}
            >
              <Text className="text-white font-semibold text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ContributorsScreen;
