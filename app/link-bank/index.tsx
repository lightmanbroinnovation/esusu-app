import { useRouter } from "expo-router";
import { useBank } from "./context/bank-context";
import {
  View,
  Text,
  Pressable,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import BankCard from "./components/bank-card";
import BottomSheet from "./components/bottom-sheet";
import type { Bank } from './types';

export default function LinkBankScreen() {
  const router = useRouter();
  const { banks, primaryBankId, isLoading, error, refreshBanks } = useBank();
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  useEffect(() => {
    // Refresh bank accounts when the screen is focused
    refreshBanks();
  }, []);

  const handlePreviousPage = () => {
    router.back();
  };

  const handleAddBank = () => {
    router.push('/link-bank/add-bank' as any);
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center mt-10">
          <ActivityIndicator size="large" color="#0074FF" />
          <Text className="text-gray-500 mt-4">Loading your bank accounts...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center mt-10 px-4">
          <Image
            source={require('../assets/images/icon.png')}
            className="w-16 h-16 mb-4"
          />
          <Text className="text-red-500 text-lg font-medium mb-2">Error Loading Accounts</Text>
          <Text className="text-gray-500 text-center mb-6">{error}</Text>
          <TouchableOpacity
            onPress={refreshBanks}
            className="bg-blue-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="flex-1 justify-center items-center mt-10 px-4">
        <Image
          source={require('../assets/images/icon.png')}
          className="w-16 h-16 mb-4"
        />
        <Text className="text-lg font-medium mb-2">No Bank Accounts</Text>
        <Text className="text-gray-500 text-center mb-6">
          You haven't added any bank accounts yet. Add an account to receive your commission payouts.
        </Text>
     
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0074FF]">
      {/* Header */}
      <View className="mt-12 pt-4 px-6">
        <TouchableOpacity
          onPress={handlePreviousPage}
          className="bg-[#F2F8FF] h-8 w-8 rounded-full items-center justify-center p-3"
        >
          <Image source={require("../assets/images/back-arrow.png")} />
        </TouchableOpacity>

        <View className="mt-6 mx-auto items-center">
          <Text className="text-[28px] font-semibold text-white text-center">
            Link Bank Account
          </Text>
          <Text className="text-white text-center mt-2 px-2 text-base">
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
      <View className="flex-1 bg-white rounded-t-[32px] mt-6 overflow-hidden">
        {banks && banks.length > 0 ? (
          <FlatList
            data={banks.filter(bank => !!bank.id)}
            keyExtractor={(item) => item.id || ''}
            renderItem={({ item }) => (
              <BankCard
                bank={item as import('./types').Bank}
                isPrimary={item.isPrimary}
                onPress={() => setSelectedBank(item as import('./types').Bank)}
              />
            )}
            contentContainerStyle={{
              paddingTop: 16,
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium text-lg">Your Bank Accounts</Text>
            
              </View>
            }
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Floating Add Button (visible only when accounts exist) */}
      {banks && banks.length > 0 && (
        <TouchableOpacity
          onPress={handleAddBank}
          className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white text-3xl font-light">+</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Sheet */}
      {selectedBank && (
        <BottomSheet bank={selectedBank} onClose={() => setSelectedBank(null)} />
      )}
    </SafeAreaView>
  );
}
