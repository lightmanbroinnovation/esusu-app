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
  ScrollView
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
            onPress={() => router.replace('/')}
          >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} color={iconColor} />
          </TouchableOpacity>
        </View>
        
          <View style={{ marginTop: getResponsiveSize(24) }}>
            <Text style={{ 
              fontSize: getResponsiveSize(24),
              fontWeight: 'bold',
              color: '#0072CE',
              marginBottom: getResponsiveSize(8)
            }}>
            Welcome Back!
          </Text>
            <Text style={{ 
              fontSize: getResponsiveSize(16),
              color: textSecondaryColor
            }}>
            Log in to manage savings, track earnings, and grow your business.
          </Text>
        </View>

        {/* Input */}
        <View style={{ marginTop: getResponsiveSize(32) }}>
          <Text style={{ 
            fontSize: getResponsiveSize(14),
            color: textSecondaryColor,
            marginBottom: getResponsiveSize(4)
          }}>
            {loginMethod === 'phone' ? 'Phone Number' : 'Email Address'}
          </Text>
          
          {loginMethod === 'phone' ? (
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
                }}>
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
          )}
          
          {/* Error message */}
          {error ? (
            <Text style={{ 
              fontSize: getResponsiveSize(14),
              color: '#FF5252',
              marginTop: getResponsiveSize(8)
            }}>{error}</Text>
          ) : null}
        </View>
        
        {/* Dynamic sign in method text */}
        <TouchableOpacity onPress={toggleLoginMethod}>
          <Text style={{ 
            color: '#0072CE',
            marginTop: getResponsiveSize(16),
            marginBottom: getResponsiveSize(8),
            textAlign: 'center',
            fontWeight: '500',
            fontSize: getResponsiveSize(14)
          }}>
            {loginMethod === 'phone' ? 'Sign in with email' : 'Sign in with phone number'}
          </Text>
        </TouchableOpacity>
        
        {/* Sign up text */}
          <Text style={{ 
            color: textSecondaryColor,
            marginVertical: getResponsiveSize(8),
            fontSize: getResponsiveSize(14)
          }}>
          Don't have an account?{" "}
          <Text 
            style={{ color: '#0072CE', fontWeight: '600' }}
            onPress={() => router.push("/signup")}
          >
            Sign up
          </Text>
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
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                  <Text style={{ 
                    color: 'white',
                    fontSize: getResponsiveSize(18),
                    marginRight: getResponsiveSize(8),
                    fontWeight: '600'
                  }}>
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
