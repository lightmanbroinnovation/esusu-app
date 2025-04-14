import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define location image interface to match the one in VerificationController
interface LocationImage {
  uri: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
}

interface BusinessLocationUploadProps {
  onClose: () => void;
  onTakePhoto: () => void;
  existingPhotos?: string[];
  locationData?: LocationImage[];
}

const BusinessLocationUpload = ({ 
  onClose, 
  onTakePhoto, 
  existingPhotos = [], 
  locationData = [] 
}: BusinessLocationUploadProps) => {
  
  // Format coordinates to be human-readable
  const formatCoordinates = (lat?: number, lng?: number) => {
    if (lat === undefined || lng === undefined) return "No location data";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };
  
  // Format timestamp to a readable date/time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Find location data for a photo if available
  const getLocationData = (photoUri: string) => {
    const photo = locationData.find(p => p.uri === photoUri);
    return photo;
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
              Business Location
            </Text>
            <Text className="text-gray-600 text-base text-center mt-2 px-4">
              Upload clear photos of your shop to verify your business location.
            </Text>
          </View>

          {/* Existing photos */}
          {existingPhotos.length > 0 && (
            <View className="mt-4 mb-8">
              <Text className="text-gray-700 mb-4 font-semibold">Uploaded Photos ({existingPhotos.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {existingPhotos.map((photo, index) => {
                  const locationInfo = getLocationData(photo);
                  return (
                    <View key={index} className="mr-4 bg-gray-50 rounded-lg overflow-hidden pb-2 border border-gray-200">
                      <Image
                        source={{ uri: photo }}
                        style={{ width: 180, height: 120 }}
                        resizeMode="cover"
                      />
                      {locationInfo && (
                        <View className="p-2">
                          <View className="flex-row items-center mb-1">
                            <Ionicons name="location" size={12} color="#0052CC" style={{ marginRight: 4 }} />
                            <Text className="text-xs text-gray-600" numberOfLines={1}>
                              {formatCoordinates(locationInfo.latitude, locationInfo.longitude)}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={12} color="#0052CC" style={{ marginRight: 4 }} />
                            <Text className="text-xs text-gray-600" numberOfLines={1}>
                              {formatTimestamp(locationInfo.timestamp)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View className="mt-4">
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
              <Ionicons name="camera" size={24} color="white" />
            </View>
            <Text className="text-[#007BFF] text-xl font-medium">
              Take Photo
            </Text>
          </TouchableOpacity>
          
          {existingPhotos.length > 0 && (
            <TouchableOpacity 
              className="py-4 rounded-xl mt-6 bg-[#007BFF]"
              onPress={onClose}
            >
              <Text className="text-white text-center text-lg font-medium">
                Done
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BusinessLocationUpload; 