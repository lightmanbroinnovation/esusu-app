import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from '../components/EsusuLoader';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
// No API import needed

// Define the Account type to match the structure in user details
type Account = {
  id: string;
  bankName: string;
  bankCode: string;
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
  createdAt: string;
};

// Define user details interface
interface UserDetails {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  balance?: number;
  totalDeposit?: number;
  totalWithdraw?: number;
  weeklyEarnings?: number;
  commissions?: any[];
  bankAccounts?: Account[];
}

// Helper to verify bank details
const verifyBankDetails = async (bankCode: string, accountNumber: string) => {
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
  return res.json();
};

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

const fetchWithdrawData = async (params: any) => {
  // If you have an API call for withdraw data, place it here
  // Otherwise, just return params as data
  return params;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messageBanner: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  balanceLabel: {
    color: '#374151',
    fontSize: 16,
    marginRight: 8,
  },
  balanceValue: {
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 16,
  },
  balancePlaceholder: {
    color: '#A9A8AF',
  },
  accountCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  accountCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountToLabel: {
    color: '#4B5563',
    marginRight: 16,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  accountBankLogo: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  accountCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  accountBankName: {
    color: '#0099FF',
    marginLeft: 8,
  },
  accountNumber: {
    color: '#0099FF',
    marginLeft: 8,
  },
  primaryBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  primaryBadgeText: {
    color: '#2563EB',
    fontSize: 12,
  },
  addBankCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBankContent: {
    flex: 1,
  },
  addBankTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addBankSubtitle: {
    color: '#4B5563',
    marginTop: 4,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    color: '#4B5563',
    fontSize: 18,
    marginBottom: 8,
  },
  amountDisplay: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  amountDivider: {
    height: 2,
    backgroundColor: '#E5E7EB',
    width: '80%',
    marginTop: 8,
  },
  feeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  feeLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeLoadingText: {
    color: '#4B5563',
    marginLeft: 8,
  },
  feeDisplay: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  feeText: {
    color: '#1E40AF',
    fontSize: 14,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAmountButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  quickAmountText: {
    color: '#1F2937',
  },
  keypadContainer: {
    width: '100%',
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 16,
  },
  keypadRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  keypadKey: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1E3A8A',
  },
  keypadEmpty: {
    width: 64,
    height: 64,
  },
  continueButtonContainer: {
    marginTop: 40,
  },
  continueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: '#2563EB',
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  accountItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  accountItemUnselected: {
    backgroundColor: '#F9FAFB',
  },
  accountItemLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 16,
  },
  accountItemContent: {
    flex: 1,
  },
  accountItemBank: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountItemName: {
    color: '#4B5563',
  },
  accountItemNumber: {
    color: '#4B5563',
  },
  accountItemPrimaryBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  accountItemPrimaryText: {
    color: '#2563EB',
    fontSize: 12,
  },
  emptyAccountsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyAccountsText: {
    color: '#6B7280',
    marginBottom: 16,
  },
  addBankButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  addBankButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addNewBankButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
  },
  addNewBankButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

const WithdrawScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [amount, setAmount] = useState('0');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [commission, setCommission] = useState<number>(0);
  const [transferFee, setTransferFee] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (fromRefresh = false) => {
    setLoading(true);
    setError(null);
    let cacheData = null;
    try {
      const cached = await AsyncStorage.getItem('commission_withdraw');
      if (cached) {
        cacheData = JSON.parse(cached);
        // Set your state from cache if needed
        const comm = cacheData.commission ? Number(cacheData.commission) : 0;
        setCommission(comm);
        let accountsArr: Account[] = [];
        if (cacheData.settlementAccounts) {
          const parsed = JSON.parse(cacheData.settlementAccounts as string);
          accountsArr = Array.isArray(parsed) ? parsed : [];
        }
        setAccounts(accountsArr);
        setSelectedAccount(accountsArr.length > 0 ? accountsArr[0] : null);
      }
    } catch {}
    if (!networkAvailable && cacheData) {
      setLoading(false);
      return;
    }
    if (fromRefresh) {
      await invalidateCache('commission_withdraw');
    }
    try {
      const data = await getCachedData('commission_withdraw', () => fetchWithdrawData(params));
      const comm = params.commission ? Number(params.commission) : 0;
      setCommission(comm);
      let accountsArr: Account[] = [];
      if (params.settlementAccounts) {
        const parsed = JSON.parse(params.settlementAccounts as string);
        accountsArr = Array.isArray(parsed) ? parsed : [];
      }
      setAccounts(accountsArr);
      setSelectedAccount(accountsArr.length > 0 ? accountsArr[0] : null);

      // Fetch transfer fee for the initially selected account
      if (accountsArr.length > 0 && accountsArr[0].bankCode) {
        try {
          const feeResponse = await getTransferFee(accountsArr[0].bankCode);
          console.log('Initial fee fetch for bank code', accountsArr[0].bankCode, ':', feeResponse);
          if (feeResponse.status === 'Success' && feeResponse.data) {
            setTransferFee(feeResponse.data.transferFee || 0);
          }
        } catch (error) {
          console.error('Error fetching initial transfer fee:', error);
          setTransferFee(0);
        }
      }
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load withdrawal data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.commission, params.settlementAccounts]);

  // Fetch transfer fee when selected account changes
  useEffect(() => {
    const fetchFee = async () => {
      if (selectedAccount?.bankCode) {
        setFeeLoading(true);
        try {
          const feeResponse = await getTransferFee(selectedAccount.bankCode);
          console.log('Fee fetch for selected bank code', selectedAccount.bankCode, ':', feeResponse);
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
      }
    };

    fetchFee();
  }, [selectedAccount?.bankCode]);

  const onRefresh = async () => {
    setLoading(true);
    await fetchData(true);
    setLoading(false);
  };

  if (loading) {
    return <EsusuLoader />;
  }
  
  const navigateBack = () => {
    router.back();
  };

  const navigateToAddBank = () => {
    router.push('/link-bank/add-bank' as any);
  };
  
  const handleAmountSelection = (value: string) => {
    setAmount(value);
  };
  
  const handleButtonPress = (digit: string) => {
    if (amount === '0') {
      setAmount(digit);
    } else {
      setAmount(amount + digit);
    }
  };
  
  const handleBackspace = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount('0');
    }
  };
  
  const handleContinue = async () => {
    setMessage(null);
    setMessageType(null);
    if (!selectedAccount) {
      setMessage('Please add a bank account to continue.');
      setMessageType('error');
      return;
    }
    const amountNum = Number(amount);
    if (amountNum < 50) {
      setMessage('Minimum withdrawal amount is ₦500.');
      setMessageType('error');
      return;
    }
    if (amountNum > commission) {
      setMessage('You do not have enough balance to withdraw this amount.');
      setMessageType('error');
      return;
    }
    setVerifying(true);
    try {
      const verifyRes = await verifyBankDetails(selectedAccount.bankCode, selectedAccount.accountNumber);
      console.log('Bank verification response:', verifyRes);
      if (verifyRes.status === 'Success' && verifyRes.data) {
        // Navigate to enter-transaction-pin.tsx with required params
        router.push({
          pathname: '/commission/enter-transaction-pin',
          params: {
            amount: amountNum,
            bankCode: selectedAccount.bankCode,
            accountNumber: selectedAccount.accountNumber,
            beneficiaryName: verifyRes.data.accountName,
            sessionId: verifyRes.data.sessionId
          }
        });
      } else {
        setMessage(verifyRes.message || 'Bank verification failed.');
        setMessageType('error');
      }
    } catch (e) {
      setMessage('Failed to verify bank details. Please try again.');
      setMessageType('error');
    } finally {
      setVerifying(false);
    }
  };

  // Helper function to get bank logo
  const getBankLogo = (bankName: string) => {
    const name = (bankName || '').toLowerCase();
    
    if (name.includes('first') || name.includes('firstbank')) {
      return require('../../assets/images/icon.png'); // Replace with actual First Bank logo
    } else if (name.includes('uba')) {
      return require('../../assets/images/icon.png'); // Replace with actual UBA logo
    } else if (name.includes('gtb') || name.includes('guaranty')) {
      return require('../../assets/images/icon.png'); // Replace with actual GTBank logo
    } else {
      return require('../../assets/images/icon.png'); // Default bank logo
    }
  };

  // Use commission as balance
  const userBalance = commission.toLocaleString();

  // Determine if continue button should be enabled
  const isContinueEnabled = !loading && 
    Number(amount) > 0 && 
    selectedAccount && 
    Number(amount) <= commission;

  return (
    <View style={styles.container}>
      {message && (
        <View style={[
          styles.messageBanner,
          { backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF' }
        ]}>
          <Text style={[
            styles.messageText,
            { color: messageType === 'error' ? '#D92D20' : '#0072CE' }
          ]}>{message}</Text>
        </View>
      )}
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 20 }}
        >
          {/* Balance Section */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Current Balance:</Text>
            <Text style={styles.balanceValue}>
              {commission !== undefined && commission !== null ? `₦${userBalance}` : <Text style={styles.balancePlaceholder}>--</Text>}
            </Text>
          </View>

          {/* Account Selection */}
          {accounts && accounts.length > 0 ? (
            <TouchableOpacity style={styles.accountCard} onPress={() => setShowAccountModal(true)}>
              <View style={styles.accountCardRow}>
                <View style={styles.accountCardLeft}>
                  <Text style={styles.accountToLabel}>To:</Text>
                  <Text style={styles.accountName}>
                    {selectedAccount?.accountName || ''}
                  </Text>
                  {selectedAccount && (
                    <Image
                      source={getBankLogo(selectedAccount.bankName)}
                      style={styles.accountBankLogo}
                    />
                  )}
                </View>
                <Ionicons name="chevron-down" size={24} color="#000" />
              </View>
              <View style={styles.accountCardBottom}>
                <Ionicons name="card-outline" size={18} color="#0099FF" />
                <Text style={styles.accountBankName}>
                  {selectedAccount?.bankName || 'Select Bank'}
                </Text>
                <Text style={styles.accountNumber}>
                  {selectedAccount?.accountNumber || ''}
                </Text>
                {selectedAccount?.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary Account</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addBankCard} onPress={navigateToAddBank}>
              <View style={styles.addBankContent}>
                <Text style={styles.addBankTitle}>Add Bank Account</Text>
                <Text style={styles.addBankSubtitle}>You need to add a bank account to withdraw</Text>
              </View>
              <Ionicons name="add-circle" size={32} color="#0074FF" />
            </TouchableOpacity>
          )}

          {/* Amount Entry */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Enter Amount</Text>
            <Text style={styles.amountDisplay}>
              {amount === '0' ? '0' : parseInt(amount).toLocaleString()}
            </Text>
            <View style={styles.amountDivider} />
          </View>

          {/* Fee Display */}
          <View style={styles.feeContainer}>
            {feeLoading ? (
              <View style={styles.feeLoadingRow}>
                <ActivityIndicator size="small" color="#0074FF" />
                <Text style={styles.feeLoadingText}>Calculating fee...</Text>
              </View>
            ) : transferFee > 0 ? (
              <View style={styles.feeDisplay}>
                <Text style={styles.feeText}>
                  Transfer Fee: ₦{transferFee.toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickAmountsRow}>
            <TouchableOpacity style={styles.quickAmountButton} onPress={() => handleAmountSelection('5000')}>
              <Text style={styles.quickAmountText}>₦5,000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAmountButton} onPress={() => handleAmountSelection('15000')}>
              <Text style={styles.quickAmountText}>₦15,000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAmountButton} onPress={() => handleAmountSelection('25000')}>
              <Text style={styles.quickAmountText}>₦25,000</Text>
            </TouchableOpacity>
          </View>

          {/* Keypad */}
          <View style={styles.keypadContainer}>
            {/* Row 1 */}
            <View style={styles.keypadRow}>
              <TouchableOpacity key="keypad-1" style={styles.keypadKey} onPress={() => handleButtonPress('1')}>
                <Text style={styles.keypadKeyText}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity key="keypad-2" style={styles.keypadKey} onPress={() => handleButtonPress('2')}>
                <Text style={styles.keypadKeyText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity key="keypad-3" style={styles.keypadKey} onPress={() => handleButtonPress('3')}>
                <Text style={styles.keypadKeyText}>3</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.keypadRow}>
              <TouchableOpacity key="keypad-4" style={styles.keypadKey} onPress={() => handleButtonPress('4')}>
                <Text style={styles.keypadKeyText}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity key="keypad-5" style={styles.keypadKey} onPress={() => handleButtonPress('5')}>
                <Text style={styles.keypadKeyText}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity key="keypad-6" style={styles.keypadKey} onPress={() => handleButtonPress('6')}>
                <Text style={styles.keypadKeyText}>6</Text>
              </TouchableOpacity>
            </View>

            {/* Row 3 */}
            <View style={styles.keypadRow}>
              <TouchableOpacity key="keypad-7" style={styles.keypadKey} onPress={() => handleButtonPress('7')}>
                <Text style={styles.keypadKeyText}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity key="keypad-8" style={styles.keypadKey} onPress={() => handleButtonPress('8')}>
                <Text style={styles.keypadKeyText}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity key="keypad-9" style={styles.keypadKey} onPress={() => handleButtonPress('9')}>
                <Text style={styles.keypadKeyText}>9</Text>
              </TouchableOpacity>
            </View>

            {/* Row 4 */}
            <View style={styles.keypadRowLast}>
              <View style={styles.keypadEmpty} />
              <TouchableOpacity key="keypad-0" style={styles.keypadKey} onPress={() => handleButtonPress('0')}>
                <Text style={styles.keypadKeyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity key="keypad-backspace" style={styles.keypadKey} onPress={handleBackspace}>
                <Ionicons name="backspace-outline" size={28} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <View style={styles.continueButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  isContinueEnabled ? styles.continueButtonEnabled : styles.continueButtonDisabled
                ]}
                onPress={handleContinue}
                disabled={!isContinueEnabled || verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Account Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAccountModal}
          onRequestClose={() => setShowAccountModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Account</Text>
                <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountItem,
                      selectedAccount?.id === account.id ? styles.accountItemSelected : styles.accountItemUnselected
                    ]}
                    onPress={() => {
                      setSelectedAccount(account);
                      setShowAccountModal(false);
                    }}
                  >
                    <Image
                      source={getBankLogo(account.bankName)}
                      style={styles.accountItemLogo}
                    />
                    <View style={styles.accountItemContent}>
                      <Text style={styles.accountItemBank}>{account.bankName}</Text>
                      <Text style={styles.accountItemName}>{account.accountName}</Text>
                      <Text style={styles.accountItemNumber}>Account: {account.accountNumber}</Text>
                    </View>
                    {account.isPrimary && (
                      <View style={styles.accountItemPrimaryBadge}>
                        <Text style={styles.accountItemPrimaryText}>Primary</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyAccountsContainer}>
                  <Text style={styles.emptyAccountsText}>No bank accounts found</Text>
                  <TouchableOpacity
                    style={styles.addBankButton}
                    onPress={() => {
                      setShowAccountModal(false);
                      navigateToAddBank();
                    }}
                  >
                    <Text style={styles.addBankButtonText}>Add Bank Account</Text>
                  </TouchableOpacity>
                </View>
              )}
              {accounts.length > 0 && accounts.length < 2 && (
                <TouchableOpacity
                  style={styles.addNewBankButton}
                  onPress={() => {
                    setShowAccountModal(false);
                    navigateToAddBank();
                  }}
                >
                  <Text style={styles.addNewBankButtonText}>+ Add New Bank Account</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default WithdrawScreen; 