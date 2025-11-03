import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ImageBackground, SafeAreaView, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVerificationStatus, updateUser } from '../../services/api';

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  successIconContainer: {
    backgroundColor: '#DCFCE7',
    borderRadius: 9999,
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1F2937',
  },
  subtitle: {
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 32,
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  debugButtonText: {
    color: '#374151',
  },
  warningButton: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  warningButtonText: {
    color: '#92400E',
  },
  debugInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

const VerificationSuccess = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Load userId on mount
    AsyncStorage.getItem('userId').then(id => {
      if (id) {
        setUserId(id);
        console.log('Success screen loaded with userId:', id);
      }
    });
  }, []);

  const checkVerificationStatus = async () => {
    try {
      // Get current userId
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setDebugInfo('No userId found in AsyncStorage');
        return;
      }
      
      // Get verification status
      const status = await getVerificationStatus(userId);
      setDebugInfo(JSON.stringify(status, null, 2));
      console.log('VERIFICATION STATUS:', status);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fixVerificationStatus = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'No user ID found');
        return;
      }

      // Default verification data
      const verificationData = {
        government_id: "https://res.cloudinary.com/daskmqzyy/image/upload/v1/verification_documents/placeholder_id.jpg",
        business_img: "https://res.cloudinary.com/daskmqzyy/image/upload/v1/business_locations/placeholder_store.jpg",
        verify_business: true,
        verificationStatus: 'pending'
      };

      // Update the user directly
      await updateUser(userId, verificationData);
      
      // Also update AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        const updatedUserData = {
          ...userData,
          ...verificationData
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      }
      
      Alert.alert('Success', 'Verification status manually updated');
      checkVerificationStatus(); // Refresh status display
    } catch (error) {
      console.error('Error fixing verification:', error);
      Alert.alert('Error', `Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const navigateToLogin = () => {
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark" size={48} color="#16A34A" />
        </View>
        
        <Text style={styles.title}>
          Verification Submitted
        </Text>
        
        <Text style={styles.subtitle}>
          Your business verification has been submitted successfully. Our team will review your information and update you shortly.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={navigateToLogin}
        >
          <Text style={styles.buttonText}>
            Continue to Dashboard
          </Text>
        </TouchableOpacity>

        {/* Debug section */}
        <View style={styles.debugContainer}>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={checkVerificationStatus}
          >
            <Text style={styles.debugButtonText}>Check Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.warningButton}
            onPress={fixVerificationStatus}
          >
            <Text style={styles.warningButtonText}>Fix Status</Text>
          </TouchableOpacity>
        </View>

        {debugInfo ? (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>{debugInfo}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default VerificationSuccess;
