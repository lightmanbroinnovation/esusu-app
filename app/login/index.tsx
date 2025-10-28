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
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
    >
      <View
        className="flex-1 bg-white px-6"
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
            onPress={() => router.replace('/')}
              style={{ padding: getResponsiveSize(8) }}
          >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
          </TouchableOpacity>
        </View>
        
          <View style={{ marginTop: getResponsiveSize(24) }}>
            <Text className="text-2xl font-bold text-[#0072CE] mb-2" style={{ fontSize: getResponsiveSize(24) }}>
            Welcome Back!
          </Text>
            <Text className="text-base text-[#4F4F4F]" style={{ fontSize: getResponsiveSize(16) }}>
            Log in to manage savings, track earnings, and grow your business.
          </Text>
        </View>

        {/* Input */}
        <View style={{ marginTop: getResponsiveSize(32) }}>
          <Text className="text-sm text-[#4F4F4F] mb-1" style={{ fontSize: getResponsiveSize(14) }}>
            {loginMethod === 'phone' ? 'Phone Number' : 'Email Address'}
          </Text>
          
          {loginMethod === 'phone' ? (
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
                <Text className="text-base text-[#BDBDBD]" style={{ fontSize: getResponsiveSize(16) }}>
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
              className="text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
              placeholderTextColor="#BDBDBD"
              style={{
                paddingHorizontal: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(12),
                borderRadius: getResponsiveSize(8),
                fontSize: getResponsiveSize(16)
              }}
            />
          )}
          
          {/* Error message */}
          {error ? (
            <Text className="text-red-500 mt-2" style={{ fontSize: getResponsiveSize(14) }}>{error}</Text>
          ) : null}
        </View>
        
        {/* Dynamic sign in method text */}
        <TouchableOpacity onPress={toggleLoginMethod}>
          <Text className="text-[#0072CE] mt-4 mb-2 text-center font-medium" style={{ fontSize: getResponsiveSize(14) }}>
            {loginMethod === 'phone' ? 'Sign in with email' : 'Sign in with phone number'}
          </Text>
        </TouchableOpacity>
        
        {/* Sign up text */}
          <Text className="text-[#4F4F4F] my-2" style={{ fontSize: getResponsiveSize(14) }}>
          Don't have an account?{" "}
          <Text 
            className="text-[#0072CE] font-semibold"
            onPress={() => router.push("/signup")}
          >
            Sign up
          </Text>
        </Text>

        {/* Spacer to push button down */}
          <View className="flex-1 justify-end" style={{ paddingBottom: getResponsiveSize(16) }}>
          {/* Continue Button */}
          <TouchableOpacity
            className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
            onPress={handleContinue}
            disabled={loading}
              style={{
                paddingVertical: getResponsiveSize(16),
                borderRadius: getResponsiveSize(8),
                opacity: loading ? 0.7 : 1
              }}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                  <Text className="text-white text-lg mr-2 font-semibold" style={{ fontSize: getResponsiveSize(18) }}>
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
