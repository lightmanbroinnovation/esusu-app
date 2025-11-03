export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Vibration, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // Correct import
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUser } from "../../services/api";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonIcon: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  content: {
    flex: 1,
    marginTop: 32,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0074FF',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  amountContainer: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  amountLabel: {
    textAlign: 'center',
    color: '#4B5563',
  },
  amountValue: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  pinInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  pinInput: {
    width: 48,
    height: 48,
    textAlign: 'center',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
  },
  pinDot: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0072CE',
  },
  resendButton: {
    marginTop: 8,
    textAlign: 'center',
  },
  resendText: {
    color: '#0074FF',
    fontSize: 18,
    textAlign: 'center',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  continueButtonActive: {
    backgroundColor: '#0072CE',
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 8,
    fontWeight: '600',
  },
  keypadContainer: {
    marginTop: 40,
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keypadKey: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 30,
    fontWeight: '600',
    color: '#0072CE',
  },
});

export default function OTPScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(false); // State to toggle keypad visibility
  const [withdrawAmount, setWithdrawAmount] = useState<string>("0");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Fetch user ID and withdrawal amount from AsyncStorage
  useEffect(() => {
    const getData = async () => {
      try {
        const [storedUserId, storedAmount] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('withdrawAmount')
        ]);
        
        if (!storedUserId) {
          console.error('User ID not found in AsyncStorage');
          Alert.alert('Error', 'User ID not found. Please try again.');
        } else {
          setUserId(storedUserId);
        }
        
        if (storedAmount) {
          setWithdrawAmount(storedAmount);
        }
      } catch (error) {
        console.error('Error retrieving data from AsyncStorage:', error);
        Alert.alert('Error', 'Failed to load necessary data. Please try again.');
      }
    };
    
    getData();
  }, []);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      Vibration.vibrate(100);
      Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP.');
      return;
    }

    if (!userId || !withdrawAmount) {
      Alert.alert('Error', 'Unable to process withdrawal. Missing required information.');
      return;
    }

    setLoading(true);
    
    try {
      // In a real app, you would validate the OTP with your backend here
      // For this demo, we'll simulate a successful OTP verification
      
      // Simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After successful OTP verification, you would process the withdrawal
      // Here we'll just navigate to the success screen
      router.replace('/commission/success');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
      setLoading(false);
    }
  };

  const renderPinInputs = () => {
    return (
      <View style={styles.pinInputsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setShowKeypad(true)}
            style={[
              styles.pinInput,
              {
                borderColor: i < pin.length ? "#0072CE" : "#ccc",
              }
            ]}
          >
            <Text style={styles.pinDot}>{pin[i] ? "•" : ""}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "✓"];
    return (
      <View style={styles.keypadContainer}>
        {Array(4)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (key === "x") handleBackspace();
                    else if (key === "✓") {
                      if (pin.length === 4) {
                        handleSubmit();
                      } else {
                        Vibration.vibrate(100);
                      }
                    } else {
                      handleKeyPress(key);
                    }
                  }}
                  style={styles.keypadKey}
                  disabled={loading}
                >
                  {key === "x" ? (
                    <Ionicons name="backspace-outline" size={30} color="#0072CE" />
                  ) : key === "✓" ? (
                    <MaterialIcons name="check-circle" size={30} color="#0072CE" />
                  ) : (
                    <Text style={styles.keypadText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </View>
    );
  };

  // Format the amount for display
  const formattedAmount = Number(withdrawAmount).toLocaleString();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <View style={styles.backButtonIcon}>
            <Ionicons name="arrow-back" size={28} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>
          Enter the OTP sent to your registered phone number to complete your withdrawal.
        </Text>
        
        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Withdrawal Amount</Text>
          <Text style={styles.amountValue}>₦{formattedAmount}</Text>
        </View>

        {renderPinInputs()}

        <TouchableOpacity style={styles.resendButton} disabled={loading}>
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>
     
        <View style={styles.bottomContainer}>
          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (loading || pin.length !== 4) ? styles.continueButtonDisabled : styles.continueButtonActive
            ]}
            onPress={handleSubmit}
            disabled={loading || pin.length !== 4}
          >
            {loading && (
              <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.continueButtonText}>
              {loading ? 'Processing...' : 'Complete Withdrawal'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Keypad */}
      {showKeypad && renderKeypad()}
    </View>
  );
}