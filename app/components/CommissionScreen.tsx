import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  ImageBackground,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Footer from './Footer';
import { fetchAccountCommission } from '../../services/api'; // Import the new API function
import StatusBarAdapter from './StatusBarAdapter';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from './EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton

// Define the CommissionTransaction type
interface CommissionTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  time: string;
}

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
  userImg?: string;
  commissions?: CommissionTransaction[];
}

const fetchCommissionData = async () => {
  return await fetchAccountCommission();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 999,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    color: '#991B1B',
    fontWeight: '500',
    marginLeft: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  commissionCard: {
    backgroundColor: '#2563EB',
    padding: 24,
    minHeight: 200,
  },
  cardContent: {
    position: 'relative',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: '#60A5FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconImage: {
    width: 64,
    height: 64,
    borderRadius: 999,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
  },
  earningsBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  earningsText: {
    color: '#FFFFFF',
  },
  earningsTextMargin: {
    color: '#FFFFFF',
    marginLeft: 4,
  },
  withdrawButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  withdrawButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 18,
  },
  recentsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  recentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentsLabel: {
    color: '#6B7280',
  },
  viewAllText: {
    color: '#2563EB',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateTitle: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  transactionItem: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDescription: {
    fontWeight: '500',
  },
  transactionAmount: {
    fontWeight: '600',
  },
  transactionAmountDebit: {
    fontWeight: '600',
    color: '#DC2626',
  },
  transactionAmountCredit: {
    fontWeight: '600',
    color: '#16A34A',
  },
  transactionAmountNeutral: {
    fontWeight: '600',
    color: '#4B5563',
  },
  transactionDate: {
    color: '#6B7280',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '91.666667%',
  },
  modalTitle: {
    color: '#2563EB',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalSectionText: {
    color: '#4B5563',
  },
  modalCloseContainer: {
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 16,
    width: '40%',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});

const CommissionScreen = () => {
  const router = useRouter();
  
  // Use back button handler for commission screen
  useBackButtonHandler('/commission');
  
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [commission, setCommission] = useState<number>(0);
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settlementAccounts, setSettlementAccounts] = useState<any[]>([]);
  const [commissionRaw, setCommissionRaw] = useState<number>(0); // for passing

  const fetchData = async (fromRefresh = false) => {
    setLoading(true);
    setError(null);
    if (fromRefresh) {
      await invalidateCache('commission_data');
    }
    try {
      const response = await getCachedData('commission_data', fetchCommissionData);
      if (response && response.status === 'Success' && response.data) {
        setCommission(response.data.commission || 0);
        setCommissionRaw(response.data.commission || 0);
        setTransactions(Array.isArray(response.data.transactions) ? response.data.transactions : []);
        setSettlementAccounts(Array.isArray(response.data.settlementAccounts) ? response.data.settlementAccounts : []);
      } else {
        setError('Failed to load commission data.');
      }
    } catch (err: any) {
      console.error('Commission data fetch error:', err);
      
      // Set fallback values to prevent crashes
      setCommission(0);
      setCommissionRaw(0);
      setTransactions([]);
      setSettlementAccounts([]);
      
      // Show user-friendly error message
      if (err.message) {
        setError(err.message);
      } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error - please check your internet connection and try again.');
      } else {
        setError('Failed to load commission data. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = () => {
    fetchData();
  };

  const navigateBack = () => {
    router.back();
  };

  const handleWithdraw = () => {
    router.push({
      pathname: '/commission/withdraw',
      params: {
        commission: commissionRaw,
        settlementAccounts: JSON.stringify(settlementAccounts)
      }
    });
  };

  const viewAllTransactions = () => {
    router.push({
      pathname: '/commission/CommissionTransactions',
      params: {
        transactions: JSON.stringify(transactions)
      }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  if (loading) {
    return <EsusuLoader />;
  }

  // Always render the main layout, even if error
  return (
    <View style={styles.container}>
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={navigateBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Commission</Text>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => setShowRatesModal(true)}
            >
              <Ionicons name="help-circle-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {/* Show error as a banner, not as a full screen */}
          {error && (
            <View style={styles.errorBanner}>
              <View style={styles.errorHeader}>
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                <Text style={styles.errorTitle}>Connection Error</Text>
              </View>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                onPress={handleRetry}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            {/* Commission Card */}
            <ImageBackground
              source={require('../../assets/images/Onboarding1.png')}
              style={{
                marginHorizontal: 16,
                borderRadius: 24,
                overflow: 'hidden',
                minHeight: 200
              }}
              imageStyle={{
                opacity: 0.3,
                borderRadius: 24
              }}
              resizeMode="cover"
            >
              <View style={[styles.commissionCard, { minHeight: 200 }]}>
                {/* Content */}
                <View style={{ position: 'relative' }}>
                {/* Profile Image and Balance */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Image 
                      source={require('../../assets/images/icon.png')}
                      style={styles.iconImage}
                    />
                  </View>
                  <Text style={styles.balanceLabel}>Your available balance is</Text>
                  <Text style={styles.balanceValue}>₦{commission ? commission.toLocaleString() : '--'}</Text>
                  {/* Earned this week tag */}
                  <View style={styles.earningsBadge}>
                    <Text style={styles.earningsText}>+₦{commission ? commission.toLocaleString() : '--'}</Text>
                    <Text style={styles.earningsTextMargin}>earned this week!</Text>
                  </View>
                </View>
                
                {/* Withdraw Button */}
                <TouchableOpacity 
                  style={styles.withdrawButton}
                  onPress={handleWithdraw}
                >
                  <Text style={styles.withdrawButtonText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            </View>
            </ImageBackground>
            
            <View style={styles.recentsContainer}>
              <View style={styles.recentsHeader}>
                <Text style={styles.recentsLabel}>Recents</Text>
                <TouchableOpacity onPress={viewAllTransactions}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Display latest 3 transactions as recents */}
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No Commission Transactions</Text>
                <Text style={styles.emptyStateText}>
                  It looks like you haven't made any commission transactions yet.
                </Text>
              </View>
            ) : (
              transactions.slice(0, 3).map((transaction: any) => {
                const title = (transaction.title || '').trim().toLowerCase();
                const isDebit = title === 'debit';
                const isCredit = title === 'credit';
                return (
                  <View key={transaction._id || transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionRow}>
                      <Text style={styles.transactionDescription}>{transaction.description || transaction.type}</Text>
                      <Text
                        style={isDebit ? styles.transactionAmountDebit : isCredit ? styles.transactionAmountCredit : styles.transactionAmountNeutral}
                      >
                        {isDebit
                          ? `-₦${Math.abs(transaction.amount).toLocaleString()}`
                          : isCredit
                          ? `+₦${transaction.amount.toLocaleString()}`
                          : `₦${transaction.amount.toLocaleString()}`}
                      </Text>
                    </View>
                    <Text style={styles.transactionDate}>{transaction.date || transaction.createdAt} {transaction.time || ''}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
        <Footer />
      </SafeAreaView>
      
      {/* Commission Rates Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRatesModal}
        onRequestClose={() => setShowRatesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Commission Rates Content */}
            <Text style={styles.modalTitle}>Commission Rates</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>First contribution deposit</Text>
              <Text style={styles.modalSectionText}>% per First contribution</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}> Contributor withdrawal fee</Text>
              <Text style={styles.modalSectionText}>% (Based on the Recipent back)</Text>
            </View>
            
            <View style={styles.modalCloseContainer}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRatesModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CommissionScreen; 