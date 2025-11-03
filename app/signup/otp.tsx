export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Correct import
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { verifyOtp } from '../../services/api'; // Add this import if not present
import { useBackButtonHandler } from '../utils/backButtonHandler';
import { StyleSheet } from 'react-native';

export default function PasscodeScreen() {
  const router = useRouter();
  
  // Use back button handler for signup OTP page
  useBackButtonHandler('/signup/otp');
  
  const { width, height } = Dimensions.get('window');
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [showKeypad, setShowKeypad] = useState<boolean>(false); // State to toggle keypad visibility
  const [loading, setLoading] = useState(false); // Add loading state
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(240); // 4 minutes in seconds
  const [canResend, setCanResend] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber || params.phone;
  const email = params.email;

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

  // Timer effect for resend functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(240); // Reset to 4 minutes
    setMessageWithTimeout("Verification code resent successfully!", "info", 4000);
    
    // TODO: Implement actual resend API call here
    console.log("Resending verification code...");
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleVerify = async () => {
    if (pin.length === 6) {
      setLoading(true); // Start loading
      try {
        // Call the server to verify the OTP
        const response = await verifyOtp(phoneNumber, pin);
        console.log('OTP verify response:', response);
        if (response.status === 'Success') {
          setMessageWithTimeout(response.data?.message || response.message || 'Verification successful!', 'info', 4000);
                  // Proceed to next step after a short delay
        setTimeout(() => {
          router.push({
            pathname: "/signup/passcode",
            params: { phoneNumber, email, verificationCode: pin },
          });
        }, 1000);
        } else {
          setMessageWithTimeout(response.data?.message || response.message || 'Invalid verification code.', 'error', 4000);
        }
      } catch (error) {
        console.error('OTP verify error:', error);
        const err: any = error;
        if (err && typeof err === 'object') {
          if (err.response && err.response.data && err.response.data.message) {
            setMessageWithTimeout(err.response.data.message, 'error', 4000);
          } else if (err.message) {
            setMessageWithTimeout(err.message, 'error', 4000);
          } else {
            setMessageWithTimeout('Could not connect to the server. Please try again.', 'error', 4000);
          }
        } else if (typeof err === 'string') {
          setMessageWithTimeout(err, 'error', 4000);
        } else {
          setMessageWithTimeout('Could not connect to the server. Please try again.', 'error', 4000);
        }
      } finally {
        setLoading(false);
      }
    } else {
      Vibration.vibrate(100);
      setMessageWithTimeout("Please enter the complete verification code", "info", 4000);
    }
  };

  const renderPinInputs = () => {
    return (
      <View style={[styles.pinContainer, { marginTop: getResponsiveSize(24) }]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setShowKeypad(true)}
            style={[
              styles.pinInput,
              {
                width: getResponsiveSize(48),
                height: getResponsiveSize(48),
                borderRadius: getResponsiveSize(8),
                marginRight: getResponsiveSize(8),
                borderColor: i < pin.length ? "#0072CE" : "#ccc",
              }
            ]}
          >
            <Text style={[styles.pinText, { fontSize: getResponsiveSize(20) }]}>{pin[i] || ""}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "✓"];
    return (
      <View style={[styles.keypad, { marginTop: getResponsiveSize(40) }]}>
        {Array(4)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} style={[styles.keypadRow, { marginBottom: getResponsiveSize(8) }]}>
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (key === "x") handleBackspace();
                    else if (key === "✓") handleVerify();
                    else handleKeyPress(key);
                  }}
                  style={[styles.keypadButton, {
                    width: getResponsiveSize(56),
                    height: getResponsiveSize(56),
                    borderRadius: getResponsiveSize(28)
                  }]}
                >
                  {key === "x" ? (
                    <Ionicons name="backspace-outline" size={getResponsiveSize(30)} color="#0072CE" />
                  ) : key === "✓" ? (
                    <MaterialIcons name="check-circle" size={getResponsiveSize(30)} color="#0072CE" />
                  ) : (
                    <Text style={[styles.keypadText, { fontSize: getResponsiveSize(30) }]}>{key}</Text>
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
        <View
          style={[styles.container, {
            paddingBottom: insets.bottom + getResponsiveSize(40),
            paddingHorizontal: getResponsiveSize(24)
          }]}
        >
          {/* Back Button */}
          <View style={[styles.headerContainer, {
            marginTop: getResponsiveSize(48),
            marginBottom: getResponsiveSize(16)
          }]}>
            <TouchableOpacity
              style={[styles.backButton, { padding: getResponsiveSize(8) }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
            </TouchableOpacity>
            <Text style={[styles.stepText, { fontSize: getResponsiveSize(16) }]}>Step 2 of 4</Text>
          </View>

          {/* Main Content */}
          <View style={[styles.contentContainer, { marginTop: getResponsiveSize(32) }]}>
            <Text style={[styles.title, { fontSize: getResponsiveSize(24) }]}>Enter Verification Code</Text>
            <Text style={[styles.subtitle, {
              fontSize: getResponsiveSize(16),
              marginTop: getResponsiveSize(8),
              marginBottom: getResponsiveSize(24)
            }]}>
              Check your messages for a 6-digit code sent to your number
            </Text>

            {/* Verification Code Info */}
            <View style={[styles.infoBox, {
              padding: getResponsiveSize(16),
              marginBottom: getResponsiveSize(24),
              borderRadius: getResponsiveSize(8)
            }]}>
              <Text style={[styles.infoTitle, {
                fontSize: getResponsiveSize(16),
                marginBottom: getResponsiveSize(8)
              }]}>
                ⚠️ IMPORTANT: Code Expires in 4 Minutes
              </Text>
              <Text style={[styles.infoText, { fontSize: getResponsiveSize(14) }]}>
                Use <Text style={styles.boldText}>347*359*6#</Text> to quickly check your verification code
              </Text>
            </View>

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

            {/* Resend Code Section */}
            <View style={[styles.resendContainer, { marginTop: getResponsiveSize(16) }]}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={[styles.resendText, { fontSize: getResponsiveSize(14) }]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.timerContainer}>
                  <Text style={[styles.timerText, { fontSize: getResponsiveSize(12) }]}>
                    Resend code in
                  </Text>
                  <Text style={[styles.timerCount, { fontSize: getResponsiveSize(18) }]}>
                    {formatTime(resendTimer)}
                  </Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity>
              <Text style={[styles.loginText, {
                fontSize: getResponsiveSize(14),
                marginVertical: getResponsiveSize(8)
              }]}>
                Already have an account?{" "}
                <Text style={styles.loginLink}>Login</Text>
              </Text>
            </TouchableOpacity>

            {/* Spacer to push button down */}
            <View style={styles.spacer} />

            {/* Continue Button */}
            <View style={[styles.buttonContainer, {
              marginTop: getResponsiveSize(16),
              marginBottom: getResponsiveSize(16)
            }]}>
              <TouchableOpacity
                style={[styles.continueButton, {
                  paddingVertical: getResponsiveSize(16),
                  borderRadius: getResponsiveSize(8),
                  opacity: loading ? 0.7 : 1
                }]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.continueButtonText, { fontSize: getResponsiveSize(18) }]}>
                    Verify and Continue
                  </Text>
                )}
                {!loading && <MaterialIcons name="arrow-forward" size={getResponsiveSize(18)} color="white" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Keypad */}
          {showKeypad && (
            <View style={styles.keypadContainer}>
              {renderKeypad()}
            </View>
          )}
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
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    marginLeft: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    color: '#4F4F4F',
  },
  infoBox: {
    backgroundColor: '#E5F1FF',
    borderWidth: 1,
    borderColor: '#0072CE',
  },
  infoTitle: {
    color: '#1E40AF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoText: {
    color: '#1E40AF',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pinInput: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
  },
  pinText: {
    fontWeight: 'bold',
    color: '#0072CE',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    color: '#0072CE',
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    color: '#4F4F4F',
  },
  timerCount: {
    color: '#0072CE',
    fontWeight: 'bold',
  },
  loginText: {
    color: '#4F4F4F',
    textAlign: 'center',
  },
  loginLink: {
    color: '#0072CE',
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
  },
  continueButtonText: {
    color: 'white',
    marginRight: 8,
    fontWeight: '600',
  },
  keypadContainer: {
    marginTop: 'auto',
  },
  keypad: {
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadButton: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontWeight: '600',
    color: '#0072CE',
  },
});