import React from "react";
import { View, Text, Pressable } from "react-native";

export default function BankCard({ bank, isPrimary, onPress }: any) {
  return (
    <Pressable onPress={onPress} className="border border-1 border-[#F4F4F5] rounded px-4 py-[24px] mt-4 bg-white">
      <View className="flex-row justify-between items-start">
        <View className="flex flex-col gap-3">
          <Text className="font-semibold text-lg capitalize">{bank.bankName}</Text>
          <Text className="text-[#52515E]">{bank.accountNumber}</Text>
          <Text className="text-[14px] text-[#52515E] capitalize font-medium">{bank.accountName}</Text>
        </View>
        {isPrimary && (
          <Text className="text-green-500 text-xs font-bold bg-green-100 px-3 py-1 rounded-full">Default</Text>
        )}
      </View>
    </Pressable>
  );
}
