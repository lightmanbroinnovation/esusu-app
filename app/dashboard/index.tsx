import React, { useState, useEffect } from 'react';
import { FlatList, SafeAreaView, Text, View, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import UserCard from '../components/UserCard';
import Footer from '../components/Footer';
import RecentActivity from '../components/RecentActivity';
import { Ionicons } from "@expo/vector-icons";
import VerificationController from '../verification/VerificationController';
import { useRouter } from 'expo-router';
import { fetchUser } from '../../services/api';
import LatestTransactions from '../components/LatestTransactions';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  firstname: string;
  email: string;
  id: string;
  balance: string,
  weeklyEarnings: string
}

// Dashboard item type for FlatList
interface DashboardItem {
  id: string;
  type: 'userCard' | 'newUser' | 'activity' | 'transactions';
}

const HomeScreen = () => {
  const router = useRouter();
  const [showVerification, setShowVerification] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        
        if (!isLoggedIn || !storedUserId) {
          // User is not logged in, redirect to login
          router.replace('/login');
          return;
        }
        
        // User is logged in, set the user ID
        setUserId(storedUserId);
      } catch (error) {
        console.error('Error checking login status:', error);
        // Use default ID as fallback
        setUserId('62f2');
      }
    };
    
    checkLoginStatus();
  }, []);

  // Fetch user data when userId is available
  useEffect(() => {
    if (!userId) return;
    
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchUser(userId);
        setUserData(data);
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  // Create data array for FlatList
  const dashboardItems: DashboardItem[] = [
    { id: 'userCard', type: 'userCard' },
    { id: 'newUser', type: 'newUser' },
    { id: 'activity', type: 'activity' },
    { id: 'transactions', type: 'transactions' }
  ];
  
  const renderItem = ({ item }: { item: DashboardItem }) => {
    switch(item.type) {
      case 'userCard':
        return userData ? <UserCard user={userData} /> : null;
      case 'newUser':
        return (
          <TouchableOpacity onPress={() => router.push("/contributor/add")}>
            <View className='flex-row justify-center items-center p-4 rounded-2xl mt-6 bg-[#E5F1FF]'>
              <Ionicons name="person-add-outline" size={24} color="#0052CC" className="mr-2" />
              <Text className="text-[#0052CC] font-medium">New User</Text>
            </View>
          </TouchableOpacity>
        );
      case 'activity':
        return (
          <RecentActivity onVerifyNow={() => router.push('/verification')} />
        );
      case 'transactions':
        return (
          <LatestTransactions transactions={transactions} />
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4 mt-4">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0052CC" />
              <Text className="mt-4 text-gray-600">Loading your dashboard...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center px-4">
              <Text className="text-red-500 mb-4">{error}</Text>
              <TouchableOpacity 
                className="bg-[#0052CC] px-6 py-3 rounded-lg"
                onPress={() => userId && fetchUser(userId)}
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={dashboardItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          )}
        </View>
        <Footer />
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
  );
};

export default HomeScreen;
