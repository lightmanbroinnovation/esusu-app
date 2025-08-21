export const options = {
    headerShown: false, // Hide the header
  };
  
  import React, { useState, useEffect } from "react";
  import { View, Text, TouchableOpacity, Vibration, Alert, ActivityIndicator } from "react-native";
  import { useSafeAreaInsets } from "react-native-safe-area-context";
  import { useRouter, useLocalSearchParams } from "expo-router";
  import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
  import { verifyOtp } from "../../services/api";
import { useBackButtonHandler } from '../utils/backButtonHandler';
  
  export default function OtpVerificationScreen() {
    const router = useRouter();
    
    // Use back button handler for reset OTP page
    useBackButtonHandler('/reset/otp');
    
    const [otp, setOtp] = useState<string>(""); // State for the entered OTP
    const [showKeypad, setShowKeypad] = useState<boolean>(true); // State to toggle keypad visibility
    const [loading, setLoading] = useState<boolean>(false);
    const [resendTimer, setResendTimer] = useState(30); // 30 second timer for resend
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
  
    // Get params from previous screen
    const phone = params.phone as string;
  
    // Timer for resend code
    useEffect(() => {
      if (resendTimer > 0) {
        const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        return () => clearTimeout(timer);
      }
    }, [resendTimer]);
  
    const handleKeyPress = (digit: string) => {
      if (otp.length < 4) {
        setOtp(otp + digit);
      }
    };
  
    const handleBackspace = () => {
      setOtp(otp.slice(0, -1));
    };
  
    const handleVerify = async () => {
      // Check if OTP is complete
      if (otp.length !== 4) {
        Alert.alert("Error", "Please enter the complete 4-digit code");
        return;
      }
      setLoading(true);
      try {
        // Use verifyOtp from services/api.js
        const response = await verifyOtp(phone, otp);
        console.log('verifyOtp response:', response);
        if (response && response.status === 'Success') {
          // On success, navigate to passcode reset page
          router.push({
            pathname: "/reset/passcode",
            params: { phone }
          });
        } else {
          Vibration.vibrate(300);
          let errorMsg = "The verification code you entered is incorrect. Please try again.";
          if (response && typeof response === 'object' && 'message' in response) {
            errorMsg = (response as Record<string, any>).message;
          }
          Alert.alert("Invalid Code", errorMsg);
          setOtp("");
        }
      } catch (error) {
        console.error('verifyOtp error:', error);
        Vibration.vibrate(300);
        let errorMsg = "The verification code you entered is incorrect. Please try again.";
        if (error instanceof Error && error.message) {
          errorMsg = error.message;
        }
        Alert.alert("Invalid Code", errorMsg);
        setOtp("");
      } finally {
        setLoading(false);
      }
    };
  
    const handleResendCode = () => {
      if (resendTimer > 0) return;
      
      // Generate new OTP (simulated) - 4 digits instead of 6
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log("New OTP generated:", newOtp);
      
      // Reset timer
      setResendTimer(30);
      
      // In production, this would send the new OTP via SMS
      Alert.alert("Code Resent", "A new verification code has been sent to your phone");
    };
  
    const renderPinInputs = () => {
      return (
        <View className="flex-row items-center justify-center space-x-4 mt-6">
          {[0, 1, 2, 3].map((i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setShowKeypad(true)} // Show keypad when clicked
              className="w-12 h-12 text-center mr-2 justify-center items-center border rounded-lg"
              style={{
                borderColor: i < otp.length ? "#0072CE" : "#ccc",
                backgroundColor: "#F4F4F5"
              }}
            >
              <Text className="text-xl font-bold text-[#0072CE]">{otp[i] || ""}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    };
  
    const renderKeypad = () => {
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
      return (
        <View className="mt-10 space-y-4 w-full">
          {Array(4)
            .fill(null)
            .map((_, rowIndex) => (
              <View key={rowIndex} className="flex-row justify-around">
                {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                  key ? (
                    <TouchableOpacity
                      key={key}
                      onPress={() => {
                        if (key === "⌫") {
                          handleBackspace();
                        } else {
                          handleKeyPress(key);
                        }
                      }}
                      className="w-20 h-20 bg-white justify-center items-center rounded-full"
                      style={{ 
                        opacity: loading ? 0.6 : 1,
                      }}
                      disabled={loading}
                    >
                      {key === "⌫" ? (
                        <Ionicons name="backspace-outline" size={28} color="#0072CE" />
                      ) : (
                        <Text className="text-3xl font-semibold text-[#0072CE]">{key}</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View key={`empty-${rowIndex}-${Math.random()}`} className="w-20 h-20" />
                  )
                ))}
              </View>
            ))}
        </View>
      );
    };
  
    return (
      <View className="flex-1 bg-white px-6 pb-10">
        {/* Back Button */}
        <View className="flex-row items-center justify-between mt-6 mb-4">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text className="font-semibold">Step 2 of 3</Text>
        </View>
  
        {/* Main Content */}
        <View className="flex-1 mt-8">
          <Text className="text-[24px] font-bold text-primaryText text-center">Enter Verification Code</Text>
          <Text className="text-gray-500 mt-2 mb-6 text-center">
            We've sent a 4-digit code to your phone. Enter it below to continue.
          </Text>
  
          {renderPinInputs()}
  
          {loading && (
            <ActivityIndicator size="large" color="#0072CE" className="mt-6" />
          )}
  
          <TouchableOpacity 
            className="mt-4" 
            onPress={handleResendCode}
            disabled={resendTimer > 0}
          >
            <Text 
              className={`text-center p-2 ${resendTimer > 0 ? 'text-gray-400' : 'text-[#0072CE]'}`}
            >
              {resendTimer > 0 
                ? `Resend code in ${resendTimer}s` 
                : "Resend Code"}
            </Text>
          </TouchableOpacity>
         
          <View className="flex-1 justify-end pb-4">
            {/* Continue Button */}
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleVerify}
              disabled={loading || otp.length !== 4}
              style={{
                opacity: loading || otp.length !== 4 ? 0.6 : 1
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text className="text-white text-lg mr-2 font-semibold">
                    Verify and Continue   
                  </Text>
                  <MaterialIcons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
  
        {/* Keypad */}
        {showKeypad && renderKeypad()}
      </View>
    );
  }