export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  Alert,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { completeBasicSignup } from "../../services/api";
import { useDisableBackHandler } from '../utils/backButtonHandler';
import { StyleSheet } from 'react-native';

interface PasscodeParams {
  phone?: string;
  phoneNumber?: string;
  verificationCode?: string;
  gmail?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
}

export default function PasscodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber || params.phone;
  const email = params.email;
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);

  // Helper function to set message with auto-clear
  const setMessageWithTimeout = (msg: string, type: 'error' | 'info', timeoutMs: number = 4000) => {
    // Clear any existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }
    
    setMessage(msg);
    setMessageType(type);
    
    // Set new timeout to clear message
    const timeout = setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, timeoutMs);
    
    setMessageTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, [messageTimeout]);

  // Use disable back handler for passcode screen
  useDisableBackHandler();

  // Responsive sizing based on screen width
  const getResponsiveSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9; // Small phones
    } else if (width < 414) {
      return baseSize; // Medium phones
    } else {
      return baseSize * 1.1; // Large phones and tablets
    }
  };

  const handleKeyPress = (digit: string) => {
    if (isConfirming) {
      if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + digit);
      }
    } else {
      if (pin.length < 4) {
      setPin(pin + digit);
      }
    }
  };

  const handleBackspace = () => {
    if (isConfirming) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const renderPinInputs = () => {
    const currentPin = isConfirming ? confirmPin : pin;
    const maxLength = 4;

    return (
      <View style={styles.pinContainer}>
        {Array.from({ length: maxLength }, (_, index) => (
          <View
            key={index}
            style={[
              styles.pinDotContainer,
              {
                width: getResponsiveSize(48),
                height: getResponsiveSize(48),
                borderRadius: getResponsiveSize(8),
                borderWidth: getResponsiveSize(2),
                borderColor: index < currentPin.length ? "#0072CE" : "#E5E7EB",
                backgroundColor: index < currentPin.length ? "#0072CE" : 'transparent'
              }
            ]}
          >
            {index < currentPin.length && (
              <View
                style={[
                  styles.pinDot,
                  {
                    width: getResponsiveSize(12),
                    height: getResponsiveSize(12),
                    borderRadius: getResponsiveSize(6)
                  }
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const digits = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace']
    ];

    return (
      <View style={styles.keypadContainer}>
        {digits.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((digit, digitIndex) => (
              <TouchableOpacity
                key={digitIndex}
                style={[
                  styles.keypadButton,
                  {
                    width: getResponsiveSize(64),
                    height: getResponsiveSize(64),
                    borderRadius: getResponsiveSize(32),
                    backgroundColor: digit === 'backspace' ? '#E5E7EB' : digit === '' ? 'transparent' : '#F3F4F6'
                  }
                ]}
                onPress={() => {
                  if (digit === 'backspace') {
                    handleBackspace();
                  } else if (digit !== '') {
                    handleKeyPress(digit);
                  }
                }}
                disabled={digit === ''}
              >
                {digit === 'backspace' ? (
                  <Ionicons name="backspace-outline" size={getResponsiveSize(24)} color="#4B5563" />
                ) : digit !== '' ? (
                  <Text style={[styles.keypadDigit, { fontSize: getResponsiveSize(24) }]}>
                    {digit}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const handleSubmit = async () => {
    if (isConfirming) {
      if (confirmPin.length !== 4) {
        Vibration.vibrate(100);
        setMessageWithTimeout("Please enter a 4-digit PIN", "error", 3000);
        return;
      }

      if (pin === confirmPin) {
        setLoading(true);
        try {
          const userData = {
            phone: phoneNumber || '',
            email: email || '',
            firstName: params.firstName || '',
            lastName: params.lastName || '',
            dob: params.dob || '',
            pin: pin
          };

          console.log('Submitting user data:', userData);

                     const response = await completeBasicSignup(userData.phone, userData.email, Number(userData.pin));
          
          if (response.status === "Success") {
            setMessageWithTimeout("Registration successful! Redirecting to login...", "info", 2000);
            setTimeout(() => {
              router.replace("/login");
            }, 2000);
          } else {
            setMessageWithTimeout(response.data?.message || response.message || "Could not complete signup. Please try again.", "error", 4000);
          }
        } catch (error) {
          console.error("Error during basic signup:", error);
          const err: any = error;
          if (err && typeof err === 'object') {
            if (err.response && err.response.data && err.response.data.message) {
              setMessageWithTimeout(err.response.data.message, "error", 4000);
            } else if (err.message) {
              setMessageWithTimeout(err.message, "error", 4000);
            } else {
              setMessageWithTimeout("Failed to complete signup. Please check your network and try again.", "error", 4000);
            }
          } else if (typeof err === 'string') {
            setMessageWithTimeout(err, "error", 4000);
          } else {
            setMessageWithTimeout("Failed to complete signup. Please check your network and try again.", "error", 4000);
          }
        } finally {
          setLoading(false); // Stop loading
        }
      } else {
        Vibration.vibrate(100);
        setMessageWithTimeout("Passcodes do not match. Please try again.", "error", 4000);
        setConfirmPin("");
      }
    } else {
      if (pin.length !== 4) {
        Vibration.vibrate(100);
        setMessageWithTimeout("Please enter a 4-digit PIN", "error", 3000);
        return;
      }
      setIsConfirming(true);
      setMessageWithTimeout("Please confirm your PIN", "info", 3000);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, {
          paddingHorizontal: getResponsiveSize(24),
          paddingBottom: getResponsiveSize(40)
        }]}>
          {/* Header */}
          <View style={[styles.header, {
            marginTop: getResponsiveSize(64),
            marginBottom: getResponsiveSize(32)
          }]}>
            <TouchableOpacity
              style={[styles.backButton, { padding: getResponsiveSize(8) }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
            </TouchableOpacity>
            <Text style={[styles.stepText, { fontSize: getResponsiveSize(16) }]}>Step 3 of 4</Text>
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { fontSize: getResponsiveSize(24) }]}>
              {isConfirming ? "Confirm passcode" : "Create passcode"}
            </Text>
            <Text style={[styles.subtitle, { 
              fontSize: getResponsiveSize(16),
              marginTop: getResponsiveSize(8),
              marginBottom: getResponsiveSize(64)
            }]}>
              {isConfirming
                ? "Re-enter your PIN to make sure it's correct."
                : "Set a 4-digit PIN to protect your account"}
            </Text>

            {message && (
              <View style={[styles.messageContainer, {
                marginBottom: getResponsiveSize(16),
                padding: getResponsiveSize(12),
                backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF',
                borderRadius: getResponsiveSize(8)
              }]}>
                <Text style={[styles.messageText, {
                  color: messageType === 'error' ? '#D92D20' : '#0072CE',
                  fontSize: getResponsiveSize(14)
                }]}>{message}</Text>
              </View>
            )}

            {renderPinInputs()}
          </View>

          {/* Keypad */}
          {renderKeypad()}

          {/* Next or Complete Registration Button */}
          <View style={[styles.buttonContainer, { paddingBottom: getResponsiveSize(16) }]}>
            <TouchableOpacity
              style={[styles.submitButton, {
                paddingVertical: getResponsiveSize(16),
                borderRadius: getResponsiveSize(8),
                opacity: loading ? 0.7 : 1
              }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.buttonText, { fontSize: getResponsiveSize(18) }]}>
                  {isConfirming ? "Complete Registration" : "Next"}
                </Text>
              )}
              {!loading && <MaterialIcons name="arrow-forward" size={getResponsiveSize(18)} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    width: '100%',
  },
  messageText: {
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pinDotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  pinDot: {
    backgroundColor: '#fff',
  },
  keypadContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  keypadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  keypadDigit: {
    fontWeight: '600',
    color: '#1F2937',
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
  },
  buttonText: {
    color: 'white',
    marginRight: 8,
    fontWeight: '600',
  },
});