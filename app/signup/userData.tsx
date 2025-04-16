import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import moment from "moment"; // Import moment for date formatting

export default function UserData() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, pin } = useLocalSearchParams(); // Retrieve phone and pin from query params

  // Calculate minimum birth date (18 years ago)
  const minBirthYear = moment().subtract(18, 'years').year();
  
  // State for input fields
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(moment().subtract(18, 'years').toDate()); // Default to 18 years ago
  const [showCalendar, setShowCalendar] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  
  // Available years (going back 100 years from minimum age)
  const availableYears = Array.from({length: 82}, (_, i) => minBirthYear - i).sort((a, b) => b - a);

  // State to track keyboard visibility
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Add event listeners for keyboard show and hide
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    // Cleanup event listeners on unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Function to handle form submission
  const handleSubmit = () => {
    // Validate age
    const userAge = moment().diff(moment(dob), 'years');
    if (userAge < 18) {
      alert("You must be at least 18 years old to register.");
      return;
    }

    const userData = {
      phone,
      pin,
      firstname,
      lastname,
      email,
      business,
      address,
      city,
      state,
      gender,
      dob: moment(dob).format('YYYY-MM-DD'),
    };

    // Log data being passed to the next screen
    console.log('===== USER DATA SCREEN - PASSING DATA =====');
    console.log('Data being passed to document screen:', JSON.stringify(userData, null, 2));
    console.log('=============================================');

    // Navigate to the next page with the user data
    router.push({
      pathname: "/signup/document",
      params: userData, // Pass all user data to the next page
    });
  };

  // Function to select a year
  const selectYear = (year: number) => {
    const newDate = moment(dob).year(year).toDate();
    setDob(newDate);
    setShowYearSelector(false);
  };

  // Function to render the calendar
  const renderCalendar = () => {
    const currentMonth = moment(dob).month(); // Get the current month (0-11)
    const currentYear = moment(dob).year(); // Get the current year
    const daysInMonth = moment(`${currentYear}-${currentMonth + 1}`, "YYYY-MM").daysInMonth(); // Get days in month
    const firstDayOfMonth = moment(`${currentYear}-${currentMonth + 1}-01`).day(); // Get the first day of the month
    
    // Check if user will be 18 after selecting this date
    const isValidYear = currentYear <= minBirthYear;

    const days = [];
    // Add empty views for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} className="flex-1 my-1" style={{ padding: 8 }} />);
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment(`${currentYear}-${currentMonth + 1}-${day}`);
      const isSelected = moment(dob).date() === day && 
                         moment(dob).month() === currentMonth && 
                         moment(dob).year() === currentYear;
      
      // Check if this date would make the user at least 18 years old
      const wouldBeEighteen = moment().diff(currentDate, 'years') >= 18;
      const isDisabled = !wouldBeEighteen;
      
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
            setDob(selectedDate);
          }}
        >
          <Text className={`text-center ${isSelected ? 'text-white' : 'text-black'}`}>{day}</Text>
        </TouchableOpacity>
      );
    }

    // Create rows of 7 days
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
  const changeMonth = (direction: 'next' | 'prev') => {
    const newDate = moment(dob).add(direction === 'next' ? 1 : -1, 'months');
    
    // Prevent going beyond today's date minus 18 years
    if (direction === 'next' && newDate.isAfter(moment().subtract(18, 'years'))) {
      return;
    }
    
    setDob(newDate.toDate());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        className="flex-1 bg-white px-6"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mt-6">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text className="font-semibold">Step 2 of 4</Text>
        </View>

        <ScrollView className="mt-8" showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View>
            <Text className="text-[24px] font-bold text-primaryText mb-2">
              Tell Us About You
            </Text>
            <Text className="text-base text-[#4F4F4F]">
              Help us set up your profile with a few basic details.
            </Text>
          </View>

          {/* Input Fields */}
          <View className="mt-6 space-y-4">
            {/* Firstname */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">First Name</Text>
              <TextInput
                value={firstname}
                onChangeText={setFirstname}
                placeholder="Enter your first name"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-inputBg"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Lastname */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Last Name</Text>
              <TextInput
                value={lastname}
                onChangeText={setLastname}
                placeholder="Enter your last name"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Email */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Business */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Business</Text>
              <TextInput
                value={business}
                onChangeText={setBusiness}
                placeholder="Enter your business name"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Address */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Gender Selection */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Gender</Text>
              <TouchableOpacity 
                onPress={() => setShowGenderPicker(true)}
                className="flex-row items-center justify-between w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
              >
                <Text>{gender || "Select your gender"}</Text>
                <Ionicons name="chevron-down" size={24} color="#0072CE" />
              </TouchableOpacity>
            </View>

            {/* Gender Picker Modal */}
            {showGenderPicker && (
              <Modal
                transparent={true}
                visible={showGenderPicker}
                animationType="slide"
                onRequestClose={() => setShowGenderPicker(false)}
              >
                <View className="flex-1 justify-end bg-black bg-opacity-30">
                  <View className="bg-white rounded-t-3xl p-4">
                    <Text className="text-xl font-bold text-center mb-4">Select Gender</Text>
                    <TouchableOpacity
                      className="py-3 px-4 mb-1 rounded-lg"
                      onPress={() => {
                        setGender('Male');
                        setShowGenderPicker(false);
                      }}
                    >
                      <Text className="text-center text-lg">Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="py-3 px-4 mb-1 rounded-lg"
                      onPress={() => {
                        setGender('Female');
                        setShowGenderPicker(false);
                      }}
                    >
                      <Text className="text-center text-lg">Female</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="py-3 px-4 mb-1 rounded-lg"
                      onPress={() => {
                        setGender('Other');
                        setShowGenderPicker(false);
                      }}
                    >
                      <Text className="text-center text-lg">Other</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowGenderPicker(false)}
                      className="mt-4 p-4 items-center bg-[#0072CE] rounded-xl"
                    >
                      <Text className="text-white font-bold text-lg">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}

            {/* Date of Birth */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Date of Birth</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(true)}
                className="flex-row items-center justify-between w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
              >
                <Text>{moment(dob).format('YYYY-MM-DD')}</Text>
                <Ionicons name="calendar" size={24} color="#0072CE" />
              </TouchableOpacity>
              <Text className="text-xs text-gray-500 mt-1">You must be at least 18 years old</Text>
            </View>

            <View className="flex-row justify-between">
              {/* City */}
              <View className="my-2 flex-1 mr-2">
                <Text className="text-[#4F4F4F] mb-2">City</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter your city"
                  className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                  style={{
                    backgroundColor: "#F4F4F5",
                  }}
                />
              </View>

              {/* State */}
              <View className="my-2 flex-1">
                <Text className="text-[#4F4F4F] mb-2">State</Text>
                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="Enter your state"
                  className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                  style={{
                    backgroundColor: "#F4F4F5",
                  }}
                />
              </View>
            </View>
          </View>

          {/* Spacer to push button down */}
          <View className="h-16" />
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
              <View className="bg-white rounded-t-3xl p-4" style={{ height: '55%' }}>
                <View className="flex-row justify-between items-center p-2 mb-2">
                  <TouchableOpacity 
                    onPress={() => changeMonth('prev')}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <Ionicons name="chevron-back" size={20} color="#0072CE" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowYearSelector(true)}
                    className="flex-row items-center"
                  >
                    <Text className="text-xl font-bold text-center">{moment(dob).format('MMMM YYYY')}</Text>
                    <Ionicons name="chevron-down" size={20} color="#0072CE" className="ml-1" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => changeMonth('next')}
                    className="p-2 rounded-full bg-gray-100"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#0072CE" />
                  </TouchableOpacity>
                </View>
                <View className="flex-row p-2 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <Text key={day} className="flex-1 text-center font-medium text-gray-500">{day}</Text>
                  ))}
                </View>
                {renderCalendar()}
                <TouchableOpacity 
                  onPress={() => setShowCalendar(false)}
                  className="mt-4 p-4 items-center bg-[#0072CE] rounded-xl"
                >
                  <Text className="text-white font-bold text-lg">Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Year Selector Modal */}
        {showYearSelector && (
          <Modal
            transparent={true}
            visible={showYearSelector}
            animationType="slide"
            onRequestClose={() => setShowYearSelector(false)}
          >
            <View className="flex-1 justify-end bg-black bg-opacity-30">
              <View className="bg-white rounded-t-3xl p-4" style={{ height: '50%' }}>
                <Text className="text-xl font-bold text-center mb-4">Select Year</Text>
                <FlatList
                  data={availableYears}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`py-3 px-4 mb-1 rounded-lg ${moment(dob).year() === item ? 'bg-blue-100' : ''}`}
                      onPress={() => selectYear(item)}
                    >
                      <Text className={`text-center text-lg ${moment(dob).year() === item ? 'text-blue-600 font-bold' : ''}`}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={true}
                  initialScrollIndex={availableYears.findIndex(year => year === moment(dob).year())}
                  getItemLayout={(data, index) => ({
                    length: 48, // height of item
                    offset: 48 * index,
                    index,
                  })}
                />
                <TouchableOpacity 
                  onPress={() => setShowYearSelector(false)}
                  className="mt-4 p-4 items-center bg-[#0072CE] rounded-xl"
                >
                  <Text className="text-white font-bold text-lg">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Continue Button */}
        <View className="pb-4">
          {!isKeyboardVisible && (
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleSubmit} // Use handleSubmit to pass data to the next page
            >
              <Text className="text-white text-lg mr-2 font-semibold">Continue</Text>
              <MaterialIcons name="arrow-forward" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
