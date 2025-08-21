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
  Modal
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6">
        {successMessage && (
          <View style={{ backgroundColor: '#D1FAE5', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#065F46', fontWeight: 'bold', textAlign: 'center' }}>{successMessage}</Text>
          </View>
        )}
        {/* Header */}
        <View className="flex-row items-center justify-between mt-12">
        <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full  items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">Recipient</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View className="mt-8">
          <Text className="text-[#004699] text-3xl font-semibold">Add New Bank Account</Text>
          <Text className="text-gray-700 mt-2 text-base">
            Enter your bank details to receive commission payouts.
          </Text>

          <View className="mt-8">
            <Text className="text-gray-800 font-medium mb-2">What is the account number?</Text>
            <TextInput
              className="bg-gray-100 px-4 py-4 rounded-lg text-gray-700 text-base"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              placeholder="Enter account number"
              maxLength={10}
              editable={!isSaving}
            />

            <Text className="text-gray-800 font-medium mb-2 mt-6">Select Bank</Text>
            <TouchableOpacity
              className="bg-gray-100 px-4 py-4 rounded-lg flex-row justify-between items-center"
              onPress={() => setShowBankDropdown(true)}
              disabled={isSaving}
            >
              <Text className={bankName ? "text-gray-700" : "text-gray-400"}>{bankName || "Select the bank"}</Text>
              <Image source={require('../assets/images/arrow-down.png')} className="h-4 w-4 ml-2" />
            </TouchableOpacity>
            {showBankDropdown && (
              <Modal
                visible={showBankDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBankDropdown(false)}
              >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: 'white', borderRadius: 12, width: '85%', maxHeight: 400, padding: 16 }}>
                    <TextInput
                      placeholder="Search bank..."
                      value={bankSearch}
                      onChangeText={setBankSearch}
                      style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 12, padding: 8 }}
                    />
                    <ScrollView style={{ maxHeight: 300 }}>
                      {banks.filter(b => (b.name || b.bankName || "").toLowerCase().includes(bankSearch.toLowerCase())).map((b) => (
                        <TouchableOpacity
                          key={String(b.code || b.bankCode || b.id || b.name || b.bankName || Math.random())}
                          style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}
                          onPress={() => {
                            setBankName(b.name ? String(b.name) : (b.bankName ? String(b.bankName) : ""));
                            setShowBankDropdown(false);
                            setBankSearch("");
                          }}
                        >
                          <Text style={{ fontSize: 16, color: '#222' }}>{b.name || b.bankName || "Unnamed Bank"}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setShowBankDropdown(false)} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
                      <Text style={{ color: '#0072CE', fontWeight: 'bold' }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
            {verifying && (
              <View className="flex-row items-center mt-2">
                <ActivityIndicator size="small" color="#0074FF" />
                <Text className="ml-2 text-blue-600">Verifying...</Text>
              </View>
            )}
            {verifyError && (
              <View><Text className="text-red-500 text-xs mt-2">{verifyError}</Text></View>
            )}

            <Text className="text-gray-800 font-medium mb-2 mt-6">Account Name</Text>
            <TextInput
              className="bg-gray-100 px-4 py-4 rounded-lg text-gray-700 text-base"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Account name"
              editable={!isSaving}
            />

            <View className="flex-row justify-between items-center mt-8">
              <View>
                <Text className="text-gray-800 font-medium text-base">Set as Primary Account</Text>
                <Text className="text-gray-400 text-sm mt-1">This will be your default withdrawal account.</Text>
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
        <View className="flex-row justify-between mt-auto mb-8 pt-20">
          <TouchableOpacity 
            onPress={handlePreviousPage} 
            className="bg-red-100 py-4 rounded-xl flex-1 mr-2"
            disabled={isSaving}
          >
            <Text className="text-red-500 text-lg font-medium text-center">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSave} 
            className={`${isSaving ? 'bg-blue-400' : 'bg-blue-600'} py-4 rounded-xl flex-1 ml-2 flex-row justify-center items-center`}
            disabled={isSaving}
          >
            {isSaving ? (
              <React.Fragment>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white text-lg font-medium ml-2">Saving...</Text>
              </React.Fragment>
            ) : (
              <Text className="text-white text-lg font-medium text-center">Save Bank Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 