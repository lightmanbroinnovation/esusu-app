import React from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { useRouter } from 'expo-router';

const SuccessScreen = () => {
  const router = useRouter();
  
  const handleGoBack = () => {
    router.push('/commission' as any);
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        {/* Confetti Background */}
        <View className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center">
          {/* Light blue squiggle (top left) */}
          <View className="absolute top-20 left-10">
            <View className="w-10 h-16 bg-blue-200 rounded-full transform rotate-45" />
          </View>
          
          {/* Red triangle (center) */}
          <View className="absolute top-1/3 right-1/3">
            <View className="w-8 h-8 bg-red-400 transform rotate-45" />
          </View>
          
          {/* Purple dash (top right) */}
          <View className="absolute top-1/4 right-10">
            <View className="w-6 h-2 bg-purple-300 rounded-full" />
          </View>
          
          {/* Green circle (center) */}
          <View className="absolute bottom-1/3 left-1/4">
            <View className="w-8 h-8 bg-green-200 rounded-full" />
          </View>
          
          {/* Yellow dash (bottom) */}
          <View className="absolute bottom-1/4 right-1/4">
            <View className="w-4 h-3 bg-yellow-300 rounded-full" />
          </View>
          
          {/* Light blue squiggle (bottom) */}
          <View className="absolute bottom-20 right-10">
            <View className="w-10 h-16 bg-blue-200 rounded-full transform rotate-45" />
          </View>
        </View>
        
        {/* Success Checkmark */}
        <View className="w-32 h-32 bg-green-400 rounded-full items-center justify-center mb-10">
          <View className="w-16 h-10 border-white border-4 border-t-0 border-r-0 transform rotate-[315deg] ml-1 mt-1" />
        </View>
        
        {/* Success Text */}
        <Text className="text-blue-600 text-4xl font-bold text-center mb-4">Successful!</Text>
        <Text className="text-gray-700 text-lg text-center mb-16">
          Your commission has been sent to your bank account.
        </Text>
        
        {/* Go Back Button */}
        <TouchableOpacity 
          className="bg-blue-600 w-full py-4 rounded-xl"
          onPress={handleGoBack}
        >
          <Text className="text-white text-lg font-semibold text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SuccessScreen; 