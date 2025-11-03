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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchContributorDetailsForWithdrawal } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';

const WithdrawalScreen = () => {
  const router = useRouter();
  
  // Use back button handler for withdrawal page
  useBackButtonHandler('/withdrawal');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

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

    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      unsubscribe();
    };
  }, []);

  const handleSearch = async () => {
    // Check if user is logged in
    if (!loggedInUserId) {
      setError("You must be logged in to make withdrawals");
      setTimeout(() => setError(null), 4000);
      return;
    }

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      setTimeout(() => setError(null), 4000);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Format phone number with or without country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : phoneNumber;
      // Fetch contributor details for withdrawal
      const contributorData = await fetchContributorDetailsForWithdrawal(formattedPhone);
      if (!contributorData) {
        throw new Error("No contributor found with this phone number");
      }
      // Navigate to the withdrawal type screen with the contributor data
      router.push({ 
        pathname: "/withdrawal/subpages/withdrawal-type", 
        params: { 
          userDataString: JSON.stringify(contributorData),
          phoneNumber: phoneNumber
        } 
      });
    } catch (error: any) {
      const err: any = error;
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
        setTimeout(() => setError(null), 4000);
      } else if (err && err.message) {
        setError(err.message);
        setTimeout(() => setError(null), 4000);
      } else {
        setError("Could not find contributor with this phone number");
        setTimeout(() => setError(null), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !loggedInUserId) {
    return (
      <View style={styles.noNetworkContainer}>
        <Text style={styles.noNetworkText}>No network. Please connect to the internet to load withdrawal data.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Withdraw</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Withdraw Funds</Text>
            <Text style={styles.subtitle}>
              Enter the contributor's registered phone number to retrieve their details
            </Text>

            {/* Phone Input */}
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.flagContainer}>
              <Image
                source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                  style={styles.flagImage}
              />
                <Text style={styles.flagText}>NGN</Text>
              </View>
              <TextInput
                style={styles.textInput}
              placeholder="Enter phone number"
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError(null);
                }}
                placeholderTextColor="#BDBDBD"
              />
            </View>
              {/* Error Message */}
              {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
          </View>

          <View style={styles.buttonContainer}>
            {/* Continue Button */}
            {!isKeyboardVisible && (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (loading || !phoneNumber) && styles.nextButtonDisabled
                ]}
                onPress={handleSearch}
                disabled={loading || !phoneNumber || !loggedInUserId}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.nextButtonText}>Next</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  safeArea: {
    flex: 1,
  },
  noNetworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noNetworkText: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 64,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  flagContainer: {
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
  flagText: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  textInput: {
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
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#0072CE',
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default WithdrawalScreen; 