import React from 'react';
import { View, Text, TouchableOpacity, Image, ImageBackground } from 'react-native';

const RecentActivity = () => {
  return (
    <View className="mt-4 space-y-4">
      {/* KYB Banner */}
      <View className="rounded-xl overflow-hidden relative">
        {/* Background Image */}
        <Image
          source={{ uri: '../assets/images/success.png' }} // Replace with actual background image asset
          className="absolute top-0 right-0 w-full h-full"
          style={{ resizeMode: 'cover', opacity: 0.2 }} // Adjust opacity for better readability
        />
        <View className="bg-black p-4 flex-row items-center justify-between relative">
          <View className="flex-1">
            <Text className="text-white text-lg font-bold mb-1">Complete Your KYB</Text>
            <Text className="text-white opacity-70">
              Ensure you verify your business and identity. This ensures security and trust for all contributors.
            </Text>
            <TouchableOpacity className="mt-2 bg-white rounded-md px-4 py-1 self-start">
              <Text className="text-black text-sm">Verify Now</Text>
            </TouchableOpacity>
          </View>
          {/* Bottom-Right Image */}
          <Image
            source={{ uri: '../assets/images/verify.png' }} // Replace with actual image asset
            className="absolute bottom-0 right-0 w-16 h-16"
          />
        </View>
      </View>

      {/* Recent Activity Title */}
      <View className="flex-row justify-between items-center">
        <Text className="font-semibold text-base">Recent Activity</Text>
        <TouchableOpacity>
          <Text className="text-blue-600 text-sm">View all</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      <View className="bg-white rounded-xl p-6 items-center border border-gray-200">
        <Text className="text-gray-400 text-sm text-center">
          No Recent Activities
        </Text>
        <Text className="text-gray-400 text-xs text-center mt-1">
          It looks like you haven't made any transactions. Once you start, your activity will appear here.
        </Text>
      </View>
    </View>
  );
};

export default RecentActivity;
