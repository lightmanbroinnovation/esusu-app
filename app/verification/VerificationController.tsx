import React, { useState, useRef } from 'react';
import { View, Alert, Modal, SafeAreaView, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
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
import { CameraType } from 'expo-camera';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    color: '#0052CC',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0052CC',
    borderRadius: 4,
  },
  progressText: {
    color: '#6B7280',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  successText: {
    color: '#10B981',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0052CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraHeader: {
    padding: 16,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  cameraGuidelines: {
    alignItems: 'center',
  },
  guidelineText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    marginBottom: 32,
  },
  documentFrame: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    width: '80%',
    height: 220,
  },
  frameHelperText: {
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
  },
  cameraControls: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 999,
  },
  captureButtonContainer: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  capturePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderSpace: {
    width: 48,
    height: 48,
  },
});

const VerificationController = ({ onClose }: VerificationControllerProps) => {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState<VerificationStage>(VerificationStage.MAIN);
  const [isLoading, setIsLoading] = useState(false);
  const [showView, setShowView] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [currentViewType, setCurrentViewType] = useState<'id' | 'location'>('id');
  const [viewReady, setViewReady] = useState(false);
  const viewRef = useRef<View>(null);

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
    
    // Request view permissions for ID capture
    setCurrentViewType('id');
    requestViewPermission();
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
    // Request view permissions for location capture
    setCurrentViewType('location');
    requestViewPermission();
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
  
  // Request view permission and open view modal
  const requestViewPermission = async () => {
    try {
      setIsLoading(true);
      // Show view modal
      setShowView(true);
      setViewReady(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error accessing view:', error);
      Alert.alert(
        "View Error",
        "There was a problem accessing your view. Please try again.",
        [{ text: "OK" }]
      );
      setIsLoading(false);
    }
  };
  
  // Toggle between front and back view
  const toggleViewType = () => {
    setCurrentViewType(
      currentViewType === 'id' ? 'location' : 'id'
    );
  };
  
  // Take a picture using view
  const takePicture = async () => {
    if (!viewRef.current || !viewReady) {
      console.log('View not ready');
      return;
    }
    
    try {
      setSavingImage(true);
      
      // Simulate photo capture
      const timestamp = new Date().getTime();
      const filename = `${currentViewType}_photo_${timestamp}.jpg`;
      
      console.log(`${currentViewType} photo captured:`, filename);
      
      if (currentViewType === 'id') {
        // Update with document image
        setVerificationData({
          ...verificationData,
          governmentIDImage: filename
        });
        setShowView(false);
        setCurrentStage(VerificationStage.DOCUMENT_QUALITY_CHECK);
      } else {
        // For business location, get geotag data if available
        let locationData: LocationImage = {
          uri: filename,
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
        setShowView(false);
        setCurrentStage(VerificationStage.LOCATION_QUALITY_CHECK);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(
        "View Error",
        "There was a problem capturing the photo. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSavingImage(false);
    }
  };
  
  // Retake photo function
  const handleRetakePhoto = () => {
    requestViewPermission();
  };
  
  const renderCurrentStage = () => {
    switch(currentStage) {
      case VerificationStage.MAIN:
        return (
          <VerifyBusiness 
            onStepSelect={handleMainStepSelect}
            onClose={handleCloseVerification}
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
              setCurrentViewType('id');
              requestViewPermission();
            }}
          />
        );
      
      case VerificationStage.BUSINESS_LOCATION:
        return (
          <BusinessLocationUpload 
            onClose={() => setCurrentStage(VerificationStage.MAIN)}
            onTakePhoto={handleLocationPhotoTaken}
            existingPhotos={verificationData.locationImages.map((img: any) => img.uri)}
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
              setCurrentViewType('location');
              requestViewPermission();
            }}
          />
        );
      
      case VerificationStage.SUBMITTING:
        return (
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.centerContainer}>
              <View style={styles.card}>
                <Text style={styles.title}>
                  Submitting Verification
                </Text>
                
                {submissionLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#0052CC" />
                    <Text style={styles.loadingText}>
                      {submissionProgress < 10 ? (
                        <Text>Preparing data...</Text>
                      ) : submissionProgress < 90 ? (
                        <Text>Uploading images...</Text>
                      ) : (
                        <Text>Finalizing submission...</Text>
                      )}
                    </Text>
                    
                    {/* Progress bar */}
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[styles.progressBar, { width: `${submissionProgress}%` }]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {submissionProgress}%
                    </Text>
                  </>
                ) : submissionError ? (
                  <Text style={styles.errorText}>
                    {submissionError}
                  </Text>
                ) : (
                  <Text style={styles.successText}>
                    Verification submitted successfully!
                  </Text>
                )}
                
                {submissionError && (
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={handleVerificationComplete}
                  >
                    <Text style={styles.retryButtonText}>
                      Retry Submission
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentStage()}
      
      {/* Real-time View Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showView}
        onRequestClose={() => setShowView(false)}
      >
        <View style={styles.cameraContainer}>
          <View
            ref={viewRef}
            style={styles.container}
          >
            <SafeAreaView style={styles.container}>
              <View style={[styles.container, styles.cameraControls]}>
                {/* View Header */}
                <View style={styles.cameraHeader}>
                  <TouchableOpacity 
                    onPress={() => setShowView(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={30} color="#FFF" />
                  </TouchableOpacity>
                </View>
                
                {/* View Guidelines */}
                <View style={styles.cameraGuidelines}>
                  <Text style={styles.guidelineText}>
                    {currentViewType === 'id' 
                      ? `Position your ${verificationData.governmentIDType?.replace('_', ' ')} in frame` 
                      : 'Position your business location in frame'}
                  </Text>
                
                  {/* Document frame guideline */}
                  {currentViewType === 'id' && (
                    <View style={[styles.documentFrame, {width: '80%', height: 220}]}>
                      <Text style={styles.frameHelperText}>
                        Align document edges with this frame
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* View Controls */}
                <View style={styles.cameraControls}>
                  <TouchableOpacity 
                    onPress={toggleViewType}
                    style={styles.cameraButton}
                    disabled={savingImage}
                  >
                    <Ionicons name="camera-reverse" size={28} color="#FFF" />
                  </TouchableOpacity>
                  
                  {/* Capture Button */}
                  <TouchableOpacity 
                    onPress={takePicture}
                    disabled={!viewReady || savingImage}
                    style={styles.cameraButton}
                  >
                    {savingImage ? (
                      <View style={styles.captureButtonContainer}>
                        <ActivityIndicator color="#FFF" size="large" />
                      </View>
                    ) : (
                      <View style={styles.capturePlaceholder}>
                        <View style={styles.captureButtonInner} />
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  {/* Placeholder for symmetry */}
                  <View style={styles.placeholderSpace} />
                </View>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VerificationController;
