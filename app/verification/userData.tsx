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
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import moment from "moment"; // Import moment for date formatting
import { completeRegistration, fetchUser } from "../../services/api";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
    color: '#1F2937',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  calendarButton: {
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '55%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  monthNavButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    padding: 8,
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
    color: '#6B7280',
  },
  // Year selector
  yearSelectorContainer: {
    height: '50%',
  },
  yearItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
  },
  yearItemSelected: {
    backgroundColor: '#DBEAFE',
  },
  yearText: {
    fontSize: 18,
    textAlign: 'center',
  },
  yearTextSelected: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  // Button styles
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  // Gender picker
  genderPickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  genderOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  genderText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  genderTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
});

export default function UserData() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, pin } = useLocalSearchParams(); // Retrieve phone and pin from query params
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [fetchedPhoneNumber, setFetchedPhoneNumber] = useState("");

  // Calculate minimum birth date (18 years ago)
  const minBirthYear = moment().subtract(18, 'years').year();
  
  // State for input fields
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
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

    // On mount, try to fetch user data
    const checkUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const userResponse = await fetchUser();
          console.log('Fetched user data:', userResponse);
          const user = userResponse?.data?.user;
          if (user && user.phoneNumber) {
            setFetchedPhoneNumber(user.phoneNumber);
          }
          if (user && user.firstName && user.lastName && user.middleName) {
            router.replace({
              pathname: "/verification/bvn",
              params: {
                firstName: user.firstName,
                lastName: user.lastName,
                middleName: user.middleName,
                email: user.email,
                dateOfBirth: user.dateOfBirth || '',
                gender: user.gender || '',
                phone: user.phoneNumber || phone,
                pin: pin
              }
            });
            return;
          }
        }
      } catch (error) {
        // If error, just let user fill the form
        console.log('No user data found or error fetching:', error);
      }
    };
    checkUserData();

    // Cleanup event listeners on unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Function to handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate age
      const userAge = moment().diff(moment(dob), 'years');
      if (userAge < 18) {
        dispatch(addNotification({
          type: 'error',
          title: 'Age Restriction',
          body: 'You must be at least 18 years old to register.'
        }));
        return;
      }

      // Validate all required fields
      if (!firstname || !lastname || !email || !gender || !dob) {
        dispatch(addNotification({
          type: 'error',
          title: 'Missing Information',
          body: 'Please fill in all required fields.'
        }));
        return;
      }

      // Validate middle name separately as it's a critical field
      console.log('Middle name before validation:', {
        middlename,
        middlenameType: typeof middlename,
        middlenameLength: middlename ? middlename.length : 0,
        middlenameTrimmed: middlename ? middlename.trim() : '',
        middlenameTrimmedLength: middlename ? middlename.trim().length : 0
      });

      if (!middlename || middlename.trim() === '') {
        dispatch(addNotification({
          type: 'error',
          title: 'Missing Middle Name',
          body: 'Please enter your middle name as it appears in your official records.'
        }));
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        dispatch(addNotification({
          type: 'error',
          title: 'Invalid Email',
          body: 'Please enter a valid email address.'
        }));
        return;
      }

      const userData = {
        firstName: firstname,
        lastName: lastname,
        middleName: middlename,
        email,
        dateOfBirth: moment(dob).format('YYYY-MM-DD'),
        gender
      };

      // Add detailed logging
      console.log('Data being sent to API:', {
        ...userData,
      });

      // Log the stringified version to see exact format
      console.log('Data as JSON:', JSON.stringify(userData));

      // Call the completeRegistration API
      const response = await completeRegistration(userData);
      
      if (response.status === 'Success') {
        dispatch(addNotification({
          type: 'success',
          title: 'Registration Successful',
          body: 'Your personal information has been saved successfully.'
        }));
        // Device notification
        await sendNotification(
          NotificationTemplates.registration.success(firstname).title,
          NotificationTemplates.registration.success(firstname).body,
          NotificationTemplates.registration.success(firstname).type
        );

        // Navigate to the next page with the user data
        router.push({
          pathname: "/verification/bvn",
          params: {
            ...userData,
            phone: phone,
            pin: pin
          }
        });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Error in registration:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Registration Failed',
        body: error?.message || 'There was an error saving your information. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
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
              Tell Us About Yourself
            </Text>
            <Text className="text-base text-[#4F4F4F]">
              Enter your details as they appear in your official records.
            </Text>
          </View>

          {/* Input Fields */}
          <View className="mt-6 space-y-4">
            {/* Firstname */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">First Name <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={firstname}
                onChangeText={setFirstname}
                placeholder="Enter first name"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-inputBg"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Middle Name */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Middle Name <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={middlename}
                onChangeText={setMiddlename}
                placeholder="Enter middle name"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-inputBg"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Lastname */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Last Name <Text className="text-red-500">*</Text></Text>
              <TextInput
                value={lastname}
                onChangeText={setLastname}
                placeholder="Enter last name"
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
                <Text className="text-base text-[#BDBDBD]">{gender || "Select your gender"}</Text>
                <Ionicons name="chevron-down" size={24} color="#0072CE" />
              </TouchableOpacity>
            </View>

            {/* Email */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Email address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                editable={false}
                placeholder="Enter email address"
                keyboardType="email-address"
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                style={{
                  backgroundColor: "#F4F4F5",
                }}
              />
            </View>

            {/* Phone Number */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Phone Number</Text>
              {fetchedPhoneNumber ? (
                <Text className="text-base text-[#0072CE] mb-1">{fetchedPhoneNumber}</Text>
              ) : null}
              <View className="flex-row items-center">
                {/* NG Flag + Code */}
                <View className="flex-row items-center mr-3 border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]">
                  <Image
                    source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                    style={{
                      width: 24,
                      height: 18,
                      borderRadius: 2,
                      marginRight: 6,
                    }}
                  />
                  <Text className="text-base text-[#4F4F4F]">NG</Text>
                </View>

                {/* Phone input (non-editable) */}
                <TextInput
                  value={fetchedPhoneNumber ? String(fetchedPhoneNumber) : (phone ? String(phone) : '')}
                  editable={false}
                  className="flex-1 text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Date Of Brith</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(true)}
                className="flex-row items-center justify-between w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
              >
                <Text className="text-base text-[#BDBDBD]">{moment(dob).format('YYYY-MM-DD') || 'Select your DOB'}</Text>
                <Ionicons name="calendar" size={24} color="#0072CE" />
              </TouchableOpacity>
              {/* <Text className="text-xs text-gray-500 mt-1">You must be at least 18 years old</Text> */}
            </View>

          </View>

          {/* Spacer to push button down */}
          <View className="h-16" />
        </ScrollView>

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
                  onPress={() => setShowGenderPicker(false)}
                  className="mt-4 p-4 items-center bg-[#0072CE] rounded-xl"
                >
                  <Text className="text-white font-bold text-lg">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Calendar Modal */}
        <Modal
          transparent={true}
          visible={showCalendar}
          animationType="slide"
          onRequestClose={() => setShowCalendar(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => changeMonth('prev')}
                  style={styles.monthNavButton}
                >
                  <Ionicons name="chevron-back" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setShowYearSelector(true)}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Text style={styles.monthText}>{moment(dob).format('MMMM YYYY')}</Text>
                  <Ionicons name="chevron-down" size={20} color="#2563EB" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => changeMonth('next')}
                  style={styles.monthNavButton}
                >
                  <Ionicons name="chevron-forward" size={20} color="#2563EB" />
                </TouchableOpacity>
              </View>
              <View style={styles.weekDaysContainer}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <Text key={day} style={styles.weekDay}>{day}</Text>
                ))}
              </View>
              {renderCalendar()}
              <TouchableOpacity 
                onPress={() => setShowCalendar(false)}
                style={[styles.button, { marginTop: 16 }]}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Year Selector Modal */}
        <Modal
          transparent={true}
          visible={showYearSelector}
          animationType="slide"
          onRequestClose={() => setShowYearSelector(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { height: '50%' }]}>
              <Text style={[styles.monthText, { marginBottom: 16 }]}>Select Year</Text>
              <FlatList
                data={availableYears}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => {
                  const isSelected = moment(dob).year() === item;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.yearItem,
                        isSelected && styles.yearItemSelected
                      ]}
                      onPress={() => selectYear(item)}
                    >
                      <Text style={[
                        styles.yearText,
                        isSelected && styles.yearTextSelected
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={true}
                initialScrollIndex={availableYears.findIndex(year => year === moment(dob).year())}
                getItemLayout={(data, index) => ({
                  length: 48,
                  offset: 48 * index,
                  index,
                })}
              />
              <TouchableOpacity 
                onPress={() => setShowYearSelector(false)}
                style={[styles.button, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Continue Button */}
        <View style={{ paddingBottom: 16 }}>
          {!isKeyboardVisible && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
