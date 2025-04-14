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
} from "react-native";
import { useState } from "react";
import BankCard from "./components/bank-card";
import BottomSheet from "./components/bottom-sheet";
import type { Bank } from './types';

export default function LinkBankScreen() {
  const router = useRouter();
  const { banks, primaryBankId } = useBank();
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  const handlePreviousPage = () => {
    router.back();
  };

  const handleNextPage = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0074FF]">
      {/* Header */}
      <View className="pt-5 px-6">
        <TouchableOpacity
          onPress={handlePreviousPage}
          className="bg-[#F2F8FF] h-8 w-8 rounded-full items-center justify-center p-3"
        >
          <Image source={require("../assets/images/back-arrow.png")} />
        </TouchableOpacity>

        <View className="mt-6 mx-auto items-center">
          <Text className="text-[24px] font-semibold text-white text-center">
            Link Bank Account
          </Text>
          <Text className="text-white text-center mt-1 px-2">
            Securely link your bank account to receive your commission payouts.
          </Text>
        </View>

        <Pressable
          onPress={() => handleNextPage('/link-bank/add-bank')}
          className="bg-white rounded-full py-3 px-6 mx-auto mt-6 w-[280px]"
        >
          <Text className="text-[#0074ff] font-semibold text-center">
            + Remind Me Later
          </Text>
        </Pressable>
      </View>

      {/* White Container with FlatList */}
      <View className="flex-1 bg-white rounded-t-[32px] mt-10 overflow-hidden">
        <FlatList
          data={banks || []}
          keyExtractor={(item) => item.id || ''}
          renderItem={({ item }) => (
            <BankCard
              bank={item}
              isPrimary={item.id === primaryBankId}
              onPress={() =>
                item.id &&
                setSelectedBank({
                  id: item.id,
                  accountNumber: item.accountNumber || '',
                  bankName: item.bankName,
                  accountName: item.accountName,
                  isPrimary: item.isPrimary,
                })
              }
            />
          )}
          contentContainerStyle={{
            paddingTop: 16,
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Bottom Sheet */}
      {selectedBank && (
        <BottomSheet bank={selectedBank} onClose={() => setSelectedBank(null)} />
      )}
    </SafeAreaView>
  );
}
