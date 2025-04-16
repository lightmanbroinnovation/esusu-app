import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import moment from 'moment'; // Import moment for date formatting
import { Picker as NativePicker } from '@react-native-picker/picker'; // Updated import for Picker
import { addContributor } from '../../services/api'; // Import the addContributor function

const SavingsPlanSetup = () => {
  const router = useRouter();
  const [depositAmount, setDepositAmount] = useState('');
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
    try {
      // First check the params we received
      console.log('SAVINGS PLAN SETUP - RECEIVED PARAMS:', JSON.stringify({
        photoUri: params.photoUri,
        imageUrl: params.imageUrl,
        isCloudinaryUrl: params.isCloudinaryUrl,
        allParams: params
      }));

      // Check if we already have a Cloudinary URL from previous steps
      let finalImageUrl = null;
      
      // Priority: imageUrl from Cloudinary > photoUri as fallback
      if (params.imageUrl && typeof params.imageUrl === 'string' && params.isCloudinaryUrl === "true") {
        // Use the Cloudinary URL if available
        finalImageUrl = params.imageUrl;
        console.log('Using Cloudinary URL from previous step:', finalImageUrl);
      } else if (params.photoUri && typeof params.photoUri === 'string') {
        // Fallback to local URI if no Cloudinary URL
        finalImageUrl = params.photoUri;
        console.log('Falling back to local photo URI:', finalImageUrl);
      } else {
        console.warn('No photo URI found in params');
      }
      
      console.log('FINAL IMAGE URL FOR DB:', finalImageUrl);
      
      // Prepare the parameters including entered details
      const contributorData = {
        agentName: params.agentName,
        agentId: params.agentId,
        firstName: params.firstName,
        lastName: params.lastName,
        phoneNumber: params.phoneNumber,
        ninNumber: params.ninNumber,
        language: params.language,
        photoUri: finalImageUrl, // Explicitly include the photo URI
        imageUrl: finalImageUrl, // Add imageUrl field as well for compatibility
        depositAmount,
        frequency,
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        durationValue,
        status: 'active',
      };
      
      console.log('ADDING CONTRIBUTOR WITH DATA:', JSON.stringify(contributorData));

      // Send data to the endpoint and get the response
      const response = await addContributor(contributorData); 
      
      console.log('API RESPONSE:', JSON.stringify(response));
      
      // Check if we got a valid response with an ID
      if (response && response.id) {
        // Navigate to the profile page with the contributor ID
        router.push({
          pathname: '/contributor/profile',
          params: { 
            contributorId: response.id,
            firstName: params.firstName,
            lastName: params.lastName,
            imageUrl: finalImageUrl
          }
        });
      } else {
        console.warn('No contributor ID returned from API');
        router.push('/contributor/profile');
      }
    } catch (error) {
      console.error("Error adding contributor:", error);
      Alert.alert(
        "Error",
        "There was a problem adding the contributor. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Function to render the calendar
  const renderCalendar = (isStartCalendar: boolean) => {
    const calendarDate = isStartCalendar ? startDate : endDate;
    const currentMonth = moment(calendarDate).month(); // Get the current month (0-11)
    const currentYear = moment(calendarDate).year(); // Get the current year
    const daysInMonth = moment(`${currentYear}-${currentMonth + 1}`, "YYYY-MM").daysInMonth(); // Get days in month
    const firstDayOfMonth = moment(`${currentYear}-${currentMonth + 1}-01`).day(); // Get the first day of the month
    const minimumDate = isStartCalendar ? moment() : moment(startDate);

    const days = [];
    // Add empty views for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} className="flex-1 my-1" style={{ padding: 8 }} />);
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment(`${currentYear}-${currentMonth + 1}-${day}`);
      const isSelected = isStartCalendar 
        ? moment(startDate).date() === day && moment(startDate).month() === currentMonth && moment(startDate).year() === currentYear
        : moment(endDate).date() === day && moment(endDate).month() === currentMonth && moment(endDate).year() === currentYear;
      
      const isDisabled = !isStartCalendar && currentDate.isBefore(minimumDate);
      
      days.push(
        <TouchableOpacity
          key={day}
          className={`flex-1 items-center justify-center my-1 rounded-full
            ${isSelected ? 'bg-blue-600' : ''}
            ${isDisabled ? 'opacity-30' : ''}`}
          style={{ padding: 8 }} // Uniform padding
          disabled={isDisabled}
          onPress={() => {
            const selectedDate = moment(`${currentYear}-${currentMonth + 1}-${day}`).toDate();
            if (isStartCalendar) {
              setStartDate(selectedDate);
              // Ensure end date is not before start date
              if (moment(endDate).isBefore(selectedDate)) {
                setEndDate(selectedDate);
              }
            } else {
              setEndDate(selectedDate);
            }
            setShowStartCalendar(false);
            setShowEndCalendar(false);
          }}
        >
          <Text className={`text-center ${isSelected ? 'text-white' : 'text-black'}`}>{day}</Text>
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
        weekDays.push(<View key={`empty-${i + weekDays.length}`} className="flex-1 my-1" style={{ padding: 8 }} />);
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
    if (isStartCalendar) {
      const newStartDate = moment(startDate).add(direction === 'next' ? 1 : -1, 'months');
      // Don't allow going to past months from current date
      if (!newStartDate.isBefore(moment(), 'month') || direction === 'next') {
        setStartDate(newStartDate.toDate());
      }
    } else {
      const newEndDate = moment(endDate).add(direction === 'next' ? 1 : -1, 'months');
      // Don't allow going before the start date month
      if (!newEndDate.isBefore(moment(startDate), 'month') || direction === 'next') {
        setEndDate(newEndDate.toDate());
      }
    }
  };

  // Custom dropdown UI component
  const CustomDropdown = ({ label, value, options, onChange }: {
    label: string;
    value: number;
    options: Array<{label: string; value: number}>;
    onChange: (value: number) => void;
  }) => (
    <View className='my-4'>
      <Text className="text-gray-700 mb-2">{label}</Text>
      <View className="bg-gray-100 rounded-xl overflow-hidden">
        <NativePicker
          selectedValue={value}
          onValueChange={onChange}
          style={{ 
            height: 60, 
            width: '100%',
            backgroundColor: '#f3f4f6',
            color: '#1f2937'
          }}
          itemStyle={{ 
            fontWeight: 'bold',
            color: '#1f2937'
          }}
        >
          {options.map((option: {label: string; value: number}) => (
            <NativePicker.Item 
              key={option.value} 
              label={option.label} 
              value={option.value} 
            />
          ))}
        </NativePicker>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center p-4 mt-10">
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
              <CustomDropdown 
                label="Select Weeks"
                value={durationValue}
                onChange={(itemValue: number) => setDurationValue(itemValue)}
                options={[...Array(52)].map((_, i) => ({ label: `${i + 1}`, value: i + 1 }))}
              />
            )}
            {frequency === 'monthly' && (
              <CustomDropdown 
                label="Select Months"
                value={durationValue}
                onChange={(itemValue: number) => setDurationValue(itemValue)}
                options={[...Array(12)].map((_, i) => ({ label: `${i + 1}`, value: i + 1 }))}
              />
            )}
            {frequency === 'yearly' && (
              <CustomDropdown 
                label="Select Years"
                value={durationValue}
                onChange={(itemValue: number) => setDurationValue(itemValue)}
                options={[...Array(10)].map((_, i) => ({ label: `${i + 1}`, value: i + 1 }))}
              />
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
                <View className="flex-row justify-between items-center p-2 mb-2">
                  <TouchableOpacity 
                    onPress={() => changeMonth(true, 'prev')}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <Ionicons name="chevron-back" size={20} color="#2563eb" />
                  </TouchableOpacity>
                  <Text className="text-xl font-bold text-center">{moment(startDate).format('MMMM YYYY')}</Text>
                  <TouchableOpacity 
                    onPress={() => changeMonth(true, 'next')}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#2563eb" />
                  </TouchableOpacity>
                </View>
                <View className="flex-row p-2 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <Text key={day} className="flex-1 text-center font-medium text-gray-500">{day}</Text>
                  ))}
                </View>
                {renderCalendar(true)}
                <TouchableOpacity 
                  onPress={() => setShowStartCalendar(false)}
                  className="mt-4 p-4 items-center bg-blue-600 rounded-xl"
                >
                  <Text className="text-white font-bold text-lg">Done</Text>
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
                <View className="flex-row justify-between items-center p-2 mb-2">
                  <TouchableOpacity 
                    onPress={() => changeMonth(false, 'prev')}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <Ionicons name="chevron-back" size={20} color="#2563eb" />
                  </TouchableOpacity>
                  <Text className="text-xl font-bold text-center">{moment(endDate).format('MMMM YYYY')}</Text>
                  <TouchableOpacity 
                    onPress={() => changeMonth(false, 'next')}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#2563eb" />
                  </TouchableOpacity>
                </View>
                <View className="flex-row p-2 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <Text key={day} className="flex-1 text-center font-medium text-gray-500">{day}</Text>
                  ))}
                </View>
                {renderCalendar(false)}
                <TouchableOpacity 
                  onPress={() => setShowEndCalendar(false)}
                  className="mt-4 p-4 items-center bg-blue-600 rounded-xl"
                >
                  <Text className="text-white font-bold text-lg">Done</Text>
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