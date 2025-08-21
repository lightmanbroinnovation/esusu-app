import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerificationStepProps {
  title: string;
  description: string;
  completed: boolean;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const VerificationStep = ({ 
  title, 
  description, 
  completed, 
  selected, 
  onPress, 
  disabled = false
}: VerificationStepProps) => {
  return (
    <TouchableOpacity 
      className="bg-[#F0F8FF] rounded-xl my-2 p-6 relative"
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View className="flex-col space-x-4 justify-center items-center">
        <View className="flex-1 pr-4">
          <Text className="text-[#0052CC] text-center text-xl font-semibold mb-2">
            {title}
          </Text>
          <Text className="text-gray-600 text-center mb-2 text-sm">
            {description}
          </Text>
        </View>
        {(completed || disabled) ? (
          <View className="bg-green-100 mt-2 rounded-full w-12 h-12 items-center justify-center">
            <Ionicons name="checkmark" size={24} color="green" />
          </View>
        ) : (
          <View className="items-center mt-2">
            <View className="bg-[#E5F1FF] rounded-full w-12 h-12 items-center justify-center mb-1">
              <Ionicons name="add" size={24} color="#007BFF" />
            </View>
            <Text className="text-[#007BFF] text-xs">Select</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default VerificationStep; 