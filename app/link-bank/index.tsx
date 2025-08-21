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
  
  // Use back button handler for link-bank page
  useBackButtonHandler('/link-bank');
  
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
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>No network. Please connect to the internet to load your bank accounts.</Text>
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
      <View className="flex-1 justify-center items-center mt-10 px-4">
        <Text className="text-lg font-medium mb-2">No Bank Accounts</Text>
        <Text className="text-gray-500 text-center mb-6">
          You haven't added any bank accounts yet. Add an account to receive your commission payouts.
        </Text>
        <TouchableOpacity
          onPress={() => fetchData()}
          className="bg-blue-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-medium">Refresh</Text>
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
    <SafeAreaView className="flex-1 bg-[#0074FF]">
      {/* Header */}
      <View className="mt-12 pt-4 px-6">
      <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full  items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

        <View className="mt-6 mx-auto items-center">
          <Text className="text-[28px] font-bold text-white text-center">
            Link Bank Account
          </Text>
          <Text className="text-white text-center mt-2 px-2 text-base font-medium">
            Securely link your bank account to receive your commission payouts.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleAddBank}
          className={`bg-white rounded-full py-3 px-6 mx-auto mt-6 mb-2 w-[280px] flex-row justify-center items-center ${banks?.length === 2 ? 'opacity-60' : ''}`}
          disabled={banks?.length === 2}
        >
          <Text className="text-[#0074ff] font-semibold text-center text-base">
            {banks?.length === 0 ? "+ Add Bank Account" : 
             banks?.length === 2 ? "Accounts below" : 
             "+ Add New Bank"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* White Container with Bank Accounts */}
      <View className="flex-1 bg-white rounded-t-[40px] mt-6 overflow-hidden">
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
            contentContainerStyle={{
              paddingTop: 32,
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-semibold text-lg">Your Bank Accounts</Text>
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
          className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white text-3xl font-light">+</Text>
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
