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
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { fetchUser } from '../../services/api';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import { useBackButtonHandler } from '../utils/backButtonHandler';

// User details interface
interface UserDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  fingerprint: boolean;
  // ... other user fields
}

const fetchSecurityData = async () => {
  const response = await fetchUser();
  if (response.status === 'Success' && response.data?.user) {
    return response.data.user;
  } else {
    throw new Error('Failed to fetch user data');
  }
};

export default function SecurityScreen() {
  const router = useRouter();
  
  // Use back button handler for security page
  useBackButtonHandler('/security');
  
  // State for biometric availability and user data
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // Check if biometric auth is available and fetch user data
  useEffect(() => {
    checkBiometricAvailability();
    fetchUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async () => {
    try {
      let cacheData = null;
      try {
        const cached = await AsyncStorage.getItem('security_user');
        if (cached) {
          cacheData = JSON.parse(cached);
          setUserDetails(cacheData);
          setIsBiometricEnabled(!!cacheData.fingerprint);
        }
      } catch {}
      
      if (!networkAvailable && cacheData) {
        return;
      }
      
      const data = await getCachedData('security_user', fetchSecurityData);
      setUserDetails(data);
      setIsBiometricEnabled(!!data.fingerprint);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

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
    try {
      setIsActivating(true);
      // Attempt authentication to verify it works
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to activate biometric login',
        fallbackLabel: 'Use PIN instead',
      });
      if (result.success) {
        // Send POST to set-fingerprint endpoint
        await fetch('https://esusu-server.onrender.com/api/merchant/set-fingerprint ', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: true })
        });
        setIsBiometricEnabled(true);
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
    try {
      setIsActivating(true);
      await fetch('https://esusu-server.onrender.com/api/merchant/set-fingerprint ', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: false })
      });
      setIsBiometricEnabled(false);
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

  if (isChecking) {
    return <EsusuLoader />;
  }

  if (!networkAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.notAvailableText}>
            No network. Please connect to the internet to load security settings.
          </Text>
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={skipBiometric}
          >
            <Text style={styles.continueButtonText}>Go Back</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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