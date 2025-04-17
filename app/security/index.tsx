import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchUser, updateUser } from '../../services/api';

interface UserDetails {
  id: string;
  biometricEnabled?: boolean;
  // ... other user fields
}

export default function SecurityScreen() {
  const router = useRouter();
  
  // State for biometric availability and user data
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  
  // Check if user is logged in and get their ID
  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          Alert.alert('Error', 'Please log in to continue');
          router.replace('/login');
          return;
        }
        setUserId(storedUserId);
        
        // Fetch user details
        const userData = await fetchUser(storedUserId);
        setUserDetails(userData);
        setIsBiometricEnabled(!!userData.biometricEnabled);
        
        console.log('User details loaded:', {
          userId: storedUserId,
          biometricEnabled: userData.biometricEnabled
        });
      } catch (error) {
        console.error('Error checking user:', error);
        Alert.alert('Error', 'Failed to verify user session');
      }
    };
    
    checkUser();
  }, []);

  // Check if biometric auth is available
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setIsChecking(true);
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      setIsBiometricAvailable(compatible && enrolled);
      console.log('Biometric status:', {
        biometricEnabled: isBiometricEnabled,
        hasHardware: compatible,
        isEnrolled: enrolled
      });
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const activateBiometric = async () => {
    if (!userId || !userDetails) {
      Alert.alert('Error', 'User session not found');
      return;
    }

    try {
      setIsActivating(true);
      
      // Attempt authentication to verify it works
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to activate biometric login',
        fallbackLabel: 'Use PIN instead',
      });
      
      if (result.success) {
        // Update user details in the backend first
        await updateUser(userId, { biometricEnabled: true });
        
        // Then update AsyncStorage
        await AsyncStorage.setItem('biometricEnabled', 'true');
        
        // Update local state
        setIsBiometricEnabled(true);
        setUserDetails({ ...userDetails, biometricEnabled: true });
        
        Alert.alert(
          'Success',
          'Biometric login has been activated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(
          "Authentication Failed", 
          "We couldn't authenticate you using biometrics. Please try again or skip for now."
        );
      }
    } catch (error) {
      console.error('Error activating biometric:', error);
      Alert.alert(
        "Error", 
        "There was a problem setting up biometric authentication."
      );
    } finally {
      setIsActivating(false);
    }
  };

  const deactivateBiometric = async () => {
    if (!userId || !userDetails) {
      Alert.alert('Error', 'User session not found');
      return;
    }

    try {
      setIsActivating(true);
      
      // Update user details in the backend first
      await updateUser(userId, { biometricEnabled: false });
      
      // Then update AsyncStorage
      await AsyncStorage.setItem('biometricEnabled', 'false');
      
      // Update local state
      setIsBiometricEnabled(false);
      setUserDetails({ ...userDetails, biometricEnabled: false });
      
      Alert.alert(
        'Success',
        'Biometric login has been deactivated.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error deactivating biometric:', error);
      Alert.alert(
        "Error", 
        "There was a problem updating your settings."
      );
    } finally {
      setIsActivating(false);
    }
  };

  const skipBiometric = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isChecking ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Checking device compatibility...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="fingerprint" size={120} color="#FFFFFF" />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>Secure & Fast Login</Text>
              {isBiometricEnabled ? (
                <Text style={styles.subtitle}>
                  Biometric login is currently active on your account.
                  You can use your fingerprint to log in quickly and securely.
                </Text>
              ) : (
                <Text style={styles.subtitle}>
                  Use your fingerprint for quicker access to your account.
                  It's faster and more secure than traditional PIN codes.
                </Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {isBiometricAvailable ? (
                isBiometricEnabled ? (
                  // Show deactivate button if biometric is enabled
                  <TouchableOpacity
                    style={styles.deactivateButton} 
                    onPress={deactivateBiometric}
                    disabled={isActivating}
                  >
                    {isActivating ? (
                      <ActivityIndicator size="small" color="#0072CE" />
                    ) : (
                      <Text style={styles.deactivateButtonText}>Deactivate Biometric Login</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  // Show activate and skip buttons if biometric is not enabled
                  <>
                    <TouchableOpacity
                      style={styles.activateButton} 
                      onPress={activateBiometric}
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <ActivityIndicator size="small" color="#0072CE" />
                      ) : (
                        <Text style={styles.activateButtonText}>Activate Now</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.skipButton} 
                      onPress={skipBiometric}
                      disabled={isActivating}
                    >
                      <Text style={styles.skipButtonText}>Not Now</Text>
                    </TouchableOpacity>
                  </>
                )
              ) : (
                <View style={styles.notAvailableContainer}>
                  <Text style={styles.notAvailableText}>
                    Biometric authentication is not available on your device.
                    Please ensure you have set up fingerprint or face recognition in your device settings.
                  </Text>
                  <TouchableOpacity 
                    style={styles.continueButton} 
                    onPress={skipBiometric}
                  >
                    <Text style={styles.continueButtonText}>Go Back</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.arrowIcon} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0072CE',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  activateButtonText: {
    color: '#0072CE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notAvailableContainer: {
    width: '100%',
    alignItems: 'center',
  },
  notAvailableText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  deactivateButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  deactivateButtonText: {
    color: '#DC2626', // Red color for deactivate
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 