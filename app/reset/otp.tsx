import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Vibration, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { verifyOtp } from "../../services/api";
import { useBackButtonHandler } from '../utils/backButtonHandler';

export const options = {
  headerShown: false, // Hide the header
};

export default function OtpVerificationScreen() { 
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // State variables
  const [otp, setOtp] = useState<string>("");
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [showKeypad, setShowKeypad] = useState<boolean>(true);
  
  // Get params from previous screen
  const phone = params.phone as string;
  
  // Timer for resend code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);
  
  const handleKeyPress = (digit: string) => {
    if (otp.length < 4) {
      setOtp(otp + digit);
    }
  };
  
  const handleBackspace = () => {
    setOtp(otp.slice(0, -1));
  };
  
  const handleVerify = async () => {
    // Check if OTP is complete
    if (otp.length !== 4) {
      Alert.alert("Error", "Please enter the complete 4-digit code");
      return;
    }
    setLoading(true);
    try {
      // Use verifyOtp from services/api.js
      const response = await verifyOtp(phone, otp);
      console.log('verifyOtp response:', response);
      if (response && response.status === 'Success') {
        // On success, navigate to passcode reset page
        router.push({
          pathname: "/reset/passcode",
          params: { phone }
        });
      } else {
        Vibration.vibrate(300);
        let errorMsg = "The verification code you entered is incorrect. Please try again.";
        if (response && typeof response === 'object' && 'message' in response) {
          errorMsg = (response as Record<string, any>).message;
        }
        Alert.alert("Invalid Code", errorMsg);
        setOtp("");
      }
    } catch (error) {
      console.error('verifyOtp error:', error);
      Vibration.vibrate(300);
      let errorMsg = "The verification code you entered is incorrect. Please try again.";
      if (error instanceof Error && error.message) {
        errorMsg = error.message;
      }
      Alert.alert("Invalid Code", errorMsg);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = () => {
    if (resendTimer > 0) return;
    
    // Generate new OTP (simulated) - 4 digits instead of 6
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("New OTP generated:", newOtp);
    
    // Reset timer
    setResendTimer(30);
    
    // In production, this would send the new OTP via SMS
  };
  
  const renderPinInputs = () => {
    return (
      <View style={styles.pinContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View 
            key={i} 
            style={[
              styles.pinInput,
              i < otp.length && { borderColor: '#0072CE' },
              i === 3 && styles.lastPinInput
            ]}
          >
            <Text style={styles.keyText}>{otp[i] || ""}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
    return (
      <View style={styles.keypad}>
        {Array(4).fill(null).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key, keyIndex) => (
              key ? (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (key === "⌫") {
                      handleBackspace();
                    } else {
                      handleKeyPress(key);
                    }
                  }}
                  style={styles.key}
                  disabled={loading}
                >
                  {key === "⌫" ? (
                    <Ionicons name="backspace-outline" size={28} color="#0072CE" />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View key={`empty-${rowIndex}-${keyIndex}`} style={{ width: 64 }} />
              )
            ))}
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="#0A369D" />
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 2 of 3</Text>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a 4-digit code to your phone. Enter it below to continue.
        </Text>

        {/* OTP Input */}
        <View style={styles.pinContainer}>
          {[0, 1, 2, 3].map((i) => (
            <View 
              key={i}
              style={[
                styles.pinInput,
                i < otp.length && { borderColor: '#0072CE' },
                i === 3 && styles.lastPinInput
              ]}
            >
              <Text style={styles.keyText}>{otp[i] || ""}</Text>
            </View>
          ))}
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0072CE" />
          </View>
        )}

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {resendTimer > 0 
              ? `Resend code in ${resendTimer}s` 
              : "Didn't receive a code?"}
          </Text>
          <TouchableOpacity 
            style={[styles.resendButton, resendTimer > 0 && styles.disabledResend]}
            onPress={handleResendCode}
            disabled={resendTimer > 0}
          >
            <Text style={styles.resendButtonText}>Resend Code</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 40 }}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { opacity: loading || otp.length !== 4 ? 0.6 : 1 }
            ]}
            onPress={handleVerify}
            disabled={loading || otp.length !== 4}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  Verify and Continue   
                </Text>
                <MaterialIcons name="arrow-forward" size={18} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Keypad */}
        {showKeypad && renderKeypad()}
      </View>
    </View>
  );
}
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F4F4F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A369D',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F4F4F',
    textAlign: 'center',
    marginBottom: 32,
  },
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  pinInput: {
    width: 48,
    height: 48,
    textAlign: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#E0E0E0',
    backgroundColor: '#F4F4F5',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0072CE',
  },
  lastPinInput: {
    marginRight: 0,
  },
  keypad: {
    marginTop: 40,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  key: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0A369D',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    color: '#4F4F4F',
    fontSize: 14,
  },
  resendButton: {
    marginTop: 4,
  },
  resendButtonText: {
    color: '#0072CE',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledResend: {
    opacity: 0.5,
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
  },
  // Add any additional styles here if needed
});
