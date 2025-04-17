import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ImageBackground, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUser, registerUser } from "../../services/api";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

export default function Success() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [autoLoginInProgress, setAutoLoginInProgress] = useState(false);
  const [userData, setUserData] = useState<{ id: string } | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Register user and fetch user data when component mounts
  useEffect(() => {
    let isSubscribed = true; // For cleanup

    const registerAndGetUserData = async () => {
      // Prevent multiple simultaneous calls
      if (loading || registering) return;
      
      try {
        console.log('===== SUCCESS SCREEN - REGISTRATION PROCESS =====');
        
        // Check if we need to register the user
        if (!params.registered && Object.keys(params).length > 0) {
          if (!isSubscribed) return;
          setRegistering(true);
          
          // Parse verification data if it was passed as a string
          let verificationData = null;
          if (params.verification_data_string) {
            try {
              verificationData = JSON.parse(String(params.verification_data_string));
              console.log('Parsed verification data from string:', verificationData);
            } catch (parseError) {
              console.error('Error parsing verification data:', parseError);
            }
          }
          
          // Prepare the user data for registration
          const userRegistrationData = {
            firstname: params.firstname,
            lastname: params.lastname,
            email: params.email,
            phone: params.phone,
            phonenumber: params.phone, // Ensure we have phonenumber field
            pin: params.pin,
            business: params.business,
            address: params.address,
            city: params.city,
            state: params.state,
            gender: params.gender || "Not specified",
            dob: params.dob,
            bvn: params.bvn,
            idImage: params.idImage,
            cacImage: params.cacImage,
            hasBiometric: params.hasBiometric === 'true', // Convert string to boolean
            // Add verification data
            verification_data: verificationData || {
              government_id: params.idImage,
              business_document: params.cacImage,
              documentType: 'national_id'
            }
          };
          
          // Register the user
          const registeredUser = await registerUser(userRegistrationData);
          if (!isSubscribed) return;
          
          console.log('User registered successfully with ID:', registeredUser.id);
          
          // Set the user data
          setUserData(registeredUser);
          
          // Save the user ID to AsyncStorage
          await AsyncStorage.setItem('userId', registeredUser.id);
          
          // Show success notification
          dispatch(addNotification({
            type: 'success',
            title: 'Registration Successful',
            body: 'Your account has been created successfully!'
          }));
          
          // Start auto-login countdown
          if (isSubscribed) {
            startAutoLogin();
            setRegistering(false);
          }
        } else if (params.userId) {
          // If user is already registered, just fetch their data
          if (!isSubscribed) return;
          setLoading(true);
          
          console.log('User already registered with ID:', params.userId);
          const userId = params.userId as string;
          const fetchedUserData = await fetchUser(userId);
          
          if (!isSubscribed) return;
          setUserData(fetchedUserData);
          
          // Start auto-login countdown
          startAutoLogin();
        } else {
          console.warn('No user ID or registration data received, checking AsyncStorage');
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId && isSubscribed) {
            console.log('Found user ID in AsyncStorage:', storedUserId);
            setUserData({ id: storedUserId });
          } else {
            console.error('No user ID available for auto-login');
            // Show error notification
            dispatch(addNotification({
              type: 'error',
              title: 'Registration Error',
              body: 'Could not complete registration. Please try again.'
            }));
          }
        }
      } catch (error) {
        console.error('Error during registration or fetching user data:', error);
        if (isSubscribed) {
          // Show error notification
          dispatch(addNotification({
            type: 'error',
            title: 'Registration Error',
            body: 'There was a problem completing your registration. Please try again.'
          }));
          
          Alert.alert(
            "Registration Error", 
            "There was a problem completing your registration. Please try again.",
            [{ text: "OK" }]
          );
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setRegistering(false);
        }
      }
      console.log('============================================');
    };
    
    registerAndGetUserData();

    // Cleanup function
    return () => {
      isSubscribed = false;
    };
  }, []); // Empty dependency array since we only want this to run once on mount

  // Start auto-login countdown
  const startAutoLogin = () => {
    setAutoLoginInProgress(true);
    
    // Countdown from 5 to 0
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGoToDashboard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup timer on unmount
    return () => clearInterval(timer);
  };

  const handleGoToDashboard = async () => {
    try {
      setLoading(true);
      
      // Ensure the user ID is saved before redirecting
      if (userData?.id) {
        await AsyncStorage.setItem('userId', userData.id);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        
        console.log('===== NAVIGATING TO LOGIN =====');
        console.log('User registered successfully with ID:', userData.id);
        console.log('=====================================');
        
        // Navigate to login instead of dashboard
        router.replace("/login");
      } else {
        console.error('No user ID available for navigation');
        // Fallback to login if we don't have user data
        Alert.alert(
          "Error", 
          "Could not retrieve your account information. Please log in again.",
          [{ 
            text: "OK", 
            onPress: () => router.replace("/login")
          }]
        );
      }
    } catch (error) {
      console.error('Error navigating to login:', error);
      Alert.alert(
        "Error", 
        "There was a problem accessing the login screen. Please try again.",
        [{ 
          text: "OK", 
          onPress: () => router.replace("/login")
        }]
      );
    } finally {
      setLoading(false);
      setAutoLoginInProgress(false);
    }
  };

  return (
    <View
      className="flex-1 items-center bg-white px-4"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 items-start p-0">
        <ImageBackground
          source={require("../assets/images/success.png")}
          className="flex-1 justify-center items-center w-full"
          resizeMode="contain"
          style={{ height: 460 }}
        >
          <Image
            source={require("../assets/images/check.png")}
            className="w-28 h-28 mb-4"
            resizeMode="contain"
          />
          <Text
            className="text-2xl font-bold text-center text-primary mb-2"
            style={{ color: "#0072CE" }}
          >
            You're All Set!
          </Text>
          <Text className="text-center text-gray-600 px-4 mb-4">
            Your Esusu POS Operator account has been successfully created. Sign in to start
            earning by helping customers save today!
          </Text>
          
          {registering && (
            <Text className="text-center text-gray-500 italic">
              Completing your registration...
            </Text>
          )}
          
          {autoLoginInProgress && (
            <Text className="text-center text-gray-500 italic">
              Redirecting to login in {countdown} seconds...
            </Text>
          )}
        </ImageBackground>
      </View>
      
      {(loading || registering) ? (
        <View className="w-full bg-[#0072CE] py-4 rounded-lg mb-6 flex-row justify-center items-center">
          <ActivityIndicator color="white" size="small" />
          <Text className="text-white font-bold text-center ml-2">
            {registering ? "Completing Registration..." : "Preparing Login..."}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          className="w-full bg-[#0072CE] py-4 rounded-lg mb-6"
          onPress={handleGoToDashboard}
          disabled={loading || registering}
        >
          <Text className="text-white font-bold text-center">
            {autoLoginInProgress ? `Go to Login (${countdown})` : "Go to Login"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
