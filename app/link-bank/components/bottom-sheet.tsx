import React from "react";
import { View, Text, Pressable, Switch } from "react-native";
import BottomSheet from "react-native-simple-bottom-sheet";
import { useBank } from "../context/bank-context";

interface Bank {
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    isPrimary?: boolean;
}

export default function BankBottomSheet({ bank, onClose }: { bank: Bank; onClose: () => void }) {
  const { removeBank, primaryBankId, setPrimary } = useBank();

  return (
    <BottomSheet isOpen onClose={onClose}>
      <View className="p-4">
        <Text className="text-xl font-bold mb-4">{bank.bankName}</Text>
        <Text className="mb-2">Account Number: {bank.accountNumber}</Text>

        <View className="flex-row justify-between items-center my-4">
          <Text>Set as Primary Account</Text>
          <Switch
            value={bank.id === primaryBankId}
            onValueChange={(val) => setPrimary(val ? bank.id : "")}
          />
        </View>

        <Pressable
          onPress={() => {
            removeBank(bank.id);
            onClose();
          }}
          className="bg-red-500 px-4 py-3 rounded mt-6"
        >
          <Text className="text-white text-center font-semibold">Remove</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
