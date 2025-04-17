import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Modal, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VerificationStep from './VerificationStep';
import GovernmentIDSelect from './GovernmentIDSelect';
import DocumentQualityCheck from './DocumentQualityCheck';
import BusinessLocationUpload from './BusinessLocationUpload';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { uploadVerificationDocument, uploadBusinessLocationPhoto } from '../../services/cloudinary';
import { submitBusinessVerification } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define camera types as string literals to avoid TypeScript errors
const CAMERA_TYPE = {
  back: 'back',
  front: 'front'
};

interface VerifyBusinessProps {
  onStepSelect: (step: string) => void;
  onClose: () => void;
  onVerificationComplete?: () => void;
}

interface StepState {
  completed: boolean;
  selected: boolean;
}

interface StepsState {
  businessInfo: StepState;
  governmentID: StepState;
  businessLocation: StepState;
  [key: string]: StepState;
}

const VerifyBusiness = ({ onStepSelect, onClose, onVerificationComplete }: VerifyBusinessProps) => {
  const router = useRouter();
  const [steps, setSteps] = useState<StepsState>({
    businessInfo: { completed: true, selected: false },
    governmentID: { completed: false, selected: false },
    businessLocation: { completed: false, selected: false }
  });

  const [showIDSelect, setShowIDSelect] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationCamera, setShowLocationCamera] = useState(false);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [showLocationQualityCheck, setShowLocationQualityCheck] = useState(false);
  const [selectedIDType, setSelectedIDType] = useState('');
  const [capturedImage, setCapturedImage] = useState('');
  const [locationImage, setLocationImage] = useState('');
  const [cameraType, setCameraType] = useState('id'); // 'id' or 'location'
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState<{latitude?: number, longitude?: number, address?: string}>({});
  const [isUploading, setIsUploading] = useState(false);
  // New state for Cloudinary URLs
  const [idCloudinaryUrl, setIdCloudinaryUrl] = useState('');
  const [locationCloudinaryUrl, setLocationCloudinaryUrl] = useState('');

  const handleStepSelect = (step: string) => {
    const updatedSteps = { ...steps };
    
    // Reset all selected states
    Object.keys(updatedSteps).forEach(key => {
      updatedSteps[key].selected = false;
    });
    
    // Set selected step
    updatedSteps[step].selected = true;
    
    setSteps(updatedSteps);
    
    // Show specific screens based on the selected step
    if (step === 'governmentID') {
      setShowIDSelect(true);
    } else if (step === 'businessLocation') {
      // Open camera directly for business location
      setCameraType('location');
      launchCamera('location');
    } else {
      // Call the parent's onStepSelect for other steps
      onStepSelect(step);
    }
  };

  const handleIDTypeSelect = (type: string) => {
    setSelectedIDType(type);
    setShowIDSelect(false);
    
    // Launch camera for ID
    setCameraType('id');
    launchCamera('id');
  };

  const launchCamera = async (type: 'id' | 'location') => {
    try {
      setIsLoading(true);
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take pictures. Please enable it in your device settings.",
          [{ text: "OK" }]
        );
        setIsLoading(false);
        return;
      }
      
      // For location photos, request location permission
      if (type === 'location') {
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus !== 'granted') {
          console.log('Location permission not granted');
          // Continue without location data
        }
      }
      
      // Set camera options based on the document type
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        exif: true,
      };
      
      // Configure aspect ratio based on document type
      if (type === 'id') {
        options.aspect = [4, 3]; // Document aspect ratio
      } else {
        options.aspect = [16, 9]; // Location photo aspect ratio
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync(options);
      
      if (!result.canceled) {
        // Create a unique filename
        const timestamp = new Date().getTime();
        const filename = `${type}_photo_${timestamp}.jpg`;
        const newUri = `${FileSystem.documentDirectory}${filename}`;
        
        // Copy the image to app's document directory for persistence
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: newUri
        });
        
        console.log(`${type} photo saved to:`, newUri);
        
        if (type === 'id') {
          setCapturedImage(newUri);
          setShowQualityCheck(true);
        } else {
          // For business location, get geotag data if available
          if (type === 'location') {
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
              });
              
              if (location) {
                console.log('Location data captured:', location.coords);
                setLocationData({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                });
              }
            } catch (locError) {
              console.log('Could not get location data:', locError);
            }
          }
          
          setLocationImage(newUri);
    setShowLocationQualityCheck(true);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(
        "Camera Error",
        "There was a problem capturing the photo. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleIDImageConfirm = (cloudinaryUrl: string) => {
    setShowQualityCheck(false);
    
    // Store the Cloudinary URL
    setIdCloudinaryUrl(cloudinaryUrl);
    console.log('ID Cloudinary URL saved:', cloudinaryUrl);
    
    // Mark government ID as completed
    const updatedSteps = { ...steps };
    updatedSteps.governmentID.completed = true;
    setSteps(updatedSteps);
  };

  const handleLocationImageConfirm = (cloudinaryUrl: string) => {
    setShowLocationQualityCheck(false);
    
    // Store the Cloudinary URL
    setLocationCloudinaryUrl(cloudinaryUrl);
    console.log('Location Cloudinary URL saved:', cloudinaryUrl);
    
    // Mark business location as completed
    const updatedSteps = { ...steps };
    updatedSteps.businessLocation.completed = true;
    setSteps(updatedSteps);
  };

  const handleVerify = async () => {
    // Check if all steps are completed
    const allCompleted = Object.values(steps).every(step => step.completed);
    
    if (allCompleted) {
      if (!idCloudinaryUrl || !locationCloudinaryUrl) {
        Alert.alert("Error", "Missing uploaded images. Please complete all steps properly.");
        return;
      }

      try {
        setIsUploading(true);
        
        // Get user ID and user data from AsyncStorage
        const userId = await AsyncStorage.getItem('userId');
        const userDataString = await AsyncStorage.getItem('userData');
        
        console.log('Retrieved userId from AsyncStorage:', userId);
        console.log('Retrieved userData from AsyncStorage:', userDataString);
        
        if (!userId) {
          Alert.alert("Error", "User ID not found. Please log in again.");
          setIsUploading(false);
          return;
        }

        let userData = userDataString ? JSON.parse(userDataString) : {};
        console.log('Parsed userData:', JSON.stringify(userData));
        
        // Images are already uploaded to Cloudinary, so we just need to update the database
        console.log("Updating user verification status in the database...");
        console.log("Using pre-uploaded images:", JSON.stringify({
          governmentID: idCloudinaryUrl,
          businessLocation: locationCloudinaryUrl
        }));
        
        const verificationData = {
          verificationStatus: 'pending',
          documentType: selectedIDType || 'national_id',
          documentImageUrl: idCloudinaryUrl,
          businessLocationImageUrl: locationCloudinaryUrl,
          locationData: locationData,
          submittedAt: new Date().toISOString(),
          verify_business: true
        };
        
        await submitBusinessVerification(userId, verificationData);
        
        // Update local user data with verification info
        userData = {
          ...userData,
          government_id: idCloudinaryUrl,
          business_img: locationCloudinaryUrl,
          verify_business: true,
          verificationStatus: 'pending'
        };
        
        // Save updated user data back to AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        console.log('USER DATA UPDATED:', JSON.stringify({
          government_id: idCloudinaryUrl,
          business_img: locationCloudinaryUrl,
          verify_business: true
        }));
        
        console.log('Verification data successfully submitted to database');
        
      // Navigate to success page
      if (onVerificationComplete) {
        onVerificationComplete();
      } else {
        router.push('/verification/success');
        }
      } catch (error) {
        console.error('Error during verification submission:', error);
        
        // Log more error details if available
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response: { data: any, status: number } };
          console.error('Error response data:', JSON.stringify(axiosError.response.data));
          console.error('Error response status:', axiosError.response.status);
        }
        
        Alert.alert(
          "Verification Failed",
          "We couldn't complete your verification at this time. Please check your connection and try again.",
          [{ text: "OK" }]
        );
      } finally {
        setIsUploading(false);
      }
    } else {
      // Show message about incomplete steps
      Alert.alert("Incomplete Verification", "Please complete all required verification steps before submitting.");
    }
  };

  return (
    <SafeAreaView className=" bg-white">
      <ScrollView className=" px-4">
   <View className=' mt-4 flex-row justify-end'>
          <TouchableOpacity 
            className=" bg-gray-100 p-2 rounded-full"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
   </View>
     
        <View className=' mt-2'>
          <Text className="text-[#0052CC] text-3xl font-bold text-center mt-4">
            Verify Business
          </Text>
          <Text className="text-gray-600 text-base text-center mt-2 px-8">
            Complete your KYB verification to start managing contributions securely.
          </Text>
        </View>

        <View className="mt-4 space-y-4">
          <VerificationStep 
            title="Business Information"
            description="Provide details about your business to ensure a smooth verification process."
            completed={steps.businessInfo.completed}
            selected={steps.businessInfo.selected}
            onPress={() => handleStepSelect('businessInfo')}
          />
          
          <VerificationStep 
            title="Government ID"
            description="Provide a Driver's License, National Identity Card, or Passport."
            completed={steps.governmentID.completed}
            selected={steps.governmentID.selected}
            onPress={() => handleStepSelect('governmentID')}
          />
          
          <VerificationStep 
            title="Business Location"
            description="Upload clear photos of your shop to verify your business location."
            completed={steps.businessLocation.completed}
            selected={steps.businessLocation.selected}
            onPress={() => handleStepSelect('businessLocation')}
          />
        </View>

        <TouchableOpacity 
          className={`py-4 rounded-xl mt-8 mb-6 ${
            Object.values(steps).every(step => step.completed) 
              ? 'bg-[#007BFF]' 
              : 'bg-gray-300'
          }`}
          onPress={handleVerify}
          disabled={isUploading}
        >
          {isUploading ? (
            <View className="flex-row justify-center items-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white text-center text-lg font-medium ml-2">
                Uploading...
              </Text>
            </View>
          ) : (
          <Text className="text-white text-center text-lg font-medium">
            Verify
          </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Government ID Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showIDSelect}
        onRequestClose={() => setShowIDSelect(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            
            <Text className="text-2xl font-bold text-center mb-8">
              Which photo ID would you like to use
            </Text>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleIDTypeSelect('drivers_license')}
            >
              <Text className="text-xl font-bold">Driver's License</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleIDTypeSelect('national_id')}
            >
              <Text className="text-xl font-bold">National Identity Card (NIN)</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 border-b border-gray-200"
              onPress={() => handleIDTypeSelect('passport')}
            >
              <Text className="text-xl font-bold">Passport</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ID Quality Check Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showQualityCheck}
        onRequestClose={() => setShowQualityCheck(false)}
      >
        <DocumentQualityCheck 
          documentType={selectedIDType || 'national_id'}
          documentImage={capturedImage}
          onBack={() => {
            setShowQualityCheck(false);
            setShowIDSelect(true);
          }}
          onConfirm={(cloudinaryUrl) => handleIDImageConfirm(cloudinaryUrl)}
          onRetake={() => {
            setShowQualityCheck(false);
            setCameraType('id');
            launchCamera('id');
          }}
        />
      </Modal>

      {/* Location Quality Check Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showLocationQualityCheck}
        onRequestClose={() => setShowLocationQualityCheck(false)}
      >
        <DocumentQualityCheck 
          documentType="business_location"
          documentImage={locationImage}
          onBack={() => {
            setShowLocationQualityCheck(false);
          }}
          onConfirm={(cloudinaryUrl) => handleLocationImageConfirm(cloudinaryUrl)}
          onRetake={() => {
            setShowLocationQualityCheck(false);
            setCameraType('location');
            launchCamera('location');
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default VerifyBusiness; 