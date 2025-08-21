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
      // Format phone number with +234 prefix for the API call
      const formattedPhone = `0${phone.substring(1)}`; // Assuming phone starts with '0' e.g., 080xxxxxxxx
      console.log("Attempting to check phone number availability for:", formattedPhone);

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
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="flex-1 px-6"
          style={{
            paddingTop: insets.top + getResponsiveSize(16),
            paddingBottom: insets.bottom + getResponsiveSize(16),
            paddingHorizontal: getResponsiveSize(24),
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center" style={{ marginBottom: getResponsiveSize(24) }}>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.back()}
              style={{ padding: getResponsiveSize(8) }}
            >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
            </TouchableOpacity>
            <Text className="font-semibold" style={{ fontSize: getResponsiveSize(16) }}>Step 1 of 4</Text>
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
            <Text className="text-2xl font-bold text-[#0072CE] mb-2" style={{ fontSize: getResponsiveSize(24) }}>
              Let's Get Started!
            </Text>
            <Text className="text-base text-[#4F4F4F]" style={{ fontSize: getResponsiveSize(16) }}>
              We'll send a verification code to your phone number and email to secure your account.
            </Text>
          </View>

          {/* Phone Number Input */}
          <View style={{ marginTop: getResponsiveSize(32) }}>
            <Text className="text-sm text-[#4F4F4F] mb-1" style={{ fontSize: getResponsiveSize(14) }}>Phone Number *</Text>
            <View className="flex-row items-center">
              {/* NG Flag + Code */}
              <View className="flex-row items-center mr-3 border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]" style={{
                paddingHorizontal: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(12),
                borderRadius: getResponsiveSize(8)
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
                <Text className="text-base text-[#BDBDBD]" style={{ fontSize: getResponsiveSize(16) }}>NGN</Text>
              </View>

              {/* Phone input */}
              <TextInput
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={11} // Allow 11 digits for local Nigerian numbers starting with 0
                value={phone}
                onChangeText={setPhone}
                className="flex-1 text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
                placeholderTextColor="#BDBDBD"
                style={{
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8),
                  fontSize: getResponsiveSize(16)
                }}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={{ marginTop: getResponsiveSize(24) }}>
            <Text className="text-sm text-[#4F4F4F] mb-1" style={{ fontSize: getResponsiveSize(14) }}>Email Address *</Text>
            <TextInput
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              className="text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
              placeholderTextColor="#BDBDBD"
              style={{
                paddingHorizontal: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(12),
                borderRadius: getResponsiveSize(8),
                fontSize: getResponsiveSize(16)
              }}
            />
          </View>

          {/* Sign up text */}
          <Text className="text-[#4F4F4F] my-2" style={{ fontSize: getResponsiveSize(14) }}>
            Already have an account?{" "}
            <Text className="text-[#0072CE] font-semibold"
                 onPress={() => router.push("/login")}>Login</Text>
          </Text>

          {/* Spacer to push button down */}
          <View className="flex-1 justify-end" style={{ paddingBottom: getResponsiveSize(16) }}>
            {/* Continue Button */}
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleSignup}
              disabled={loading} // Disable button when loading
              style={{
                paddingVertical: getResponsiveSize(16),
                borderRadius: getResponsiveSize(8),
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-lg mr-2 font-semibold" style={{ fontSize: getResponsiveSize(18) }}>Continue</Text>
              )}
              {!loading && <MaterialIcons name="arrow-forward" size={getResponsiveSize(18)} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
