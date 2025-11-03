import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBackButtonHandler } from '../../utils/backButtonHandler';

const styles = StyleSheet.create({
  scrollView:{
    flex: 1,
    backgroundColor: '#FFFFFF',
    
  },
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    paddingTop: 16,
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
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  
  // User Card
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
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
  },
  userDetails: {
    gap: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Error Message
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 4,
  },
  errorText: {
    color: '#B91C1C',
  },
  
  // Amount Display
  amountContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  amountLabel: {
    color: '#6B7280',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Quick Amount Buttons
  quickButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  quickButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  quickButtonText: {
    color: '#111827',
  },
  
  // Keypad
  keypadContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
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
  keypadText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111827',
  },
  
  // Done Button
  buttonContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#2563EB',
  },
  buttonDisabled: {
    backgroundColor: '#BFDBFE',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 18,
    color: '#111827',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#4B5563',
    fontWeight: '500',
  },
});

interface ContributorAccount {
  _id: string;
  settlementBalance: number;
  id: string;
}
interface Contributor {
  _id: string;
  firstName: string;
  lastName: string;
  photo?: string;
}
interface UserData {
  contributorAccount: ContributorAccount;
  contributor: Contributor;
}

const WithdrawalTypeScreen = () => {
  const router = useRouter();
  
  // Use back button handler for withdrawal type page
  useBackButtonHandler('/withdrawal/subpages/withdrawal-type');
  
  const params = useLocalSearchParams();
  const phoneNumberParam = params.phoneNumber as string | undefined;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [amount, setAmount] = useState('0');
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.userDataString) {
      try {
        const parsedData = JSON.parse(params.userDataString as string);
        setUserData(parsedData);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, [params.userDataString]);

  const handleNumberPress = (num: string) => {
    setAmount(prev => {
      if (prev === '0') {
        return num;
      }
      // Handle '00' special case
      if (num === '00') {
        return prev === '0' ? '0' : prev + '00';
      }
      return prev + num;
    });
    if (error) setError(null);
  };

  const handleBackspace = () => {
    setAmount(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
    if (error) setError(null);
  };

  const handleDone = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!userData) return;
    const settlementBalance = userData.contributorAccount.settlementBalance || 0;
    if (parseFloat(amount) > settlementBalance) {
      setError(`You cannot withdraw more than ₦${settlementBalance.toLocaleString()}`);
      return;
    }
    try {
      // Save withdrawal amount and user details
      await AsyncStorage.setItem('withdrawalAmount', amount);
      await AsyncStorage.setItem('withdrawalUserData', JSON.stringify(userData));
      // Navigate to recepient.tsx with phoneNumber and amount
      router.push({
        pathname: '/withdrawal/subpages/recepient',
        params: {
          phoneNumber: phoneNumberParam || (userData.contributor as any)?.phoneNumber || userData.contributorAccount.id || '',
          amount
        }
      });
    } catch (error) {
      console.error('Error saving withdrawal data:', error);
    }
  };

  const handleOptionSelect = async (type: 'cash' | 'transfer') => {
    try {
      await AsyncStorage.setItem('withdrawalType', type);
      if (type === 'transfer') {
        router.push({
          pathname: '/withdrawal/subpages/recipient',
          params: { amount }
        });
      } else {
        router.push({
          pathname: '/withdrawal/subpages/otp',
          params: { amount }
        });
      }
    } catch (error) {
      console.error('Error saving withdrawal type:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* User Card */}
      {userData && (
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            {userData.contributor.photo ? (
              <Image
                source={{ uri: userData.contributor.photo }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData.contributor.firstName[0]}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userData.contributor.firstName}</Text>
              <Text style={styles.userEmail}>{userData.contributor.lastName}</Text>
            </View>
          </View>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Settlement Balance</Text>
            <Text style={styles.balanceAmount}>₦{userData.contributorAccount.settlementBalance?.toLocaleString() || '0'}</Text>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Process</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Amount Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Enter Amount</Text>
        <Text style={styles.amountText}>₦{parseInt(amount).toLocaleString()}</Text>
      </View>

      {/* Quick Amount Buttons */}
      <View style={styles.quickButtonsContainer}>
        <TouchableOpacity 
          onPress={() => setAmount('5000')}
          style={styles.quickButton}
        >
          <Text style={styles.quickButtonText}>₦5,000</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setAmount('15000')}
          style={styles.quickButton}
        >
          <Text style={styles.quickButtonText}>₦15,000</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setAmount('25000')}
          style={styles.quickButton}
        >
          <Text style={styles.quickButtonText}>₦25,000</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.content, {marginTop: 32}]}>
        {/* Keypad */}
        <View style={styles.keypadContainer}>
          {/* Row 1 */}
          <View style={styles.keypadRow}>
            {['1', '2', '3'].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num)}
                style={styles.keypadButton}
              >
                <Text style={styles.keypadText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 2 */}
          <View style={styles.keypadRow}>
            {['4', '5', '6'].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num)}
                style={styles.keypadButton}
              >
                <Text style={styles.keypadText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 3 */}
          <View style={styles.keypadRow}>
            {['7', '8', '9'].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num)}
                style={styles.keypadButton}
              >
                <Text style={styles.keypadText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 4 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity
              onPress={() => handleNumberPress('00')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadText}>00</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleNumberPress('0')}
              style={styles.keypadButton}
            >
              <Text style={styles.keypadText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBackspace}
              style={styles.keypadButton}
            >
              <Ionicons name="backspace-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Done Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleDone}
            disabled={!amount || amount === '0'}
            style={[
              styles.button,
              !amount || amount === '0' ? styles.buttonDisabled : styles.buttonEnabled
            ]}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Withdrawal Options Modal */}
      {showOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Withdrawal Method</Text>
            
            <TouchableOpacity
              onPress={() => handleOptionSelect('cash')}
              style={styles.optionButton}
            >
              <Ionicons name="cash-outline" size={24} color="#2563EB" />
              <Text style={styles.optionText}>Cash Withdrawal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOptionSelect('transfer')}
              style={styles.optionButton}
            >
              <Ionicons name="card-outline" size={24} color="#2563EB" />
              <Text style={styles.optionText}>Bank Transfer</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowOptions(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default WithdrawalTypeScreen; 