import React from "react";
import { View, Text, Pressable } from "react-native";

export default function BankCard({ bank, isPrimary, onPress }: any) {
  return (
    <Pressable onPress={onPress} className="border rounded p-4 mt-4 bg-white shadow">
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="font-semibold text-lg">{bank.bankName}</Text>
          <Text>{bank.accountNumber}</Text>
          <Text className="text-xs text-gray-500">{bank.accountName}</Text>
        </View>
        {isPrimary && (
          <Text className="text-green-500 text-xs font-bold">Default</Text>
        )}
      </View>
    </Pressable>
  );
}
