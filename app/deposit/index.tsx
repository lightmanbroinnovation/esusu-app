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
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  TextInputProps,
  ScrollViewProps,
  ImageSourcePropType
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

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    marginTop: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#0072CE',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F4F4F',
    lineHeight: 22,
  },
  inputContainer: {
    marginTop: 32,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4F4F4F',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
  },
  flagImage: {
    width: 24,
    height: 18,
    borderRadius: 2,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
  },
  errorText: {
    color: '#EF4444',
    marginTop: 8,
    fontSize: 14,
  },
  contributorsList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    maxHeight: 256,
    overflow: 'hidden',
  },
  contributorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '500',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  contributorPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 8,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(0, 114, 206, 0.5)',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

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
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineText}>No network. Please connect to the internet to load deposit page.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardAvoidingView}
    >
      <View
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Deposit Contribution</Text>
          <Text style={styles.subtitle}>
            Enter the contributor's registered phone number to retrieve their details
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            {/* NG Flag + Code */}
            <View style={styles.countryCodeContainer}>
              <Image
                source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                style={styles.flagImage}
              />
              <Text style={styles.countryCodeText}>NGN</Text>
            </View>

            {/* Phone input */}
            <TextInput
              placeholder="Enter phone number"
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
              maxLength={11}
              value={phone}
              onChangeText={setPhone}
              style={styles.phoneInput}
              placeholderTextColor="#BDBDBD"
            />
          </View>
          
          {/* Error message */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          {/* Contributors list */}
          {filteredContributors.length > 0 && (
            <View style={styles.contributorsList}>
              {filteredContributors.map((contributor: Contributor, index: number) => {
                // Skip if contributor is missing required fields
                if (!contributor) return null;
                
                const name = `${contributor.firstName || ''} ${contributor.lastName || ''}`.trim();
                const phoneNumber = contributor.phoneNumber || '';
                
                return (
                  <TouchableOpacity
                    key={contributor._id || `contributor-${index}`}
                    style={styles.contributorItem}
                    onPress={() => handleContributorSelect(contributor)}
                  >
                    {contributor.photo ? (
                      <Image
                        source={{ uri: contributor.photo }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {name[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.contributorInfo}>
                      <Text style={styles.contributorName} numberOfLines={1}>
                        {name || 'Unnamed Contributor'}
                      </Text>
                      {phoneNumber ? (
                        <Text style={styles.contributorPhone}>{phoneNumber}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Spacer to push button down */}
        <View style={styles.buttonContainer}>
          {/* Continue Button */}
          {!isKeyboardVisible && (
            <TouchableOpacity
              style={[
                styles.continueButton,
                (loading || !phone) && styles.continueButtonDisabled
              ]}
              onPress={() => fetchContributorDetails()}
              disabled={loading || !phone}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>Next</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
