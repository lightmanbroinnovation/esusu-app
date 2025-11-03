import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Vibration, ScrollView, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { transferToBank } from '../../../services/api';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../../services/notificationService';
import { useBackButtonHandler } from '../../utils/backButtonHandler';

const styles = StyleSheet.create({
  // Layout
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    justifyContent: 'space-between'
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    color: '#6B7280',
    marginBottom: 48,
    textAlign: 'center',
  },
  
  // Pin Input
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
    fontWeight: 'bold',
    borderRadius: 12,
    borderWidth: 1,
  },
  
  // Keypad
  keypadContainer: {
    marginTop: 40,
    width: '100%',
    rowGap: 24,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  keypadText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0072CE',
  },
  
  // Buttons
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0072CE',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  
  // Messages
  errorMessage: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  successMessage: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  messageText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
  },
  successText: {
    color: '#166534',
  },
});

export default function EnterTransactionPinScreen() {
  const router = useRouter();
  
  // Use back button handler for withdrawal transaction pin page
  useBackButtonHandler('/withdrawal/subpages/enter-transaction-pin');
  
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

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
      <View style={styles.pinContainer}>
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
                  style={styles.keypadButton}
                >
                  <Text style={styles.keypadText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        {/* Last row with backspace and "0" */}
        <View style={styles.keypadRow}>
          {/* Backspace Button */}
          <TouchableOpacity
            onPress={handleBackspace}
            style={styles.keypadButton}
          >
            <Ionicons name="backspace-outline" size={30} color="#0072CE" />
          </TouchableOpacity>

          {/* Zero Button */}
          <TouchableOpacity
            onPress={() => handleKeyPress("0")}
            style={styles.keypadButton}
          >
            <Text style={styles.keypadText}>0</Text>
          </TouchableOpacity>

          {/* Placeholder for alignment */}
          <View style={styles.keypadButton} />
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
        phoneNumber: params.phoneNumber || '',
        amount: params.amount || '',
        bankCode: params.bankCode || '',
        accountNumber: params.accountNumber || '',
        beneficiaryName: params.beneficiaryName || '',
        transactionPin: pin
      };
      if (params.sessionId) {
        payload.sessionId = params.sessionId; // Use capital D
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
          router.replace('/withdrawal/subpages/success');
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
      style={styles.scrollView}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Enter Transaction Pin</Text>
          <View style={{ width: 28 }} /> {/* Spacer for alignment */}
        </View>

        {error && (
          <View style={[styles.errorMessage, { marginTop: 24 }]}>
            <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={[styles.successMessage, { marginTop: 24 }]}>
            <Text style={[styles.messageText, styles.successText]}>
              Transfer successful! Redirecting to dashboard...
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.heading}>
            Enter your Transaction Pin
          </Text>
          <Text style={styles.subheading}>
            Please input your 4-digit transaction pin to continue.
          </Text>
          {renderPinInputs()}
        </View>

        {renderKeypad()}

        <View style={{ paddingBottom: 16 }}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                Continue
              </Text>
            )}
            {!loading && <Ionicons name="arrow-forward" size={24} color="white" />}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
