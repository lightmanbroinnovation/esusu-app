import React, { useState, useRef } from 'react';
import { View, Alert, Modal, SafeAreaView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import VerifyBusiness from './index';
import BusinessInfoForm from './BusinessInfoForm';
import GovernmentIDSelect from './GovernmentIDSelect';
import DocumentQualityCheck from './DocumentQualityCheck';
import BusinessLocationUpload from './BusinessLocationUpload';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType } from 'expo-camera';
import { submitBusinessVerification } from '../../services/api';
import { prepareVerificationDataForSubmission } from '../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VerificationControllerProps {
  onClose?: () => void;
}

// Define a proper interface for the verification data
interface VerificationData {
  businessInfo: any | null;
  governmentIDType: string | null;
  governmentIDImage: string | null;
  governmentIDImageUrl: string | null;
  locationImages: LocationImage[];
  locationImagesUrls: string[];
}

// Define a location image interface to store geotag data
interface LocationImage {
  uri: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
  cloudinaryUrl?: string;
}

enum VerificationStage {
  MAIN = 'main',
  BUSINESS_INFO = 'business_info',
  GOVERNMENT_ID_SELECT = 'government_id_select',
  DOCUMENT_QUALITY_CHECK = 'document_quality_check',
  BUSINESS_LOCATION = 'business_location',
  LOCATION_QUALITY_CHECK = 'location_quality_check',
  SUBMITTING = 'submitting'
}

const VerificationController = ({ onClose }: VerificationControllerProps) => {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState<VerificationStage>(VerificationStage.MAIN);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [cameraType, setCameraType] = useState<'id' | 'location'>('id');
  const [cameraReady, setCameraReady] = useState(false);
  const [currentCameraType, setCurrentCameraType] = useState(CameraType.back);
  const cameraRef = useRef<Camera>(null);
  
  const [verificationData, setVerificationData] = useState<VerificationData>({
    businessInfo: null,
    governmentIDType: null,
    governmentIDImage: null,
    governmentIDImageUrl: null,
    locationImages: [],
    locationImagesUrls: []
  });
  
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const handleBusinessInfoSave = (data: any) => {
    setVerificationData({
      ...verificationData,
      businessInfo: data
    });
    setCurrentStage(VerificationStage.MAIN);
  };
  
  const handleIDTypeSelect = (type: string) => {
    setVerificationData({
      ...verificationData,
      governmentIDType: type
    });
    
    // Request camera permissions for ID capture
    setCameraType('id');
    requestCameraPermission();
  };
  
  const handleIDConfirm = (cloudinaryUrl: string) => {
    // Store the Cloudinary URL
    setVerificationData({
      ...verificationData,
      governmentIDImageUrl: cloudinaryUrl
    });
    console.log('ID Cloudinary URL saved in controller:', cloudinaryUrl);
    
    setCurrentStage(VerificationStage.MAIN);
  };
  
  const handleLocationPhotoTaken = () => {
    // Request camera permissions for location capture
    setCameraType('location');
    requestCameraPermission();
  };
  
  const handleLocationConfirm = (cloudinaryUrl: string) => {
    // Get the current most recent location image
    const latestImage = verificationData.locationImages[verificationData.locationImages.length - 1];
    
    // Update the location image with the Cloudinary URL
    const updatedLocationImages = [...verificationData.locationImages];
    updatedLocationImages[updatedLocationImages.length - 1] = {
      ...latestImage,
      cloudinaryUrl
    };
    
    // Update the state with the cloudinary URL
    setVerificationData({
      ...verificationData,
      locationImages: updatedLocationImages,
      locationImagesUrls: [...verificationData.locationImagesUrls, cloudinaryUrl]
    });
    
    console.log('Location Cloudinary URL saved in controller:', cloudinaryUrl);
    
    setCurrentStage(VerificationStage.MAIN);
  };
  
  const handleMainStepSelect = (step: string) => {
    switch(step) {
      case 'businessInfo':
        setCurrentStage(VerificationStage.BUSINESS_INFO);
        break;
      case 'governmentID':
        setCurrentStage(VerificationStage.GOVERNMENT_ID_SELECT);
        break;
      case 'businessLocation':
        setCurrentStage(VerificationStage.BUSINESS_LOCATION);
        break;
    }
  };
  
  const handleCloseVerification = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleVerificationComplete = async () => {
    try {
      // Check if all required steps are completed
      const hasAllSteps = verificationData.businessInfo && 
          verificationData.governmentIDImage && 
          verificationData.governmentIDType &&
          verificationData.locationImages.length > 0;
          
      // Check if all Cloudinary URLs are available
      const hasAllCloudinaryUrls = verificationData.governmentIDImageUrl && 
          verificationData.locationImagesUrls.length > 0;
      
      if (!hasAllSteps) {
        Alert.alert(
          "Incomplete Verification",
          "Please complete all verification steps before submitting.",
          [{ text: "OK" }]
        );
        return;
      }
      
      if (!hasAllCloudinaryUrls) {
        Alert.alert(
          "Missing Image Uploads",
          "Some images failed to upload. Please retry the verification steps.",
          [{ text: "OK" }]
        );
        return;
      }
      
      setCurrentStage(VerificationStage.SUBMITTING);
      setSubmissionLoading(true);
      setSubmissionProgress(0);
      setSubmissionError(null);
      
      // Get the user ID from AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        throw new Error('User data not found. Please log in again.');
      }
      
      const userData = JSON.parse(userDataString);
      const userId = userData.id;
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      // Update progress - since images are already uploaded, we can skip to 70%
      setSubmissionProgress(70);
      
      // Prepare the submission data using already uploaded images
      const submissionData = {
        verificationStatus: 'pending',
        businessInfo: verificationData.businessInfo,
        documentType: verificationData.governmentIDType,
        documentImageUrl: verificationData.governmentIDImageUrl,
        locationImagesUrls: verificationData.locationImagesUrls,
        businessLocationImageUrl: verificationData.locationImagesUrls[0], // Use first location image as primary
        locationData: verificationData.locationImages[0], // Use first location data
        submittedAt: new Date().toISOString(),
        verify_business: true
      };
      
      console.log('Submitting verification with pre-uploaded images:', JSON.stringify({
        governmentID: submissionData.documentImageUrl,
        locationImages: submissionData.locationImagesUrls
      }));
      
      // Update progress
      setSubmissionProgress(90);
      
      // Submit the verification data to the API
      await submitBusinessVerification(userId, submissionData);
      
      // Update user data in AsyncStorage with verification information
      const updatedUserData = {
        ...userData,
        government_id: submissionData.documentImageUrl,
        business_img: submissionData.businessLocationImageUrl,
        verify_business: true,
        verificationStatus: 'pending'
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      
      console.log('USER DATA UPDATED WITH VERIFICATION:', JSON.stringify({
        government_id: submissionData.documentImageUrl,
        business_img: submissionData.businessLocationImageUrl,
        verify_business: true
      }));
      
      // Update progress
      setSubmissionProgress(100);
      
      // Navigate to success page after a short delay
      setTimeout(() => {
        setSubmissionLoading(false);
    router.push('/verification/success');
      }, 500);
      
    } catch (error) {
      console.error('Error submitting verification:', error);
      setSubmissionError(error instanceof Error ? error.message : 'An unknown error occurred');
      setSubmissionLoading(false);
      
      Alert.alert(
        "Verification Error",
        "There was a problem submitting your verification. Please try again.",
        [{ text: "OK", onPress: () => setCurrentStage(VerificationStage.MAIN) }]
      );
    }
  };
  
  // Request camera permission and open camera modal
  const requestCameraPermission = async () => {
    try {
      setIsLoading(true);
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take photos. Please enable it in your device settings.",
          [{ text: "OK" }]
        );
        setIsLoading(false);
        return;
      }
      
      // For location photos, request location permission
      if (cameraType === 'location') {
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus !== 'granted') {
          console.log('Location permission not granted');
          // Continue without location data
        }
      }
      
      // Set default camera type
      if (cameraType === 'id') {
        // Use back camera for ID documents
        setCurrentCameraType(CameraType.back);
      } else {
        // Also use back camera for location photos
        setCurrentCameraType(CameraType.back);
      }
      
      // Show camera modal
      setShowCamera(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert(
        "Camera Error",
        "There was a problem accessing your camera. Please try again.",
        [{ text: "OK" }]
      );
      setIsLoading(false);
    }
  };
  
  // Toggle between front and back camera
  const toggleCameraType = () => {
    setCurrentCameraType(
      currentCameraType === CameraType.back ? CameraType.front : CameraType.back
    );
  };
  
  // Take a picture using the camera
  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady) {
      console.log('Camera not ready');
      return;
    }
    
    try {
      setSavingImage(true);
      
      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        exif: true,
      });
      
      if (photo) {
        // Create a unique filename
        const timestamp = new Date().getTime();
        const filename = `${cameraType}_photo_${timestamp}.jpg`;
        const newUri = `${FileSystem.documentDirectory}${filename}`;
        
        // Copy the image to app's document directory for persistence
        await FileSystem.copyAsync({
          from: photo.uri,
          to: newUri
        });
        
        console.log(`${cameraType} photo saved to:`, newUri);
        
        if (cameraType === 'id') {
          // Update with document image
          setVerificationData({
            ...verificationData,
            governmentIDImage: newUri
          });
          setShowCamera(false);
          setCurrentStage(VerificationStage.DOCUMENT_QUALITY_CHECK);
        } else {
          // For business location, get geotag data if available
          let locationData: LocationImage = {
            uri: newUri,
            timestamp
          };
          
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High
            });
            
            if (location) {
              locationData.latitude = location.coords.latitude;
              locationData.longitude = location.coords.longitude;
              console.log('Location data captured:', location.coords);
            }
          } catch (locError) {
            console.log('Could not get location data:', locError);
          }
          
          // Update with location image
          setVerificationData({
            ...verificationData,
            locationImages: [...verificationData.locationImages, locationData]
          });
          setShowCamera(false);
          setCurrentStage(VerificationStage.LOCATION_QUALITY_CHECK);
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
      setSavingImage(false);
    }
  };
  
  // Retake photo function
  const handleRetakePhoto = () => {
    requestCameraPermission();
  };
  
  const renderCurrentStage = () => {
    switch(currentStage) {
      case VerificationStage.MAIN:
        return (
          <VerifyBusiness 
            onStepSelect={handleMainStepSelect}
            onClose={handleCloseVerification}
            onVerificationComplete={handleVerificationComplete}
            steps={{
              businessInfo: verificationData.businessInfo !== null,
              governmentID: verificationData.governmentIDImage !== null,
              businessLocation: verificationData.locationImages.length > 0
            }}
          />
        );
      
      case VerificationStage.BUSINESS_INFO:
        return (
          <BusinessInfoForm 
            onClose={() => setCurrentStage(VerificationStage.MAIN)}
            onSave={handleBusinessInfoSave}
            initialData={verificationData.businessInfo}
          />
        );
      
      case VerificationStage.GOVERNMENT_ID_SELECT:
        return (
          <GovernmentIDSelect 
            onClose={() => setCurrentStage(VerificationStage.MAIN)}
            onSelectIDType={handleIDTypeSelect}
          />
        );
      
      case VerificationStage.DOCUMENT_QUALITY_CHECK:
        return (
          <DocumentQualityCheck 
            documentType={verificationData.governmentIDType || ''}
            documentImage={verificationData.governmentIDImage || ''}
            isLoading={isLoading}
            onBack={() => setCurrentStage(VerificationStage.GOVERNMENT_ID_SELECT)}
            onConfirm={(cloudinaryUrl) => {
              handleIDConfirm(cloudinaryUrl);
            }}
            onRetake={() => {
              setCameraType('id');
              handleRetakePhoto();
            }}
          />
        );
      
      case VerificationStage.BUSINESS_LOCATION:
        return (
          <BusinessLocationUpload 
            onClose={() => setCurrentStage(VerificationStage.MAIN)}
            onTakePhoto={handleLocationPhotoTaken}
            existingPhotos={verificationData.locationImages.map(img => img.uri)}
            locationData={verificationData.locationImages}
          />
        );
      
      case VerificationStage.LOCATION_QUALITY_CHECK:
        return (
          <DocumentQualityCheck 
            documentType="business_location"
            documentImage={verificationData.locationImages.length > 0 ? 
              verificationData.locationImages[verificationData.locationImages.length - 1].uri : ''}
            isLoading={isLoading}
            onBack={() => setCurrentStage(VerificationStage.BUSINESS_LOCATION)}
            onConfirm={(cloudinaryUrl) => {
              handleLocationConfirm(cloudinaryUrl);
            }}
            onRetake={() => {
              setCameraType('location');
              handleRetakePhoto();
            }}
          />
        );
      
      case VerificationStage.SUBMITTING:
        return (
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 justify-center items-center p-6">
              <View className="bg-white rounded-2xl w-full p-8 items-center shadow-md">
                <Text className="text-[#0052CC] text-xl font-bold text-center mb-6">
                  Submitting Verification
                </Text>
                
                {submissionLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#0052CC" />
                    <Text className="text-gray-600 mt-4 text-center">
                      {submissionProgress < 10 ? (
                        <Text>Preparing data...</Text>
                      ) : submissionProgress < 90 ? (
                        <Text>Uploading images...</Text>
                      ) : (
                        <Text>Finalizing submission...</Text>
                      )}
                    </Text>
                    
                    {/* Progress bar */}
                    <View className="w-full h-2 bg-gray-200 rounded-full mt-4">
                      <View 
                        className="h-2 bg-[#0052CC] rounded-full" 
                        style={{ width: `${submissionProgress}%` }} 
                      />
                    </View>
                    <Text className="text-gray-500 mt-2 text-sm">
                      {submissionProgress}%
                    </Text>
                  </>
                ) : submissionError ? (
                  <>
                    <Ionicons name="alert-circle" size={48} color="#F44336" />
                    <Text className="text-red-500 mt-4 text-center">
                      {submissionError}
                    </Text>
                    <TouchableOpacity
                      className="bg-[#0052CC] py-3 px-6 rounded-lg mt-6"
                      onPress={() => setCurrentStage(VerificationStage.MAIN)}
                    >
                      <Text className="text-white font-medium">Try Again</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                    <Text className="text-green-500 mt-4 text-center">
                      Verification submitted successfully!
                    </Text>
                  </>
                )}
              </View>
            </View>
          </SafeAreaView>
        );
    }
  };

  return (
    <View className="flex-1">
      {renderCurrentStage()}
      
      {/* Real-time Camera Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showCamera}
        onRequestClose={() => setShowCamera(false)}
      >
        <View className="flex-1 bg-black">
          <Camera
            ref={cameraRef}
            type={currentCameraType}
            className="flex-1"
            onCameraReady={() => setCameraReady(true)}
            ratio={cameraType === 'id' ? '4:3' : '16:9'}
          >
            <SafeAreaView className="flex-1">
              <View className="flex-1 justify-between">
                {/* Camera Header */}
                <View className="p-4">
                  <TouchableOpacity 
                    onPress={() => setShowCamera(false)}
                    className="bg-black/30 p-2 rounded-full self-start"
                  >
                    <Ionicons name="close" size={30} color="#FFF" />
                  </TouchableOpacity>
                </View>
                
                {/* Camera Guidelines */}
                <View className="items-center">
                  <Text className="text-white text-xl text-center px-4 mb-4 bg-black/30 py-2 rounded-lg">
                    {cameraType === 'id' 
                      ? `Position your ${verificationData.governmentIDType?.replace('_', ' ')} in the frame` 
                      : 'Position your business location in the frame'}
                  </Text>
                
                  {/* Document frame guideline */}
                  {cameraType === 'id' && (
                    <View className="border-2 border-white border-dashed rounded-md mb-8 justify-center items-center"
                          style={{width: '80%', height: 220}}>
                      <Text className="text-white text-center bg-black/50 px-4 py-2 rounded-md text-sm">
                        Align document edges with this frame
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Camera Controls */}
                <View className="p-6 flex-row justify-between items-center mb-4">
                  <TouchableOpacity 
                    onPress={toggleCameraType}
                    className="bg-white/20 p-4 rounded-full"
                    disabled={savingImage}
                  >
                    <Ionicons name="camera-reverse" size={28} color="#FFF" />
                  </TouchableOpacity>
                  
                  {/* Capture Button */}
                  <TouchableOpacity 
                    onPress={takePicture}
                    disabled={!cameraReady || savingImage}
                    className="rounded-full p-2"
                    style={{opacity: !cameraReady || savingImage ? 0.7 : 1}}
                  >
                    {savingImage ? (
                      <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                        <ActivityIndicator color="#FFF" size="large" />
                      </View>
                    ) : (
                      <View className="w-20 h-20 rounded-full border-4 border-white bg-white/10 items-center justify-center">
                        <View className="w-16 h-16 rounded-full bg-white" />
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {/* Placeholder for symmetry */}
                  <View className="w-12 h-12" />
                </View>
              </View>
            </SafeAreaView>
          </Camera>
        </View>
      </Modal>
    </View>
  );
};

export default VerificationController; 