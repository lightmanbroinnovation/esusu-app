import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration, ScrollView, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { transferToBank } from '../../services/api';
import NetInfo from '@react-native-community/netinfo';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  networkError: {
    marginTop: 10,
    marginBottom: 10,
  },
  networkErrorText: {
    color: 'red',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  errorText: {
    color: '#B91C1C',
    textAlign: 'center',
    fontWeight: '600',
  },
  successBanner: {
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
  titleSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0074FF',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 48,
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
    marginRight: 8,
    padding: 4,
    fontSize: 20,
    color: '#0074FF',
    fontWeight: 'bold',
    borderWidth: 1,
    borderRadius: 8,
  },
  keypadContainer: {
    marginTop: 40,
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  keypadKey: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 30,
    fontWeight: '600',
    color: '#0072CE',
  },
  emptyKey: {
    width: 80,
    height: 80,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 8,
    fontWeight: '600',
  },
});

export default function EnterTransactionPinScreen() {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [networkAvailable, setNetworkAvailable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  const renderPinInputs = () => {
    return (
      <View style={styles.pinInputsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <TextInput
            key={i}
            value={pin[i] || ""}
            editable={false}
            style={[
              styles.pinInput,
              {
                borderColor: i < pin.length ? "#0072CE" : "#ccc",
                backgroundColor: i < pin.length ? "#ffffff" : "#F4F4F5",
              }
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
                  style={styles.keypadKey}
                >
                  <Text style={styles.keypadText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        {/* Last row with backspace and "0" */}
        <View style={styles.keypadRow}>
          {/* Cancel Button */}
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
            <Text style={styles.keypadText}>0</Text>
          </TouchableOpacity>

          {/* Placeholder for alignment */}
          <View style={styles.emptyKey} />
        </View>
      </View>
    );
  };

  const handleSubmit = async () => {
    console.log('Params in enter-transaction-pin:', params);
    if (pin.length !== 4) {
      Vibration.vibrate(100);
      setError("Please enter your 4-digit transaction pin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        amount: params.amount || '',
        bankCode: params.bankCode || '',
        accountNumber: params.accountNumber || '',
        beneficiaryName: params.beneficiaryName || '',
        transactionPin: pin
      };
      if (params.sessionId) {
        payload.sessionId = params.sessionId;
      }
      console.log('TransferToBank Payload:', payload);
      const response = await transferToBank(payload);
      console.log('Transfer to Bank API Response:', response);
      if (response.status === 'Success') {
        await sendNotification(
          NotificationTemplates.transaction.withdrawal(payload.amount).title,
          NotificationTemplates.transaction.withdrawal(payload.amount).body,
          NotificationTemplates.transaction.withdrawal(payload.amount).type
        );
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.replace('/dashboard');
        }, 2000);
      } else {
        setError(response.message || 'Failed to complete transfer.');
      }
    } catch (error) {
      const err: any = error;
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('Failed to complete transfer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Transaction Pin</Text>
      </View>
      {!networkAvailable && (
        <View style={styles.networkError}>
          <Text style={styles.networkErrorText}>
            You are offline. Some features may be unavailable.
          </Text>
        </View>
      )}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>Transfer successful! Redirecting to dashboard...</Text>
        </View>
      )}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          Enter your Transaction Pin
        </Text>
        <Text style={styles.subtitle}>
          Please input your 4-digit transaction pin to continue.
        </Text>
        {renderPinInputs()}
      </View>
      {renderKeypad()}
      <View style={{ paddingBottom: 16 }}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>
                Continue
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
    </ScrollView>
  );
} 