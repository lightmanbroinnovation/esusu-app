import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { uploadContributorImage } from '../utils/documentUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Remove the broken import
// import { ContributorData } from './types';

// Define ContributorData type inline
export interface ContributorData {
  firstName: string;
  lastName: string;
  middleName?: string;
  phoneNumber: string;
  nin: string;
  gender: string;
  language: string;
  depositAmount: string;
  duration: string;
  dob: Date;
  photo: string;
}
import moment from 'moment';
import NetInfo from '@react-native-community/netinfo';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import { fetchMerchantDashboardAccount } from '../../services/api';
import EsusuLoader from './EsusuLoader';
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';

export default function AddContributor() {
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('AddContributor', 15);

  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Calculate minimum birth date (18 years ago)
  const minBirthYear = moment().subtract(18, 'years').year();
  
  // Available years (going back 100 years from minimum age)
  const availableYears = Array.from({length: 82}, (_, i) => minBirthYear - i).sort((a, b) => b - a);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nin, setNin] = useState('');
  const [gender, setGender] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [dob, setDob] = useState(moment().subtract(18, 'years').toDate());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Use a ref to track if we've already processed this photoUri
  const processedPhotoUri = useRef<string | null>(null);
  
  // If photoUri is present in params, use it as the image
  useEffect(() => {
    console.log('[AddContributor] useEffect triggered, params:', params);
    console.log('[AddContributor] params.photoUri:', params.photoUri);
    console.log('[AddContributor] current imageUri:', imageUri);
    console.log('[AddContributor] processedPhotoUri.current:', processedPhotoUri.current);

    if (params.photoUri && typeof params.photoUri === 'string') {
      // Check if this is a new photoUri that hasn't been processed yet
      if (params.photoUri !== processedPhotoUri.current) {
        console.log('[AddContributor] Processing new photoUri:', params.photoUri);
        processedPhotoUri.current = params.photoUri;
        setImageUri(params.photoUri);
        setHasImage(true);
        setImageError(false);
        setImageLoading(false);
      } else {
        console.log('[AddContributor] PhotoUri already processed, skipping');
      }
    }
  }, [params.photoUri]);

  // Verify that the image file exists and is readable
  const verifyImageExists = async (uri: string) => {
    try {
      setImageLoading(true);
      if (!uri) {
        setImageError(true);
        setHasImage(false);
        setImageLoading(false);
        return;
      }
      
      // Check if the file exists (for file:// URIs)
      if (uri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          console.log('Image file does not exist:', uri);
          setImageError(true);
          setHasImage(false);
          setImageLoading(false);
          return;
        }
      }
      
      setImageUri(uri);
      setHasImage(true);
      setImageError(false);
    } catch (error) {
      console.error('Error verifying image:', error);
      setImageError(true);
      setHasImage(false);
    } finally {
      setImageLoading(false);
    }
  };

  const navigateBack = () => {
    router.back();
  };

  const handleAddImage = async () => {
    try {
      if (Platform.OS === 'web') {
        handleSelectFromGallery();
      } else {
        // Request camera permissions for native platforms
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status === 'granted') {
        setShowCamera(true);
      } else {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take pictures. Please enable it in your device settings.",
          [
              { text: "Cancel", style: "cancel" },
            { 
              text: "Open Settings", 
              onPress: () => {
                console.log("User should be directed to settings");
              }
            }
          ]
        );
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert(
        "Camera Error",
        "There was a problem accessing your camera. Would you like to select from your gallery instead?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Select from Gallery",
            onPress: handleSelectFromGallery
          }
        ]
      );
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const galleryResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      
      if (!galleryResult.canceled) {
        if (Platform.OS === 'web') {
          // For web, directly navigate to photo quality check with the URI
          router.push({
            pathname: '/contributor/photo-quality',
            params: { photoUri: galleryResult.assets[0].uri }
          });
        } else {
          // For native platforms, save to FileSystem first
        const newUri = await saveImageToAppStorage(galleryResult.assets[0].uri);
          router.push({
            pathname: '/contributor/photo-quality',
            params: { photoUri: newUri }
          });
        }
      }
    } catch (galleryError) {
      console.error('Error selecting from gallery:', galleryError);
      Alert.alert(
        "Gallery Error",
        "There was a problem selecting an image from your gallery.",
        [{ text: "OK" }]
      );
    }
  };

  const takePicture = async () => {
    setSavingImage(true);
    try {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        exif: true,
        cameraType: ImagePicker.CameraType.front,
        });
        
        if (!result.canceled) {
        if (Platform.OS === 'web') {
          // For web, directly navigate with the URI
          router.push({
            pathname: '/contributor/photo-quality',
            params: { photoUri: result.assets[0].uri }
          });
        } else {
          // For native platforms, save to FileSystem first
        const newUri = await saveImageToAppStorage(result.assets[0].uri);
          router.push({
            pathname: '/contributor/photo-quality',
          params: { photoUri: newUri }
        });
        }
      }
      
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(
        "Camera Error",
        "There was a problem capturing the photo. Please try again.",
        [{ text: "OK" }]
      );
      setShowCamera(false);
    } finally {
      setSavingImage(false);
    }
  };

  // Helper function to save image to app storage (only for native platforms)
  const saveImageToAppStorage = async (uri: string) => {
    if (Platform.OS === 'web') {
      return uri; // On web, return the URI directly
    }

    try {
      // Create a unique filename
      const timestamp = new Date().getTime();
      const newUri = `${FileSystem.documentDirectory}contributor_photo_${timestamp}.jpg`;
      
      // Copy the image to app's document directory for persistence
      await FileSystem.copyAsync({
        from: uri,
        to: newUri
      });
      
      console.log('Image saved to:', newUri);
      return newUri;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  };

  const handleNext = async () => {
    try {
      // Validate form fields
      if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !nin.trim() || !gender || !selectedLanguage || !dob) {
        Alert.alert("Missing Information", "Please fill in all required fields.");
        return;
      }

      if (!hasImage || !imageUri) {
        Alert.alert("Missing Profile Image", "Please add a profile image for the contributor.");
        return;
      }
      // No Cloudinary upload, just pass the real image URI
      navigateToNextScreen(imageUri);
    } catch (error) {
      console.error('Error in handleNext:', error);
      Alert.alert(
        "Error", 
        "There was a problem processing your request. Please try again.",
        [{ text: "OK" }]
      );
    }
  };
  
  const navigateToNextScreen = (imageUriOrUrl: string) => {
    const contributorData: ContributorData = {
        firstName,
        lastName,
      middleName,
        phoneNumber,
      nin,
      gender,
        language: selectedLanguage,
      depositAmount: '',
      duration: '',
      dob,
      photo: imageUriOrUrl
    };

    console.log('[AddContributor] Navigating to SavingsPlanSetup with:', contributorData);

    // Convert all fields to string for router params
    const params: { [key: string]: string } = {
      firstName: contributorData.firstName,
      lastName: contributorData.lastName,
      middleName: contributorData.middleName || '',
      phoneNumber: contributorData.phoneNumber,
      nin: contributorData.nin,
      gender: contributorData.gender,
      language: contributorData.language,
      depositAmount: contributorData.depositAmount,
      duration: contributorData.duration,
      dob: contributorData.dob instanceof Date ? contributorData.dob.toISOString() : String(contributorData.dob),
      photo: contributorData.photo
    };

    router.push({
      pathname: '/contributor/savings-plan',
      params
    });
  };

  // Handle language selection and track the change
  const handleLanguageSelect = (language: string) => {
    console.log(`Language changed from ${selectedLanguage} to ${language}`);
    setSelectedLanguage(language);
  };

  const handleImageError = () => {
    setImageError(true);
    setHasImage(false);
  };

  // Function to render the calendar
  const renderCalendar = () => {
    const currentMonth = moment(dob).month();
    const currentYear = moment(dob).year();
    const daysInMonth = moment(`${currentYear}-${currentMonth + 1}`, "YYYY-MM").daysInMonth();
    const firstDayOfMonth = moment(`${currentYear}-${currentMonth + 1}-01`).day();
    
    const days = [];
    // Add empty views for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={[styles.calendarDayEmpty, { padding: 8 }]} />);
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
            styles.calendarDay,
            isSelected ? styles.calendarDaySelected : null,
            isDisabled ? styles.calendarDayDisabled : null,
            { padding: 8 }
          ]}
          disabled={isDisabled}
          onPress={() => {
            const selectedDate = moment(`${currentYear}-${currentMonth + 1}-${day}`).toDate();
            setDob(selectedDate);
          }}
        >
          <Text style={isSelected ? styles.calendarDayTextSelected : styles.calendarDayTextUnselected}>{day}</Text>
        </TouchableOpacity>
      );
    }

    // Create rows of 7 days
    const rows = [];
    const totalDays = Math.max(days.length, 35);
    for (let i = 0; i < totalDays; i += 7) {
      const weekDays = days.slice(i, i + 7);
      while (weekDays.length < 7) {
        weekDays.push(<View key={`empty-${i + weekDays.length}`} style={[styles.calendarDayEmpty, { padding: 8 }]} />);
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

  // Function to select a year
  const selectYear = (year: number) => {
    const newDate = moment(dob).year(year).toDate();
    setDob(newDate);
    setShowYearSelector(false);
  };

  const genderOptions = ['Male', 'Female', 'Prefer not to say'];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginTop: 56,
    },
    backButton: {
      padding: 8,
      borderRadius: 999,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      flex: 1,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 30,
      fontWeight: 'bold',
      color: '#0052CC',
      marginTop: 16,
      marginBottom: 8,
    },
    subtitle: {
      color: '#374151',
      marginBottom: 24,
    },
    imageSection: {
      alignItems: 'center',
      marginBottom: 24,
    
    },
    imagePlaceholder: {
      backgroundColor: '#F3F4F6',
      width: 96,
      height: 96,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      padding: 10,
    },
    imagePlaceholderText: {
      color: '#6B7280',
      fontSize: 12,
      marginTop: 8,
    },
    imageContainer: {
      marginBottom: 8,
    },
    image: {
      borderRadius: 10,
      height: 150,
      width: 150,
    },
    changeImageText: {
      color: '#16A34A',
      textAlign: 'center',
      marginTop: 8,
      fontWeight: '500',
    },
    addImageButton: {
      backgroundColor: '#F3F4F6',
      width: '100%',
      paddingVertical: 64,
      borderRadius: 12,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addImageText: {
      color: '#0052CC',
      marginTop: 8,
    },
    addImageLabel: {
      color: '#16A34A',
      textAlign: 'center',
      fontWeight: '500',
    },
    formContainer: {
      marginTop: 8,
      marginBottom: 8,
    },
    formField: {
      marginVertical: 8,
    },
    fieldLabel: {
      color: '#374151',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: '#F3F4F6',
      padding: 16,
      borderRadius: 12,
    },
    phoneContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    phoneFlagContainer: {
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
    phoneFlagText: {
      fontSize: 16,
      color: '#BDBDBD',
    },
    phoneInput: {
      flex: 1,
      fontSize: 16,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: '#F4F4F5',
    },
    genderButton: {
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
    genderButtonText: {
      color: '#000000',
    },
    genderButtonTextPlaceholder: {
      color: '#6B7280',
    },
    languageContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    languageButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 999,
      marginRight: 8,
      marginBottom: 8,
    },
    languageButtonSelected: {
      backgroundColor: '#2563EB',
    },
    languageButtonUnselected: {
      backgroundColor: '#F3F4F6',
    },
    languageButtonText: {
      color: '#FFFFFF',
    },
    languageButtonTextUnselected: {
      color: '#4B5563',
    },
    dateButton: {
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
    dateButtonText: {
      color: '#000000',
    },
    dateButtonTextPlaceholder: {
      color: '#6B7280',
    },
    spacer: {
      height: 96,
    },
    bottomButton: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    nextButton: {
      backgroundColor: '#2563EB',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 18,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 16,
    },
    modalOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 4,
      borderRadius: 8,
    },
    modalOptionText: {
      textAlign: 'center',
      fontSize: 18,
    },
    modalCancelButton: {
      marginTop: 16,
      padding: 16,
      alignItems: 'center',
      backgroundColor: '#0072CE',
      borderRadius: 12,
    },
    modalCancelButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 18,
    },
    calendarModalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
      height: '55%',
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    calendarNavButton: {
      padding: 8,
      borderRadius: 999,
      backgroundColor: '#F3F4F6',
    },
    calendarMonthButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    calendarMonthText: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    calendarDaysHeader: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    calendarDayLabel: {
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
    calendarDayEmpty: {
      flex: 1,
      marginVertical: 4,
      padding: 8,
    },
    calendarDay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 4,
      borderRadius: 999,
      padding: 8,
    },
    calendarDaySelected: {
      backgroundColor: '#2563EB',
    },
    calendarDayDisabled: {
      opacity: 0.3,
    },
    calendarDayText: {
      textAlign: 'center',
    },
    calendarDayTextSelected: {
      textAlign: 'center',
      color: '#FFFFFF',
    },
    calendarDayTextUnselected: {
      textAlign: 'center',
      color: '#000000',
    },
    calendarDoneButton: {
      marginTop: 16,
      padding: 16,
      alignItems: 'center',
      backgroundColor: '#0072CE',
      borderRadius: 12,
    },
    calendarDoneButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 18,
    },
    yearSelectorModalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
      height: '50%',
    },
    yearSelectorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 16,
    },
    yearOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 4,
      borderRadius: 8,
    },
    yearOptionSelected: {
      backgroundColor: '#DBEAFE',
    },
    yearOptionText: {
      textAlign: 'center',
      fontSize: 18,
    },
    yearOptionTextSelected: {
      textAlign: 'center',
      fontSize: 18,
      color: '#2563EB',
      fontWeight: 'bold',
    },
    cameraModalContainer: {
      flex: 1,
      backgroundColor: '#000000',
    },
    cameraModalContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraSavingIndicator: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      padding: 32,
      borderRadius: 12,
    },
    cameraSavingText: {
      color: '#FFFFFF',
      marginTop: 16,
    },
    cameraInstruction: {
      color: '#FFFFFF',
      fontSize: 20,
      marginBottom: 32,
    },
    cameraControls: {
      marginTop: 'auto',
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cameraControlButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      padding: 16,
      borderRadius: 999,
    },
    cameraCaptureButton: {
      backgroundColor: '#FFFFFF',
      padding: 8,
      borderRadius: 999,
    },
    cameraCaptureCircle: {
      width: 64,
      height: 64,
      borderRadius: 999,
      borderWidth: 4,
      borderColor: '#FFFFFF',
    },
  });

  const fetchData = async (fromRefresh = false) => {
    // Check if we can fetch data
    if (!fromRefresh && !fetchGuard.canFetch()) {
      console.log('🚨 Data fetch blocked by guard');
      return;
    }

    // Check render guard
    if (!renderGuard.checkRender()) {
      console.log('🚨 Render blocked by guard');
      return;
    }

    setLoading(true);
    setError(null);
    let cacheData = null;
    
    try {
      const cached = await AsyncStorage.getItem('merchant_dashboard');
      if (cached) {
        cacheData = JSON.parse(cached);
        setMerchantData(cacheData);
      }
    } catch {}
    
    if (!networkAvailable && cacheData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    if (fromRefresh) {
      await invalidateCache('merchant_dashboard');
    }
    
    try {
      // Record the fetch attempt
      fetchGuard.recordFetch();
      
      const data = await getCachedData('merchant_dashboard', fetchMerchantDashboardAccount);
      setMerchantData(data);
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load merchant data');
        setMerchantData(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only fetch data once on mount
    if (!fetchGuard.isInitialized()) {
      fetchData();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={navigateBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New User</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollContent}>
          {/* Title */}
          <Text style={styles.title}>Add New User</Text>
          <Text style={styles.subtitle}>Help your customer start their Esusu journey</Text>
          
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            {imageLoading || uploadingImage ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="small" color="#0052CC" />
                <Text style={styles.imagePlaceholderText}>
                  {uploadingImage ? 'Uploading...' : 'Loading...'}
                </Text>
              </View>
            ) : hasImage && imageUri && !imageError ? (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles.image}
                  onError={handleImageError}
                  onLoadStart={() => console.log('[AddContributor] Image loading started:', imageUri)}
                  onLoadEnd={() => console.log('[AddContributor] Image loading completed:', imageUri)}
                />
                <TouchableOpacity onPress={handleAddImage}>
                  <Text style={styles.changeImageText}>+ Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity 
                  onPress={handleAddImage}
                  style={styles.addImageButton}
                >
                  <Ionicons name="camera" size={40} color="#0052CC" />
                  <Text style={styles.addImageText}>Tap to add photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddImage}>
                  <Text style={styles.addImageLabel}>+ Add User Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* First Name */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                style={styles.textInput}
              />
            </View>
            
            {/* Last Name */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                style={styles.textInput}
              />
            </View>

            {/* Middle Name */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Middle Name</Text>
              <TextInput
                value={middleName}
                onChangeText={setMiddleName}
                placeholder="Enter middle name"
                style={styles.textInput}
              />
            </View>
            
            {/* Phone Number */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.phoneContainer}>
                {/* NGN Flag + Code */}
                <View style={styles.phoneFlagContainer}>
                  <Image
                    source={{ uri: "https://flagcdn.com/w40/ng.png" }}
                    style={{
                      width: 24, 
                      height: 18,
                      borderRadius: 2,
                      marginRight: 6,
                    }}
                  />
                  <Text style={styles.phoneFlagText}>
                    NGN
                  </Text>
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  style={styles.phoneInput}
                  keyboardType="phone-pad"
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>
            
            {/* NIN */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>National Identity Number (NIN)</Text>
              <TextInput
                value={nin}
                onChangeText={setNin}
                placeholder="Enter NIN"
                style={styles.textInput}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>
            
            {/* Gender */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <TouchableOpacity 
                onPress={() => setShowGenderPicker(true)}
                style={styles.genderButton}
              >
                <Text style={gender ? styles.genderButtonText : styles.genderButtonTextPlaceholder}>
                  {gender || "Select your gender"}
                </Text>
                <Ionicons name="chevron-down" size={24} color="#0052CC" />
              </TouchableOpacity>
            </View>
            
            {/* Language Selection */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Language</Text>
              <View style={styles.languageContainer}>
                {['english', 'yoruba', 'hausa', 'igbo'].map((language) => (
                  <TouchableOpacity 
                    key={language}
                    onPress={() => handleLanguageSelect(language)}
                    style={[
                      styles.languageButton,
                      selectedLanguage === language ? styles.languageButtonSelected : styles.languageButtonUnselected
                    ]}
                  >
                    <Text style={selectedLanguage === language ? styles.languageButtonText : styles.languageButtonTextUnselected}>
                      {language.charAt(0).toUpperCase() + language.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Date of Birth */}
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(true)}
                style={styles.dateButton}
              >
                <Text style={dob ? styles.dateButtonText : styles.dateButtonTextPlaceholder}>
                  {moment(dob).format('MMMM D, YYYY')}
                </Text>
                <Ionicons name="calendar" size={24} color="#0052CC" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.spacer} />
        </ScrollView>
        
        {/* Bottom Button */}
        <View style={styles.bottomButton}>
          <TouchableOpacity 
            onPress={handleNext}
            style={styles.nextButton}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
            <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Gender Picker Modal */}
      {showGenderPicker && (
        <Modal
          transparent={true}
          visible={showGenderPicker}
          animationType="slide"
          onRequestClose={() => setShowGenderPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setGender('Male');
                  setShowGenderPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setGender('Female');
                  setShowGenderPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>Female</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowGenderPicker(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <Modal
          transparent={true}
          visible={showCalendar}
          animationType="slide"
          onRequestClose={() => setShowCalendar(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.calendarModalContent, { height: '55%' }]}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity 
                  onPress={() => changeMonth('prev')}
                  style={styles.calendarNavButton}
                >
                  <Ionicons name="chevron-back" size={20} color="#0072CE" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setShowYearSelector(true)}
                  style={styles.calendarMonthButton}
                >
                  <Text style={styles.calendarMonthText}>{moment(dob).format('MMMM YYYY')}</Text>
                  <Ionicons name="chevron-down" size={20} color="#0072CE" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => changeMonth('next')}
                  style={styles.calendarNavButton}
                >
                  <Ionicons name="chevron-forward" size={20} color="#0072CE" />
                </TouchableOpacity>
              </View>
              <View style={styles.calendarDaysHeader}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <Text key={day} style={styles.calendarDayLabel}>{day}</Text>
                ))}
              </View>
              {renderCalendar()}
              <TouchableOpacity 
                onPress={() => setShowCalendar(false)}
                style={styles.calendarDoneButton}
              >
                <Text style={styles.calendarDoneButtonText}>Done</Text>
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
          <View style={styles.modalOverlay}>
            <View style={[styles.yearSelectorModalContent, { height: '50%' }]}>
              <Text style={styles.yearSelectorTitle}>Select Year</Text>
              <FlatList
                data={availableYears}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.yearOption,
                      moment(dob).year() === item ? styles.yearOptionSelected : null
                    ]}
                    onPress={() => selectYear(item)}
                  >
                    <Text style={moment(dob).year() === item ? styles.yearOptionTextSelected : styles.yearOptionText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
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
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showCamera}
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraModalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.cameraModalContent}>
              {savingImage ? (
                <View style={styles.cameraSavingIndicator}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.cameraSavingText}>Saving photo...</Text>
                </View>
              ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={styles.cameraInstruction}>Position your face in the frame</Text>
                  
                  {/* Camera Controls */}
                  <View style={styles.cameraControls}>
                    <TouchableOpacity 
                      onPress={() => setShowCamera(false)}
                      style={styles.cameraControlButton}
                    >
                      <Ionicons name="close" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={takePicture}
                      style={styles.cameraCaptureButton}
                    >
                      <View style={styles.cameraCaptureCircle} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={handleSelectFromGallery}
                      style={styles.cameraControlButton}
                    >
                      <Ionicons name="images" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}; 