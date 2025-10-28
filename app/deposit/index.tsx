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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { fetchContributorDetailsForDeposit, fetchGroupedContributorPhotos } from "../../services/api";
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';

// Define the Contributor type based on the API response
type Contributor = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
  photo?: string;
  [key: string]: any; // For any additional properties
};

// Define the API response structure
type GroupedContributors = {
  [key: string]: {
    contributors: Contributor[];
    title: string;
  };
};

type ApiResponse = GroupedContributors & {
  status?: string;
};

export default function DepositScreen() {
  const router = useRouter();
  
  // Use back button handler for deposit page
  useBackButtonHandler('/deposit');
  
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [filteredContributors, setFilteredContributors] = useState<Contributor[]>([]);
  const [isLoadingContributors, setIsLoadingContributors] = useState(false);

  useEffect(() => {
    // Add event listeners for keyboard show and hide
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    // Cleanup event listeners on unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    
    // Fetch all contributors on component mount
    const fetchAllContributors = async () => {
      if (!networkAvailable) return;
      
      setIsLoadingContributors(true);
      try {
        const response = await fetchGroupedContributorPhotos();
        console.log('API Response:', JSON.stringify(response, null, 2));
        
        if (!response) {
          console.log('No response received from API');
          throw new Error('No response from server');
        }
        
        // Flatten the grouped data into a single array of contributors
        const allContributors: Contributor[] = [];
        
        // Extract contributors from all groups (daily, weekly, monthly)
        const groups = ['daily', 'weekly', 'monthly'] as const;
        
        groups.forEach(groupKey => {
          const group = response[groupKey];
          if (group?.contributors?.length) {
            group.contributors.forEach((contributor: Contributor) => {
              if (contributor) {
                allContributors.push({
                  ...contributor,
                  phoneNumber: contributor.phoneNumber || '',
                  firstName: contributor.firstName || '',
                  lastName: contributor.lastName || ''
                });
              }
            });
          }
        });
        
        console.log('Processed contributors:', allContributors);
        setContributors(allContributors);
      } catch (error) {
        console.error("Error fetching contributors:", error);
        setError("Failed to load contributors. Please try again.");
        setTimeout(() => setError(''), 4000);
      } finally {
        setIsLoadingContributors(false);
      }
    };
    
    fetchAllContributors();
    
    return () => {
      unsubscribe();
    };
  }, [networkAvailable]);
  
  // Filter contributors based on phone input
  useEffect(() => {
    if (!phone) {
      setFilteredContributors([]);
      return;
    }
    
    const searchTerm = phone.toLowerCase().trim();
    if (searchTerm.length < 2) {
      setFilteredContributors([]);
      return;
    }
    
    const filtered = contributors.filter((contributor): contributor is Required<Contributor> => {
      if (!contributor) return false;
      
      const phoneNumber = (contributor.phoneNumber || contributor.phone || '').toLowerCase();
      const firstName = (contributor.firstName || '').toLowerCase();
      const lastName = (contributor.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Match by phone number or name
      return phoneNumber.includes(searchTerm) || 
             fullName.includes(searchTerm) ||
             firstName.includes(searchTerm) ||
             lastName.includes(searchTerm);
    });
    
    setFilteredContributors(filtered);
  }, [phone, contributors]);

  const handleContributorSelect = (contributor: Contributor) => {
    if (!contributor) return;
    
    const phoneNumber = contributor.phoneNumber || contributor.phone || '';
    setPhone(phoneNumber);
    setFilteredContributors([]);
    Keyboard.dismiss();
    
    // Proceed with the selected contributor
    if (phoneNumber) {
      fetchContributorDetails(phoneNumber);
    }
  };

  const fetchContributorDetails = async (phoneNumber: string | null = null) => {
    const phoneToUse = phoneNumber || phone;
    
    if (!phoneToUse) {
      setError("Phone number is required");
      setTimeout(() => setError(''), 4000);
      return;
    }
    
    // Validate phone number
    if (!phoneToUse || phoneToUse.length < 10) {
      setError("Please enter a valid phone number");
      setTimeout(() => setError(''), 4000);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Format phone number with or without country code
      const formattedPhone = phoneToUse.startsWith('+') ? phoneToUse : phoneToUse;
      console.log("Searching for contributor with phone:", formattedPhone);
      
      // Fetch contributor details using the new API endpoint
      const contributorData = await fetchContributorDetailsForDeposit(formattedPhone);
      
      // Log contributor details for debugging
      console.log("CONTRIBUTOR DETAILS:", JSON.stringify(contributorData, null, 2));
      
      if (!contributorData) {
        throw new Error("No contributor found with this phone number");
      }
      
      // Navigate to the next page with the contributor data
      router.push({ 
        pathname: "/deposit/subpages/amt-deposit", 
        params: { 
          contributorId: contributorData.id || contributorData._id,
          phone: formattedPhone, 
          firstname: contributorData.firstname || contributorData.firstName,
          lastname: contributorData.lastname || contributorData.lastName,
          balance: contributorData.balance || 0,
          userDataString: JSON.stringify(contributorData)
        } 
      });
    } catch (error) {
      console.error("Error fetching contributor details:", error);
      const err: any = error;
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
        setTimeout(() => setError(''), 4000);
      } else if (err && err.message) {
        setError(err.message);
        setTimeout(() => setError(''), 4000);
      } else {
        setError("Could not find contributor with this phone number");
        setTimeout(() => setError(''), 4000);
      }
      // Don't navigate when there's an error
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoadingContributors) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !phone) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No network. Please connect to the internet to load deposit page.</Text>
      </View>
    );
  }

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
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
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
          
          {/* Contributors list */}
          {filteredContributors.length > 0 && (
            <View className="mt-2 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {filteredContributors.map((contributor: Contributor, index: number) => {
                // Skip if contributor is missing required fields
                if (!contributor) return null;
                
                const name = `${contributor.firstName || ''} ${contributor.lastName || ''}`.trim();
                const phoneNumber = contributor.phoneNumber || '';
                
                return (
                  <TouchableOpacity
                    key={contributor._id || `contributor-${index}`}
                    className="flex-row items-center p-3 border-b border-gray-100 bg-white"
                    onPress={() => handleContributorSelect(contributor)}
                  >
                    {contributor.photo ? (
                      <Image
                        source={{ uri: contributor.photo }}
                        className="w-10 h-10 rounded-full mr-3"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-gray-200 mr-3 items-center justify-center">
                        <Text className="text-gray-500 text-lg font-medium">
                          {name[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-base font-medium" numberOfLines={1}>
                        {name || 'Unnamed Contributor'}
                      </Text>
                      {phoneNumber ? (
                        <Text className="text-sm text-gray-500">{phoneNumber}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Spacer to push button down */}
        <View className="flex-1 justify-end pb-4">
          {/* Continue Button */}
          {!isKeyboardVisible && ( // Hide button when keyboard is visible
            <TouchableOpacity
              className={`flex-row justify-center items-center ${loading || !phone ? 'bg-[#0072CE]/50' : 'bg-[#0072CE]'} py-4 rounded-lg`}
              onPress={() => fetchContributorDetails()}
              disabled={loading || !phone}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-lg mr-2 font-semibold">Next</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
