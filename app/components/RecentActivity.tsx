import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';

interface RecentActivityProps {
  onVerifyNow?: () => void;
  onViewAllActivity?: () => void;
  transactionHistory?: any[];
  hideKybBanner?: boolean;
  showVerificationNotification?: boolean;
}

const RecentActivity = ({ onVerifyNow, onViewAllActivity, transactionHistory = [], hideKybBanner, showVerificationNotification }: RecentActivityProps) => {
  const router = useRouter();
  
  return (
    <View className="mt-4 space-y-4">
      {/* KYB Banner */}
      {!hideKybBanner && (
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
              <Text className="text-white text-xl font-bold mb-1">Complete Your Verification</Text>
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
      )}

      {/* Verification Required Notification */}
      {showVerificationNotification && (
        <View className="rounded-xl overflow-hidden">
          <View className="bg-orange-500 p-6 relative">
            {/* Decorative elements */}
            <View className="absolute top-3 right-10">
              <FontAwesome name="exclamation-triangle" size={8} color="#fff" />
            </View>
            <View className="absolute top-8 right-4">
              <FontAwesome name="exclamation-triangle" size={12} color="#fff" />
            </View>

            <View className="flex-1 pr-20">
              <Text className="text-white text-xl font-bold mb-1">Verification Required</Text>
              <Text className="text-white opacity-90 text-sm">
                You must verify your personal information before you can continue. Please complete your verification to access all features.
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
            
            {/* Warning icon */}
            <View className="absolute bottom-4 right-4 bg-white rounded-full w-16 h-16 items-center justify-center shadow-lg">
              <FontAwesome name="exclamation-triangle" size={30} color="#f97316" />
            </View>
          </View>
        </View>
      )}

      {/* Recent Transactions */}
      <View className="bg-white rounded-xl p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-900">Recent Activity</Text>
          <TouchableOpacity 
            onPress={onViewAllActivity}
            disabled={showVerificationNotification}
            style={{ opacity: showVerificationNotification ? 0.5 : 1 }}
          >
            <Text className="text-[#0052CC] font-medium">View All</Text>
          </TouchableOpacity>
        </View>
        
        {transactionHistory.length > 0 ? (
          <View className="space-y-3">
            {transactionHistory.map((transaction, index) => {
              // Format the date properly
              const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
              const formattedDate = transactionDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              
              // Determine transaction type and icon
              const isDeposit = transaction.type === 'deposit' || transaction.type === 'commission';
              const iconName = isDeposit ? 'arrow-down' : 'arrow-up';
              const amountColor = isDeposit ? 'text-green-600' : 'text-red-600';
              const amountPrefix = isDeposit ? '+' : '-';
              
              return (
                <View key={index} className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-10 h-10 ${isDeposit ? 'bg-green-500' : 'bg-red-500'} rounded-full items-center justify-center mr-3`}>
                      <Ionicons 
                        name={iconName} 
                        size={20} 
                        color="white" 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900" numberOfLines={1} ellipsizeMode="tail">
                        {transaction.name && transaction.name.length > 20 
                          ? `${transaction.name.substring(0, 20)}...` 
                          : transaction.name || 'Transaction'
                        }
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {formattedDate}
                      </Text>
                    </View>
                  </View>
                  <Text className={`font-bold ${amountColor}`}>
                    {amountPrefix}₦{Number(Math.abs(transaction.amount || 0)).toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="items-center py-8">
            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2 text-center">No recent transactions</Text>
          </View>
        )}
      </View>
      
    </View>
  );
};

export default RecentActivity;
