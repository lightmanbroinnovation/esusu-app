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
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { checkPhoneNumberAvailability } from '../../services/api';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function Signup() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.dark;
  
  // Use back button handler for signup page
  useBackButtonHandler('/signup');
  
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Theme-aware colors
  const backgroundColor = isDark ? '#1a1a1a' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const textSecondaryColor = isDark ? '#B0B0B0' : '#4F4F4F';
  const inputBgColor = isDark ? '#2a2a2a' : '#F4F4F5';
  const borderColor = isDark ? '#404040' : '#E0E0E0';
  const iconColor = isDark ? '#FFFFFF' : '#000000';

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
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={{ flex: 1, backgroundColor: backgroundColor }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: backgroundColor,
            paddingTop: insets.top + getResponsiveSize(16),
            paddingBottom: insets.bottom + getResponsiveSize(16),
            paddingHorizontal: getResponsiveSize(24),
          }}
        >
          {/* Header */}
          <View style={{ 
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: getResponsiveSize(24)
          }}>
            <TouchableOpacity
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                padding: getResponsiveSize(8)
              }}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} color={iconColor} />
            </TouchableOpacity>
            <Text style={{ 
              fontWeight: '600',
              fontSize: getResponsiveSize(16),
              color: textColor
            }}>Step 1 of 4</Text>
          </View>

          {message && (
            <View style={{ 
              marginBottom: getResponsiveSize(16), 
              padding: getResponsiveSize(12), 
              backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF', 
              borderRadius: getResponsiveSize(8) 
            }}>
              <Text style={{ 
                color: messageType === 'error' ? '#D92D20' : '#0072CE', 
                textAlign: 'center',
                fontSize: getResponsiveSize(14)
              }}>{message}</Text>
            </View>
          )}

          <View style={{ marginTop: getResponsiveSize(32) }}>
            <Text style={{ 
              fontSize: getResponsiveSize(24),
              fontWeight: 'bold',
              color: '#0072CE',
              marginBottom: getResponsiveSize(8)
            }}>
              Let's Get Started!
            </Text>
            <Text style={{ 
              fontSize: getResponsiveSize(16),
              color: textSecondaryColor
            }}>
              We'll send a verification code to your phone number and email to secure your account.
            </Text>
          </View>

          {/* Phone Number Input */}
          <View style={{ marginTop: getResponsiveSize(32) }}>
            <Text style={{ 
              fontSize: getResponsiveSize(14),
              color: textSecondaryColor,
              marginBottom: getResponsiveSize(4)
            }}>Phone Number *</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* NG Flag + Code */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: getResponsiveSize(12),
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: getResponsiveSize(8),
                paddingHorizontal: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(12),
                backgroundColor: inputBgColor
              }}>
                <Image
                  source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                  style={{
                    width: getResponsiveSize(24),
                    height: getResponsiveSize(18),
                    borderRadius: 2,
                    marginRight: getResponsiveSize(6),
                  }}
                />
                <Text style={{ 
                  fontSize: getResponsiveSize(16),
                  color: textSecondaryColor
                }}>NGN</Text>
              </View>

              {/* Phone input */}
              <TextInput
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={textSecondaryColor}
                style={{
                  flex: 1,
                  fontSize: getResponsiveSize(16),
                  color: textColor,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: getResponsiveSize(8),
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  backgroundColor: inputBgColor
                }}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={{ marginTop: getResponsiveSize(24) }}>
            <Text style={{ 
              fontSize: getResponsiveSize(14),
              color: textSecondaryColor,
              marginBottom: getResponsiveSize(4)
            }}>Email Address *</Text>
            <TextInput
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={textSecondaryColor}
              style={{
                fontSize: getResponsiveSize(16),
                color: textColor,
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: getResponsiveSize(8),
                paddingHorizontal: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(12),
                backgroundColor: inputBgColor
              }}
            />
          </View>

          {/* Sign up text */}
          <Text style={{ 
            color: textSecondaryColor,
            marginVertical: getResponsiveSize(8),
            fontSize: getResponsiveSize(14)
          }}>
            Already have an account?{" "}
            <Text style={{ 
              color: '#0072CE',
              fontWeight: '600'
            }}
                 onPress={() => router.push("/login")}>Login</Text>
          </Text>

          {/* Spacer to push button down */}
          <View style={{ 
            flex: 1,
            justifyContent: 'flex-end',
            paddingBottom: getResponsiveSize(16)
          }}>
            {/* Continue Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#0072CE',
                paddingVertical: getResponsiveSize(16),
                borderRadius: getResponsiveSize(8),
                opacity: loading ? 0.7 : 1
              }}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ 
                  color: 'white',
                  fontSize: getResponsiveSize(18),
                  marginRight: getResponsiveSize(8),
                  fontWeight: '600'
                }}>Continue</Text>
              )}
              {!loading && <MaterialIcons name="arrow-forward" size={getResponsiveSize(18)} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
