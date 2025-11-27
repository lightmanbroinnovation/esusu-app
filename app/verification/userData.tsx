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
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStepText: {
    fontWeight: '600',
  },
  scrollView: {
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F4F4F',
  },
  inputContainer: {
    marginTop: 24,
  },
  inputWrapper: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#4F4F4F',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  input: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  touchableInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
  },
  placeholderText: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  inputText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  phoneNumberText: {
    fontSize: 16,
    color: '#0072CE',
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
  },
  flagImage: {
    width: 24,
    height: 18,
    borderRadius: 2,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#4F4F4F',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F4F4F5',
  },
  spacer: {
    height: 64,
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
    padding: 16,
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
  calendarContainer: {
    flex: 1,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    marginVertical: 4,
    marginHorizontal: 8,
    padding: 8,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    borderRadius: 999,
    padding: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#2563EB',
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayText: {
    textAlign: 'center',
    color: '#000000',
  },
  dayTextSelected: {
    color: '#FFFFFF',
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
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  // Gender picker
  genderPickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  genderPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  genderPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  genderOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
  },
  genderText: {
    fontSize: 18,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  genderCancelButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#0072CE',
    borderRadius: 12,
  },
  genderCancelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bottomButtonContainer: {
    paddingBottom: 16,
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
  const availableYears = Array.from({ length: 82 }, (_, i) => minBirthYear - i).sort((a, b) => b - a);

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
          if (user && user.email) {
            setEmail(user.email);
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
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
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
          style={[
            styles.dayButton,
            isSelected && styles.dayButtonSelected,
            isDisabled && styles.dayButtonDisabled
          ]}
          disabled={isDisabled}
          onPress={() => {
            const selectedDate = moment(`${currentYear}-${currentMonth + 1}-${day}`).toDate();
            setDob(selectedDate);
          }}
        >
          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
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
        weekDays.push(<View key={`empty-${i + weekDays.length}`} style={styles.dayCell} />);
      }
      rows.push(
        <View key={`row-${i}`} style={styles.calendarRow}>
          {weekDays}
        </View>
      );
    }

    return (
      <View style={styles.calendarContainer}>
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
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerStepText}>Step 2 of 4</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View>
            <Text style={styles.title}>
              Tell Us About Yourself
            </Text>
            <Text style={styles.subtitle}>
              Enter your details as they appear in your official records.
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            {/* Firstname */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>First Name <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                value={firstname}
                onChangeText={setFirstname}
                placeholder="Enter first name"
                style={styles.input}
              />
            </View>

            {/* Middle Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Middle Name <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                value={middlename}
                onChangeText={setMiddlename}
                placeholder="Enter middle name"
                style={styles.input}
              />
            </View>

            {/* Lastname */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Last Name <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                value={lastname}
                onChangeText={setLastname}
                placeholder="Enter last name"
                style={styles.input}
              />
            </View>

            {/* Gender Selection */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity
                onPress={() => setShowGenderPicker(true)}
                style={styles.touchableInput}
              >
                <Text style={styles.placeholderText}>{gender || "Select your gender"}</Text>
                <Ionicons name="chevron-down" size={24} color="#0072CE" />
              </TouchableOpacity>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                editable={false}
                placeholder="Enter email address"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneContainer}>
                {/* NG Flag + Code */}
                <View style={styles.countryCodeContainer}>
                  <Image
                    source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                    style={styles.flagImage}
                  />
                  <Text style={styles.countryCodeText}>NG</Text>
                </View>

                {/* Phone input (non-editable) */}
                <TextInput
                  value={fetchedPhoneNumber ? String(fetchedPhoneNumber) : (phone ? String(phone) : '')}
                  editable={false}
                  style={styles.phoneInput}
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Date Of Birth</Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(true)}
                style={styles.touchableInput}
              >
                <Text style={styles.placeholderText}>{moment(dob).format('YYYY-MM-DD') || 'Select your DOB'}</Text>
                <Ionicons name="calendar" size={24} color="#0072CE" />
              </TouchableOpacity>
              {/* <Text className="text-xs text-gray-500 mt-1">You must be at least 18 years old</Text> */}
            </View>

          </View>

          {/* Spacer to push button down */}
          <View style={styles.spacer} />
        </ScrollView>

        {/* Gender Picker Modal */}
        {showGenderPicker && (
          <Modal
            transparent={true}
            visible={showGenderPicker}
            animationType="slide"
            onRequestClose={() => setShowGenderPicker(false)}
          >
            <View style={styles.genderPickerModal}>
              <View style={styles.genderPickerContainer}>
                <Text style={styles.genderPickerTitle}>Select Gender</Text>
                <TouchableOpacity
                  style={styles.genderOption}
                  onPress={() => {
                    setGender('Male');
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={styles.genderText}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.genderOption}
                  onPress={() => {
                    setGender('Female');
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={styles.genderText}>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowGenderPicker(false)}
                  style={styles.genderCancelButton}
                >
                  <Text style={styles.genderCancelText}>Cancel</Text>
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
              <ScrollView style={{ flex: 1, marginBottom: 8 }} showsVerticalScrollIndicator={false}>
                {renderCalendar()}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                style={[styles.button, { marginTop: 8 }]}
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
        <View style={styles.bottomButtonContainer}>
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
