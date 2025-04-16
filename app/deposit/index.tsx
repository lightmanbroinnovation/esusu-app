import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { fetchContributorByPhone } from "../../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DepositScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  useEffect(() => {
    // Add event listeners for keyboard show and hide
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    // Get the logged-in user ID from AsyncStorage
    const getLoggedInUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          setLoggedInUserId(userId);
          console.log("Found logged in user ID:", userId);
        } else {
          console.log("No logged in user ID found");
          setError("You must be logged in to make deposits");
        }
      } catch (err) {
        console.error("Error getting logged in user ID:", err);
        setError("Could not retrieve login information");
      }
    };

    getLoggedInUserId();

    // Cleanup event listeners on unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchContributorDetails = async () => {
    // Check if user is logged in
    if (!loggedInUserId) {
      setError("You must be logged in to make deposits");
      return;
    }

    // Validate phone number
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Format phone number with or without country code
      const formattedPhone = phone.startsWith('+') ? phone : phone;
      console.log("Searching for contributor with phone:", formattedPhone);
      
      // Fetch contributor details by phone number for this agent
      const contributorData = await fetchContributorByPhone(loggedInUserId, formattedPhone);
      
      // Log contributor details for debugging
      console.log("CONTRIBUTOR DETAILS:", JSON.stringify(contributorData, null, 2));
      
      if (!contributorData) {
        throw new Error("No contributor found with this phone number");
      }
      
      // Navigate to the next page with the contributor data
      router.push({ 
        pathname: "/deposit/subpages/amt-deposit", 
        params: { 
          contributorId: contributorData.id,
          phone: formattedPhone, 
          firstname: contributorData.firstname || contributorData.firstName,
          lastname: contributorData.lastname || contributorData.lastName,
          balance: contributorData.balance || 0,
          userDataString: JSON.stringify(contributorData)
        } 
      });
    } catch (error: any) {
      console.error("Error fetching contributor details:", error);
      setError(error.message || "Could not find contributor with this phone number");
      // Don't navigate when there's an error
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <View
        className="flex-1 bg-white px-6"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mt-6">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
        </View>

        <View className="mt-8">
          <Text className="text-[26px] font-semibold text-[#0072CE] mb-2">
          Deposit Contribution
          </Text>
          <Text className="text-base text-[#4F4F4F]">
          Enter the contributor's registered phone number to retrieve their details
          </Text>
        </View>

        {/* Input */}
        <View className="mt-8">
          <Text className="text-sm text-[#4F4F4F] mb-2">Phone Number</Text>
          <View className="flex-row items-center">
            {/* NG Flag + Code */}
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

            {/* Phone input */}
            <TextInput
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={11}
              value={phone}
              onChangeText={setPhone}
              className="flex-1 text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
              placeholderTextColor="#BDBDBD"
            />
          </View>
          
          {/* Error message */}
          {error ? (
            <Text className="text-red-500 mt-2">{error}</Text>
          ) : null}
        </View>

        {/* Spacer to push button down */}
        <View className="flex-1 justify-end pb-4">
          {/* Continue Button */}
          {!isKeyboardVisible && ( // Hide button when keyboard is visible
            <TouchableOpacity
              className={`flex-row justify-center items-center ${loading || !phone ? 'bg-[#0072CE]/50' : 'bg-[#0072CE]'} py-4 rounded-lg`}
              onPress={fetchContributorDetails}
              disabled={loading || !phone || !loggedInUserId}
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
      </View>
    </KeyboardAvoidingView>
  );
}
