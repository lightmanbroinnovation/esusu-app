import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration, ScrollView, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { setTransactionPin } from '../../../services/api';

export default function TransactionPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleKeyPress = (digit: string) => {
    if (!isConfirming && pin.length < 4) {
      setPin(pin + digit);
    } else if (isConfirming && confirmPin.length < 4) {
      setConfirmPin(confirmPin + digit);
    }
  };

  const handleBackspace = () => {
    if (!isConfirming) {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const renderPinInputs = () => {
    const currentPin = isConfirming ? confirmPin : pin;
    return (
      <View style={styles.pinInputsContainer}> 
        {[0, 1, 2, 3].map((i) => (
          <TextInput
            key={i}
            value={currentPin[i] || ""}
            editable={false}
            style={[
              styles.pinInput,
              i < currentPin.length ? styles.pinInputFilled : {},
              { marginRight: i !== 3 ? 8 : 0 }
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    return (
      <View style={styles.keypadContainer}> 
        {Array(3)
          .fill(null)
          .map((_, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}> 
              {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleKeyPress(key)}
                  style={styles.keypadButton}
                >
                  <Text style={styles.keypadButtonText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        {/* Last row with backspace and "0" */}
        <View style={styles.keypadBottomRow}> 
          <TouchableOpacity
            onPress={handleBackspace}
            style={styles.keypadButton}
          >
            <Ionicons name="backspace-outline" size={30} color="#0072CE" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleKeyPress("0")}
            style={styles.keypadButton}
          >
            <Text style={styles.keypadButtonText}>0</Text>
          </TouchableOpacity>

          <View style={styles.keypadButton} />
        </View>
      </View>
    );
  };

  const handleSubmit = async () => {
    if (!isConfirming) {
      if (pin.length === 4) {
        setIsConfirming(true);
        setConfirmPin("");
      } else {
        Vibration.vibrate(100);
        Alert.alert("Invalid Transaction Pin", "Please enter a 4-digit transaction pin.");
      }
    } else {
      if (confirmPin === pin) {
        setLoading(true);
        try {
          const response = await setTransactionPin(pin);
          console.log('Transaction Pin API Response:', response);
          if (response.status === "Success") {
            Alert.alert("Success", "Transaction pin set successfully.", [
              { text: "OK", onPress: () => router.back() }
            ]);
          } else {
            Alert.alert("Failed", response.message || "Could not set transaction pin. Please try again.");
          }
        } catch (error) {
          Alert.alert("Error", "Failed to set transaction pin. Please check your network and try again.");
        } finally {
          setLoading(false);
        }
      } else {
        Vibration.vibrate(100);
        Alert.alert("Pin Mismatch", "Pins do not match. Please try again.");
        setConfirmPin("");
      }
    }
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Set Transaction Pin</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.titleText}>
            {isConfirming ? "Confirm Transaction Pin" : "Create Transaction Pin"}
          </Text>
          <Text style={styles.subtitleText}>
            {isConfirming
              ? "Re-enter your transaction pin to make sure it's correct."
              : "Set a 4-digit transaction pin for secure transactions."}
          </Text>
          {renderPinInputs()}
        </View>
        
        {renderKeypad()}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isConfirming ? "Set Pin" : "Next"}
              </Text>
            )}
            {!loading && <MaterialIcons name="arrow-forward" size={18} color="white" />}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: 'white',
    justifyContent: 'flex-start',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  pinInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  pinInput: {
    width: 48,
    height: 48,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 1.5,
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: '#F4F4F5',
    color: '#222',
    marginRight: 0,
  },
  pinInputFilled: {
    borderColor: '#0072CE',
    backgroundColor: '#ffffff',
  },
  keypadContainer: {
    marginTop: 40,
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  keypadBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  keypadButtonText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0072CE',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingBottom: 16,
    marginTop: 24,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 