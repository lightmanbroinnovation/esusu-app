import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ImageBackground, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { sendNotification, NotificationTemplates } from '../services/notificationService';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function Success() {
  const router = useRouter();
  
  // Use back button handler for signup success page
  useBackButtonHandler('/signup/success');
  
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { width, height } = Dimensions.get('window');

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
    let isSubscribed = true;

    const startSuccessFlow = async () => {
      console.log('===== SUCCESS SCREEN - STARTING FLOW =====');
      
      // Show success notification
      dispatch(addNotification({
        type: 'success',
        title: 'Registration Successful',
        body: 'Your account has been created successfully!'
      }));
      // Device notification
      await sendNotification(
        NotificationTemplates.registration.success('User').title,
        NotificationTemplates.registration.success('User').body,
        NotificationTemplates.registration.success('User').type
      );
      
      console.log('============================================');
    };
    
    startSuccessFlow();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleGoToLogin = async () => {
    try {
      setLoading(true);
      router.replace("/login");
    } catch (error) {
      console.error('Error navigating to login:', error);
      Alert.alert(
        "Error",
        "There was a problem accessing the login page. Please try again.",
        [{
          text: "OK",
          onPress: () => router.replace("/login")
        }]
      );
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
          className="flex-1 items-center bg-white px-4"
          style={{ 
            paddingTop: insets.top + getResponsiveSize(16), 
            paddingBottom: insets.bottom + getResponsiveSize(16),
            paddingHorizontal: getResponsiveSize(16)
          }}
        >
          <View className="flex-1 items-start p-0" style={{ width: '100%' }}>
            <ImageBackground
              source={require("../assets/images/success.png")}
              className="flex-1 justify-center items-center w-full"
              resizeMode="contain"
              style={{ 
                height: getResponsiveSize(460),
                width: '100%'
              }}
            >
              <Image
                source={require("../assets/images/check.png")}
                className="w-28 h-28 mb-4"
                resizeMode="contain"
                style={{
                  width: getResponsiveSize(112),
                  height: getResponsiveSize(112),
                  marginBottom: getResponsiveSize(16)
                }}
              />
              <Text
                className="text-2xl font-bold text-center text-primary mb-2"
                style={{ 
                  color: "#0072CE",
                  fontSize: getResponsiveSize(24),
                  marginBottom: getResponsiveSize(8)
                }}
              >
                You're All Set!
              </Text>
              <Text className="text-center text-gray-600 px-4 mb-4" style={{
                fontSize: getResponsiveSize(16),
                paddingHorizontal: getResponsiveSize(16),
                marginBottom: getResponsiveSize(16)
              }}>
                Your Esusu POS Operator account has been successfully created. Please log in to continue.
              </Text>
            </ImageBackground>
          </View>
          
          {loading ? (
            <View className="w-full bg-[#0072CE] py-4 rounded-lg mb-6 flex-row justify-center items-center" style={{
              paddingVertical: getResponsiveSize(16),
              marginBottom: getResponsiveSize(24),
              borderRadius: getResponsiveSize(8)
            }}>
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-bold text-center ml-2" style={{
                fontSize: getResponsiveSize(16),
                marginLeft: getResponsiveSize(8)
              }}>
                Preparing Login...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              className="w-full bg-[#0072CE] py-4 rounded-lg mb-6"
              onPress={handleGoToLogin}
              disabled={loading}
              style={{
                paddingVertical: getResponsiveSize(16),
                marginBottom: getResponsiveSize(24),
                borderRadius: getResponsiveSize(8)
              }}
            >
              <Text className="text-white font-bold text-center" style={{ fontSize: getResponsiveSize(16) }}>
                Go to Login
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
