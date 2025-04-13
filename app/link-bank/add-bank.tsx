import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, Switch, Pressable } from "react-native";
import { useBank } from "./context/bank-context";

export default function AddBankScreen() {
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { addBank } = useBank();
  const router = useRouter();

  const handleSave = () => {
    addBank({ bankName, accountName, isPrimary });
    if (router) {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold mb-6">Add New Bank Account</Text>

      <Text className="mb-1">Account Number</Text>
      <TextInput
        className="border p-2 rounded mb-4"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
      />

      <Text className="mb-1">Bank Name</Text>
      <TextInput
        className="border p-2 rounded mb-4"
        value={bankName}
        onChangeText={setBankName}
      />

      <Text className="mb-1">Account Name</Text>
      <TextInput
        className="border p-2 rounded mb-4"
        value={accountName}
        onChangeText={setAccountName}
      />

      <View className="flex-row justify-between items-center mb-6">
        <Text>Set as Primary</Text>
        <Switch value={isPrimary} onValueChange={setIsPrimary} />
      </View>

      <View className="flex-row justify-between">
        <Pressable onPress={() => router.back()} className="bg-gray-300 px-4 py-2 rounded">
          <Text>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSave} className="bg-blue-600 px-4 py-2 rounded">
          <Text className="text-white">Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
