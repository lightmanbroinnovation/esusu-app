import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BusinessInfoFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const BusinessInfoForm = ({ onClose, onSave }: BusinessInfoFormProps) => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessAddress: '',
    phone: '',
    email: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    // Validate form data here
    onSave(formData);
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

          <View className="mt-16 mb-8">
            <Text className="text-[#0052CC] text-3xl font-bold text-center">
              Business Information
            </Text>
            <Text className="text-gray-600 text-base text-center mt-2 px-4">
              Provide details about your business to ensure a smooth verification process.
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 mb-1 font-medium">Business Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="Enter business name"
                value={formData.businessName}
                onChangeText={(text) => handleChange('businessName', text)}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Business Type</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="Enter business type"
                value={formData.businessType}
                onChangeText={(text) => handleChange('businessType', text)}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Business Address</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="Enter business address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={formData.businessAddress}
                onChangeText={(text) => handleChange('businessAddress', text)}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Phone Number</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Email Address</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="Enter email address"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
              />
            </View>
          </View>

          <TouchableOpacity 
            className="bg-[#007BFF] py-4 rounded-xl mt-8"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center text-lg font-medium">
              Save & Continue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BusinessInfoForm; 