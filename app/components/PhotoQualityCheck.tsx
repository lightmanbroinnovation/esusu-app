import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export const PhotoQualityCheck = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDone = () => {
    // Return to the form with the photo URI
    router.push({
      pathname: '/contributor/add',
      params: { photoUri }
    });
  };

  const handleNewPhoto = async () => {
    try {
      setLoading(true);
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take photos. Please enable it in your device settings.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }
      
      // Open camera with improved options
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        exif: true,
      });
      
      if (!result.canceled) {
        // Update the URI parameter in this screen
        router.replace({
          pathname: '/contributor/photo-quality',
          params: { photoUri: result.assets[0].uri }
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error taking new photo:', error);
      Alert.alert(
        "Camera Error",
        "There was a problem accessing your camera. Please try again.",
        [{ text: "OK" }]
      );
      setLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        {/* Header with back button */}
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-gray-100 p-2 rounded-full self-start mb-6"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Title */}
        <Text className="text-3xl font-bold text-center text-[#0052CC] mb-2">Check Quality</Text>
        <Text className="text-gray-600 text-center mb-8">
          Make sure your face is not blurred or out of frame before continuing
        </Text>
        
        {/* Photo Display */}
        <View className="items-center mb-12">
          {loading ? (
            <View className="bg-gray-100 w-[280px] h-[280px] rounded-3xl items-center justify-center">
              <ActivityIndicator size="large" color="#0052CC" />
            </View>
          ) : imageError ? (
            <View className="bg-gray-100 w-[280px] h-[280px] rounded-3xl items-center justify-center">
              <Text className="text-gray-500 text-center px-4">
                Image could not be loaded. Please take a new photo.
              </Text>
            </View>
          ) : (
            <Image 
              source={{ uri: photoUri }}
              style={{ 
                width: 280, 
                height: 280, 
                borderRadius: 20,
              }}
              resizeMode="cover"
              onError={handleImageError}
            />
          )}
        </View>
        
        <View className="flex-1" />
        
        {/* Action Buttons */}
        <View className="space-y-4">
          <TouchableOpacity 
            onPress={handleDone}
            className="bg-blue-600 p-4 rounded-xl items-center w-full"
            disabled={loading || imageError}
            style={{ opacity: (loading || imageError) ? 0.7 : 1 }}
          >
            <Text className="text-white font-semibold text-lg">Done</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleNewPhoto}
            className="p-4 items-center w-full"
            disabled={loading}
          >
            <Text className="text-blue-600 font-semibold text-lg">
              {loading ? "Opening Camera..." : "Take a New Photo"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PhotoQualityCheck; 