import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, Switch, Pressable, SafeAreaView, ScrollView, TouchableOpacity, Image } from "react-native";
import { useBank } from "./context/bank-context";


export const options = {
  headerShown: false,
};


export default function AddBankScreen() {
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { addBank } = useBank();
  const router = useRouter();

  const handleSave = () => {
    addBank({ bankName, accountName, accountNumber, isPrimary });
    if (router) {
      router.back();
    }
  };

  const handlePreviousPage = () => {
    router.back()
  }

  const handleNextPage = (route: string) => {
    router.push(route as any)
  }


  return (
    <SafeAreaView className="flex-1 bg-white h-screen">
      <ScrollView className="px-[1rem]">
        {/* header */}
        <View className="flex-row items-center gap-[110px] mt-[2rem]">
          <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
            <Image
              source={require('../assets/images/back-arrow.png')}
            />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Recipient</Text>
        </View>

        {/* content */}
        <View className="main mt-5">
          <View className="sub-header mb-6 flex flex-col gap-2">
            <Text className="text-[28px] font-semibold text-[#004699]">Add New Bank Account</Text>
            <Text className="text-base">Enter your bank details to receive commission payouts.</Text>
          </View>

          <View className="account-inputs">
            <Text className="mb-2 font-medium text-[#15141F]">What is the account number?</Text>
            <TextInput
              className="bg-[#F4F4F5] px-[1rem] py-[0.9rem] rounded-lg mb-3"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              placeholder="Enter account number"
            />

            <Text className="mb-2 font-medium text-[#15141F]">Select Bank</Text>
            <TextInput
              className="bg-[#F4F4F5] px-[1rem] py-[0.9rem] rounded-lg mb-3"
              value={bankName}
              onChangeText={setBankName}
              placeholder="Select Bank"
            />

            <Text className="mb-2 font-medium text-[#15141F]">Account Name</Text>
            <TextInput
              className="bg-[#F4F4F5] px-[1rem] py-[0.9rem] rounded-lg mb-3"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Account name"
            />

            <View className="flex-row justify-between items-start mb-6 mt-3">
              <View>
                <Text className="font-medium text-[14px] text-[#15141F] mb-2">Set as Primary Account</Text>
                <Text className="text-[12px] text-[#A9A8AF]">This will be your default withdrawal account.</Text>
              </View>
              <Switch value={isPrimary} onValueChange={setIsPrimary} />
            </View>
          </View>

          <View className=" mt-10 flex flex-row items-center gap-1">
            <Pressable onPress={() => router.back()} className="bg-red-100 px-4 py-4 rounded-xl w-[35%]">
              <Text className="text-red-500 text-base font-semibold text-center">Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} className="bg-[#0074FF] px-4 py-4 rounded-xl w-[65%]">
              <Text className="text-white text-base font-semibold text-center">Save Bank Account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 