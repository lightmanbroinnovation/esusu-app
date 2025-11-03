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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { getOtpByPhone } from "../../services/api";
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A369D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F4F4F',
    marginBottom: 8,
  },
  inputContainer: {
    marginTop: 32,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4F4F4F',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  flag: {
    width: 24,
    height: 18,
    borderRadius: 2,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#0A369D',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: '#0072CE',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginText: {
    color: '#4F4F4F',
    textAlign: 'center',
    marginTop: 16,
  },
  loginLink: {
    color: '#0072CE',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function ResetPasscode() {
  const router = useRouter();
  
  // Use back button handler for reset page
  useBackButtonHandler('/reset');
  
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState(params.phone as string || "");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // State to track keyboard visibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [networkAvailable, setNetworkAvailable] = useState(true);

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

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleContinue = async () => {
    // Validate phone
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send POST request to getOtp endpoint
      const res = await fetch('https://esusu-server.onrender.com/api/merchant/getOtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone })
      });
      let data = null;
      let text = '';
      try {
        text = await res.text();
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('JSON parse error:', jsonErr, 'Response text:', text);
        setError('Server error: Invalid response format.');
        setLoading(false);
        return;
      }
      console.log('getOtp response:', data);
      // Navigate to OTP page, passing phone as param
      router.push({
        pathname: "/reset/otp",
        params: { phone }
      });
    } catch (error: any) {
      console.error("Reset error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    router.replace('/login');
  }

  if (loading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !phone) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No network. Please connect to the internet to load reset page.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={handlePreviousPage}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0A369D', marginBottom: 8 }}></Text>
        </View>

        <View style={{ marginTop: 32 }}>
          <Text style={styles.title}>Reset Your Passcode</Text>
          <Text style={styles.subtitle}>
            Enter your registered phone number to receive a reset code.
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCodeContainer}>
              <Image
                source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                style={styles.flag}
              />
              <Text style={styles.countryCodeText}>NGN</Text>
            </View>

            <TextInput
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setError("");
              }}
              style={styles.phoneInput}
              placeholderTextColor="#BDBDBD"
            />
          </View>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>

        {/* Spacer to push button down */}
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 40 }}>
          {/* Continue Button */}
          {!isKeyboardVisible && ( // Hide button when keyboard is visible
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!phone || loading) && styles.disabledButton
              ]}
              onPress={handleContinue}
              disabled={!phone || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
