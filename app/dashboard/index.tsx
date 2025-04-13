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

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await fetchUser(userId);
        setUserData(data);
        setTransactions(data.transactions || []);
        console.log(data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [userId]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4">
      <ScrollView>
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
          onVerifyNow={() => console.log('Verify Now clicked')}
       
        />
        <LatestTransactions transactions={transactions}
          />
 
      </ScrollView>
      <Footer />
      <Modal
        animationType="slide"
        transparent={false}
        visible={showVerification}
        onRequestClose={() => setShowVerification(false)}
      >
        <VerificationController onClose={() => setShowVerification(false)} />
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
