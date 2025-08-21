import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Dimensions,
  ScrollView,
  FlatList,
  Modal
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import moment from "moment"; // Import moment for date formatting
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function UserData() {
  const router = useRouter();
  
  // Use back button handler for signup userData page
  useBackButtonHandler('/signup/userData');
  
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const params = useLocalSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);

  // Helper function to set message with auto-clear
  const setMessageWithTimeout = (msg: string, type: 'error' | 'info', timeoutMs: number = 4000) => {
    // Clear any existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }
    
    setMessage(msg);
    setMessageType(type);
    
    // Set new timeout to clear message
    const timeout = setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, timeoutMs);
    
    setMessageTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, [messageTimeout]);

  // Responsive sizing based on screen width
  const getResponsiveSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9; // Small phones
    } else if (width < 414) {
      return baseSize; // Medium phones
    } else {
      return baseSize * 1.1; // Large phones and tablets
    }
  };

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

  const handleSubmit = () => {
    // Validate required fields
    if (!firstName.trim()) {
      setMessageWithTimeout("Please enter your first name", "error", 3000);
      return;
    }
    if (!lastName.trim()) {
      setMessageWithTimeout("Please enter your last name", "error", 3000);
      return;
    }
    if (!email.trim()) {
      setMessageWithTimeout("Please enter your email address", "error", 3000);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessageWithTimeout("Please enter a valid email address", "error", 3000);
      return;
    }

    // Navigate to next screen with user data
    router.push({
      pathname: "/signup/passcode",
      params: {
        phone: params.phone as string,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        dob: dob.toISOString(),
      },
    });
  };

  const selectYear = (year: number) => {
    const newDate = new Date(dob);
    newDate.setFullYear(year);
    setDob(newDate);
    setShowYearSelector(false);
  };

  const renderCalendar = () => {
    const startOfMonth = moment(dob).startOf('month');
    const endOfMonth = moment(dob).endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');
    const days = [];
    let day = startDate.clone();

    while (day.isSameOrBefore(endDate)) {
      days.push(day.clone());
      day.add(1, 'day');
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks.map((week, weekIndex) => (
      <View key={weekIndex} className="flex-row">
        {week.map((day, dayIndex) => {
          const isCurrentMonth = day.isSame(dob, 'month');
          const isSelected = day.isSame(dob, 'day');
          const isToday = day.isSame(moment(), 'day');
          
          return (
        <TouchableOpacity
              key={dayIndex}
              className={`flex-1 items-center justify-center py-2 ${isSelected ? 'bg-blue-500 rounded-full' : ''}`}
              onPress={() => setDob(day.toDate())}
              style={{
                paddingVertical: getResponsiveSize(8),
                borderRadius: getResponsiveSize(20)
              }}
            >
              <Text className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'} ${isSelected ? 'text-white font-bold' : ''} ${isToday ? 'font-bold' : ''}`} style={{ fontSize: getResponsiveSize(14) }}>
                {day.format('D')}
              </Text>
        </TouchableOpacity>
      );
        })}
      </View>
    ));
  };

  const changeMonth = (direction: 'next' | 'prev') => {
    const newDate = new Date(dob);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setDob(newDate);
  };

  const availableYears = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 18 - i);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
    >
      <View
          className="flex-1 px-6"
        style={{
            paddingTop: insets.top + getResponsiveSize(16),
            paddingBottom: insets.bottom + getResponsiveSize(16),
            paddingHorizontal: getResponsiveSize(24),
        }}
      >
        {/* Header */}
          <View className="flex-row justify-between items-center" style={{ marginBottom: getResponsiveSize(24) }}>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
              style={{ padding: getResponsiveSize(8) }}
          >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
          </TouchableOpacity>
            <Text className="font-semibold" style={{ fontSize: getResponsiveSize(16) }}>Step 2 of 4</Text>
          </View>

          {/* Message Display */}
          {message && (
            <View style={{
              marginBottom: getResponsiveSize(16),
              padding: getResponsiveSize(12),
              backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF',
              borderRadius: getResponsiveSize(8)
            }}>
              <Text style={{
                color: messageType === 'error' ? '#D92D20' : '#0072CE',
                textAlign: 'center',
                fontSize: getResponsiveSize(14)
              }}>{message}</Text>
            </View>
          )}

          <View style={{ marginTop: getResponsiveSize(16) }}>
            <Text className="text-2xl font-bold text-[#0072CE] mb-2" style={{ fontSize: getResponsiveSize(24) }}>
              Tell us about yourself
            </Text>
            <Text className="text-base text-[#4F4F4F]" style={{ fontSize: getResponsiveSize(16) }}>
              We need some basic information to set up your account.
            </Text>
          </View>

          {/* Input Fields */}
          <View style={{ marginTop: getResponsiveSize(32) }}>
            {/* First Name */}
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <Text className="text-sm text-[#4F4F4F] mb-1" style={{ fontSize: getResponsiveSize(14) }}>First Name</Text>
              <TextInput
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
                className="text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
                placeholderTextColor="#BDBDBD"
                style={{
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8),
                  fontSize: getResponsiveSize(16)
                }}
              />
            </View>

            {/* Last Name */}
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <Text className="text-sm text-[#4F4F4F] mb-1" style={{ fontSize: getResponsiveSize(14) }}>Last Name</Text>
              <TextInput
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={setLastName}
                className="text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
                placeholderTextColor="#BDBDBD"
                style={{
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8),
                  fontSize: getResponsiveSize(16)
                }}
              />
            </View>

            {/* Email */}
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <Text className="text-sm text-[#4F4F4F] mb-1" style={{ fontSize: getResponsiveSize(14) }}>Email Address</Text>
              <TextInput
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
                placeholderTextColor="#BDBDBD"
                style={{
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8),
                  fontSize: getResponsiveSize(16)
                }}
              />
            </View>

            {/* Date of Birth */}
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <Text className="text-sm text-[#4F4F4F] mb-1" style={{ fontSize: getResponsiveSize(14) }}>Date of Birth</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(true)}
                className="flex-row items-center justify-between text-base text-[#1A1A1A] border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
                style={{
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8)
                }}
              >
                <Text className="text-base text-[#1A1A1A]" style={{ fontSize: getResponsiveSize(16) }}>
                  {moment(dob).format('MMMM DD, YYYY')}
                </Text>
                <Ionicons name="calendar-outline" size={getResponsiveSize(20)} color="#0072CE" />
              </TouchableOpacity>
            </View>
          </View>

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
                      style={{ padding: getResponsiveSize(8), borderRadius: getResponsiveSize(20) }}
                  >
                      <Ionicons name="chevron-back" size={getResponsiveSize(20)} color="#0072CE" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowYearSelector(true)}
                    className="flex-row items-center"
                  >
                      <Text className="text-xl font-bold text-center" style={{ fontSize: getResponsiveSize(20) }}>{moment(dob).format('MMMM YYYY')}</Text>
                      <Ionicons name="chevron-down" size={getResponsiveSize(20)} color="#0072CE" style={{ marginLeft: getResponsiveSize(4) }} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => changeMonth('next')}
                    className="p-2 rounded-full bg-gray-100"
                      style={{ padding: getResponsiveSize(8), borderRadius: getResponsiveSize(20) }}
                  >
                      <Ionicons name="chevron-forward" size={getResponsiveSize(20)} color="#0072CE" />
                  </TouchableOpacity>
                </View>
                <View className="flex-row p-2 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <Text key={day} className="flex-1 text-center font-medium text-gray-500" style={{ fontSize: getResponsiveSize(14) }}>{day}</Text>
                  ))}
                </View>
                {renderCalendar()}
                <TouchableOpacity 
                  onPress={() => setShowCalendar(false)}
                  className="mt-4 p-4 items-center bg-[#0072CE] rounded-xl"
                    style={{
                      marginTop: getResponsiveSize(16),
                      paddingVertical: getResponsiveSize(16),
                      borderRadius: getResponsiveSize(12)
                    }}
                >
                    <Text className="text-white font-bold text-lg" style={{ fontSize: getResponsiveSize(18) }}>Done</Text>
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
                  <Text className="text-xl font-bold text-center mb-4" style={{ fontSize: getResponsiveSize(20) }}>Select Year</Text>
                <FlatList
                  data={availableYears}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`py-3 px-4 mb-1 rounded-lg ${moment(dob).year() === item ? 'bg-blue-100' : ''}`}
                      onPress={() => selectYear(item)}
                        style={{
                          paddingVertical: getResponsiveSize(12),
                          paddingHorizontal: getResponsiveSize(16),
                          marginBottom: getResponsiveSize(4),
                          borderRadius: getResponsiveSize(8)
                        }}
                      >
                        <Text className={`text-center text-lg ${moment(dob).year() === item ? 'text-blue-600 font-bold' : ''}`} style={{ fontSize: getResponsiveSize(18) }}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={true}
                  initialScrollIndex={availableYears.findIndex(year => year === moment(dob).year())}
                  getItemLayout={(data, index) => ({
                      length: getResponsiveSize(48), // height of item
                      offset: getResponsiveSize(48) * index,
                    index,
                  })}
                />
                <TouchableOpacity 
                  onPress={() => setShowYearSelector(false)}
                  className="mt-4 p-4 items-center bg-[#0072CE] rounded-xl"
                    style={{
                      marginTop: getResponsiveSize(16),
                      paddingVertical: getResponsiveSize(16),
                      borderRadius: getResponsiveSize(12)
                    }}
                >
                    <Text className="text-white font-bold text-lg" style={{ fontSize: getResponsiveSize(18) }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Continue Button */}
          <View className="pb-4" style={{ paddingBottom: getResponsiveSize(16) }}>
            <TouchableOpacity
              className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
              onPress={handleSubmit} // Use handleSubmit to pass data to the next page
              style={{
                paddingVertical: getResponsiveSize(16),
                borderRadius: getResponsiveSize(8)
              }}
            >
              <Text className="text-white text-lg mr-2 font-semibold" style={{ fontSize: getResponsiveSize(18) }}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={getResponsiveSize(18)} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
