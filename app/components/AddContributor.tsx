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
    if (params.photoUri && typeof params.photoUri === 'string' && params.photoUri !== imageUri) {
      setImageUri(params.photoUri);
      setHasImage(true);
      setImageError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Create rows of 7 days
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 mt-14">
          <TouchableOpacity 
            onPress={navigateBack}
            className=" p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">Add New User</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView className="flex-1 px-4">
          {/* Title */}
          <Text className="text-3xl font-bold text-[#0052CC] mt-4 mb-2">Add New User</Text>
          <Text className="text-gray-700 mb-6">Help your customer start their Esusu journey</Text>
          
          {/* Profile Image Section */}
          <View className="items-center mb-6">
            {imageLoading || uploadingImage ? (
              <View className="bg-gray-100 w-24 h-24 rounded-2xl items-center justify-center mb-2">
                <ActivityIndicator size="small" color="#0052CC" />
                <Text className="text-gray-500 text-xs mt-2">
                  {uploadingImage ? 'Uploading...' : 'Loading...'}
                </Text>
              </View>
            ) : hasImage && imageUri && !imageError ? (
              <View className="mb-2">
                <Image 
                  source={{ uri: imageUri }} 
                  className="w-24 h-24 rounded-2xl"
                  style={{borderRadius: 10, height: 150, width: 150}}
                  onError={handleImageError}
                />
                <TouchableOpacity onPress={handleAddImage}>
                  <Text className="text-green-500 text-center mt-2 font-medium">+ Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity 
                  onPress={handleAddImage}
                  className="bg-gray-100 w-full p-16 rounded-xl mb-2 items-center justify-center"
                >
                  <Ionicons name="camera" size={40} color="#0052CC" />
                  <Text className="text-[#0052CC] mt-2">Tap to add photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddImage}>
                  <Text className="text-green-500 text-center font-medium">+ Add User Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Form Fields */}
          <View className="space-y-4 my-2">
            {/* First Name */}
            <View className='my-2'>
              <Text className="text-gray-700 mb-2">First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                className="bg-gray-100 p-4 rounded-xl"
              />
            </View>
            
            {/* Last Name */}
            <View className='my-2'>
              <Text className="text-gray-700 mb-2">Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                className="bg-gray-100 p-4 rounded-xl"
              />
            </View>

            {/* Middle Name */}
            <View className='my-2'>
              <Text className="text-gray-700 mb-2">Middle Name</Text>
              <TextInput
                value={middleName}
                onChangeText={setMiddleName}
                placeholder="Enter middle name"
                className="bg-gray-100 p-4 rounded-xl"
              />
            </View>
            
            {/* Phone Number */}
            <View className='my-2'>
              <Text className="text-gray-700 mb-2">Phone Number</Text>
              <View className="flex-row items-center">
                {/* NGN Flag + Code */}
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
                  <Text className="text-base text-[#BDBDBD]">
                    NGN
                  </Text>
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  className="flex-1 text-base border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5]"
                  keyboardType="phone-pad"
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>
            
            {/* NIN */}
            <View className='my-2'>
              <Text className="text-gray-700 mb-2">National Identity Number (NIN)</Text>
              <TextInput
                value={nin}
                onChangeText={setNin}
                placeholder="Enter NIN"
                className="bg-gray-100 p-4 rounded-xl"
                keyboardType="numeric"
                maxLength={11}
              />
            </View>
            
            {/* Gender */}
            <View className="my-2">
              <Text className="text-gray-700 mb-2">Gender</Text>
              <TouchableOpacity 
                onPress={() => setShowGenderPicker(true)}
                className="flex-row items-center justify-between w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
              >
                <Text className={gender ? "text-black" : "text-gray-500"}>{gender || "Select your gender"}</Text>
                <Ionicons name="chevron-down" size={24} color="#0052CC" />
              </TouchableOpacity>
            </View>
            
            {/* Language Selection */}
            <View className='my-2'>
              <Text className="text-gray-700 mb-2">Language</Text>
              <View className="flex-row flex-wrap gap-2">
                {['english', 'yoruba', 'hausa', 'igbo'].map((language) => (
                  <TouchableOpacity 
                    key={language}
                    onPress={() => handleLanguageSelect(language)}
                    className={`py-3 px-6 rounded-full ${
                      selectedLanguage === language ? 'bg-blue-600' : 'bg-gray-100'
                    }`}
                  >
                    <Text className={selectedLanguage === language ? 'text-white' : 'text-gray-600'}>
                      {language.charAt(0).toUpperCase() + language.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Date of Birth */}
            <View className="my-2">
              <Text className="text-gray-700 mb-2">Date of Birth</Text>
              <TouchableOpacity 
                onPress={() => setShowCalendar(true)}
                className="flex-row items-center justify-between w-full h-12 px-4 border border-[#E0E0E0] rounded-lg py-3 bg-[#F4F4F5]"
              >
                <Text className={dob ? "text-black" : "text-gray-500"}>
                  {moment(dob).format('MMMM D, YYYY')}
                </Text>
                <Ionicons name="calendar" size={24} color="#0052CC" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="h-24" />
        </ScrollView>
        
        {/* Bottom Button */}
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity 
            onPress={handleNext}
            className="bg-blue-600 p-4 rounded-xl items-center"
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
            <Text className="text-white font-semibold text-lg">Next</Text>
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
                  length: 48,
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

      {/* Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showCamera}
        onRequestClose={() => setShowCamera(false)}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            <View className="flex-1 justify-center items-center">
              {savingImage ? (
                <View className="bg-white/20 p-8 rounded-xl">
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text className="text-white mt-4">Saving photo...</Text>
                </View>
              ) : (
                <View className="w-full items-center">
                  <Text className="text-white text-xl mb-8">Position your face in the frame</Text>
                  
                  {/* Camera Controls */}
                  <View className="mt-auto w-full px-4 py-10 flex-row items-center justify-between">
                    <TouchableOpacity 
                      onPress={() => setShowCamera(false)}
                      className="bg-white/20 p-4 rounded-full"
                    >
                      <Ionicons name="close" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={takePicture}
                      className="bg-white p-2 rounded-full"
                    >
                      <View className="w-16 h-16 rounded-full border-4 border-white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={handleSelectFromGallery}
                      className="bg-white/20 p-4 rounded-full"
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