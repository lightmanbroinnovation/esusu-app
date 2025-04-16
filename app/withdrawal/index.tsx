import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchContributorByPhone } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WithdrawalScreen = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Get logged in user ID
    AsyncStorage.getItem('userId').then(userId => {
      setLoggedInUserId(userId);
      if (!userId) {
        setError('Please log in to continue');
      }
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSearch = async () => {
    // Check if user is logged in
    if (!loggedInUserId) {
      setError("You must be logged in to make withdrawals");
      return;
    }

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Format phone number with or without country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : phoneNumber;
      console.log("Searching for contributor with phone:", formattedPhone);
      
      // Fetch contributor details by phone number for this agent
      const contributorData = await fetchContributorByPhone(loggedInUserId, formattedPhone);
      
      // Log contributor details for debugging
      console.log("CONTRIBUTOR DETAILS:", JSON.stringify(contributorData, null, 2));
      
      if (!contributorData) {
        throw new Error("No contributor found with this phone number");
      }
      
      // Navigate to the withdrawal type screen with the contributor data
      router.push({ 
        pathname: "/withdrawal/subpages/withdrawal-type", 
        params: { 
          userDataString: JSON.stringify({
            id: contributorData.id,
            firstname: contributorData.firstname || contributorData.firstName,
            lastname: contributorData.lastname || contributorData.lastName,
            phonenumber: formattedPhone,
            balance: contributorData.balance || contributorData.depositAmount || 0,
            imageUrl: contributorData.photoUri || null
          })
        } 
      });
    } catch (error: any) {
      console.error("Error fetching contributor details:", error);
      setError(error.message || "Could not find contributor with this phone number");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-4">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between mt-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Withdraw</Text>
            <View className="w-10" />
          </View>

          {/* Content */}
          <View className="mt-8">
            <Text className="text-2xl font-bold text-blue-600 mb-2">Withdraw Funds</Text>
            <Text className="text-base text-gray-600 mb-8">
              Enter the contributor's registered phone number to retrieve their details
            </Text>

            {/* Error Message */}
            {error && (
              <View className="mb-4 p-3 bg-red-50 rounded-lg">
                <Text className="text-red-600">{error}</Text>
              </View>
            )}

            {/* Phone Input */}
            <Text className="text-base font-medium mb-2">Phone Number</Text>
            <View className="flex-row items-center mb-6">
              <View className="">
              <View className="flex-row items-center mr-3 border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]">
              <Image
                source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                style={{
                  width: 24,
                  height: 18,
                  borderRadius: 2,
                  marginRight: 6,
                }}
              />
              <Text className="text-base text-[#BDBDBD]">NGN</Text>
            </View>
              </View>
              <TextInput
              className="flex-1 text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
              placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError(null);
                }}
              />
            </View>
          </View>

          <View className="flex-1 justify-end pb-4">
            {/* Continue Button */}
            {!isKeyboardVisible && (
              <TouchableOpacity
                className={`flex-row justify-center items-center ${loading || !phoneNumber ? 'bg-[#0072CE]/50' : 'bg-[#0072CE]'} py-4 rounded-lg`}
                onPress={handleSearch}
                disabled={loading || !phoneNumber || !loggedInUserId}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text className="text-white text-lg mr-2 font-semibold">Next</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default WithdrawalScreen; 