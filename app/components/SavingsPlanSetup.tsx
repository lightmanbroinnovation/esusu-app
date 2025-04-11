import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SavingsPlanSetup = () => {
  const router = useRouter();
  const [depositAmount, setDepositAmount] = useState('2,000');
  const [frequency, setFrequency] = useState('daily');
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState('Mar 1, 2025');
  const [endDate, setEndDate] = useState('Mar 31, 2025');
  
  const navigateBack = () => {
    router.back();
  };

  const handleNext = () => {
    // In a real app, this would create the contributor profile
    router.push('/contributor/profile');
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

        <ScrollView className="flex-1 px-4">
          {/* Form Fields */}
          <View className="space-y-6">
            {/* Deposit Amount */}
            <View>
              <Text className="text-gray-700 mb-2">Deposit Amount</Text>
              <View className="flex-row items-center bg-gray-100 p-4 rounded-xl">
                <Text className="text-black font-medium mr-2">₦</Text>
                <TextInput
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  keyboardType="numeric"
                  className="flex-1 text-lg text-black"
                />
              </View>
            </View>
            
            {/* Duration */}
            <View>
              <Text className="text-gray-700 mb-2">Duration</Text>
              <View className="flex-row">
                {[
                  { id: 'daily', label: 'Daily' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'yearly', label: 'Yearly' }
                ].map(item => (
                  <TouchableOpacity 
                    key={item.id}
                    className={`flex-1 rounded-xl p-4 items-center justify-center mx-1 ${frequency === item.id ? 'bg-green-600' : 'bg-blue-600'}`}
                    onPress={() => setFrequency(item.id)}
                  >
                    {frequency === item.id && (
                      <View className="absolute top-3 right-3">
                        <Ionicons name="checkmark-circle" size={16} color="white" />
                      </View>
                    )}
                    <Text className="text-white font-semibold">{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Start Date */}
            <View>
              <Text className="text-gray-700 mb-2">Start Date</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(true)}
                className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl"
              >
                <Text className="text-black">Starts Today: {startDate}</Text>
                <Ionicons name="calendar" size={24} color="#0066FF" />
              </TouchableOpacity>
            </View>
            
            {/* End Date */}
            <View>
              <Text className="text-gray-700 mb-2">End Date</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(true)}
                className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl"
              >
                <Text className="text-black">Ends in 31days: {endDate}</Text>
                <Ionicons name="calendar" size={24} color="#0066FF" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Calendar Modal */}
        {showCalendar && (
          <Modal
            transparent={true}
            visible={showCalendar}
            animationType="slide"
            onRequestClose={() => setShowCalendar(false)}
          >
            <View className="flex-1 justify-end bg-black bg-opacity-30">
              <View className="bg-white rounded-t-3xl">
                <View className="p-4 border-b border-gray-200">
                  <Text className="text-xl font-bold text-center">March 2025</Text>
                  <TouchableOpacity 
                    onPress={() => setShowCalendar(false)}
                    className="absolute right-4 top-4"
                  >
                    <Text className="text-xl">→</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Calendar header */}
                <View className="flex-row p-4">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <Text key={day} className="flex-1 text-center font-medium">{day}</Text>
                  ))}
                </View>
                
                {/* Calendar grid would go here - simplified for this example */}
                <View className="p-4 items-center justify-center">
                  <View className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center">
                    <Text className="text-white font-bold">1</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={() => setShowCalendar(false)}
                  className="p-4 items-center border-t border-gray-200"
                >
                  <Text className="text-lg">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        
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

export default SavingsPlanSetup; 