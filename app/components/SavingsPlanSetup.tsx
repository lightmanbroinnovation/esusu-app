import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import moment from 'moment'; // Import moment for date formatting
import { Picker as NativePicker } from '@react-native-picker/picker'; // Updated import for Picker
import { addContributor } from '../../services/api'; // Import the addContributor function

const SavingsPlanSetup = () => {
  const router = useRouter();
  const [depositAmount, setDepositAmount] = useState('2,000');
  const [frequency, setFrequency] = useState('daily');
  const [startDate, setStartDate] = useState(moment().startOf('day').toDate()); // Default to today's date
  const [endDate, setEndDate] = useState(moment().startOf('day').toDate()); // Default to today's date
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [durationValue, setDurationValue] = useState(1); // Default value for duration dropdown
  const params = useLocalSearchParams(); // Get parameters passed from the previous screen

  const navigateBack = () => {
    router.back();
  };

  const handleNext = async () => {
    // Prepare the parameters including entered details
    const contributorData = {
      agentName: params.agentName,
      agentId: params.agentId,
      firstName: params.firstName, // Pass original firstName
      lastName: params.lastName, // Pass original lastName
      phoneNumber: params.phoneNumber,
      ninNumber: params.ninNumber,
      language: params.language,
      photoUri: params.photoUri,
      depositAmount,
      frequency,
      startDate: moment(startDate).format('YYYY-MM-DD'),
      endDate: moment(endDate).format('YYYY-MM-DD'),
      durationValue,
    };
    console.log(contributorData); // Log the parameters

    try {
      await addContributor(contributorData); // Send data to the endpoint
      router.push('/contributor/profile'); // Navigate to the profile page after successful addition
    } catch (error) {
      console.error("Error adding contributor:", error);
    }
  };

  // Function to render the calendar
  const renderCalendar = (isStartCalendar: boolean) => {
    const currentMonth = moment(startDate).month(); // Get the current month (0-11)
    const currentYear = moment(startDate).year(); // Get the current year
    const daysInMonth = moment(`${currentYear}-${currentMonth + 1}`, "YYYY-MM").daysInMonth(); // Get days in month
    const firstDayOfMonth = moment(`${currentYear}-${currentMonth + 1}-01`).day(); // Get the first day of the month

    const days = [];
    // Add empty views for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} className="flex-1 border my-1" style={{ padding: 8 }} />);
    }
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <TouchableOpacity
          key={day}
          className={`flex-1 items-center justify-center border my-1 ${moment(startDate).date() === day ? 'bg-blue-600' : ''}`}
          style={{ padding: 8 }} // Uniform padding
          onPress={() => {
            const selectedDate = moment(`${currentYear}-${currentMonth + 1}-${day}`).toDate();
            if (isStartCalendar) {
              setStartDate(selectedDate);
              // Reset end date if it is before the selected start date
              if (endDate < selectedDate) {
                setEndDate(selectedDate);
              }
            } else {
              setEndDate(selectedDate);
            }
            setShowStartCalendar(false);
            setShowEndCalendar(false);
          }}
        >
          <Text className={`text-center ${moment(startDate).date() === day ? 'text-white' : 'text-black'}`}>{day}</Text>
        </TouchableOpacity>
      );
    }

    // Create rows of 7 days (4 weeks minimum)
    const rows = [];
    const totalDays = Math.max(days.length, 35); // Ensure at least 35 days are displayed for 5 weeks
    for (let i = 0; i < totalDays; i += 7) {
      const weekDays = days.slice(i, i + 7);
      // Fill empty days if the week has less than 7 days
      while (weekDays.length < 7) {
        weekDays.push(<View key={`empty-${i + weekDays.length}`} className="flex-1 border my-1" style={{ padding: 8 }} />);
      }
      rows.push(
        <View key={`row-${i}`} className="flex-row">
          {weekDays}
        </View>
      );
    }

    return (
      <View className="flex-1">
        {rows}
      </View>
    );
  };

  // Function to change the month
  const changeMonth = (isStartCalendar: boolean, direction: 'next' | 'prev') => {
    const currentMonth = moment(startDate).month();
    const currentYear = moment(startDate).year();

    if (isStartCalendar) {
      const newStartDate = moment(startDate).add(direction === 'next' ? 1 : -1, 'months');
      setStartDate(newStartDate.toDate());
    } else {
      const newEndDate = moment(endDate).add(direction === 'next' ? 1 : -1, 'months');
      setEndDate(newEndDate.toDate());
    }
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
            <View className='my-2'>
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
            <View className='my-4'>
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
                    className={`flex-1 rounded-xl p-4 px-3 items-center justify-center mx-1 ${frequency === item.id ? 'bg-green-600' : 'bg-blue-600'}`}
                    onPress={() => {
                      setFrequency(item.id);
                      if (item.id === 'daily') {
                        setShowEndCalendar(false); // Hide end date for daily
                      } else {
                        setShowEndCalendar(false); // Hide end date for other durations
                      }
                    }}
                  >
                    {frequency === item.id && (
                      <View className="absolute top-3 right-4">
                        <Ionicons name="checkmark-circle" size={16} color="white" />
                      </View>
                    )}
                    <Text className="text-white font-semibold">{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration Dropdown */}
            {frequency === 'weekly' && (
              <View className='my-4'>
                <Text className="text-gray-700 mb-2">Select Weeks</Text>
                <NativePicker
                  selectedValue={durationValue}
                  style={{ height: 60, width: '100%' }} // Reduced height
                  onValueChange={(itemValue) => setDurationValue(itemValue)}
                >
                  {[...Array(52).keys()].map(i => (
                    <NativePicker.Item key={i + 1} label={`${i + 1}`} value={i + 1} style={{height: "60%"}}/>
                  ))}
                </NativePicker>
              </View>
            )}
            {frequency === 'monthly' && (
              <View className='my-4'>
                <Text className="text-gray-700 mb-2">Select Months</Text>
                <NativePicker
                  selectedValue={durationValue}
                  style={{ height: 60, width: '100%' }} // Reduced height
                  onValueChange={(itemValue) => setDurationValue(itemValue)}
                >
                  {[...Array(12).keys()].map(i => (
                    <NativePicker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />
                  ))}
                </NativePicker>
              </View>
            )}
            {frequency === 'yearly' && (
              <View className='my-4'>
                <Text className="text-gray-700 mb-2">Select Years</Text>
                <NativePicker
                  selectedValue={durationValue}
                  style={{ height: 60, width: '100%' }} // Reduced height
                  onValueChange={(itemValue) => setDurationValue(itemValue)}
                >
                  {[...Array(10).keys()].map(i => (
                    <NativePicker.Item key={i + 1} label={`${i + 1}`} value={i + 1} />
                  ))}
                </NativePicker>
              </View>
            )}
            
            {/* Start Date */}
            <View className='my-3'>
              <Text className="text-gray-700 mb-2">Start Date</Text>
              <TouchableOpacity 
                onPress={() => setShowStartCalendar(true)}
                className="flex-row items-center justify-between bg-gray-100 border border-gray-200 p-4 rounded-xl"
              >
                <Text className="text-blue-600">Starts Today: {moment(startDate).format('YYYY-MM-DD')}</Text>
                <Ionicons name="calendar" size={24} color="#2563eb" />
              </TouchableOpacity>
            </View>
            
            {/* End Date (conditionally rendered) */}
            {frequency === 'daily' && (
              <View className='my-3'>
                <Text className="text-gray-700 mb-2">End Date</Text>
                <TouchableOpacity 
                  onPress={() => setShowEndCalendar(true)}
                  className="flex-row items-center justify-between bg-gray-100 border border-gray-200 p-4 rounded-xl"
                >
                  <Text className="text-blue-600">Ends By: {moment(endDate).format('YYYY-MM-DD')}</Text>
                  <Ionicons name="calendar" size={24} color="#2563eb" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Start Calendar Modal */}
        {showStartCalendar && (
          <Modal
            transparent={true}
            visible={showStartCalendar}
            animationType="slide"
            onRequestClose={() => setShowStartCalendar(false)}
          >
            <View className="flex-1 justify-end bg-black bg-opacity-30">
              <View className="bg-white rounded-t-3xl p-4" style={{ height: '55%' }}> {/* Reduced modal height */}
                <View className="flex-row justify-between">
                  <TouchableOpacity onPress={() => changeMonth(true, 'prev')}>
                    <Text className="text-lg">{"<"}</Text>
                  </TouchableOpacity>
                  <Text className="text-xl font-bold text-center">{moment(startDate).format('MMMM YYYY')}</Text>
                  <TouchableOpacity onPress={() => changeMonth(true, 'next')}>
                    <Text className="text-lg">{">"}</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row p-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <Text key={day} className="flex-1 text-center font-medium">{day}</Text>
                  ))}
                </View>
                {renderCalendar(true)}
                <TouchableOpacity 
                  onPress={() => setShowStartCalendar(false)}
                  className="p-4 items-center border-t border-gray-200"
                >
                  <Text className="text-lg">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* End Calendar Modal */}
        {showEndCalendar && (
          <Modal
            transparent={true}
            visible={showEndCalendar}
            animationType="slide"
            onRequestClose={() => setShowEndCalendar(false)}
          >
            <View className="flex-1 justify-end bg-black bg-opacity-30">
              <View className="bg-white rounded-t-3xl p-4" style={{ height: '55%' }}> {/* Reduced modal height */}
                <View className="flex-row justify-between">
                  <TouchableOpacity onPress={() => changeMonth(false, 'prev')}>
                    <Text className="text-lg">{"<"}</Text>
                  </TouchableOpacity>
                  <Text className="text-xl font-bold text-center">{moment(endDate).format('MMMM YYYY')}</Text>
                  <TouchableOpacity onPress={() => changeMonth(false, 'next')}>
                    <Text className="text-lg">{">"}</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row p-4">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <Text key={day} className="flex-1 text-center font-medium">{day}</Text>
                  ))}
                </View>
                {renderCalendar(false)}
                <TouchableOpacity 
                  onPress={() => setShowEndCalendar(false)}
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