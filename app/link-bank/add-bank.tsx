import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Switch, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet
} from "react-native";
import { useBank } from "./context/bank-context";
import React from 'react';
import { fetchBankList } from "../../services/api";
import { saveBankAccount } from "../../services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from '../components/EsusuLoader';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useBackButtonHandler } from '../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton

// Define Bank type for proper typing
interface Bank {
  name?: string;
  bankName?: string;
  code?: string;
  bankCode?: string;
  id?: string;
}

// Remove the dummy verifyBankDetails and use the real logic from recepient.tsx
async function verifyBankDetails({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }) {
  const token = await AsyncStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const res = await fetch('https://esusu-server.onrender.com/api/verification/safehaven/name-enquiry', {
    method: 'POST',
    headers,
    body: JSON.stringify({ bankCode, accountNumber })
  });
  const data = await res.json();
  if (data && data.status === 'Success' && data.data && data.data.accountName) {
    // Return both accountName and sessionId if present
    return {
      accountName: data.data.accountName,
      sessionId: data.data.sessionId || data.data.sessionID || ''
    };
  } else {
    return { accountName: '', sessionId: '' };
  }
}

export const options = {
  headerShown: false,
};

const fetchBankListData = async () => {
  const bankList = await fetchBankList();
  return bankList;
};

export default function AddBankScreen() {
  const router = useRouter();
  
  // Use back button handler for add-bank page
  useBackButtonHandler('/link-bank/add-bank');
  
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const prevBankName = useRef("");
  const [bankCode, setBankCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  const { addBank, isLoading, error } = useBank();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (fromRefresh = false) => {
    let cacheData = null;
    try {
      const cached = await AsyncStorage.getItem('bank_list');
      if (cached) {
        cacheData = JSON.parse(cached);
        setBanks(cacheData);
      }
    } catch {}
    if (!networkAvailable && cacheData) {
      return;
    }
    if (fromRefresh) {
      await invalidateCache('bank_list');
    }
    try {
      const bankList = await getCachedData('bank_list', fetchBankListData);
      setBanks(bankList);
    } catch (err) {
      if (!cacheData) {
        setBanks([]);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update autoVerify to set bankCode and sessionId
  useEffect(() => {
    const autoVerify = async () => {
      setVerifyError("");
      if (bankName && accountNumber.length === 10) {
        setVerifying(true);
        try {
          const selectedBank = banks.find(b => b.name === bankName || b.bankName === bankName);
          if (!selectedBank) return;
          const code = String(selectedBank.code || selectedBank.bankCode || '');
          setBankCode(code);
          if (!code) return;
          const result: any = await verifyBankDetails({ bankCode: code, accountNumber });
          if (result && result.accountName) {
            setAccountName(result.accountName);
            if (result.sessionId !== undefined) setSessionId(result.sessionId);
          } else {
            setAccountName("");
            setVerifyError("Could not verify account. Please check details.");
          }
        } catch (err) {
          setAccountName("");
          setVerifyError("Verification failed. Try again.");
        } finally {
          setVerifying(false);
        }
      } else {
        setAccountName("");
      }
    };
    autoVerify();
    if (prevBankName.current && prevBankName.current !== bankName) {
      setAccountName("");
      setVerifyError("");
    }
    prevBankName.current = bankName;
  }, [bankName, accountNumber, banks]);

  const validateForm = () => {
    if (!accountNumber.trim()) {
      Alert.alert("Error", "Please enter your account number");
      return false;
    }
    if (!bankName.trim()) {
      Alert.alert("Error", "Please select a bank");
      return false;
    }
    if (!accountName.trim()) {
      Alert.alert("Error", "Please enter the account name");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const result = await saveBankAccount({
        accountNumber,
        accountName,
        bankCode,
        sessionId,
        isPrimary,
        bankName // Pass bankName to API
      });
      console.log('Save bank account response:', result);
      if (result && result.status === 'Success') {
        // Invalidate settlement accounts cache to force refetch
        try {
          await invalidateCache('settlement_accounts');
          console.log('Settlement accounts cache invalidated after adding bank');
        } catch (cacheError) {
          console.error('Error invalidating settlement accounts cache:', cacheError);
        }
        
        setSuccessMessage(result.message || 'Bank account added successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
          router.push('/link-bank');
        }, 2000);
        return;
      }
      Alert.alert(
        "Success",
        "Bank account added successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error("Error saving bank account:", err);
      const error: any = err;
      let errorMsg = "Failed to add bank account. Please try again.";
      if (error && error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      } else if (error && error.message) {
        errorMsg = error.message;
      }
      Alert.alert(
        "Error",
        errorMsg
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviousPage = () => {
    router.back();
  };

  if (isLoading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && banks.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>No network. Please connect to the internet to load bank list.</Text>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {successMessage && (
          <View style={styles.successMessageContainer}>
            <Text style={styles.successMessageText}>{successMessage}</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipient</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Add New Bank Account</Text>
          <Text style={styles.subtitle}>
            Enter your bank details to receive commission payouts.
          </Text>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>What is the account number?</Text>
            <TextInput
              style={[styles.input, !isSaving && styles.inputDisabled]}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              placeholder="Enter account number"
              maxLength={10}
              editable={!isSaving}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={[styles.inputLabel, styles.mt6]}>Select Bank</Text>
            <TouchableOpacity
              style={[styles.bankSelect, isSaving && styles.disabled]}
              onPress={() => setShowBankDropdown(true)}
              disabled={isSaving}
            >
              <Text style={bankName ? styles.bankName : styles.bankPlaceholder}>
                {bankName || "Select the bank"}
              </Text>
              <Image 
                source={require('../assets/images/arrow-down.png')} 
                style={styles.arrowIcon} 
              />
            </TouchableOpacity>
            {showBankDropdown && (
              <Modal
                visible={showBankDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBankDropdown(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <TextInput
                      placeholder="Search bank..."
                      value={bankSearch}
                      onChangeText={setBankSearch}
                      style={styles.searchInput}
                      placeholderTextColor="#9CA3AF"
                    />
                    <ScrollView style={styles.bankList}>
                      {banks.filter(b => (b.name || b.bankName || "").toLowerCase().includes(bankSearch.toLowerCase())).map((b) => (
                        <TouchableOpacity
                          key={String(b.code || b.bankCode || b.id || b.name || b.bankName || Math.random())}
                          style={styles.bankItem}
                          onPress={() => {
                            setBankName(b.name ? String(b.name) : (b.bankName ? String(b.bankName) : ""));
                            setShowBankDropdown(false);
                            setBankSearch("");
                          }}
                        >
                          <Text style={styles.bankItemText}>{b.name || b.bankName || "Unnamed Bank"}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity 
                      onPress={() => setShowBankDropdown(false)} 
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
            {verifying && (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator size="small" color="#0074FF" />
                <Text style={styles.verifyingText}>Verifying...</Text>
              </View>
            )}
            {verifyError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{verifyError}</Text>
              </View>
            )}

            <Text style={[styles.inputLabel, styles.mt6]}>Account Name</Text>
            <TextInput
              style={[styles.input, !isSaving && styles.inputDisabled]}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Account name"
              editable={!isSaving}
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.primaryAccountContainer}>
              <View>
                <Text style={styles.primaryAccountText}>Set as Primary Account</Text>
                <Text style={styles.primaryAccountSubtext}>This will be your default withdrawal account.</Text>
              </View>
              <Switch 
                value={isPrimary} 
                onValueChange={setIsPrimary}
                disabled={isSaving}
                trackColor={{ false: '#D1D5DB', true: '#0074FF' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footerContainer}>
          <TouchableOpacity 
            onPress={handlePreviousPage} 
            style={[styles.cancelButton, isSaving && styles.disabledButton]}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSave} 
            style={[
              styles.saveButton, 
              isSaving ? styles.saveButtonDisabled : styles.saveButtonActive
            ]}
            disabled={isSaving}
          >
            {isSaving ? (
              <React.Fragment>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </React.Fragment>
            ) : (
              <Text style={styles.saveButtonText}>Save Bank Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    paddingHorizontal: 24,
  },
  successMessageContainer: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successMessageText: {
    color: '#065F46',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  contentContainer: {
    marginTop: 32,
  },
  title: {
    color: '#004699',
    fontSize: 28,
    fontWeight: '600',
  },
  subtitle: {
    color: '#374151',
    marginTop: 8,
    fontSize: 16,
  },
  formSection: {
    marginTop: 32,
  },
  inputLabel: {
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    color: '#374151',
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  mt6: {
    marginTop: 24,
  },
  bankSelect: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
  bankName: {
    color: '#374151',
  },
  bankPlaceholder: {
    color: '#9CA3AF',
  },
  arrowIcon: {
    height: 16,
    width: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '85%',
    maxHeight: 400,
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    padding: 8,
    color: '#1F2937',
  },
  bankList: {
    maxHeight: 300,
  },
  bankItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bankItemText: {
    fontSize: 16,
    color: '#222222',
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    color: '#0072CE',
    fontWeight: 'bold',
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  verifyingText: {
    marginLeft: 8,
    color: '#2563EB',
  },
  errorContainer: {
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  primaryAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 20,
    marginBottom: 8,
  },
  primaryAccountText: {
    color: '#1F2937',
    fontWeight: '500',
    fontSize: 16,
  },
  primaryAccountSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 32,
    paddingTop: 80,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: '#2563EB',
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
}); 