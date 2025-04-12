import React, { useState } from 'react';
import { ScrollView, SafeAreaView, Text, View, TouchableOpacity, Modal } from 'react-native';
import UserCard from '../components/UserCard';
import Footer from '../components/Footer';
import RecentActivity from '../components/RecentActivity';
import { Ionicons } from "@expo/vector-icons";
import VerificationController from '../verification/VerificationController';
import { useRouter } from 'expo-router';
import { fetchUser } from '../../services/api';

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

  React.useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await fetchUser(userId);
        setUserData(data);
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
          onViewAllActivity={() => router.push('/transactions')} 
        />
        <TouchableOpacity 
          onPress={() => router.push("/contributors/ContributorsScreen")}
          className="bg-blue-500 p-4 rounded-xl mt-4 mb-4"
        >
          <Text className="text-white text-center font-bold">TEST: Open Verification</Text>
        </TouchableOpacity>
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
