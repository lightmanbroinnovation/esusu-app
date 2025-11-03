export const options = {
  headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Vibration, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icon libraries
import { updatePasscode } from "../../services/api";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { useBackButtonHandler } from '../utils/backButtonHandler';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F4F4F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A369D',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F4F4F',
    textAlign: 'center',
    marginBottom: 32,
  },
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  pinDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotFilled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  keypad: {
    marginTop: 40,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  key: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0A369D',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default function PasscodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  
  // Use back button handler for reset passcode page
  useBackButtonHandler('/reset/passcode');
  
  const [pin, setPin] = useState<string>(""); // State for the entered PIN
  const [confirmPin, setConfirmPin] = useState<string>(""); // State for the confirmed PIN
  const [isConfirming, setIsConfirming] = useState<boolean>(false); // State to toggle between "Enter PIN" and "Confirm PIN"
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Get params from previous screen
  const phone = params.phone as string;

  const handleKeyPress = (digit: string) => {
    setError("");
    if (!isConfirming && pin.length < 4) {
      setPin(pin + digit);
    } else if (isConfirming && confirmPin.length < 4) {
      setConfirmPin(confirmPin + digit);
    }
  };

  const handleBackspace = () => {
    setError("");
    if (!isConfirming) {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  // Check if PIN is complete
  useEffect(() => {
    if (pin.length === 4 && !isConfirming) {
      // Auto-advance to confirm PIN when first PIN is complete
      setTimeout(() => {
        setIsConfirming(true);
      }, 500);
    }
  }, [pin]);

  // Check if confirmation PIN is complete
  useEffect(() => {
    if (confirmPin.length === 4 && isConfirming) {
      // Auto-check PINs when confirmation is complete
      handlePinConfirmation();
    }
  }, [confirmPin]);

  const handlePinConfirmation = () => {
    if (confirmPin === pin) {
      // PINs match, save the new PIN
      savePIN();
    } else {
      // PINs don't match
      Vibration.vibrate(300);
      Alert.alert(
        "PINs Don't Match",
        "The PINs you entered don't match. Please try again.",
        [{ text: "OK", onPress: () => {
          setPin("");
          setConfirmPin("");
          setIsConfirming(false);
        }}]
      );
    }
  };

  const savePIN = async () => {
    setLoading(true);
    try {
      // Send POST request to change-password endpoint
      const res = await fetch('https://esusu-server.onrender.com/api/merchant/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassCode: String(pin) })
      });
      let data = null;
      let text = '';
      try {
        text = await res.text();
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('JSON parse error:', jsonErr, 'Response text:', text);
        dispatch(addNotification({
          type: 'error',
          title: 'Update Failed',
          body: 'Server error: Invalid response format.'
        }));
        setLoading(false);
        Alert.alert(
          "Error",
          "Server error: Invalid response format.",
          [{ text: "OK" }]
        );
        return;
      }
      console.log('change-password response:', data);
      if (data && data.status === 'Success') {
        dispatch(addNotification({
          type: 'success',
          title: 'Passcode Updated',
          body: 'Your passcode has been updated successfully.'
        }));
        setTimeout(() => {
          setLoading(false);
          router.push({
            pathname: "/reset/success",
            params: { phone }
          });
        }, 1000);
      } else {
        dispatch(addNotification({
          type: 'error',
          title: 'Update Failed',
          body: data?.message || 'There was an error saving your new passcode. Please try again.'
        }));
        setLoading(false);
        Alert.alert(
          "Error",
          data?.message || "There was an error saving your new PIN. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error saving PIN:", error);
      // Show error notification
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        body: 'There was an error saving your new passcode. Please try again.'
      }));
      setLoading(false);
      Alert.alert(
        "Error",
        "There was an error saving your new PIN. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const renderPinInputs = () => {
    const currentPin = isConfirming ? confirmPin : pin;
    return (
      <View style={styles.pinContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View 
            key={i}
            style={[
              styles.pinDot,
              { 
                borderColor: i < currentPin.length ? "#0072CE" : "#ccc",
                backgroundColor: i < currentPin.length ? "#0072CE" : "transparent",
              }
            ]}
          >
            {i < currentPin.length && (
              <View style={styles.pinDotFilled} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
    
    return (
      <View style={styles.keypad}>
        {Array(4).fill(null).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key, keyIndex) => (
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
                  style={styles.key}
                  disabled={loading}
                >
                  {key === "⌫" ? (
                    <Ionicons name="backspace-outline" size={28} color="#0072CE" />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View key={`empty-${rowIndex}-${keyIndex}`} style={{ width: 64 }} />
              )
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="#0A369D" />
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 3 of 3</Text>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {isConfirming ? "Confirm New Passcode" : "Create New Passcode"}
        </Text>
        <Text style={styles.subtitle}>
          {isConfirming
            ? "Re-enter your new 4-digit passcode to confirm."
            : "Create a 4-digit passcode to secure your account."}
        </Text>

        {/* PIN Input */}
        {renderPinInputs()}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0072CE" />
          </View>
        )}

        {/* Error Message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Keypad */}
        {!loading && renderKeypad()}
      </View>
    </View>
  );
}