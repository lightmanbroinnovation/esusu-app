import React, { useState, useEffect } from 'react';
import { ScrollView, SafeAreaView, Text, View, TouchableOpacity, Modal } from 'react-native';
import UserCard from '../components/UserCard';
import Footer from '../components/Footer';
import RecentActivity from '../components/RecentActivity';
import { Ionicons } from "@expo/vector-icons";
import VerificationController from '../verification/VerificationController';
import { useRouter } from 'expo-router';
import { fetchUser } from '../../services/api';
import LatestTransactions from '../components/LatestTransactions';
import StatusBarAdapter from '../components/StatusBarAdapter';

interface User {
  firstname: string;
  email: string;
  id: string;
}

const HomeScreen = () => {
  const router = useRouter();
  const [showVerification, setShowVerification] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const userId = '62f2';
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await fetchUser(userId);
        setUserData(data);
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4 mt-10">
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }} // Add padding for footer
          >
            {userData ? (
              <UserCard user={userData} />
            ) : (
              <Text className="text-center">Loading user data...</Text>
            )}
            <TouchableOpacity onPress={() => router.push("/contributor/add")}>
              <View className='flex-row justify-center items-center p-4 rounded-2xl mt-6 bg-[#E5F1FF]'>
                <Ionicons name="person-add-outline" size={24} color="#0052CC" className="mr-2" />
                <Text className="text-[#0052CC] font-medium">New User</Text>
              </View>
            </TouchableOpacity>
            <RecentActivity 
              onVerifyNow={() => router.push('/verification')}
            />
            <LatestTransactions transactions={transactions} />
          </ScrollView>
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
