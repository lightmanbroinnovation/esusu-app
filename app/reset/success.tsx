export const options = {
  headerShown: false, // Hide the header
};

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function SuccessScreen() {
  const router = useRouter();
  
  // Use back button handler for reset success page
  useBackButtonHandler('/reset/success');
  
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const handleGoToLogin = () => {
    // Show success notification
    dispatch(addNotification({
      type: 'success',
      title: 'Passcode Reset Complete',
      body: 'Your passcode has been reset successfully. Please log in with your new passcode.'
    }));
    // Replace the entire navigation stack with the login screen
    router.replace("/login");
  };

  const { width, height } = Dimensions.get('window');
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
      {/* Confetti background as image */}
      <Image
        source={require('../assets/images/success.png')}
        style={styles.confettiBg}
        resizeMode="contain"
      />
      {/* Checkmark in green circle as image */}
      <View style={styles.checkContainer}>
        <Image
          source={require('../assets/images/check.png')}
          style={styles.checkImage}
          resizeMode="contain"
        />
      </View>
      {/* Title */}
      <Text style={styles.successTitle}>Passcode Reset Successfully!</Text>
      {/* Subtitle (dynamic) */}
      <Text style={styles.successSubtitle}>
        Your passcode has been reset successfully. You can now log in with your new passcode.
      </Text>
      {/* Go to Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  confettiBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  checkContainer: {
    marginTop: 120,
    marginBottom: 32,
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  checkImage: {
    width: 140,
    height: 140,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0A369D',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 12,
    zIndex: 2,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#22223B',
    textAlign: 'center',
    marginHorizontal: 24,
    marginBottom: 40,
    fontWeight: '400',
    zIndex: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '85%',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 32,
    position: 'absolute',
    bottom: 40,
    left: '7.5%',
    zIndex: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
