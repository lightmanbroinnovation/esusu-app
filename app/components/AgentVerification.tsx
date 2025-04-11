import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const AgentVerification = () => {
  const router = useRouter();
  const [agentName, setAgentName] = useState('John Ade');
  const [agentId, setAgentId] = useState('AGT-12345');
  
  const navigateBack = () => {
    router.back();
  };

  const handleNext = () => {
    // Navigate to the savings plan setup screen
    router.push('/contributor/savings-plan');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center p-4">
          <TouchableOpacity 
            onPress={navigateBack}
            className="bg-gray-100 p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">Add New User</Text>
          <View style={{width: 40}} />
        </View>

        <View className="flex-1 px-4">
          {/* Title */}
          <Text className="text-3xl font-bold text-[#0052CC] mt-4">Confirm Your Identity</Text>
          <Text className="text-gray-700 mb-8 mt-2">
            Before completing this onboarding, we need to verify your identity as the agent responsible.
          </Text>
          
          {/* Form Fields */}
          <View className="space-y-6">
            {/* Agent Name */}
            <View>
              <Text className="text-gray-700 mb-1">Agent Name</Text>
              <TextInput
                value={agentName}
                onChangeText={setAgentName}
                className="bg-gray-100 p-4 rounded-xl"
                editable={false}
              />
            </View>
            
            {/* Agent ID */}
            <View>
              <Text className="text-gray-700 mb-1">Agent ID</Text>
              <TextInput
                value={agentId}
                onChangeText={setAgentId}
                className="bg-gray-100 p-4 rounded-xl"
                editable={false}
              />
            </View>
          </View>
        </View>
        
        {/* Bottom Button */}
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity 
            onPress={handleNext}
            className="bg-blue-600 p-4 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-lg">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AgentVerification; 