import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, FlatList, Modal, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchBankList } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBackButtonHandler } from '../../utils/backButtonHandler';

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
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
  
  // Content
  content: {
    marginTop: 40,
  },
  subtitle: {
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 24,
  },
  
  // Form Elements
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#272636',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    color: '#374151',
    fontSize: 16,
    marginBottom: 24,
  },
  bankInput: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
    color: '#1F2937',
  },
  bankInputText: {
    color: '#374151',
    fontSize: 16,
  },
  
  // Messages
  errorMessage: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
  },
  successMessage: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 16,
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
  
  // Fee Display
  feeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  feeLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeLoadingText: {
    color: '#4B5563',
    marginLeft: 8,
  },
  feeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  feeText: {
    color: '#1E40AF',
    fontSize: 14,
  },
  
  // Button
  button: {
    backgroundColor: '#0074FF',
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonLoadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  // Bank Dropdown
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: windowWidth,
    height: '100%',
    zIndex: 1000,
  },
  dropdownContainer: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 350,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    backgroundColor: '#F4F4F5',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  bankItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bankItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  bankList: {
    maxHeight: 250,
  },
  bankName: {
    fontSize: 16,
    color: '#1F2937',
  },
});

export default function Recepient() {
  const router = useRouter();
  
  // Use back button handler for withdrawal recipient page
  useBackButtonHandler('/withdrawal/subpages/recepient');
  
  const params = useLocalSearchParams();

  const [accountNumber, setAccountNumber] = useState('');
  const [bank, setBank] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banks, setBanks] = useState<any[]>([]); // Real bank list
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankInputLayout, setBankInputLayout] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [transferFee, setTransferFee] = useState<number>(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);

  // Fetch bank list from public endpoint on mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const bankList = await fetchBankList();
        setBanks(bankList);
        console.log('Fetched banks:', bankList);
      } catch (err) {
        setBanks([]);
      }
    };
    fetchBanks();
  }, []);

  // Helper to get transfer fee for a bank code
  const getTransferFee = async (bankCode: string) => {
    const token = await AsyncStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch(`https://esusu-server.onrender.com/api/account/fee/${bankCode}`, {
      method: 'GET',
      headers
    });
    const response = await res.json();
    console.log('Transfer fee response for bank code', bankCode, ':', response);
    return response;
  };

    const handlePreviousPage = () => {
    setShowBankDropdown(false);
    router.back();
  };

  const validateForm = () => {
    if (!accountNumber.trim()) {
      setError('Please enter your account number');
      return false;
    }
    if (!bank.trim() || !bankCode.trim()) {
      setError('Please select a bank');
      return false;
    }
    if (!accountName.trim()) {
      setError('Please enter the account name');
      return false;
    }
    setError(null);
    return true;
  };

  // Real verify bank details using name-enquiry endpoint
  const verifyBankDetails = async (selectedBankCode?: string) => {
    setIsVerifying(true);
    setVerifyResult(null);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch('https://esusu-server.onrender.com/api/verification/safehaven/name-enquiry', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bankCode: selectedBankCode || bankCode,
          accountNumber
        })
      });
      const data = await res.json();
      console.log('Bank Name Enquiry Response:', data);
      if (data && data.status === 'Success' && data.data && data.data.accountName) {
        setAccountName(data.data.accountName);
        setVerifyResult('Bank details verified successfully!');
        if (data.data.sessionId) setSessionId(data.data.sessionId);

        // Fetch transfer fee after successful verification
        setFeeLoading(true);
        try {
          const feeResponse = await getTransferFee(selectedBankCode || bankCode);
          if (feeResponse.status === 'Success' && feeResponse.data) {
            setTransferFee(feeResponse.data.transferFee || 0);
          } else {
            setTransferFee(0);
          }
        } catch (error) {
          console.error('Error fetching transfer fee:', error);
          setTransferFee(0);
        } finally {
          setFeeLoading(false);
        }
      } else {
        setVerifyResult(data?.message || 'Failed to verify bank details.');
      }
    } catch (err) {
      setVerifyResult('Failed to verify bank details.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNextPage = async () => {
    if (!validateForm()) return;
    setIsVerifying(true);
    try {
      // Here you can add a real bank verification API call if available
      // For now, we just simulate a delay
      await new Promise(res => setTimeout(res, 1000));
      setIsVerifying(false);
      console.log('Passing sessionId to enter-transaction-pin:', sessionId);
      console.log('Params to enter-transaction-pin:', {
        phoneNumber: params.phoneNumber || '',
        amount: params.amount || '',
        bankCode,
        accountNumber,
        beneficiaryName: accountName,
        sessionId
      });
      router.push({
        pathname: './enter-transaction-pin',
        params: {
          phoneNumber: params.phoneNumber || '',
          amount: params.amount || '',
          bankCode,
          accountNumber,
          beneficiaryName: accountName,
          sessionId
        }
      });
    } catch (err) {
      setIsVerifying(false);
      setError('Failed to verify bank details. Please try again.');
    }
  };

  // Custom dropdown for banks (portal-like overlay, closes on outside press or selection)
  const renderBankDropdown = () => {
    if (!showBankDropdown) return null;
    // Filter banks by search
    const filteredBanks = banks.filter(b => (b.name || b.bankName || '').toLowerCase().includes(bankSearch.toLowerCase()));
    return (
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: (bankInputLayout?.y || 0) + (bankInputLayout?.height || 0) + 8,
          left: 0,
          width: windowWidth,
          height: '100%',
          zIndex: 1000,
        }}
        activeOpacity={1}
        onPress={() => setShowBankDropdown(false)}
      >
        <View style={styles.dropdownContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search banks..."
            value={bankSearch}
            onChangeText={setBankSearch}
            autoFocus={true}
          />
          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bankItem}
                onPress={() => {
                  setSelectedBank(item);
                  setBankSearch(item.name || item.bankName || '');
                  setShowBankDropdown(false);
                  verifyBankDetails(item.code);
                }}
              >
                <Text style={styles.bankName}>{item.name || item.bankName}</Text>
              </TouchableOpacity>
            )}
            style={styles.bankList}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handlePreviousPage}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipient</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.subtitle}>
          Please provide the details you would like to withdraw to below.
        </Text>

        {/* Error Message */}
        {error && (
          <View style={styles.errorMessage}>
            <Text style={[styles.messageText, styles.errorText]}>{error}</Text>
          </View>
        )}

        {/* Verification Result */}
        {verifyResult && (
          <View style={styles.successMessage}>
            <Text style={[styles.messageText, styles.successText]}>{verifyResult}</Text>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.content}>
          <Text style={styles.inputLabel}>What is the account number?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Account Number"
            placeholderTextColor="#9CA3AF"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            maxLength={10}
            editable={!isVerifying}
          />

          <Text style={styles.inputLabel}>Select Bank</Text>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.bankInput}
              onPress={() => setShowBankDropdown(true)}
              disabled={isVerifying}
              onLayout={event => setBankInputLayout(event.nativeEvent.layout)}
            >
              <Text style={[styles.bankInputText, !bank && { color: '#9CA3AF' }]}>
                {bank || 'Select Bank'}
              </Text>
              <Ionicons 
                name={showBankDropdown ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Account Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#F3F4F6' }]}
            placeholder="Account Name"
            placeholderTextColor="#9CA3AF"
            value={accountName}
            onChangeText={setAccountName}
            editable={false}
          />

          {/* Fee Display */}
          <View style={styles.feeContainer}>
            {feeLoading ? (
              <View style={styles.feeLoading}>
                <ActivityIndicator size="small" color="#0074FF" />
                <Text style={styles.feeLoadingText}>Calculating fee...</Text>
              </View>
            ) : transferFee > 0 ? (
              <View style={styles.feeBox}>
                <Text style={styles.feeText}>
                  Transfer Fee: ₦{transferFee.toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            isVerifying && styles.buttonDisabled
          ]}
          onPress={handleNextPage}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.buttonLoadingText}>Verifying...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Done</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      {renderBankDropdown()}
    </View>
  );
}

