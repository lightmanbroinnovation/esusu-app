import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DocumentQualityCheckProps {
  documentType: string;
  documentImage: string; // URI of the document image
  isLoading?: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onRetake: () => void;
}

const DocumentQualityCheck = ({ 
  documentType,
  documentImage,
  isLoading = false,
  onBack,
  onConfirm,
  onRetake
}: DocumentQualityCheckProps) => {
  
  const getTitle = () => {
    switch(documentType) {
      case 'drivers_license':
        return "Driver's License";
      case 'national_id':
        return "National Identity Card";
      case 'passport':
        return "Passport";
      case 'business_location':
        return "Business Location";
      default:
        return "Document";
    }
  };

  const getInstructions = () => {
    return documentType === 'business_location' 
      ? "Make sure the image is not blurred before continuing"
      : "Please make sure your card details are clear to read with no blur or glare";
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-6 flex-1">
        <TouchableOpacity 
          className="bg-gray-100 p-2 rounded-full"
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View className="mt-8 mb-4">
          <Text className="text-[#0052CC] text-3xl font-bold text-center">
            Check Quality
          </Text>
          <Text className="text-gray-600 text-base text-center mt-2 px-4">
            {getInstructions()}
          </Text>
        </View>

        <View className="flex-1 justify-center items-center my-6">
          {isLoading ? (
            <View className="bg-gray-200 rounded-3xl w-full aspect-square items-center justify-center">
              <ActivityIndicator size="large" color="#007BFF" />
            </View>
          ) : documentImage ? (
            <View className="w-full aspect-square rounded-3xl overflow-hidden border border-gray-200">
              <Image
                source={{ uri: documentImage }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View className="bg-gray-200 rounded-3xl w-full aspect-square items-center justify-center">
              <Text className="text-gray-500">No image available</Text>
            </View>
          )}
        </View>

        <View className="mt-auto mb-4 space-y-3">
          <TouchableOpacity 
            className="bg-[#007BFF] py-4 rounded-xl"
            onPress={onConfirm}
          >
            <Text className="text-white text-center text-lg font-medium">
              Done
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="py-4"
            onPress={onRetake}
          >
            <Text className="text-[#007BFF] text-center text-lg font-medium">
              Take a New Photo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DocumentQualityCheck; 