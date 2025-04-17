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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interface for params
interface UserParams {
  [key: string]: string | number | string[] | null | undefined;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  pin?: string;
  business?: string;
  address?: string;
  city?: string;
  state?: string;
  gender?: string;
  dob?: string;
  bvn?: string;
  idImage?: string;
  cacImage?: string;
  biometricEnabled?: string;
}

export default function SecurityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as UserParams;
  
  // State for biometric availability
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  
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
      console.log(`Device biometric compatibility: ${compatible ? 'Yes' : 'No'}`);
      console.log(`User has enrolled biometrics: ${enrolled ? 'Yes' : 'No'}`);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const activateBiometric = async () => {
    try {
      setIsActivating(true);
      
      // Attempt authentication to verify it works
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to activate biometric login',
        fallbackLabel: 'Use PIN instead',
      });
      
      if (result.success) {
        // Save biometric status to AsyncStorage
        await AsyncStorage.setItem('biometricEnabled', 'true');
        
        // Get all user data from params to pass to next screen
        console.log('===== SECURITY SCREEN - PASSING DATA TO SUCCESS =====');
        const userData: UserParams = { 
          ...params, 
          biometricEnabled: 'true',
          hasBiometric: 'true'
        };
        
        // Log the data being passed (omitting sensitive data)
        console.log('Data being passed to success screen:', JSON.stringify({
          ...userData,
          idImage: userData.idImage ? String(userData.idImage).substring(0, 30) + "..." : "missing",
          cacImage: userData.cacImage ? String(userData.cacImage).substring(0, 30) + "..." : "missing",
        }, null, 2));
        console.log('==============================================');
        
        // Navigate to success with all user data
        router.push({
          pathname: "/signup/success",
          params: userData,
        });
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

  const skipBiometric = async () => {
    try {
      // Save biometric status to AsyncStorage
      await AsyncStorage.setItem('biometricEnabled', 'false');
      
      // Navigate to success without enabling biometrics
      console.log('===== SECURITY SCREEN - PASSING DATA TO SUCCESS =====');
      const userData: UserParams = { 
        ...params, 
        biometricEnabled: 'false',
        hasBiometric: 'false'
      };
      
      // Log the data being passed (omitting sensitive data)
      console.log('Data being passed to success screen:', JSON.stringify({
        ...userData,
        idImage: userData.idImage ? String(userData.idImage).substring(0, 30) + "..." : "missing",
        cacImage: userData.cacImage ? String(userData.cacImage).substring(0, 30) + "..." : "missing",
      }, null, 2));
      console.log('==============================================');
      
      router.push({
        pathname: "/signup/success",
        params: userData,
      });
    } catch (error) {
      console.error('Error saving biometric status:', error);
      Alert.alert(
        "Error",
        "There was a problem saving your preferences. Please try again."
      );
    }
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
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="fingerprint" size={120} color="#FFFFFF" />
        </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>Secure & Fast Login</Text>
              <Text style={styles.subtitle}>
                Use your fingerprint for quicker access to your account.
                It's faster and more secure than traditional PIN codes.
        </Text>
      </View>

            <View style={styles.buttonContainer}>
              {isBiometricAvailable ? (
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
                    <Text style={styles.skipButtonText}>Skip for Now</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.notAvailableContainer}>
                  <Text style={styles.notAvailableText}>
                    Biometric authentication is not available on your device.
          </Text>
                  <TouchableOpacity 
                    style={styles.continueButton} 
                    onPress={skipBiometric}
                  >
                    <Text style={styles.continueButtonText}>Continue to PIN Setup</Text>
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
});
