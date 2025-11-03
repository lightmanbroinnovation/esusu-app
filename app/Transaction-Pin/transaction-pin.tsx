import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Vibration, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  TextInputProps,
  TouchableOpacityProps,
  ScrollViewProps
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { setTransactionPin } from '../../services/api';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';

export default function TransactionPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // New state for success message
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

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
      <View style={styles.pinContainer}>
        {[0, 1, 2, 3].map((i) => {
          const isFilled = i < currentPin.length;
          return (
            <TextInput
              key={i}
              value={currentPin[i] || ""}
              editable={false}
              style={[
                styles.pinInput,
                {
                  borderColor: isFilled ? "#0072CE" : "#ccc",
                  backgroundColor: isFilled ? "#ffffff" : "#F4F4F5",
                }
              ]}
            />
          );
        })}
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
                  style={styles.keypadKey}
                >
                  <Text style={styles.keypadKeyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        {/* Last row with backspace and "0" */}
        <View style={styles.keypadRow}>
          {/* Backspace Button */}
          <TouchableOpacity
            onPress={handleBackspace}
            style={styles.keypadKey}
          >
            <Ionicons name="backspace-outline" size={30} color="#0072CE" />
          </TouchableOpacity>

          {/* Zero Button */}
          <TouchableOpacity
            onPress={() => handleKeyPress("0")}
            style={styles.keypadKey}
          >
            <Text style={styles.keypadKeyText}>0</Text>
          </TouchableOpacity>

          {/* Placeholder for alignment */}
          <View style={styles.keypadPlaceholder} />
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
            setSuccess(true);
            setTimeout(() => {
              setSuccess(false);
              router.replace('/dashboard');
            }, 2000);
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

  if (loading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !pin) {
    return (
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineText}>No network. Please connect to the internet to load transaction pin page.</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Transaction Pin</Text>
        </View>
        
        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>Transaction pin set successfully! Redirecting to dashboard...</Text>
          </View>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isConfirming ? "Confirm Transaction Pin" : "Create Transaction Pin"}
          </Text>
          <Text style={styles.subtitle}>
            {isConfirming
              ? "Re-enter your transaction pin to make sure it's correct."
              : "Set a 4-digit transaction pin for secure transactions."}
          </Text>

          {renderPinInputs()}
        </View>

        {/* Keypad */}
        {renderKeypad()}

        {/* Next or Complete Registration Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 64,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 32,
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#34D399',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  successText: {
    color: '#065F46',
    textAlign: 'center',
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0072CE',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 64,
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  pinInput: {
    width: 48,
    height: 48,
    textAlign: 'center',
    marginRight: 8,
    fontSize: 20,
    fontWeight: '700',
    color: '#0072CE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  keypadContainer: {
    marginTop: 40,
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keypadKey: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  keypadKeyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0072CE',
  },
  keypadPlaceholder: {
    width: 80,
    height: 80,
  },
  buttonContainer: {
    paddingBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 8,
    fontWeight: '600',
  },
});