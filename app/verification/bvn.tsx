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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import moment from "moment";
import { initiateIdentityVerification, validateIdentity } from "../../services/api";
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';

const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '91.67%', // 11/12
    maxWidth: 384, // max-w-sm
    padding: 24, // p-6
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalTitle: {
    fontSize: 24, // text-2xl
    fontWeight: 'bold',
    color: '#1E40AF', // text-primaryText
    textAlign: 'center',
    marginBottom: 16 // mb-4
  },
  modalSubtitle: {
    fontSize: 18, // text-lg
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8 // mb-2
  },
  modalText: {
    color: '#4B5563', // text-gray-600
    textAlign: 'center',
    fontSize: 16, // text-base
    marginBottom: 24 // mb-6
  },
  modalButton: {
    backgroundColor: '#0072CE', // bg-[#0072CE]
    paddingVertical: 12, // py-3
    borderRadius: 8, // rounded-lg
    alignItems: 'center'
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18, // text-lg
    fontWeight: '600' // font-semibold
  },
  // Form styles
  formGroup: {
    marginVertical: 8, // my-2
  },
  label: {
    color: '#4F4F4F',
    marginBottom: 8, // mb-2
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 48, // h-12
    paddingHorizontal: 16, // px-4
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8, // rounded-lg
    backgroundColor: '#F4F4F5',
    paddingVertical: 12, // py-3
  },
  dropdownButtonText: {
    fontSize: 16, // text-base
    color: '#1A1A1A',
  },
  dropdownMenu: {
    position: 'absolute',
    zIndex: 10,
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8, // rounded-lg
    marginTop: 4, // mt-1
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12, // py-3
    paddingHorizontal: 16, // px-4
  },
  dropdownItemText: {
    fontSize: 16, // text-base
    color: '#1A1A1A',
  },
});

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
      days.push(<View key={`empty-${i}`} style={bvStyles.dayEmpty} />);
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
          style={[
            bvStyles.dayBtn,
            isSelected && bvStyles.dayBtnSelected,
            isDisabled && bvStyles.dayBtnDisabled,
          ]}
          disabled={isDisabled}
          onPress={() => {
            const selectedDate = moment(`${currentYear}-${currentMonth + 1}-${day}`).toDate();
            setDob(selectedDate);
          }}
        >
          <Text style={[bvStyles.dayText, isSelected && bvStyles.dayTextSelected]}>{day}</Text>
        </TouchableOpacity>
      );
    }

    const rows = [];
    const totalDays = Math.max(days.length, 35);
    for (let i = 0; i < totalDays; i += 7) {
      const weekDays = days.slice(i, i + 7);
      while (weekDays.length < 7) {
        weekDays.push(<View key={`empty-${i + weekDays.length}`} style={bvStyles.dayEmpty} />);
      }
      rows.push(
        <View key={`row-${i}`} style={bvStyles.weekRow}>
          {weekDays}
        </View>
      );
    }

    return (
      <View style={bvStyles.calendarContainer}>
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
      style={bvStyles.flex}
    >
      <View
        style={[bvStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        {/* Header */}
        <View style={bvStyles.headerRow}>
          <TouchableOpacity
            style={bvStyles.headerBack}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} />
          </TouchableOpacity>
          <Text style={bvStyles.stepText}>Step 3 of 4</Text>
        </View>

        <ScrollView style={bvStyles.scroll} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View>
            <Text style={bvStyles.title}>
              Verify Your Identity
            </Text>
            <Text style={bvStyles.subtitle}>
              Please provide your BVN or NIN to continue.
            </Text>
          </View>

          {/* Identity Type Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Identity Type</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowIdentityTypeDropdown(!showIdentityTypeDropdown)}
            >
              <Text style={styles.dropdownButtonText}>{identityType}</Text>
              <Ionicons 
                name={showIdentityTypeDropdown ? 'chevron-up' : 'chevron-down'} 
                size={24} 
                color="#0072CE" 
              />
            </TouchableOpacity>
            {showIdentityTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {['BVN', 'NIN'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setIdentityType(type);
                      setShowIdentityTypeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Input Fields */}
          <View style={bvStyles.inputsWrap}>
            {/* BVN/NIN Number */}
            <View style={bvStyles.inputGroup}>
              <Text style={bvStyles.label}>{identityType} Number</Text>
              <View style={bvStyles.inputRow}>
                <TextInput
                  value={bvn}
                  onChangeText={setBvn}
                  placeholder={`Enter ${identityType} number`}
                  keyboardType="number-pad"
                  maxLength={identityType === 'BVN' ? 11 : 11} // Adjust if NIN has different length
                  style={bvStyles.textInput}
                  placeholderTextColor="#BDBDBD"
                />
                <TouchableOpacity onPress={() => setShowBvnInfoModal(true)}>
                  <Ionicons name="information-circle-outline" size={20} color="#9B9B9B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date of Birth */}
            <View style={bvStyles.inputGroup}>
              <Text style={bvStyles.label}>Date Of Brith</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(true)}
                style={bvStyles.inputRow}
              >
                <Text style={bvStyles.placeholderText}>{moment(dob).format('YYYY-MM-DD') || 'Select your DOB'}</Text>
                <Ionicons name="calendar" size={24} color="#0072CE" />
              </TouchableOpacity>
            </View>

            {/* Phone Number */}
            <View style={bvStyles.inputGroup}>
              <Text style={bvStyles.label}>Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={11} // Adjust based on common phone number length
                style={bvStyles.fullInput}
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>

          {/* Spacer to push button down */}
          <View style={bvStyles.spacer} />
        </ScrollView>

        {/* Calendar Modal */}
        {showCalendar && (
          <Modal
            transparent={true}
            visible={showCalendar}
            animationType="slide"
            onRequestClose={() => setShowCalendar(false)}
          >
            <View style={bvStyles.modalOverlay}>
              <View style={[bvStyles.modalCard, { height: '55%' }] }>
                <View style={bvStyles.modalHeaderRow}>
                  <TouchableOpacity 
                    onPress={() => changeMonth('prev')}
                    style={bvStyles.roundBtn}
                  >
                    <Ionicons name="chevron-back" size={20} color="#0072CE" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowYearSelector(true)}
                    style={bvStyles.inlineRow}
                  >
                    <Text style={bvStyles.modalTitleCenter}>{moment(dob).format('MMMM YYYY')}</Text>
                    <Ionicons name="chevron-down" size={20} color="#0072CE" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => changeMonth('next')}
                    style={bvStyles.roundBtn}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#0072CE" />
                  </TouchableOpacity>
                </View>
                <View style={bvStyles.weekHeaderRow}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <Text key={day} style={bvStyles.weekHeaderText}>{day}</Text>
                  ))}
                </View>
                {renderCalendar()}
                <TouchableOpacity 
                  onPress={() => setShowCalendar(false)}
                  style={bvStyles.primaryBtn}
                >
                  <Text style={bvStyles.primaryText}>Done</Text>
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
            <View style={bvStyles.modalOverlay}>
              <View style={[bvStyles.modalCard, { height: '50%' }]}>
                <Text style={bvStyles.modalTitleCenter}>Select Year</Text>
                <FlatList
                  data={availableYears}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[bvStyles.yearItem, moment(dob).year() === item && bvStyles.yearItemActive]}
                      onPress={() => selectYear(item)}
                    >
                      <Text style={[bvStyles.yearText, moment(dob).year() === item && bvStyles.yearTextActive]}>{item}</Text>
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
                  style={bvStyles.primaryBtn}
                >
                  <Text style={bvStyles.primaryText}>Cancel</Text>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Don't Know Your BVN?
              </Text>
              <Text style={styles.modalSubtitle}>
                Just dial *565*0#
              </Text>
              <Text style={styles.modalText}>
                This will work only if you are making the request from the same phone number currently linked to your account.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowBvnInfoModal(false)}
              >
                <Text style={styles.modalButtonText}>Okay</Text>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Enter Verification Code
              </Text>
              <Text style={styles.modalText}>
                Please enter the 6-digit code sent to your phone number.
              </Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                style={bvStyles.fullInput}
                placeholderTextColor="#BDBDBD"
              />
              <TouchableOpacity
                style={bvStyles.primaryBtn}
                onPress={handleOtpVerification}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={bvStyles.primaryText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Verify Button */}
        <View style={bvStyles.bottomPad}>
          {!isKeyboardVisible && (
            <TouchableOpacity
              style={bvStyles.primaryBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={bvStyles.primaryText}>Verify</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
} 

const bvStyles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  headerBack: { flexDirection: 'row', alignItems: 'center' },
  stepText: { fontWeight: '600' },
  scroll: { marginTop: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0052CC', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4F4F4F' },
  inputsWrap: { marginTop: 24 },
  inputGroup: { marginVertical: 8 },
  label: { color: '#4F4F4F', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: '#F4F4F5' },
  textInput: { flex: 1, fontSize: 16, color: '#1A1A1A' },
  placeholderText: { fontSize: 16, color: '#BDBDBD' },
  fullInput: { width: '100%', height: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: '#F4F4F5', paddingVertical: 12, marginBottom: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, marginBottom: 8 },
  roundBtn: { padding: 8, borderRadius: 999, backgroundColor: '#F3F4F6' },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitleCenter: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  weekHeaderRow: { flexDirection: 'row', padding: 8, marginBottom: 8 },
  weekHeaderText: { flex: 1, textAlign: 'center', fontWeight: '500', color: '#6B7280' },
  primaryBtn: { marginTop: 16, padding: 16, alignItems: 'center', backgroundColor: '#0072CE', borderRadius: 12 },
  primaryText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
  yearItem: { paddingVertical: 12, paddingHorizontal: 16, marginBottom: 4, borderRadius: 8 },
  yearItemActive: { backgroundColor: '#DBEAFE' },
  yearText: { textAlign: 'center', fontSize: 18 },
  yearTextActive: { color: '#2563EB', fontWeight: 'bold' },
  bottomPad: { paddingBottom: 16 },
  dayEmpty: { flex: 1, padding: 8, marginVertical: 4 },
  dayBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 4, borderRadius: 999, padding: 8 },
  dayBtnSelected: { backgroundColor: '#2563EB' },
  dayBtnDisabled: { opacity: 0.3 },
  dayText: { textAlign: 'center', color: '#000000' },
  dayTextSelected: { color: '#FFFFFF' },
  weekRow: { flexDirection: 'row' },
  calendarContainer: { flex: 1 },
  spacer: { height: 64 },
});