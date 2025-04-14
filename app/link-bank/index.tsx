import { useRouter } from "expo-router";
import { useBank } from "./context/bank-context";
import { View, Text, Pressable, FlatList } from "react-native";
import { useState } from "react";
import BankCard from "./components/bank-card";
import BottomSheet from "./components/bottom-sheet";
import type { Bank } from './types'; // Ensure you have a 'Bank' type defined in './types' or the appropriate file

export default function LinkBankScreen() {
  const router = useRouter();
  const { banks, primaryBankId } = useBank();
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-center">Link Bank Account</Text>
      <Text className="text-gray-500 text-center mb-4">
        Securely link your bank account to receive payouts.
      </Text>

      <Pressable
        onPress={() => router.push('/link-bank/add-bank')}
        className="bg-blue-600 rounded-full py-3 px-6 mx-auto"
      >
        <Text className="text-white font-semibold text-center">Remind Me Later</Text>
      </Pressable>

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
        className="mt-4"
      />

      {selectedBank && (
        <BottomSheet bank={selectedBank} onClose={() => setSelectedBank(null)} />
      )}
    </View>
  );
}
