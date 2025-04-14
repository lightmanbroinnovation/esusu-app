import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ImageBackground, SafeAreaView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVerificationStatus, updateUser } from '../../services/api';

const VerificationSuccess = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Load userId on mount
    AsyncStorage.getItem('userId').then(id => {
      if (id) {
        setUserId(id);
        console.log('Success screen loaded with userId:', id);
      }
    });
  }, []);

  const checkVerificationStatus = async () => {
    try {
      // Get current userId
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setDebugInfo('No userId found in AsyncStorage');
        return;
      }
      
      // Get verification status
      const status = await getVerificationStatus(userId);
      setDebugInfo(JSON.stringify(status, null, 2));
      console.log('VERIFICATION STATUS:', status);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  const fixVerificationStatus = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'No user ID found');
        return;
      }

      // Default verification data
      const verificationData = {
        government_id: "https://res.cloudinary.com/daskmqzyy/image/upload/v1/verification_documents/placeholder_id.jpg",
        business_img: "https://res.cloudinary.com/daskmqzyy/image/upload/v1/business_locations/placeholder_store.jpg",
        verify_business: true,
        verificationStatus: 'pending'
      };

      // Update the user directly
      await updateUser(userId, verificationData);
      
      // Also update AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const updatedUserData = {
          ...userData,
          ...verificationData
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      }
      
      Alert.alert('Success', 'Verification status manually updated');
      checkVerificationStatus(); // Refresh status display
    } catch (error) {
      console.error('Error fixing verification:', error);
      Alert.alert('Error', `Failed to update: ${error.message}`);
    }
  };

  const navigateToLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4 pt-6">
      <View className="flex-1 items-center justify-center">
        <View className="bg-green-100 rounded-full p-6 mb-6">
          <Ionicons name="checkmark" size={48} color="green" />
        </View>
        
        <Text className="text-3xl font-bold text-center mb-4">
          Verification Submitted
        </Text>
        
        <Text className="text-gray-600 text-center mb-8 px-4">
          Your business verification has been submitted successfully. Our team will review your information and update you shortly.
        </Text>
        
        <TouchableOpacity 
          className="bg-blue-600 py-4 px-6 rounded-xl w-full"
          onPress={navigateToLogin}
        >
          <Text className="text-white text-center text-lg font-medium">
            Continue to Dashboard
          </Text>
        </TouchableOpacity>

        {/* Debug section */}
        <View className="mt-8 flex-row space-x-2">
          <TouchableOpacity 
            className="bg-gray-200 py-3 px-4 rounded-lg"
            onPress={checkVerificationStatus}
          >
            <Text className="text-gray-700">Check Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-amber-200 py-3 px-4 rounded-lg"
            onPress={fixVerificationStatus}
          >
            <Text className="text-amber-700">Fix Status</Text>
          </TouchableOpacity>
        </View>

        {debugInfo ? (
          <View className="mt-4 p-4 bg-gray-100 rounded-lg w-full">
            <Text className="text-xs font-mono">{debugInfo}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default VerificationSuccess;
