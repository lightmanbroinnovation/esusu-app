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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { initiateIdentityVerification, validateIdentity } from "../../services/api";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';

export default function BvnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams(); // Get all passed params
  const dispatch = useDispatch();

  const [bvn, setBvn] = useState("");
  const [dob, setDob] = useState(moment().subtract(18, 'years').toDate()); // Default to 18 years ago
  const [phone, setPhone] = useState(params.phone ? String(params.phone) : ""); // Pre-fill from params
  const [showCalendar, setShowCalendar] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showBvnInfoModal, setShowBvnInfoModal] = useState(false); // State for BVN info modal
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [identityType, setIdentityType] = useState('BVN'); // New state for identity type
  const [showIdentityTypeDropdown, setShowIdentityTypeDropdown] = useState(false); // Dropdown visibility

  // Calculate minimum birth date (18 years ago)
  const minBirthYear = moment().subtract(18, 'years').year();
  // Available years (going back 100 years from minimum age)
  const availableYears = Array.from({length: 82}, (_, i) => minBirthYear - i).sort((a, b) => b - a);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate BVN/NIN
      if (!bvn || bvn.length !== 11) {
        dispatch(addNotification({
          type: 'error',
          title: `Invalid ${identityType}`,
          body: `Please enter a valid 11-digit ${identityType} number.`
        }));
        setLoading(false);
        return;
      }

      // Validate phone number - ensure it starts with 0 or +234
      let formattedPhone = phone;
      if (!phone) {
        dispatch(addNotification({
          type: 'error',
          title: 'Invalid Phone',
          body: 'Please enter a phone number.'
        }));
        setLoading(false);
        return;
      }

      // Format phone number to ensure it starts with +234
      if (phone.startsWith('0')) {
        formattedPhone = '0' + phone.substring(1);
      } else if (!phone.startsWith('+234')) {
        formattedPhone = '0' + phone;
      }

      const identityData = {
        identityType,
        identityNumber: bvn.trim(),
        phoneNumber: formattedPhone.trim()
      };

      console.log('Sending identity data:', identityData); // Debug log

      // Call initiate identity verification
      const response = await initiateIdentityVerification(identityData);
      
      if (response.status === 'Success') {
        dispatch(addNotification({
          type: 'success',
          title: 'Verification Initiated',
          body: 'Please enter the OTP sent to your phone.'
        }));
        // Device notification
        await sendNotification(
          NotificationTemplates.registration.verification.approved.title,
          NotificationTemplates.registration.verification.approved.body,
          NotificationTemplates.registration.verification.approved.type
        );
        setShowOtpModal(true);
      } else {
        throw new Error(response.message || 'Identity verification initiation failed');
      }
    } catch (error: any) {
      console.error('Error in identity verification:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Verification Failed',
        body: error.message || 'There was an error verifying your identity. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    try {
      setLoading(true);
      
      if (otp.length !== 6) {
        dispatch(addNotification({
          type: 'error',
          title: 'Invalid OTP',
          body: 'Please enter the complete 6-digit OTP.'
        }));
        return;
      }

      // Call validate identity with OTP
      const response = await validateIdentity(otp);
      
      if (response.status === 'Success') {
        dispatch(addNotification({
          type: 'success',
          title: 'Verification Successful',
          body: 'Your identity has been verified successfully.'
        }));

        // Navigate to dashboard after successful verification
        router.replace('/dashboard');
        return;
      } else {
        throw new Error('Identity validation failed');
      }
    } catch (error: any) {
      console.error('Error in OTP verification:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Verification Failed',
        body: error.message || 'There was an error verifying your OTP. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const selectYear = (year: number) => {
    const newDate = moment(dob).year(year).toDate();
    setDob(newDate);
    setShowYearSelector(false);
  };

  const renderCalendar = () => {
    const currentMonth = moment(dob).month();
    const currentYear = moment(dob).year();
    const daysInMonth = moment(`${currentYear}-${currentMonth + 1}`, "YYYY-MM").daysInMonth();
    const firstDayOfMonth = moment(`${currentYear}-${currentMonth + 1}-01`).day();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} className="flex-1 my-1" style={{ padding: 8 }} />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment(`${currentYear}-${currentMonth + 1}-${day}`);
      const isSelected = moment(dob).date() === day && 
                         moment(dob).month() === currentMonth && 
                         moment(dob).year() === currentYear;
      
      const wouldBeEighteen = moment().diff(currentDate, 'years') >= 18;
      const isDisabled = !wouldBeEighteen;
      
      days.push(
        <TouchableOpacity
          key={day}
          className={`flex-1 items-center justify-center my-1 rounded-full
            ${isSelected ? 'bg-blue-600' : ''}
            ${isDisabled ? 'opacity-30' : ''}`}
          style={{ padding: 8 }}
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

    const rows = [];
    const totalDays = Math.max(days.length, 35);
    for (let i = 0; i < totalDays; i += 7) {
      const weekDays = days.slice(i, i + 7);
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

  const changeMonth = (direction: 'next' | 'prev') => {
    const newDate = moment(dob).add(direction === 'next' ? 1 : -1, 'months');
    
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
          <Text className="font-semibold">Step 3 of 4</Text>
        </View>

        <ScrollView className="mt-8" showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View>
            <Text className="text-[24px] font-bold text-primaryText mb-2">
              Verify Your Identity
            </Text>
            <Text className="text-base text-[#4F4F4F]">
              Please provide your BVN or NIN to continue.
            </Text>
          </View>

          {/* Identity Type Dropdown */}
          <View className="my-2">
            <Text className="text-[#4F4F4F] mb-2">Identity Type</Text>
            <TouchableOpacity
              className="flex-row items-center justify-between w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
              onPress={() => setShowIdentityTypeDropdown(!showIdentityTypeDropdown)}
            >
              <Text className="text-base text-[#1A1A1A]">{identityType}</Text>
              <Ionicons name={showIdentityTypeDropdown ? 'chevron-up' : 'chevron-down'} size={24} color="#0072CE" />
            </TouchableOpacity>
            {showIdentityTypeDropdown && (
              <View className="absolute z-10 w-full bg-white border border-[#E0E0E0] rounded-lg mt-1 shadow-lg">
                {['BVN', 'NIN'].map(type => (
                  <TouchableOpacity
                    key={type}
                    className="py-3 px-4"
                    onPress={() => {
                      setIdentityType(type);
                      setShowIdentityTypeDropdown(false);
                    }}
                  >
                    <Text className="text-base text-[#1A1A1A]">{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Input Fields */}
          <View className="mt-6 space-y-4">
            {/* BVN/NIN Number */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">{identityType} Number</Text>
              <View className="flex-row items-center w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]">
                <TextInput
                  value={bvn}
                  onChangeText={setBvn}
                  placeholder={`Enter ${identityType} number`}
                  keyboardType="number-pad"
                  maxLength={identityType === 'BVN' ? 11 : 11} // Adjust if NIN has different length
                  className="flex-1 text-base text-[#1A1A1A]"
                  placeholderTextColor="#BDBDBD"
                />
                <TouchableOpacity onPress={() => setShowBvnInfoModal(true)}>
                  <Ionicons name="information-circle-outline" size={20} color="#9B9B9B" />
                </TouchableOpacity>
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
            </View>

            {/* Phone Number */}
            <View className="my-2">
              <Text className="text-[#4F4F4F] mb-2">Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={11} // Adjust based on common phone number length
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
                placeholderTextColor="#BDBDBD"
              />
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

        {/* BVN Info Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showBvnInfoModal}
          onRequestClose={() => setShowBvnInfoModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white rounded-2xl w-11/12 max-w-sm p-6 shadow-lg">
              <Text className="text-2xl font-bold text-primaryText text-center mb-4">
                Don't Know Your BVN?
              </Text>
              <Text className="text-lg font-bold text-center mb-2">
                Just dial *565*0#
              </Text>
              <Text className="text-gray-600 text-center text-base mb-6">
                This will work only if you are making the request from the same phone number currently linked to your account.
              </Text>
              <TouchableOpacity
                className="bg-[#0072CE] py-3 rounded-lg items-center"
                onPress={() => setShowBvnInfoModal(false)}
              >
                <Text className="text-white text-lg font-semibold">Okay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* OTP Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showOtpModal}
          onRequestClose={() => setShowOtpModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white rounded-2xl w-11/12 max-w-sm p-6 shadow-lg">
              <Text className="text-2xl font-bold text-primaryText text-center mb-4">
                Enter Verification Code
              </Text>
              <Text className="text-gray-600 text-center text-base mb-6">
                Please enter the 6-digit code sent to your phone number.
              </Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                className="w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5] mb-4"
                placeholderTextColor="#BDBDBD"
              />
              <TouchableOpacity
                className="bg-[#0072CE] py-3 rounded-lg items-center"
                onPress={handleOtpVerification}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-lg font-semibold">Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Verify Button */}
        <View className="pb-4">
          {!isKeyboardVisible && (
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-lg mr-2 font-semibold">Verify</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
} 