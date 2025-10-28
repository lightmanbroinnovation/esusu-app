/**
 * Dashboard Actions Component
 * Displays quick action buttons for the dashboard
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DashboardActionsProps {
  disabled?: boolean;
}

export const DashboardActions: React.FC<DashboardActionsProps> = ({
  disabled = false
}) => {
  const router = useRouter();

  const actions = [
    {
      id: 'add-contributor',
      title: 'Add Contributor',
      icon: 'person-add-outline',
      color: '#0074FF',
      onPress: () => router.push('/contributor/add')
    },
    {
      id: 'view-contributors',
      title: 'View Contributors',
      icon: 'people-outline',
      color: '#28A745',
      onPress: () => router.push('/contributors')
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: 'swap-horizontal-outline',
      color: '#FFC107',
      onPress: () => router.push('/transactions')
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      icon: 'card-outline',
      color: '#DC3545',
      onPress: () => router.push('/withdrawal')
    }
  ];

  return (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
      
      <View className="flex-row flex-wrap justify-between">
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={action.onPress}
            disabled={disabled}
            className={`w-[48%] mb-3 p-4 rounded-xl items-center ${
              disabled ? 'opacity-50' : 'bg-gray-50'
            }`}
            style={{ opacity: disabled ? 0.5 : 1 }}
          >
            <View 
              className="w-12 h-12 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: `${action.color}20` }}
            >
              <Ionicons 
                name={action.icon as any} 
                size={24} 
                color={action.color} 
              />
            </View>
            <Text className="text-sm font-medium text-gray-900 text-center">
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default DashboardActions;



