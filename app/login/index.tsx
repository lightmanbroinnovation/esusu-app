import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries


export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Create responsive styles function
  const getStyles = (): any => ({
    scrollView: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      paddingTop: insets.top + getResponsiveSize(16),
      paddingBottom: insets.bottom + getResponsiveSize(16),
      paddingHorizontal: getResponsiveSize(24),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: getResponsiveSize(24),
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: getResponsiveSize(8),
    },
    titleContainer: {
      marginTop: getResponsiveSize(24),
    },
    title: {
      fontSize: getResponsiveSize(24),
      fontWeight: 'bold',
      color: '#0072CE',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: getResponsiveSize(16),
      color: '#4F4F4F',
    },
    inputContainer: {
      marginTop: getResponsiveSize(32),
    },
    inputLabel: {
      fontSize: getResponsiveSize(14),
      color: '#4F4F4F',
      marginBottom: 4,
    },
    phoneInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: getResponsiveSize(8),
      paddingHorizontal: getResponsiveSize(12),
      paddingVertical: getResponsiveSize(12),
      backgroundColor: '#F4F4F5',
    },
    flagImage: {
      width: getResponsiveSize(24),
      height: getResponsiveSize(18),
      borderRadius: 2,
      marginRight: getResponsiveSize(6),
    },
    flagText: {
      fontSize: getResponsiveSize(16),
      color: '#BDBDBD',
    },
    textInput: {
      flex: 1,
      fontSize: getResponsiveSize(16),
      color: '#1A1A1A',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: getResponsiveSize(8),
      paddingHorizontal: getResponsiveSize(12),
      paddingVertical: getResponsiveSize(12),
      backgroundColor: '#F4F4F5',
    },
    emailInput: {
      fontSize: getResponsiveSize(16),
      color: '#1A1A1A',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: getResponsiveSize(8),
      paddingHorizontal: getResponsiveSize(12),
      paddingVertical: getResponsiveSize(12),
      backgroundColor: '#F4F4F5',
    },
    errorText: {
      color: '#EF4444',
      marginTop: 8,
      fontSize: getResponsiveSize(14),
    },
    toggleMethodText: {
      color: '#0072CE',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
      fontWeight: '500',
      fontSize: getResponsiveSize(14),
    },
    signUpContainer: {
      marginVertical: 8,
      fontSize: getResponsiveSize(14),
      color: '#4F4F4F',
    },
    signUpLink: {
      color: '#0072CE',
      fontWeight: '600',
    },
    buttonContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingBottom: getResponsiveSize(16),
    },
    continueButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0072CE',
      paddingVertical: getResponsiveSize(16),
      borderRadius: getResponsiveSize(8),
      opacity: loading ? 0.7 : 1,
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontSize: getResponsiveSize(18),
      marginRight: 8,
      fontWeight: '600',
    },
  });



  // Note: Removed auto-redirect to allow users to access login page even with existing token
  // Users should be able to re-authenticate or switch accounts if needed

  const handleContinue = async () => {
    console.log("[Login] handleContinue called with:", loginMethod === 'phone' ? phone : email);
    
    if (loginMethod === 'phone') {
      // Validate phone number (must be 11 digits)
      if (!phone || phone.length !== 11) {
        setError("Please enter a valid 11-digit phone number");
        return;
      }
    } else {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        setError("Please enter a valid email address");
        return;
      }
    }
    
    setLoading(true);
    setError("");
    try {
      console.log("[Login] Navigating to passcode with:", loginMethod === 'phone' ? phone : email);
      // Navigate to passcode screen, pass phone or email as param
      router.push({
        pathname: "/login/passcode",
        params: { 
          [loginMethod]: loginMethod === 'phone' ? phone : email,
          loginMethod 
        }
      });
      console.log("[Login] Navigation to passcode attempted");
    } catch (error) {
      console.error("[Login] Navigation error:", error);
      setError("An error occurred. Please try again.");
      Alert.alert("Navigation Error", "Failed to navigate to passcode screen. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone');
    setPhone("");
    setEmail("");
    setError("");
  };

  const dynamicStyles = getStyles();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={dynamicStyles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
    >
        <View style={dynamicStyles.container}>
        {/* Header */}
          <View style={dynamicStyles.header}>
          <TouchableOpacity
              style={dynamicStyles.backButton}
            onPress={() => router.replace('/')}
          >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        
          <View style={dynamicStyles.titleContainer}>
            <Text style={dynamicStyles.title}>
            Welcome Back!
          </Text>
            <Text style={dynamicStyles.subtitle}>
            Log in to manage savings, track earnings, and grow your business.
          </Text>
        </View>

        {/* Input */}
          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.inputLabel}>
            {loginMethod === 'phone' ? 'Phone Number' : 'Email Address'}
          </Text>
          
          {loginMethod === 'phone' ? (
              <View style={dynamicStyles.phoneInputRow}>
              {/* NG Flag + Code */}
                <View style={dynamicStyles.flagContainer}>
                <Image
                  source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                    style={dynamicStyles.flagImage}
                />
                  <Text style={dynamicStyles.flagText}>
                  NGN
                </Text>
              </View>

              {/* Phone input */}
              <TextInput
                placeholder="Enter phone number"
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setError("");
                  console.log("[Login] User entered phone:", text);
                }}
                placeholderTextColor="#BDBDBD"
                  style={dynamicStyles.textInput}
              />
            </View>
          ) : (
            /* Email input */
            <TextInput
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError("");
                console.log("[Login] User entered email:", text);
              }}
              placeholderTextColor="#BDBDBD"
                style={dynamicStyles.emailInput}
            />
          )}
          
          {/* Error message */}
          {error ? (
              <Text style={dynamicStyles.errorText}>{error}</Text>
          ) : null}
        </View>
        
        {/* Dynamic sign in method text */}
        <TouchableOpacity onPress={toggleLoginMethod}>
            <Text style={dynamicStyles.toggleMethodText}>
            {loginMethod === 'phone' ? 'Sign in with email' : 'Sign in with phone number'}
          </Text>
        </TouchableOpacity>
        
        {/* Sign up text */}
          <Text style={dynamicStyles.signUpContainer}>
          Don't have an account?{" "}
          <Text 
              style={dynamicStyles.signUpLink}
            onPress={() => router.push("/signup")}
          >
            Sign up
          </Text>
        </Text>

        {/* Spacer to push button down */}
          <View style={dynamicStyles.buttonContainer}>
          {/* Continue Button */}
          <TouchableOpacity
              style={dynamicStyles.continueButton}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                  <Text style={dynamicStyles.continueButtonText}>
                  Continue
                </Text>
                  <MaterialIcons name="arrow-forward" size={getResponsiveSize(18)} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
