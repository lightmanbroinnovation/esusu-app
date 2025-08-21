import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ImageBackground, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { sendNotification, NotificationTemplates } from '../services/notificationService';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function Success() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const isContributor = params.contributor === 'true';

  // Use back button handler for contributor success page
  useBackButtonHandler('/contributor/success');

  useEffect(() => {
    let isSubscribed = true;

    const startSuccessFlow = async () => {
      if (!isContributor) {
        dispatch(addNotification({
          type: 'success',
          title: 'Registration Successful',
          body: 'Your account has been created successfully!'
        }));
        await sendNotification(
          NotificationTemplates.registration.success('User').title,
          NotificationTemplates.registration.success('User').body,
          NotificationTemplates.registration.success('User').type
        );
      }
    };
    startSuccessFlow();
    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleDone = async () => {
    try {
      setLoading(true);
      if (isContributor) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    } catch (error) {
      console.error('Error navigating:', error);
      Alert.alert(
        "Error",
        "There was a problem navigating. Please try again.",
        [{
          text: "OK",
          onPress: () => isContributor ? router.replace("/dashboard") : router.replace("/login")
        }]
      );
    } finally {
      setLoading(false);
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
            {isContributor ? "Contributor profile created successfully!" : "You're All Set!"}
          </Text>
          <Text className="text-center text-gray-600 px-4 mb-4">
            {isContributor
              ? "The contributor profile has been created. You can now manage their savings plan."
              : "Your Esusu POS Operator account has been successfully created. Please log in to continue."}
          </Text>
        </ImageBackground>
      </View>
      {loading ? (
        <View className="w-full bg-[#0072CE] py-4 rounded-lg mb-6 flex-row justify-center items-center">
          <ActivityIndicator color="white" size="small" />
          <Text className="text-white font-bold text-center ml-2">
            {isContributor ? "Finishing..." : "Preparing Login..."}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          className="w-full bg-[#0072CE] py-4 rounded-lg mb-6"
          onPress={handleDone}
          disabled={loading}
        >
          <Text className="text-white font-bold text-center">
            {isContributor ? "Done" : "Go to Login"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
