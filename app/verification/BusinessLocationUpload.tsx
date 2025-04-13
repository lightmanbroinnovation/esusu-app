import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BusinessLocationUploadProps {
  onClose: () => void;
  onTakePhoto: () => void;
}

const BusinessLocationUpload = ({ onClose, onTakePhoto }: BusinessLocationUploadProps) => {
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

          <View className="mt-16 mb-8">
            <Text className="text-[#0052CC] text-3xl font-bold text-center">
              Business Location
            </Text>
            <Text className="text-gray-600 text-base text-center mt-2 px-4">
              Upload clear photos of your shop to verify your business location.
            </Text>
          </View>

          <View className="mt-8">
            <Text className="text-gray-700 mb-6 text-center">
              Please take photos that clearly show:
            </Text>

            <View className="space-y-4">
              <View className="flex-row items-center">
                <View className="bg-[#007BFF] rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Text className="text-white font-bold">1</Text>
                </View>
                <Text className="text-gray-700 flex-1">The front of your business with signage</Text>
              </View>

              <View className="flex-row items-center">
                <View className="bg-[#007BFF] rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Text className="text-white font-bold">2</Text>
                </View>
                <Text className="text-gray-700 flex-1">Inside your shop or business premises</Text>
              </View>

              <View className="flex-row items-center">
                <View className="bg-[#007BFF] rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Text className="text-white font-bold">3</Text>
                </View>
                <Text className="text-gray-700 flex-1">Any official business registration displayed</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            className="flex-row items-center justify-center bg-[#E5F1FF] py-6 rounded-xl mt-10"
            onPress={onTakePhoto}
          >
            <View className="bg-[#007BFF] rounded-full w-12 h-12 items-center justify-center mr-4">
              <Ionicons name="add" size={24} color="white" />
            </View>
            <Text className="text-[#007BFF] text-xl font-medium">
              Select
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BusinessLocationUpload; 