import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ContributorProfile = () => {
  const router = useRouter();
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  
  const navigateBack = () => {
    router.back();
  };

  const handleDeposit = () => {
    console.log('Make a deposit');
  };

  const handleWithdraw = () => {
    console.log('Withdraw funds');
  };

  const handleSendReminder = () => {
    setReminderModalVisible(true);
  };

  const closeReminderModal = () => {
    setReminderModalVisible(false);
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
          <Text className="text-lg font-semibold flex-1 text-center">Adebimpe Adewale</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView className="flex-1">
          {/* Profile Card */}
          <View className="bg-blue-600 mx-4 rounded-xl p-6">
            {/* Profile Image and Balance */}
            <View className="items-center mb-4">
              <Image 
                source={require('../../assets/images/profile.jpg')}
                className="w-20 h-20 rounded-full mb-3"
              />
              <Text className="text-white text-sm">Total Contributions Made</Text>
              <Text className="text-white text-3xl font-bold">₦50,000</Text>
            </View>
            
            {/* Action Buttons */}
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="bg-black rounded-lg flex-row items-center justify-center px-6 py-3 flex-1 mr-2"
                onPress={handleDeposit}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text className="text-white ml-2">Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-white rounded-lg flex-row items-center justify-center px-6 py-3 flex-1 ml-2"
                onPress={handleWithdraw}
              >
                <Ionicons name="remove-circle-outline" size={20} color="#0066FF" />
                <Text className="text-blue-600 ml-2">Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Agent Notice */}
          <View className="bg-blue-50 mx-4 mt-4 rounded-lg p-4">
            <Text className="text-blue-500 font-medium">Important Notice for Agents</Text>
            <Text className="text-blue-500 text-sm">
              As an agent, you do not have access to withdraw or control a contributor's funds—only the 
              contributor can initiate payouts securely.
            </Text>
          </View>

          {/* Savings Details */}
          <View className="mx-4 mt-4">
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Start Date</Text>
                <Text className="font-medium">1st March 2025</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">End Date</Text>
                <Text className="font-medium">31st March 2025</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Frequency</Text>
                <Text className="font-medium">₦500 daily</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Days Left</Text>
                <Text className="font-medium">30</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Language</Text>
                <Text className="font-medium">English</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Days Left</Text>
                <Text className="font-medium">30</Text>
              </View>
            </View>
          </View>
          
          {/* Recent Activity */}
          <View className="mx-4 mt-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold">Recent Activity</Text>
              <TouchableOpacity>
                <Text className="text-blue-600">View all</Text>
              </TouchableOpacity>
            </View>
            
            {/* Activity List */}
            <View className="mb-3">
              <View className="flex-row justify-between items-center">
                <Text className="font-medium">Deposited</Text>
                <Text className="text-green-600 font-semibold">₦5,000</Text>
              </View>
              <Text className="text-gray-500 text-sm">14 March 2025 12:03 AM</Text>
            </View>
            
            <View className="mb-3">
              <View className="flex-row justify-between items-center">
                <Text className="font-medium">Withdraw</Text>
                <Text className="text-red-600 font-semibold">-₦10,000</Text>
              </View>
              <Text className="text-gray-500 text-sm">10 March 2025 12:03 AM</Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Button */}
        <View className="p-4">
          <TouchableOpacity 
            onPress={handleSendReminder}
            className="bg-blue-600 p-4 rounded-xl items-center flex-row justify-center"
          >
            <Ionicons name="notifications-outline" size={22} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">Send Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Reminder Sent Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={reminderModalVisible}
          onRequestClose={closeReminderModal}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white rounded-xl w-10/12 p-6">
              <Text className="text-blue-600 text-2xl font-bold text-center mb-4">Reminder Sent!</Text>
              <Text className="text-center text-gray-700 text-base mb-6">
                A reminder has been sent to <Text className="font-medium">Adebimpe Adewale</Text> via SMS to not forget to contribute today.
              </Text>
              <TouchableOpacity 
                className="bg-blue-600 py-3 rounded-xl"
                onPress={closeReminderModal}
              >
                <Text className="text-white font-semibold text-center text-lg">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default ContributorProfile; 