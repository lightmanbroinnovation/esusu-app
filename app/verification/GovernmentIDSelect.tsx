import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GovernmentIDSelectProps {
  onClose: () => void;
  onSelectIDType: (type: string) => void;
}

const GovernmentIDSelect = ({ onClose, onSelectIDType }: GovernmentIDSelectProps) => {
  const handleSelect = (type: string) => {
    onSelectIDType(type);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-6">
          <TouchableOpacity 
            className="absolute right-6 top-6 bg-gray-100 p-2 rounded-full z-10"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          <View className="mt-16 mb-6">
            <Text className="text-[#0052CC] text-3xl font-bold text-center">
              Verify Business
            </Text>
            <Text className="text-gray-600 text-base text-center mt-2 px-4">
              Complete your KYB verification to start managing contributions securely.
            </Text>
          </View>

          <View className="my-6">
            <Text className="text-2xl font-bold text-center mb-8">
              Which photo ID would you like to use
            </Text>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleSelect('drivers_license')}
            >
              <Text className="text-xl font-bold">Driver's License</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleSelect('national_id')}
            >
              <Text className="text-xl font-bold">National Identity Card (NIN)</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleSelect('passport')}
            >
              <Text className="text-xl font-bold">Passport</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GovernmentIDSelect; 