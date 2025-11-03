import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ImageBackground, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { sendNotification, NotificationTemplates } from '../services/notificationService';
import { useBackButtonHandler } from '../utils/backButtonHandler';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'flex-start',
    padding: 0,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  checkImage: {
    width: 112,
    height: 112,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0072CE',
  },
  subtitle: {
    textAlign: 'center',
    color: '#4B5563',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  loadingButton: {
    width: '100%',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 8,
  },
  doneButton: {
    width: '100%',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

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
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <View style={styles.contentContainer}>
        <ImageBackground
          source={require("../assets/images/success.png")}
          style={[styles.imageBackground, { height: 460 }]}
          resizeMode="contain"
        >
          <Image
            source={require("../assets/images/check.png")}
            style={styles.checkImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            {isContributor ? "Contributor profile created successfully!" : "You're All Set!"}
          </Text>
          <Text style={styles.subtitle}>
            {isContributor
              ? "The contributor profile has been created. You can now manage their savings plan."
              : "Your Esusu POS Operator account has been successfully created. Please log in to continue."}
          </Text>
        </ImageBackground>
      </View>
      {loading ? (
        <View style={styles.loadingButton}>
          <ActivityIndicator color="white" size="small" />
          <Text style={styles.loadingButtonText}>
            {isContributor ? "Finishing..." : "Preparing Login..."}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          disabled={loading}
        >
          <Text style={styles.doneButtonText}>
            {isContributor ? "Done" : "Go to Login"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
