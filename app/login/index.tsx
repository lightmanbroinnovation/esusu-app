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
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";


export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { width, height } = Dimensions.get('window');
  const isDark = theme.dark;
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Theme-aware colors
  const backgroundColor = isDark ? '#1a1a1a' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const textSecondaryColor = isDark ? '#B0B0B0' : '#4F4F4F';
  const inputBgColor = isDark ? '#2a2a2a' : '#F4F4F5';
  const borderColor = isDark ? '#404040' : '#E0E0E0';
  const iconColor = isDark ? '#FFFFFF' : '#000000';

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.container, {
          paddingTop: insets.top + getResponsiveSize(16),
          paddingBottom: insets.bottom + getResponsiveSize(16),
        }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: getResponsiveSize(24) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.titleContainer, { marginTop: getResponsiveSize(24) }]}>
          <Text style={[styles.title, { fontSize: getResponsiveSize(24) }]}>
            Welcome Back!
          </Text>
          <Text style={[styles.subtitle, { fontSize: getResponsiveSize(16) }]}>
            Log in to manage savings, track earnings, and grow your business.
          </Text>
        </View>

        {/* Input */}
        <View style={[styles.inputWrapper, { marginTop: getResponsiveSize(32) }]}>
          <Text style={[styles.inputLabel, { fontSize: getResponsiveSize(14) }]}>
            {loginMethod === 'phone' ? 'Phone Number' : 'Email Address'}
          </Text>
          
          {loginMethod === 'phone' ? (
            <View style={styles.phoneInputRow}>
              {/* NG Flag + Code */}
              <View style={[
                styles.flagContainer, 
                { 
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8)
                }
              ]}>
                <Image
                  source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                  style={styles.flagImage}
                />
                <Text style={[styles.flagText, { fontSize: getResponsiveSize(16) }]}>
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
                style={[
                  styles.textInput,
                  {
                    paddingHorizontal: getResponsiveSize(12),
                    paddingVertical: getResponsiveSize(12),
                    borderRadius: getResponsiveSize(8),
                    fontSize: getResponsiveSize(16)
                  }
                ]}
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
              style={[
                styles.emailInput,
                {
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8),
                  fontSize: getResponsiveSize(16)
                }
              ]}
            />
          )}
          
          {/* Error message */}
          {error ? (
            <Text style={[styles.errorText, { fontSize: getResponsiveSize(14) }]}>{error}</Text>
          ) : null}
        </View>
        
        {/* Dynamic sign in method text */}
        <TouchableOpacity onPress={toggleLoginMethod}>
          <Text style={[styles.toggleMethodText, { fontSize: getResponsiveSize(14) }]}>
            {loginMethod === 'phone' ? 'Sign in with email' : 'Sign in with phone number'}
          </Text>
        </TouchableOpacity>
        
        {/* Sign up text */}
        <Text style={[styles.signUpText, { fontSize: getResponsiveSize(14) }]}>
          Don't have an account?{" "}
          <Text 
            style={styles.signUpLinkText}
            onPress={() => router.push("/signup")}
          >
            Sign up
          </Text>
        </Text>

        {/* Spacer to push button down */}
        <View style={[styles.buttonContainer, { paddingBottom: getResponsiveSize(16) }]}>
          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                paddingVertical: getResponsiveSize(16),
                borderRadius: getResponsiveSize(8),
                ...(loading && styles.disabledButton)
              }
            ]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={[styles.continueButtonText, { fontSize: getResponsiveSize(18) }]}>
                  Continue
                </Text>
                <MaterialIcons 
                  name="arrow-forward" 
                  size={getResponsiveSize(18)} 
                  color="white" 
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  titleContainer: {
    marginTop: 24,
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
    marginTop: 32,
  },
  inputLabel: {
    fontSize: 14,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
  },
  flagImage: {
    width: 24,
    height: 18,
    borderRadius: 2,
    marginRight: 6,
  },
  flagText: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
  },
  emailInput: {
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
  },
  errorText: {
    color: '#EF4444',
    marginTop: 8,
    fontSize: 14,
  },
  toggleMethodText: {
    color: '#0072CE',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  signUpContainer: {
    marginVertical: 8,
    fontSize: 14,
    color: '#4F4F4F',
  },
  signUpLink: {
    color: '#0072CE',
    fontWeight: '600',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
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
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 8,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  inputWrapper: {
    marginTop: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0072CE',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4F4F4F',
  },
  signUpText: {
    color: '#4F4F4F',
    marginVertical: 8,
    fontSize: 14,
  },
  signUpLinkText: {
    color: '#0072CE',
    fontWeight: '600',
  },
});
