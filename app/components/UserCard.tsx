import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icons from @expo/vector-icons
import { useRouter } from 'expo-router';

interface User {
  firstname: string;
  email: string;
  id: string;
  userImg?: string; // Add user image property
}

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const router = useRouter();

  const handleDeposit = () => {
    router.push('/deposit');
  };

  const handleWithdraw = () => {
    router.push('/withdrawal');
  };

  return (
    <View className="bg-[#0052CC] rounded-2xl px-4 py-[20px] mt-4">
      {/* Header Section */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Image
            source={user.userImg ? { uri: user.userImg } : require('../assets/images/user.png')}
            className="w-10 h-10 rounded-full mr-2 border border-gray-100"
          />
          <View>
            <Text className="text-white text-sm">Hi, {user.firstname} 👋</Text>
            <Text className="text-white text-xs opacity-70">Agent ID: {user.id}</Text>
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
          <Text className="text-white text-3xl font-bold">₦ 0.00</Text>
        </View>
        <View>
          <Text className="text-white text-xs mb-2">Commission</Text>
          <View className="flex-row items-center bg-white rounded-full px-2 py-0.5">
            <Ionicons name="arrow-up" size={14} color="green" />
            <Text className="text-green-600 text-xs font-bold ml-1">₦0.00</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row mt-4">
        <TouchableOpacity 
          className="flex-1 flex-row items-center justify-center bg-black py-3 rounded-lg mr-2"
          onPress={handleDeposit}
        >
          <View className="w-6 h-6 rounded-full border border-white items-center justify-center mr-2">
            <Ionicons name="add" size={20} color="#fff" />
          </View>
          <Text className="text-white font-semibold">Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 flex-row items-center justify-center bg-[#00B0FF] py-3 rounded-lg ml-2"
          onPress={handleWithdraw}
        >
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
