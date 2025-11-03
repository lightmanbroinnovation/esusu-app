export const options = {
  headerShown: false, // Hide the header
};

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Vibration, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Correct import
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { validateIdentity } from "../../services/api";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    marginLeft: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0052CC',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
  },
  pinContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  pinInput: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
  },
  pinText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0072CE',
  },
  resendText: {
    color: '#4F4F4F',
    marginTop: 8,
  },
  loginText: {
    color: '#4F4F4F',
    marginVertical: 8,
  },
  loginLink: {
    color: '#0072CE',
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    marginRight: 8,
    fontWeight: '600',
  },
  keypadContainer: {
    marginTop: 40,
    gap: 8,
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: 56,
    height: 56,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0072CE',
  },
});

export default function PasscodeScreen() {
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(false); // State to toggle keypad visibility
  const [loading, setLoading] = useState(false); // Add loading state
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams(); // Retrieve the phone number from query params
  const dispatch = useDispatch();

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleVerify = async () => {
    if (pin.length === 4) {
      setLoading(true);
      try {
        const response = await validateIdentity({ otp: pin });
        
        if (response.status === 'Success') {
          dispatch(addNotification({
            type: 'success',
            title: 'Verification Successful',
            body: 'Your identity has been verified successfully.'
          }));
          
          router.push({
            pathname: "/verification/index",
            params: { phone, verificationCode: pin },
          });
        } else {
          throw new Error('Verification failed');
        }
      } catch (error) {
        console.error('Error in verification:', error);
        dispatch(addNotification({
          type: 'error',
          title: 'Verification Failed',
          body: 'There was an error verifying your code. Please try again.'
        }));
        Vibration.vibrate(100);
      } finally {
        setLoading(false);
      }
    } else {
      Vibration.vibrate(100);
      dispatch(addNotification({
        type: 'error',
        title: 'Invalid Code',
        body: 'Please enter the complete verification code.'
      }));
    }
  };

  const renderPinInputs = () => {
    return (
      <View style={styles.pinContainer}>
        {[0, 1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setShowKeypad(true)}
            style={[
              styles.pinInput,
              { borderColor: i < pin.length ? "#0072CE" : "#E0E0E0" }
            ]}
          >
            <Text style={styles.pinText}>{pin[i] || ""}</Text>
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
                    else if (key === "✓") handleVerify();
                    else handleKeyPress(key);
                  }}
                  style={styles.keypadButton}
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text style={styles.stepText}>Step 1 of 4</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            Check your messages for a 4-digit code sent to your number
          </Text>

          {renderPinInputs()}

          <TouchableOpacity>
            <Text style={styles.resendText}>Resend Code</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>

          {/* Spacer to push button down */}
          <View style={{ flex: 1 }} />

          {/* Continue Button */}
          <View style={{ marginTop: 16, marginBottom: 16 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Verify and Continue</Text>
              )}
              {!loading && <MaterialIcons name="arrow-forward" size={18} color="white" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Keypad */}
        {showKeypad && (
          <View style={{ marginTop: 'auto' }}>
            {renderKeypad()}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}