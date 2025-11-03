import React from 'react';
import { useRouter } from "expo-router";
// import { useBank } from "./context/bank-context"; // Remove context usage for bank list
import {
  View,
  Text,
  Pressable,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useState, useEffect } from "react";
import BankCard from "./components/bank-card";
import BottomSheet from "./components/bottom-sheet";
import type { Bank } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from '../components/EsusuLoader';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useBackButtonHandler } from '../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton

export default function LinkBankScreen() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  
  // Use back button handler for link-bank page
  useBackButtonHandler('/settings');
  
  // const { banks, primaryBankId, isLoading, error, refreshBanks } = useBank();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  const fetchSettlementAccountsData = async () => {
    let token = '';
    try {
      token = await AsyncStorage.getItem('auth_token') || '';
    } catch (e) {
      console.log('Could not get token from AsyncStorage:', e);
    }
    const response = await fetch('https://esusu-server.onrender.com/api/account/settlement-accounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    const data = await response.json();
    if ((data.status === 'Success' || data.status === 'Successfully gotten the settlement accounts') && Array.isArray(data.data)) {
      return data.data;
    } else if ((data.status === 'Success' || data.status === 'Successfully gotten the settlement accounts') && data.data && Array.isArray(data.data.settlementAccounts)) {
      return data.data.settlementAccounts;
    } else {
      throw new Error(data.message || 'Failed to fetch settlement accounts');
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (fromRefresh = false) => {
    setIsLoading(true);
    setError(null);
    let cacheData = null;
    try {
      const cached = await AsyncStorage.getItem('settlement_accounts');
      if (cached) {
        cacheData = JSON.parse(cached);
        setBanks(cacheData);
      }
    } catch {}
    if (!networkAvailable && cacheData) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }
    if (fromRefresh) {
      await invalidateCache('settlement_accounts');
    }
    try {
      const accountsData = await getCachedData('settlement_accounts', fetchSettlementAccountsData);
      setBanks(accountsData);
    } catch (err) {
      if (!cacheData) {
        setError('Failed to fetch settlement accounts');
        setBanks([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  if (isLoading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && banks.length === 0) {
    return (
      <SafeAreaView style={styles.noNetworkContainer}>
        <Text style={styles.noNetworkText}>No network. Please connect to the internet to load your bank accounts.</Text>
      </SafeAreaView>
    );
  }

  // const handlePreviousPage = () => {
  //   router.back();
  // };

  const handleAddBank = () => {
    router.push('/link-bank/add-bank' as any);
  };

  const renderEmptyState = () => {
    // Only show a simple message and add button, no large image
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Bank Accounts</Text>
        <Text style={styles.emptyDescription}>
          You haven't added any bank accounts yet. Add an account to receive your commission payouts.
        </Text>
        <TouchableOpacity
          onPress={() => fetchData()}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Helper: log the banks array after filtering
  console.log('[LinkBankScreen] Raw banks array:', banks);
  console.log('[LinkBankScreen] Banks array length:', banks.length);
  
  // Loosened filter: allow banks with accountName and at least one of accountNumber, bankName, or bankCode
  const displayBanks = banks.filter(bank =>
    bank.accountName && (bank.accountNumber || bank.bankName || (bank as any).bankCode)
  );
  
  console.log('[LinkBankScreen] Display banks after filtering:', displayBanks);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
      <TouchableOpacity
              onPress={() => router.back()}
          style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Link Bank Account</Text>
          <Text style={styles.subtitle}>
            Securely link your bank account to receive your commission payouts.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleAddBank}
          style={[
            styles.addButton,
            banks?.length === 2 && styles.addButtonDisabled
          ]}
          disabled={banks?.length === 2}
        >
          <Text style={styles.addButtonText}>
            {banks?.length === 0 ? "+ Add Bank Account" : 
             banks?.length === 2 ? "Accounts below" : 
             "+ Add New Bank"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* White Container with Bank Accounts */}
      <View style={styles.contentContainer}>
        {displayBanks && displayBanks.length > 0 ? (
          <FlatList
            data={displayBanks}
            keyExtractor={(item) => item.id || item.accountNumber || String((item as any).bankCode)}
            renderItem={({ item }) => {
              console.log('[LinkBankScreen] Rendering BankCard with:', item);
              return (
                <BankCard
                  bank={item}
                  isPrimary={item.isPrimary}
                  onPress={() => setSelectedBank(item)}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>Your Bank Accounts</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Floating Add Button (visible only when accounts exist) */}
      {displayBanks && displayBanks.length > 0 && displayBanks.length < 2 && (
        <TouchableOpacity
          onPress={handleAddBank}
          style={styles.floatingButton}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Sheet */}
      {selectedBank && (
        (console.log('[LinkBankScreen] Passing to BottomSheet:', selectedBank),
        <BottomSheet bank={selectedBank} onClose={() => setSelectedBank(null)} />)
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0074FF',
  },
  noNetworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  noNetworkText: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 48,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
    width: 280,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#0074FF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 24,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listHeaderText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2563EB',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
});
