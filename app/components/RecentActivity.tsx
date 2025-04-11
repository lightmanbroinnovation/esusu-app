import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';

interface RecentActivityProps {
  onVerifyNow?: () => void;
  onViewAllActivity?: () => void;
}

const RecentActivity = ({ onVerifyNow, onViewAllActivity }: RecentActivityProps) => {
  const router = useRouter();
  
  return (
    <View className="mt-4 space-y-4">
      {/* KYB Banner */}
      <View className="rounded-xl overflow-hidden">
        <View className="bg-black p-6 relative">
          {/* Decorative elements */}
          <View className="absolute top-3 right-10">
            <FontAwesome name="circle-thin" size={8} color="#444" />
          </View>
          <View className="absolute top-8 right-4">
            <FontAwesome name="circle-thin" size={12} color="#444" />
          </View>
          <View className="absolute top-4 right-20">
            <View style={{width: 8, height: 8, backgroundColor: '#444', transform: [{rotate: '45deg'}]}} />
          </View>
          <View className="absolute bottom-10 right-28">
            <View style={{width: 12, height: 2, backgroundColor: '#444'}} />
          </View>
          <View className="absolute bottom-20 right-10">
            <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: '#444'}} />
          </View>

          <View className="flex-1 pr-20">
            <Text className="text-white text-xl font-bold mb-1">Complete Your KYB</Text>
            <Text className="text-white opacity-70 text-sm">
              Ensure you verify your business and identity. This ensures security and trust for all contributors.
            </Text>
            <TouchableOpacity 
              className="mt-3 self-start"
              onPress={() => {
                if (onVerifyNow) {
                  onVerifyNow();
                }
              }}
            >
              <Text className="text-white underline font-medium">Verify Now</Text>
            </TouchableOpacity>
          </View>
          
          {/* Green checkmark */}
          <View className="absolute bottom-4 right-4 bg-green-500 rounded-full w-16 h-16 items-center justify-center shadow-lg">
            <FontAwesome name="check" size={30} color="white" />
          </View>
        </View>
      </View>
      
      {/* Recent Activity Title */}
      <View className="flex-row justify-between items-center">
        <Text className="font-semibold text-base">Recent Activity</Text>
        <TouchableOpacity 
          onPress={onViewAllActivity}
        >
          <Text className="text-blue-600 text-sm">View all</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      <View className="bg-white py-10 rounded-xl mt-2">
        <Text className="text-gray-400 text-lg font-medium text-center">
          No Recent Activities
        </Text>
        <Text className="text-gray-400 text-sm text-center mt-2 px-4">
          It looks like you haven't made any transactions. Once you start, your activity will appear here.
        </Text>
      </View>
    </View>
  );
};

export default RecentActivity;
