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
  Platform,
  StyleSheet
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
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.container,
            { 
              paddingTop: insets.top + getResponsiveSize(16), 
              paddingBottom: insets.bottom + getResponsiveSize(16),
              paddingHorizontal: getResponsiveSize(16)
            }
          ]}
        >
          <View style={[styles.contentContainer, { width: '100%' }]}>
            <ImageBackground
              source={require("../assets/images/success.png")}
              style={[
                styles.imageBackground,
                { 
                  height: getResponsiveSize(460),
                }
              ]}
              resizeMode="contain"
            >
              <Image
                source={require("../assets/images/check.png")}
                style={[
                  styles.checkIcon,
                  {
                    width: getResponsiveSize(112),
                    height: getResponsiveSize(112),
                    marginBottom: getResponsiveSize(16)
                  }
                ]}
                resizeMode="contain"
              />
              <Text style={[
                styles.successTitle,
                { 
                  fontSize: getResponsiveSize(24),
                  marginBottom: getResponsiveSize(8)
                }
              ]}>
                You're All Set!
              </Text>
              <Text style={[
                styles.successMessage,
                {
                  fontSize: getResponsiveSize(16),
                  paddingHorizontal: getResponsiveSize(16),
                  marginBottom: getResponsiveSize(16)
                }
              ]}>
                Your Esusu POS Operator account has been successfully created. Please log in to continue.
              </Text>
            </ImageBackground>
          </View>
          
          {loading ? (
            <View style={[
              styles.loadingButton,
              {
                paddingVertical: getResponsiveSize(16),
                marginBottom: getResponsiveSize(24),
                borderRadius: getResponsiveSize(8)
              }
            ]}>
              <ActivityIndicator color="white" size="small" />
              <Text style={[
                styles.loadingButtonText,
                {
                  fontSize: getResponsiveSize(16),
                  marginLeft: getResponsiveSize(8)
                }
              ]}>
                Preparing Login...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  paddingVertical: getResponsiveSize(16),
                  marginBottom: getResponsiveSize(24),
                  borderRadius: getResponsiveSize(8)
                }
              ]}
              onPress={handleGoToLogin}
              disabled={loading}
            >
              <Text style={[
                styles.loginButtonText,
                { fontSize: getResponsiveSize(16) }
              ]}>
                Go to Login
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  checkIcon: {
    width: 112,
    height: 112,
    marginBottom: 16,
  },
  successTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0072CE',
  },
  successMessage: {
    textAlign: 'center',
    color: '#4B5563',
    paddingHorizontal: 16,
  },
  loadingButton: {
    width: '100%',
    backgroundColor: '#0072CE',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#0072CE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
