import { useRouter } from "expo-router";
import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Switch, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert
} from "react-native";
import { useBank } from "./context/bank-context";
import React from 'react';

export const options = {
  headerShown: false,
};

export default function AddBankScreen() {
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { addBank, isLoading, error } = useBank();
  const router = useRouter();

  const validateForm = () => {
    if (!accountNumber.trim()) {
      Alert.alert("Error", "Please enter your account number");
      return false;
    }
    if (!bankName.trim()) {
      Alert.alert("Error", "Please select a bank");
      return false;
    }
    if (!accountName.trim()) {
      Alert.alert("Error", "Please enter the account name");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      await addBank({ 
        bankName, 
        accountName, 
        accountNumber, 
        isPrimary 
      });
      
      Alert.alert(
        "Success", 
        "Bank account added successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err) {
      console.error("Error saving bank account:", err);
      Alert.alert(
        "Error", 
        error || "Failed to add bank account. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviousPage = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mt-6">
          <TouchableOpacity 
            onPress={handlePreviousPage} 
            className="bg-gray-100 h-10 w-10 rounded-full items-center justify-center"
          >
            <Image
              source={require('../assets/images/back-arrow.png')}
              className="h-5 w-5"
            />
          </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">Recipient</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View className="mt-8">
          <Text className="text-[#004699] text-3xl font-semibold">Add New Bank Account</Text>
          <Text className="text-gray-700 mt-2 text-base">
            Enter your bank details to receive commission payouts.
          </Text>

          <View className="mt-8">
            <Text className="text-gray-800 font-medium mb-2">What is the account number?</Text>
            <TextInput
              className="bg-gray-100 px-4 py-4 rounded-lg text-gray-700 text-base"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              placeholder="Enter account number"
              maxLength={10}
              editable={!isSaving}
            />

            <Text className="text-gray-800 font-medium mb-2 mt-6">Select Bank</Text>
            <TextInput
              className="bg-gray-100 px-4 py-4 rounded-lg text-gray-700 text-base"
              value={bankName}
              onChangeText={setBankName}
              placeholder="Select the bank"
              editable={!isSaving}
            />

            <Text className="text-gray-800 font-medium mb-2 mt-6">Account Name</Text>
            <TextInput
              className="bg-gray-100 px-4 py-4 rounded-lg text-gray-700 text-base"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Account name"
              editable={!isSaving}
            />

            <View className="flex-row justify-between items-center mt-8">
              <View>
                <Text className="text-gray-800 font-medium text-base">Set as Primary Account</Text>
                <Text className="text-gray-400 text-sm mt-1">This will be your default withdrawal account.</Text>
              </View>
              <Switch 
                value={isPrimary} 
                onValueChange={setIsPrimary}
                disabled={isSaving}
                trackColor={{ false: '#D1D5DB', true: '#0074FF' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>
        </View>

        {/* Footer Buttons */}
        <View className="flex-row justify-between mt-auto mb-8 pt-20">
          <TouchableOpacity 
            onPress={handlePreviousPage} 
            className="bg-red-100 py-4 rounded-xl flex-1 mr-2"
            disabled={isSaving}
          >
            <Text className="text-red-500 text-lg font-medium text-center">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSave} 
            className={`${isSaving ? 'bg-blue-400' : 'bg-blue-600'} py-4 rounded-xl flex-1 ml-2 flex-row justify-center items-center`}
            disabled={isSaving}
          >
            {isSaving ? (
              <React.Fragment>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white text-lg font-medium ml-2">Saving...</Text>
              </React.Fragment>
            ) : (
              <Text className="text-white text-lg font-medium text-center">Save Bank Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 