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
  Dimensions,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { checkPhoneNumberAvailability } from '../../services/api'; // Import the API function
import { useBackButtonHandler } from '../utils/backButtonHandler';
import { StyleSheet } from 'react-native';

export default function Signup() {
  const router = useRouter();
  
  // Use back button handler for signup page
  useBackButtonHandler('/signup');
  
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility
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

  const handleSignup = async () => {
    if (phone.length < 10) {
      setMessageWithTimeout("Please enter a valid 10-digit phone number.", "info", 3000);
      return;
    }

    if (!email.trim()) {
      setMessageWithTimeout("Please enter your email address.", "info", 3000);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailRegex.test(email.trim())) {
      setMessageWithTimeout("Please enter a valid Gmail address (must end with @gmail.com).", "info", 3000);
      return;
    }

    setLoading(true);
    try {
      // Format phone number - ensure it starts with '0' for Nigerian numbers
      let formattedPhone = phone;
      if (!phone.startsWith('0')) {
        formattedPhone = `0${phone}`;
      }
      console.log("Attempting to check phone number availability for:", formattedPhone);
      console.log("Email being sent:", email.trim());

      const response = await checkPhoneNumberAvailability(formattedPhone, email.trim());
      
      if (response.status === "Success" && response.data?.codeSent) {
        // Display success message and clear input data
        setMessageWithTimeout("Verification code sent successfully! Redirecting to OTP page...", "info", 3000);
        
        // Clear input data
        setPhone("");
        setEmail("");
        
        // Navigate to OTP page after a short delay to show the success message
        setTimeout(() => {
          router.push({ pathname: "/signup/otp", params: { phone: formattedPhone, email: email.trim() } });
        }, 2000);
      } else if (response.status === "Failed") {
        setMessageWithTimeout(response.data?.message || response.message || "Failed to send verification code. Please try again.", "error");
      } else {
        setMessageWithTimeout(response.data?.message || response.message || "Failed to send verification code. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error during phone number check:", error);
      const err: any = error;
      if (err && typeof err === 'object') {
        if (err.response && err.response.data && err.response.data.message) {
          setMessageWithTimeout(err.response.data.message, "error");
        } else if (err.message) {
          setMessageWithTimeout(err.message, "error");
        } else {
          setMessageWithTimeout("Could not connect to the server. Please check your internet connection and try again.", "error");
        }
      } else if (typeof err === 'string') {
        setMessageWithTimeout(err, "error");
      } else {
        setMessageWithTimeout("Could not connect to the server. Please check your internet connection and try again.", "error");
      }
    } finally {
      setLoading(false);
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
          paddingTop: insets.top + getResponsiveSize(16),
          paddingBottom: insets.bottom + getResponsiveSize(16),
          paddingHorizontal: getResponsiveSize(24),
        }]}>
          {/* Header */}
          <View style={[styles.header, { marginBottom: getResponsiveSize(24) }]}>
            <TouchableOpacity
              style={[styles.backButton, { padding: getResponsiveSize(8) }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
            </TouchableOpacity>
            <Text style={[styles.stepText, { fontSize: getResponsiveSize(16) }]}>Step 1 of 4</Text>
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

          <View style={[styles.headerTextContainer, { marginTop: getResponsiveSize(32) }]}>
            <Text style={[styles.title, { fontSize: getResponsiveSize(24) }]}>
              Let's Get Started!
            </Text>
            <Text style={[styles.subtitle, { fontSize: getResponsiveSize(16) }]}>
              We'll send a verification code to your phone number and email to secure your account.
            </Text>
          </View>

          {/* Phone Number Input */}
          <View style={[styles.inputContainer, { marginTop: getResponsiveSize(32) }]}>
            <Text style={[styles.inputLabel, { fontSize: getResponsiveSize(14) }]}>Phone Number *</Text>
            <View style={styles.phoneInputContainer}>
              {/* NG Flag + Code */}
              <View style={[styles.flagContainer, {
                paddingHorizontal: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(12),
                borderRadius: getResponsiveSize(8)
              }]}>
                <Image
                  source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                  style={[styles.flagImage, {
                    width: getResponsiveSize(24),
                    height: getResponsiveSize(18),
                    marginRight: getResponsiveSize(6),
                  }]}
                />
                <Text style={[styles.countryCode, { fontSize: getResponsiveSize(16) }]}>NGN</Text>
              </View>

              {/* Phone input */}
              <TextInput
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#BDBDBD"
                style={[styles.phoneInput, {
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8),
                  fontSize: getResponsiveSize(16)
                }]}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={[styles.inputContainer, { marginTop: getResponsiveSize(24) }]}>
            <Text style={[styles.inputLabel, { fontSize: getResponsiveSize(14) }]}>Email Address *</Text>
            <TextInput
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#BDBDBD"
              style={[styles.emailInput, {
                paddingHorizontal: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(12),
                borderRadius: getResponsiveSize(8),
                fontSize: getResponsiveSize(16)
              }]}
            />
          </View>

          {/* Sign up text */}
          <Text style={[styles.loginText, { fontSize: getResponsiveSize(14) }]}>
            Already have an account?{" "}
            <Text style={styles.loginLink} onPress={() => router.push("/login")}>Login</Text>
          </Text>

          {/* Spacer to push button down */}
          <View style={[styles.buttonContainer, { paddingBottom: getResponsiveSize(16) }]}>
            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, {
                paddingVertical: getResponsiveSize(16),
                borderRadius: getResponsiveSize(8),
                opacity: loading ? 0.7 : 1
              }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.continueButtonText, { fontSize: getResponsiveSize(18) }]}>Continue</Text>
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
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    textAlign: 'center',
  },
  headerTextContainer: {
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0072CE',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F4F4F',
  },
  inputContainer: {
    marginTop: 24,
  },
  inputLabel: {
    color: '#4F4F4F',
    marginBottom: 4,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F4F4F5',
    marginRight: 12,
  },
  flagImage: {
    borderRadius: 2,
  },
  countryCode: {
    color: '#BDBDBD',
  },
  phoneInput: {
    flex: 1,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F4F4F5',
  },
  emailInput: {
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F4F4F5',
  },
  loginText: {
    color: '#4F4F4F',
    marginVertical: 8,
  },
  loginLink: {
    color: '#0072CE',
    fontWeight: '600',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
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
});
