import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, FlatList, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchBankList } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBackButtonHandler } from '../../utils/backButtonHandler';

const windowWidth = Dimensions.get('window').width;

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

  // Hide verify result after 3 seconds
  useEffect(() => {
    if (verifyResult) {
      const timer = setTimeout(() => setVerifyResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [verifyResult]);

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
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: '#fff',
            borderRadius: 12,
            maxHeight: 350,
            marginTop: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View style={{ padding: 8 }}>
            <TextInput
              placeholder="Search bank"
              value={bankSearch}
              onChangeText={setBankSearch}
              style={{ backgroundColor: '#F4F4F5', borderRadius: 8, padding: 8, marginBottom: 8 }}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredBanks}
            keyExtractor={(item, idx) => `${item.code || item.bankCode || item.id || ''}_${idx}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={async () => {
                  if (accountNumber.length !== 10) {
                    setError('Please enter a valid 10-digit account number before selecting a bank.');
                    setShowBankDropdown(false);
                    return;
                  }
                  setBank(item.name || item.bankName || '');
                  setBankCode(item.code || item.bankCode || '');
                  setAccountName(''); // Clear account name when a new bank is selected
                  setShowBankDropdown(false);
                  setBankSearch('');
                  await verifyBankDetails(item.code || item.bankCode || '');
                }}
              >
                <Text style={{ fontSize: 16 }}>{item.name || item.bankName}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-white px-4 pt-8" keyboardShouldPersistTaps="handled">
            {/* Header */}
        <View className="flex-row items-center justify-between mt-8 mb-4">
        <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10  items-center justify-center"
            >
              <Ionicons name="arrow-back" size={28} />
            </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">Recipient</Text>
          <View style={{ width: 40 }} />
            </View>

            <Text className="text-center mt-6">Please provide the details you would like to withdraw to below.</Text>

        {/* Error Message */}
        {error && (
          <View className="mt-4 p-3 bg-red-100 rounded-lg border border-red-400">
            <Text className="text-red-700 text-center font-semibold">{error}</Text>
          </View>
        )}

        {/* Verification Result */}
        {verifyResult && (
          <View className="mt-4 p-3 bg-green-100 rounded-lg border border-green-400">
            <Text className="text-green-800 text-center font-semibold">{verifyResult}</Text>
          </View>
        )}

        {/* Inputs */}
        <View className='mt-10'>
          <Text className="text-base font-medium text-[#272636] mb-2">What is the account number?</Text>
                            <TextInput
            className="bg-gray-100 px-4 py-4 rounded-lg text-gray-700 text-base mb-6"
                                placeholder='Enter Account Number'
                                value={accountNumber}
                                onChangeText={setAccountNumber}
            keyboardType="numeric"
            maxLength={10}
            editable={!isVerifying}
          />

          <Text className="text-base font-medium text-[#272636] mb-2">Select Bank</Text>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              className="bg-gray-100 px-4 py-4 rounded-lg mb-6 flex-row items-center justify-between"
              onPress={() => setShowBankDropdown(true)}
              disabled={isVerifying}
              onLayout={event => setBankInputLayout(event.nativeEvent.layout)}
            >
              <Text className="text-gray-700 text-base">{bank || 'Select Bank'}</Text>
              <Ionicons name={showBankDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
            </TouchableOpacity>
                    </View>

          {/* Removed Verify button here */}

          <Text className="text-base font-medium text-[#272636] mb-2">Account Name</Text>
                            <TextInput
            className="bg-gray-100 px-4 py-4 rounded-lg text-gray-700 text-base mb-10"
                                placeholder="Account Name"
                                value={accountName}
                                onChangeText={setAccountName}
            editable={false}
                            />
                </View>

        <TouchableOpacity
          className={`bg-[#0074FF] w-full rounded-xl justify-center py-4 mb-8 flex-row items-center ${isVerifying ? 'opacity-60' : ''}`}
          onPress={handleNextPage}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-base font-bold ml-2">Verifying...</Text>
            </>
          ) : (
                    <Text className='text-white text-base font-bold'>Done</Text>
          )}
                </TouchableOpacity>
      </ScrollView>
      {renderBankDropdown()}
            </View>
    );
}

