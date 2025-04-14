import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as FaceDetector from 'expo-face-detector';
import { uploadContributorImage } from '../utils/documentUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define icon type for better type safety
type IconName = 'scan' | 'checkmark-circle' | 'alert-circle';

interface FaceDetectionStatus {
  message: string;
  icon: IconName;
  color: string;
}

export const PhotoQualityCheck = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [photoUri, setPhotoUri] = useState<string | null>(typeof params.photoUri === 'string' ? params.photoUri : null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
  const [checkingFace, setCheckingFace] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);

  useEffect(() => {
    // When receiving a photoUri parameter, check if the file exists
    if (params.photoUri && typeof params.photoUri === 'string') {
      verifyImageExists(params.photoUri);
    }
  }, [params.photoUri]);

  // Verify that the image file exists and is readable
  const verifyImageExists = async (uri: string) => {
    try {
      if (!uri) {
        setImageError(true);
        return;
      }
      
      // Check if the file exists (for file:// URIs)
      if (uri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          console.log('Image file does not exist:', uri);
          setImageError(true);
          return;
        }
      }
      
      setPhotoUri(uri);
      setImageError(false);
      
      // Run face detection on the image
      detectFaceInImage(uri);
    } catch (error) {
      console.error('Error verifying image:', error);
      setImageError(true);
    }
  };

  // Detect if the image contains a face
  const detectFaceInImage = async (uri: string) => {
    try {
      setCheckingFace(true);
      setFaceDetected(null);
      
      // Process the image with the face detector
      const options = { mode: FaceDetector.FaceDetectorMode.fast };
      const result = await FaceDetector.detectFacesAsync(uri, options);
      
      // Check if any faces were detected
      const hasFace = result.faces.length > 0;
      setFaceDetected(hasFace);
      
      if (!hasFace) {
        console.log('No face detected in the image');
      } else {
        console.log(`Detected ${result.faces.length} face(s) in the image`);
      }
    } catch (error) {
      console.error('Error detecting face:', error);
      setFaceDetected(false);
    } finally {
      setCheckingFace(false);
    }
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (uri: string) => {
    try {
      setUploading(true);
      console.log('Starting Cloudinary upload...');
      
      // Try to get user ID from AsyncStorage
      let userId = null;
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userId = userData.id;
        }
      } catch (error) {
        console.log('Could not get user data from AsyncStorage:', error);
      }
      
      // Use a temporary ID if no user ID is found
      if (!userId) {
        userId = `temp_user_${Date.now()}`;
      }
      
      // Generate a temporary contributor ID for the upload
      const tempContributorId = `temp_contributor_${Date.now()}`;
      
      // Upload the image to Cloudinary
      const url = await uploadContributorImage(uri, tempContributorId, userId);
      console.log('Cloudinary upload successful:', url);
      setCloudinaryUrl(url);
      return url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      // Continue without the Cloudinary URL if it fails
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleDone = async () => {
    if (!photoUri || imageError) {
      Alert.alert(
        "No Valid Photo",
        "Please take a photo before proceeding.",
        [{ text: "OK" }]
      );
      return;
    }

    if (faceDetected === false) {
      Alert.alert(
        "No Face Detected",
        "The photo must clearly show your face. Please take another photo.",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      // If we don't have a Cloudinary URL yet, upload the image
      let imageUrl = cloudinaryUrl;
      if (!imageUrl && photoUri) {
        imageUrl = await uploadImageToCloudinary(photoUri);
      }
      
      // Return to the form with both the photo URI and Cloudinary URL
      router.push({
        pathname: '/contributor/add',
        params: { 
          photoUri,
          imageUrl,
          isCloudinaryUrl: imageUrl ? "true" : "false"
        }
      });
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(
        "Processing Error",
        "There was a problem processing the image. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewPhoto = async () => {
    try {
      setLoading(true);
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take photos. Please enable it in your device settings.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }
      
      setShowCamera(true);
      setLoading(false);
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert(
        "Camera Error",
        "There was a problem accessing your camera. Please try again.",
        [{ text: "OK" }]
      );
      setLoading(false);
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
        cameraType: ImagePicker.CameraType.front, // Use front camera for face photos
      });
      
      if (!result.canceled) {
        // Reset Cloudinary URL since we have a new image
        setCloudinaryUrl(null);
        
        // Create a unique filename
        const timestamp = new Date().getTime();
        const newUri = `${FileSystem.documentDirectory}contributor_photo_${timestamp}.jpg`;
        
        // Copy the image to app's document directory for persistence
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: newUri
        });
        
        console.log('Image saved to:', newUri);
        setPhotoUri(newUri);
        setImageError(false);
        setFaceDetected(null); // Reset face detection
        setShowCamera(false);
        
        // Run face detection on the new image
        detectFaceInImage(newUri);
        
        // Try to upload the image to Cloudinary in the background
        uploadImageToCloudinary(newUri).then(url => {
          console.log('Background upload complete, URL:', url);
        }).catch(error => {
          console.error('Background upload failed:', error);
        });
      } else {
        // User canceled taking photo
        setShowCamera(false);
      }
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

  const handleImageError = () => {
    setImageError(true);
    setFaceDetected(null);
  };

  // Get face detection status message and icon
  const getFaceDetectionStatus = (): FaceDetectionStatus => {
    if (faceDetected === null || checkingFace) {
      return {
        message: "Analyzing image...",
        icon: "scan",
        color: "#0052CC"
      };
    } else if (faceDetected) {
      return {
        message: "Face detected ✓",
        icon: "checkmark-circle",
        color: "#4CAF50"
      };
    } else {
      return {
        message: "No face detected! Please take another photo.",
        icon: "alert-circle",
        color: "#F44336"
      };
    }
  };

  const faceStatus = getFaceDetectionStatus();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        {/* Header with back button */}
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-gray-100 p-2 rounded-full self-start mb-6"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Title */}
        <Text className="text-3xl font-bold text-center text-[#0052CC] mb-2">Check Quality</Text>
        <Text className="text-gray-600 text-center mb-8">
          Make sure your face is not blurred or out of frame before continuing
        </Text>
        
        {/* Photo Display */}
        <View className="items-center mb-4">
          {loading ? (
            <View className="bg-gray-100 w-[280px] h-[280px] rounded-3xl items-center justify-center">
              <ActivityIndicator size="large" color="#0052CC" />
            </View>
          ) : imageError || !photoUri ? (
            <View className="bg-gray-100 w-[280px] h-[280px] rounded-3xl items-center justify-center">
              <Text className="text-gray-500 text-center px-4">
                {imageError ? "Image could not be loaded. Please take a new photo." : "No photo taken yet."}
              </Text>
            </View>
          ) : (
            <Image 
              source={{ uri: photoUri }}
              style={{ 
                width: 280, 
                height: 280, 
                borderRadius: 20,
              }}
              resizeMode="cover"
              onError={handleImageError}
            />
          )}
        </View>
        
        {/* Face Detection Status */}
        {photoUri && !imageError && (
          <View className="items-center mb-6 flex-row justify-center">
            {checkingFace ? (
              <ActivityIndicator size="small" color="#0052CC" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name={faceStatus.icon} size={20} color={faceStatus.color} style={{ marginRight: 8 }} />
            )}
            <Text style={{ color: faceStatus.color, fontWeight: '500' }}>
              {faceStatus.message}
            </Text>
          </View>
        )}
        
        <View className="flex-1" />
        
        {/* Action Buttons */}
        <View className="space-y-4">
          <TouchableOpacity 
            onPress={handleDone}
            className="bg-blue-600 p-4 rounded-xl items-center w-full"
            disabled={loading || imageError || !photoUri || faceDetected === false || checkingFace}
            style={{ opacity: (loading || imageError || !photoUri || faceDetected === false || checkingFace) ? 0.7 : 1 }}
          >
            <Text className="text-white font-semibold text-lg">Done</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleNewPhoto}
            className="p-4 items-center w-full"
            disabled={loading}
          >
            <Text className="text-blue-600 font-semibold text-lg">
              {loading ? "Opening Camera..." : "Take a New Photo"}
            </Text>
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

export default PhotoQualityCheck; 