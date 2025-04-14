import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBank } from "../context/bank-context";

interface Bank {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function BankBottomSheet({
  bank,
  onClose,
}: {
  bank: Bank;
  onClose: () => void;
}) {
  const { removeBank, primaryBankId, setPrimary } = useBank();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    // Slide up when modal opens
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={true} transparent animationType="none" onRequestClose={handleClose}>
      {/* Overlay */}
      <View className="flex-1 bg-black/60">
        {/* Close Button */}
        <TouchableOpacity
          onPress={handleClose}
          className="absolute top-10 right-5 z-20"
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Sliding Sheet */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
          }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6"
        >
          <View className="mb-4 flex flex-col gap-4 py-4">
            <Text className="capitalize text-[#52515E] text-[14px]">bank name</Text>
            <Text className="text-[18px] font-semibold capitalize">{bank.bankName}</Text>
          </View>

          <View className="h-[1px] w-full bg-gray-200"></View>


          <View className="mb-4 flex flex-col gap-4 py-4">
            <Text className="capitalize text-[#52515E] text-[14px]">account number</Text>
            <Text className="text-[18px] font-semibold capitalize">{bank.accountNumber}</Text>
          </View>

          <View className="h-[1px] w-full bg-gray-200"></View>

          <View className="flex-row justify-between items-start mb-16 py-6">
            <View className="flex flex-col gap-4">
              <Text className="text-[#15141F] text-[14px] font-medium">Set as Primary Account</Text>
              <Text className="text-[#A9A8AF] text-[12px]">This will be your default withdrawal account.</Text>
            </View>
            <Switch
              value={bank.id === primaryBankId}
              onValueChange={(val) => setPrimary(val ? bank.id : "")}
            />
          </View>

          <Pressable
            onPress={() => {
              removeBank(bank.id);
              handleClose();
            }}
            className="bg-red-200 px-4 py-4 rounded-[32px]"
          >
            <Text className="text-red-500 text-center text-[18px] font-semibold">Remove</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
