import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icons from @expo/vector-icons


const UserCard = () => {
  return (
    <View className="bg-[#0052CC] rounded-2xl px-4 py-[20px] mt-4">
      {/* Header Section */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Image
            source={{ uri: 'https://placehold.co/40x40' }}
            className="w-10 h-10 rounded-full mr-2 border border-gray-100"
          />
          <View>
            <Text className="text-white text-sm">Hi, John 👋</Text>
            <Text className="text-white text-xs opacity-70">Agent ID: AGT-12345</Text>
          </View>
        </View>
        <Ionicons
        className='border rounded-full p-1 border-white'
          name="notifications-outline"
          size={24}
          color={"#fff"}
       
        />
      </View>

      {/* Balance Section */}
      <View className="flex-row justify-between mt-4">
        <View>
          <Text className="text-white text-xs mb-2">Total Balance</Text>
          <Text className="text-white text-2xl font-bold">₦0.0</Text>
        </View>
        <View>
          <Text className="text-white text-xs mb-2">Commission</Text>
          <Text className=" text-xs  p-[1px] bg-green-100 text-green-600 text-center rounded-2xl font-bold">₦0.0</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-between mt-6">
      {/* Deposit Button */}
      <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-black py-3 rounded-lg mr-2">
        <View className="w-6 h-6 rounded-full border border-white items-center justify-center mr-2">
          <Ionicons name="add" size={20} color="#fff" />
        </View>
        <Text className="text-white font-semibold">Deposit</Text>
      </TouchableOpacity>

      {/* Withdraw Button */}
      <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#00B0FF] py-3 rounded-lg ml-2">
        <View className="w-6 h-6 rounded-full border border-white items-center justify-center mr-2">
          <Ionicons name="remove" size={20} color="#fff" />
        </View>
        <Text className="text-white font-semibold">Withdraw</Text>
      </TouchableOpacity>
    </View>
    </View>
  );
};

export default UserCard;
