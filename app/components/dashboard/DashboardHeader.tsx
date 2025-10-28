/**
 * Dashboard Header Component
 * Displays user information and account summary
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/user';

interface DashboardHeaderProps {
  user: User;
  accountData: any;
  onRefresh: () => void;
  refreshing: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  accountData,
  onRefresh,
  refreshing
}) => {
  return (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
      {/* User Info */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          {user.userImg ? (
            <Image
              source={{ uri: user.userImg }}
              className="w-12 h-12 rounded-full mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
          <View>
            <Text className="text-lg font-semibold text-gray-900">
              {user.firstname} {user.lastname}
            </Text>
            <Text className="text-sm text-gray-500">{user.email}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-full bg-gray-100"
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={refreshing ? "#999" : "#0074FF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Account Summary */}
      <View className="flex-row justify-between">
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Balance</Text>
          <Text className="text-2xl font-bold text-gray-900">
            ₦{parseFloat(user.balance || '0').toLocaleString()}
          </Text>
        </View>
        
        <View className="flex-1 items-end">
          <Text className="text-sm text-gray-500 mb-1">Weekly Earnings</Text>
          <Text className="text-2xl font-bold text-green-600">
            ₦{parseFloat(user.weeklyEarnings || '0').toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Account Data */}
      {accountData && (
        <View className="mt-4 pt-4 border-t border-gray-100">
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-sm text-gray-500">Total Contributors</Text>
              <Text className="text-lg font-semibold text-gray-900">
                {accountData.totalContributors || 0}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-sm text-gray-500">Active Groups</Text>
              <Text className="text-lg font-semibold text-gray-900">
                {accountData.activeGroups || 0}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DashboardHeader;



