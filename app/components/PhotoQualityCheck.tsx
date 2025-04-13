import React from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  StyleSheet
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export const PhotoQualityCheck = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;

  const handleDone = () => {
    // Return to the form with the photo URI
    router.push({
      pathname: '/contributor/add',
      params: { photoUri }
    });
  };

  const handleNewPhoto = async () => {
    try {
      // Open camera again
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      
      if (!result.canceled) {
        // Update the URI parameter in this screen
        router.replace({
          pathname: '/contributor/photo-quality',
          params: { photoUri: result.assets[0].uri }
        });
      }
    } catch (error) {
      console.error('Error taking new photo:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        {/* Title */}
        <Text className="text-3xl font-bold text-center text-[#0052CC] mb-2">Check Quality</Text>
        <Text className="text-gray-600 text-center mb-8">
          Make sure your face is not blurred or out of frame before continuing
        </Text>
        
        {/* Photo Display */}
        <View className="items-center mb-12">
          <Image 
            source={{ uri: photoUri }}
            style={{ 
              width: 280, 
              height: 280, 
              borderRadius: 20,
            }}
            resizeMode="cover"
          />
        </View>
        
        <View className="flex-1" />
        
        {/* Action Buttons */}
        <View className="space-y-4">
          <TouchableOpacity 
            onPress={handleDone}
            className="bg-blue-600 p-4 rounded-xl items-center w-full"
          >
            <Text className="text-white font-semibold text-lg">Done</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleNewPhoto}
            className="p-4 items-center w-full"
          >
            <Text className="text-blue-600 font-semibold text-lg">Take a New Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PhotoQualityCheck; 