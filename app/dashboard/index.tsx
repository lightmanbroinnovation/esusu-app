import React, { useState } from 'react';
import { ScrollView, SafeAreaView, Text, View, TouchableOpacity, Modal } from 'react-native';
import UserCard from '../components/UserCard';
import Footer from '../components/Footer';
import RecentActivity from '../components/RecentActivity';
import { Ionicons } from "@expo/vector-icons";
import VerificationController from '../verification/VerificationController';
import { useRouter } from 'expo-router';

const HomeScreen = () => {
  const router = useRouter();
  const [showVerification, setShowVerification] = useState(false);

  const handleVerifyNow = () => {
    console.log('Verify Now clicked');
    setShowVerification(true);
  };

  const handleCloseVerification = () => {
    console.log('Closing verification');
    setShowVerification(false);
  };

  const handleViewAllActivity = () => {
    // Navigate to the transactions screen
    console.log('Navigating to transactions');
    // @ts-ignore - Using string path directly to work around type issues
    router.push('/transactions');
  };

  const handleAddContributor = () => {
    // Navigate to add contributor flow
    console.log('Adding new contributor');
    // @ts-ignore - Using string path directly to work around type issues
    router.push('/contributor/add');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4">
      <ScrollView>
        <UserCard />
        <TouchableOpacity
        onPress={() => router.push("/contributor/add")}
         >
          <View className='flex-row justify-center items-center p-4 rounded-2xl mt-6 bg-[#E5F1FF]'>
            <Ionicons name="person-add-outline" size={24} color="#0052CC" className="mr-2" />
            <Text className="text-[#0052CC] font-medium">New User</Text>
          </View>
        </TouchableOpacity>
        <RecentActivity 
          onVerifyNow={handleVerifyNow}
          onViewAllActivity={handleViewAllActivity} 
        />
        
        {/* Temporary test button for direct verification */}
        <TouchableOpacity 
          onPress={handleVerifyNow}
          className="bg-blue-500 p-4 rounded-xl mt-4 mb-4"
        >
          <Text className="text-white text-center font-bold">TEST: Open Verification</Text>
        </TouchableOpacity>
      </ScrollView>
      <Footer />

      {/* Verification Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showVerification}
        onRequestClose={handleCloseVerification}
      >
        <VerificationController onClose={handleCloseVerification} />
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
