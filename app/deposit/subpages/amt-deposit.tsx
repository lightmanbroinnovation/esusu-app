import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ImageSourcePropType
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import StatusBarAdapter from '../../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchContributorDetailsForDeposit, fetchMerchantDashboardAccount, creditContributorAccount } from '../../../services/api';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../../components/EsusuLoader';
import { sendNotification, NotificationTemplates } from '../../services/notificationService';
import { getCachedData, invalidateCache } from '../../utils/dataCaching';
import { useDataFetchGuard, useRenderGuard } from '../../utils/dataFetchGuard';
import { useBackButtonHandler } from '../../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton

// Define the Account type
type Account = {
  bank: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  image: any;
  balance: number;
};

// Define user details interface
interface UserDetails {
  id: string;
  firstname?: string;
  firstName?: string; 
  lastname?: string;
  lastName?: string;
  email?: string;
  phonenumber?: string;
  phoneNumber?: string;
  phone?: string;
  balance?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  weeklyEarnings?: number;
  commissions?: any[];
  imageUrl?: string;
  photo?: string;
  depositAmount?: number;
  nextDepositDate?: string;
}

// Define merchant dashboard data interface
interface MerchantDashboardData {
  balance?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  // Add other dashboard fields as needed
}

interface RadioButtonProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: (value: string | null) => void;
}

const RadioButton: React.FC<RadioButtonProps> = ({ label, value, selected, onSelect }) => {
  const isSelected = selected;
  
  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  };

  const radioOuter: ViewStyle = {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: isSelected ? '#3B82F6' : '#9CA3AF',
    backgroundColor: isSelected ? '#3B82F6' : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  };

  const radioInner: ViewStyle = {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
  };

  const labelStyle: TextStyle = {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  };

  return (
    <TouchableOpacity
      onPress={() => onSelect(isSelected ? null : value)}
      style={containerStyle}
    >
      <View style={radioOuter}>
        {isSelected && <View style={radioInner} />}
      </View>
      <Text style={styles.labelStyle}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  userTextContainer: {
    gap: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userLastName: {
    fontSize: 14,
    color: '#4B5563',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#DC2626',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  requiredDepositContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  requiredDepositLabel: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginBottom: 4,
  },
  requiredDepositAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E40AF',
  },
  nextDepositDate: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4,
  },
  errorMessageContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorMessageTitle: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 4,
  },
  errorMessageText: {
    color: '#B91C1C',
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  amountLabel: {
    color: '#6B7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '600',
    color: '#111827',
  },
  keypadContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAmountButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  quickAmountText: {
    color: '#4B5563',
    fontSize: 14,
  },
  keypad: {
    marginTop: 32,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  keypadButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111827',
  },
  backspaceButton: {
    backgroundColor: '#F3F4F6',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  continueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  labelStyle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});

export default function AmtDepositScreen() {
  const router = useRouter();
  
  // Use back button handler for deposit amount page
  useBackButtonHandler('/deposit/subpages/amt-deposit');
  
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('AmtDepositScreen', 15);

  const params = useLocalSearchParams();
  const [amount, setAmount] = useState('0');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [merchantDashboardData, setMerchantDashboardData] = useState<MerchantDashboardData | null>(null);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Load contributor data asynchronously
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load merchant dashboard data to get user balance
        await loadMerchantDashboardData();
        
        // If we have data in params, use it
        if (params.userDataString) {
          const contributorData = JSON.parse(params.userDataString as string);
          console.log('Parsed contributor data:', contributorData);
          
          // Handle the new response structure
          if (contributorData.contributorAccount && contributorData.contributor) {
            setUserDetails({
              id: contributorData.contributorAccount._id || contributorData.contributorAccount.id,
              firstname: contributorData.contributor.firstName || '',
              lastname: contributorData.contributor.lastName || '',
              email: contributorData.contributor.email || '',
              phonenumber: params.phone as string,
              balance: contributorData.contributorAccount.balance || 0,
              imageUrl: contributorData.contributor.photo || '',
              depositAmount: contributorData.contributorAccount.depositAmount || 0,
              nextDepositDate: contributorData.contributorAccount.nextDepositDate || '',
            });
          } else {
            // Fallback for old data structure
          setUserDetails({
            id: contributorData.id,
            firstname: contributorData.firstname || contributorData.firstName || '',
            lastname: contributorData.lastname || contributorData.lastName || '',
            email: contributorData.email || '',
            phonenumber: contributorData.phonenumber || contributorData.phone || params.phone as string,
            balance: contributorData.balance || 0,
            imageUrl: contributorData.photoUri || '',
          });
          }
          setLoadingData(false);
          return; // Exit if we successfully loaded from params
        }

        // If no data in params, try to load from API
        await loadContributorData();
      } catch (err) {
        console.error("Error in initialization:", err);
        setError("Failed to load contributor details");
      } finally {
        setLoadingData(false);
      }
    };

    initializeData();
  }, []);

  // Load merchant dashboard data to get user balance
  const loadMerchantDashboardData = async () => {
    try {
      const dashboardData = await fetchMerchantDashboardAccount();
      console.log('Merchant Dashboard Data:', dashboardData);
      
      if (dashboardData && dashboardData.data) {
        setMerchantDashboardData(dashboardData.data);
        console.log('User Balance from Dashboard:', dashboardData.data.balance);
      }
    } catch (error) {
      console.error('Error loading merchant dashboard data:', error);
    }
  };

  // Load contributor data from API (fallback method)
  const loadContributorData = async () => {
    try {
      // Get the phone number from params or storage
      const phoneNumber = params.phone as string;
      
      if (!phoneNumber) {
        throw new Error("No phone number provided");
      }
      
      console.log('Fetching contributor data for phone:', phoneNumber);
      
      // Fetch contributor data using the new API endpoint
      const contributorData = await fetchContributorDetailsForDeposit(phoneNumber);
      
      if (!contributorData) {
        throw new Error("Contributor not found");
      }
      
      console.log('Received contributor data:', contributorData);
      
      // Handle the new response structure
      if (contributorData.contributorAccount && contributorData.contributor) {
        setUserDetails({
          id: contributorData.contributorAccount._id || contributorData.contributorAccount.id,
          firstname: contributorData.contributor.firstName || '',
          lastname: contributorData.contributor.lastName || '',
          email: contributorData.contributor.email || '',
          phonenumber: contributorData.contributor.phoneNumber || contributorData.contributor.phone || phoneNumber,
          balance: contributorData.contributorAccount.balance || 0,
          imageUrl: contributorData.contributor.photo || '',
          depositAmount: contributorData.contributorAccount.depositAmount || 0,
          nextDepositDate: contributorData.contributorAccount.nextDepositDate || '',
        });
      } else {
        // Fallback for old data structure
      setUserDetails({
          id: contributorData.id || contributorData._id,
        firstname: contributorData.firstname || contributorData.firstName || '',
        lastname: contributorData.lastname || contributorData.lastName || '',
        email: contributorData.email || '',
          phonenumber: contributorData.phonenumber || contributorData.phoneNumber || contributorData.phone || phoneNumber,
        balance: contributorData.balance || 0,
          imageUrl: contributorData.photoUri || contributorData.imageUrl || '',
      });
      }
    } catch (error: any) {
      console.error("Error loading contributor data:", error);
      setError(error.message || "Failed to load contributor details");
      throw error; // Re-throw to be caught by the caller
    }
  };

  const navigateBack = () => {
    // Try to go back, but if not possible, go to dashboard
    try {
    router.back();
    } catch (e) {
      router.replace('/dashboard');
    }
  };

  const handleAmountSelection = (value: string) => {
    setAmount(value);
    // Clear error when user starts entering a new amount
    if (error) {
      setError(null);
    }
  };

  const handleButtonPress = (digit: string) => {
    if (amount === '0') {
      setAmount(digit);
    } else {
      setAmount(amount + digit);
    }
    // Clear error when user starts entering a new amount
    if (error) {
      setError(null);
    }
  };

  const handleBackspace = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount('0');
    }
    // Clear error when user starts entering a new amount
    if (error) {
      setError(null);
    }
  };

  const handleContinue = async () => {
    const amountNum = Number(amount);
  
    if (amountNum <= 0) {
      setError('Please enter an amount greater than zero.');
      return;
    }
  
    if (!userDetails?.id) {
      setError('Contributor details not found.');
      return;
    }

    // Validate amount against required deposit amount
    if (userDetails.depositAmount && amountNum < userDetails.depositAmount) {
      setError(`Please enter at least ₦${userDetails.depositAmount.toLocaleString()} as required for this deposit.`);
      return;
    }

    // Validate amount against user balance
    if (merchantDashboardData?.balance && amountNum > merchantDashboardData.balance) {
      setError(`Your account balance is ₦${merchantDashboardData.balance.toLocaleString()}. Please enter an amount within your available balance.`);
      return;
    }

    // Validate amount against required deposit amount (if greater)
    if (userDetails.depositAmount && amountNum > userDetails.depositAmount) {
      setError(`The required deposit amount is ₦${userDetails.depositAmount.toLocaleString()}. Please enter the exact required amount.`);
      return;
    }

    // Clear any previous errors
    setError(null);

    setIsLoading(true);
    try {
      // Log the data being sent to the server
      console.log('Sending deposit to server:', {
        phoneNumber: userDetails.phonenumber,
        amount: amountNum,
        userDetails: userDetails
      });
      // Save deposit data to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('depositAmount', amount),
        AsyncStorage.setItem('depositContributorId', userDetails.id),
        AsyncStorage.setItem('depositContributorData', JSON.stringify(userDetails)),
        AsyncStorage.setItem('userImage', userDetails.imageUrl || ''),
        AsyncStorage.setItem('merchantDashboardData', JSON.stringify(merchantDashboardData))
      ]);
      
      // Call the creditContributorAccount API
      const creditResponse = await creditContributorAccount(userDetails.phonenumber, amountNum);
      
      // If credit API is successful, navigate to success screen
      if (creditResponse && creditResponse.status === 'Success') {
        // Save deposit amount for success screen
        await AsyncStorage.setItem('depositAmount', amount);
        // Device notification for deposit
        await sendNotification(
          NotificationTemplates.transaction.deposit(amount).title,
          NotificationTemplates.transaction.deposit(amount).body,
          NotificationTemplates.transaction.deposit(amount).type
        );
        router.push('/deposit/subpages/success');
      } else {
        throw new Error('Credit operation failed');
      }
    } catch (error) {
      console.error('Error saving deposit data:', error);
      const err: any = error;
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('Failed to process deposit. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !userDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No network. Please connect to the internet to load contributor data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={navigateBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {userDetails ? (
        <View style={styles.userCard}>
          <View style={styles.userInfoContainer}>
            {userDetails.imageUrl ? (
              <Image 
                source={{ uri: userDetails.imageUrl }} 
                style={styles.userImage} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userDetails.firstname?.[0] || ''}
                </Text>
              </View>
            )}
            <View style={styles.userTextContainer}>
              <Text style={styles.userName}>{userDetails.firstname}</Text>
              <Text style={styles.userLastName}>{userDetails.lastname}</Text>
            </View>
          </View>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>₦{userDetails.balance ? userDetails.balance.toLocaleString() : '0'}</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#0072CE" />
          <Text style={styles.loadingText}>Loading user details...</Text>
        </View>
      )}

        {/* Required Deposit Amount */}
        {userDetails?.depositAmount && (
          <View style={styles.requiredDepositContainer}>
            <Text style={styles.requiredDepositLabel}>Required Deposit Amount</Text>
            <Text style={styles.requiredDepositAmount}>₦{userDetails.depositAmount.toLocaleString()}</Text>
            {userDetails.nextDepositDate && (
              <Text style={styles.nextDepositDate}>
                Next deposit due: {new Date(userDetails.nextDepositDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Error Messages */}
        {error && (
          <View style={styles.errorMessageContainer}>
            <Text style={styles.errorMessageTitle}>Unable to Process</Text>
            <Text style={styles.errorMessageText}>{error}</Text>
          </View>
        )}

      {/* Amount Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Enter Amount</Text>
        <Text style={styles.amountValue}>₦{parseInt(amount).toLocaleString()}</Text>
      </View>

        <View style={styles.keypadContainer}>
        {/* Quick Amounts */}
        <View style={styles.quickAmountsContainer}>
          <TouchableOpacity
            style={styles.quickAmountButton}
            onPress={() => handleAmountSelection('5000')}
          >
            <Text style={styles.quickAmountText}>₦5,000</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAmountButton}
            onPress={() => handleAmountSelection('15000')}
          >
            <Text style={styles.quickAmountText}>₦15,000</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAmountButton}
            onPress={() => handleAmountSelection('30000')}
          >
            <Text style={styles.quickAmountText}>₦30,000</Text>
          </TouchableOpacity>
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {/* Row 1 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity
              onPress={() => handleButtonPress('1')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('2')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('3')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>3</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity
              onPress={() => handleButtonPress('4')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>4</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('5')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('6')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>6</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity
              onPress={() => handleButtonPress('7')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('8')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('9')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>9</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity
              onPress={() => handleButtonPress('00')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>00</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleButtonPress('0')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBackspace}
              style={[styles.keypadButton, styles.backspaceButton]}
            >
              <Ionicons name="backspace-outline" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </ScrollView>

      {/* Continue Button - Fixed at bottom */}
      <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinue}
            style={[
              styles.continueButton,
              { backgroundColor: parseInt(amount) > 0 ? '#2563EB' : '#93C5FD' }
            ]}
            disabled={parseInt(amount) <= 0 || isLoading || loadingData}
          >
            {isLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.buttonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

