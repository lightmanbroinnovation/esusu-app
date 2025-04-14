import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchUser } from '../../services/api';

interface User {
  firstname: string;
  lastname: string;
  email: string;
  id: string; // Add other user properties as needed
}

const AgentVerification = () => {
  const router = useRouter();
  const params = useLocalSearchParams(); // Get parameters passed from the previous screen
  const [userData, setUserData] = useState<User | null>(null);
  const userId = '62f2'; // Replace with the actual user ID you want to fetch

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const data = await fetchUser(userId);
        setUserData(data);
        console.log(data); // Log the fetched data for debugging
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const navigateBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (userData) {
      const agentName = `${userData.firstname} ${userData.lastname}`; // Combine first and last name
      const agentId = userData.id; // Use the user ID

      // Navigate to the savings plan setup screen with agentName and agentId
      router.push({
        pathname: '/contributor/savings-plan',
        params: {
          agentName,
          agentId,
          firstName: params.firstName, // Pass original firstName
          lastName: params.lastName, // Pass original lastName
          phoneNumber: params.phoneNumber,
          ninNumber: params.ninNumber,
          language: params.language,
          photoUri: params.photoUri,
        }
      });
    }
  };

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
          
          {/* Form Fields */}
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
        </View>
        
        {/* Bottom Button */}
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity 
            onPress={handleNext}
            className="bg-blue-600 p-4 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-lg">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AgentVerification; 