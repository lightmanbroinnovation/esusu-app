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
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { uploadContributorImage } from '../utils/documentUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddContributor = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ninNumber, setNinNumber] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
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
  
  // Check if returning from photo quality check with an image
  useEffect(() => {
    const photoUri = params.photoUri as string;
    const imageUrl = params.imageUrl as string;
    const isCloudinaryUrl = params.isCloudinaryUrl === "true";
    
    // Only process the URI if it's different from what we've already processed
    if (photoUri && photoUri !== processedPhotoUri.current) {
      processedPhotoUri.current = photoUri;
      verifyImageExists(photoUri);
      
      // If we have a Cloudinary URL, use it directly
      if (imageUrl && isCloudinaryUrl) {
        console.log('Using existing Cloudinary URL:', imageUrl);
        setImageUrl(imageUrl);
      }
    }
  }, [params]);

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
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status === 'granted') {
        setShowCamera(true);
      } else {
        // Show proper permission alert
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take pictures. Please enable it in your device settings.",
          [
            { 
              text: "Cancel", 
              style: "cancel" 
            },
            { 
              text: "Open Settings", 
              onPress: () => {
                // This would ideally open settings, but for now just log
                console.log("User should be directed to settings");
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert(
        "Camera Error",
        "There was a problem accessing your camera. Would you like to select from your gallery instead?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
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
        // Save the image to app storage
        const newUri = await saveImageToAppStorage(galleryResult.assets[0].uri);
        setImageUri(newUri);
        setHasImage(true);
        setImageError(false);
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
      // Open camera with improved options
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        exif: true,
        cameraType: ImagePicker.CameraType.front, // Default to front camera for user photos
      });
      
      if (!result.canceled) {
        // Save the image to app storage
        const newUri = await saveImageToAppStorage(result.assets[0].uri);
        
        // Navigate to photo quality check with permanent image URI
        router.push({
          pathname: '/contributor/photo-quality',
          params: { photoUri: newUri }
        });
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

  // Helper function to save image to app storage
  const saveImageToAppStorage = async (uri: string) => {
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
      if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
        Alert.alert("Missing Information", "Please fill in all required fields.");
        return;
      }

      if (!hasImage || !imageUri) {
        Alert.alert("Missing Profile Image", "Please add a profile image for the contributor.");
        return;
      }
      
      // Upload image to Cloudinary if we have a local image but no Cloudinary URL yet
      if (imageUri && !imageUrl) {
        setUploadingImage(true);
        
        try {
          // Try multiple approaches to get the user ID
          let userId = null;
          
          // First try getting user data object
          try {
            const userDataString = await AsyncStorage.getItem('userData');
            if (userDataString) {
              const userData = JSON.parse(userDataString);
              if (userData && userData.id) {
                userId = userData.id;
                console.log('User ID found in userData:', userId);
              }
            }
          } catch (userDataError) {
            console.log('Error parsing userData:', userDataError);
          }
          
          // If that fails, try getting userId directly
          if (!userId) {
            try {
              const directUserId = await AsyncStorage.getItem('userId');
              if (directUserId) {
                userId = directUserId;
                console.log('User ID found directly:', userId);
              }
            } catch (directIdError) {
              console.log('Error getting direct userId:', directIdError);
            }
          }
          
          // If still no userId, use a temporary one and warn
          if (!userId) {
            userId = `temp_user_${Date.now()}`;
            console.warn('No user ID found, using temporary ID:', userId);
          }
          
          // We don't have a contributor ID yet, so we'll use a temporary ID
          const tempContributorId = `temp_${Date.now()}`;
          
          // First check if file exists
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (!fileInfo.exists) {
            throw new Error('Image file not found. The file may have been deleted or moved.');
          }
          
          console.log(`Attempting to upload image: ${imageUri}`);
          console.log(`File size: ${(fileInfo.size / 1024).toFixed(2)}KB`);
          
          // Upload image to Cloudinary
          const cloudinaryUrl = await uploadContributorImage(imageUri, tempContributorId, userId);
          
          // Store the Cloudinary URL
          setImageUrl(cloudinaryUrl);
          console.log('Image successfully uploaded to Cloudinary:', cloudinaryUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert(
            "Upload Error",
            "There was a problem uploading the contributor image. Would you like to retry or continue without uploading?",
            [
              { 
                text: "Retry", 
                onPress: async () => {
                  setUploadingImage(false);
                  // Wait a second before retrying
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  // Call handleNext again to retry
                  handleNext();
                }
              },
              { 
                text: "Cancel", 
                style: "cancel",
                onPress: () => setUploadingImage(false)
              },
              { 
                text: "Continue", 
                onPress: () => {
                  // Continue with local image
                  navigateToNextScreen(imageUri);
                }
              }
            ]
          );
          return;
        }
        
        setUploadingImage(false);
      }
      
      // Navigate to next screen
      navigateToNextScreen(imageUrl || imageUri);
    } catch (error) {
      setUploadingImage(false);
      console.error('Error in handleNext:', error);
      Alert.alert(
        "Error", 
        "There was a problem processing your request. Please try again.",
        [
          {
            text: "OK"
          }
        ]
      );
    }
  };
  
  const navigateToNextScreen = (imageUriOrUrl: string) => {
    // Log all image data before navigation for debugging
    console.log('CONTRIBUTOR IMAGE DATA:', JSON.stringify({
      photoUri: imageUri,
      cloudinaryUrl: imageUrl,
      passedImageUri: imageUriOrUrl,
      isCloudinary: !!imageUrl
    }));
    
    // Navigate to next screen with form data
    router.push({
      pathname: "/contributor/agent-verification" as any,
      params: {
        firstName,
        lastName,
        phoneNumber,
        ninNumber,
        language: selectedLanguage,
        // Pass both local URI and Cloudinary URL
        photoUri: imageUri || '',
        imageUrl: imageUrl || imageUriOrUrl,
        isCloudinaryUrl: imageUrl ? "true" : "false"
      }
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 mt-16">
          <TouchableOpacity 
            onPress={navigateBack}
            className="bg-gray-200 p-2 rounded-full"
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
                value={ninNumber}
                onChangeText={setNinNumber}
                placeholder="Enter NIN"
                className="bg-gray-100 p-4 rounded-xl"
                keyboardType="numeric"
              />
            </View>
            
            {/* Language Selection */}
            <View className='my-2'>
              <Text className="text-gray-700 mb-2">Language</Text>
              <View className="flex-row justify-between my-2">
                {['English', 'Yoruba', 'Hausa', 'Igbo'].map((language) => (
                  <TouchableOpacity 
                    key={language}
                    className={`py-3 px-5 rounded-full ${selectedLanguage === language ? 'bg-[#E5F1FF]' : 'bg-gray-100'}`}
                    onPress={() => handleLanguageSelect(language)}
                  >
                    <Text 
                      className={selectedLanguage === language ? 'text-blue-600' : 'text-gray-500'}
                    >
                      {language}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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

      {/* Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showCamera}
        onRequestClose={() => setShowCamera(false)}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            {/* Camera Preview (simulated in this example) */}
            <View className="flex-1 justify-center items-center">
              {savingImage ? (
                <View className="bg-white/20 p-8 rounded-xl">
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text className="text-white mt-4">Saving photo...</Text>
                </View>
              ) : (
                <View className="w-full items-center">
                  <Text className="text-white text-xl mb-8">Position your face in the frame</Text>
                  
                  {/* Camera UI */}
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
                      className="bg-white/20 p-4 rounded-full"
                      onPress={() => {
                        // This would switch between front/back camera in a real implementation
                        Alert.alert("Camera Switch", "Switching camera");
                      }}
                    >
                      <Ionicons name="camera-reverse" size={30} color="#FFFFFF" />
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

export default AddContributor; 