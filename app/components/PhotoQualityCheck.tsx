import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FaceDetector from 'expo-face-detector';

export const PhotoQualityCheck = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Simplified state management
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [fileSizeError, setFileSizeError] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [checkingFace, setCheckingFace] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get screen dimensions for responsive sizing
  const { width } = Dimensions.get('window');
  const imageSize = useMemo(() => Math.min(width * 0.7, 280), [width]);

  // Simplified initialization - no heavy operations
  useEffect(() => {
    const initializeComponent = () => {
      try {
    if (params.photoUri && typeof params.photoUri === 'string') {
      console.log('PhotoQualityCheck: Received photoUri:', params.photoUri);

      // Check if it's already a Cloudinary URL
          // For face detection we treat any uri the same
          setPhotoUri(params.photoUri);
          setImageError(false);
          setFileSizeError(false);
          // Run face detection without blocking paint
          setTimeout(() => {
            runFaceDetection(params.photoUri as string).catch(err => console.error('Init face detection failed:', err));
          }, 200);
        }
      } catch (error) {
        console.error('PhotoQualityCheck: Initialization error:', error);
        setImageError(true);
        setFileSizeError(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Use requestAnimationFrame to ensure UI is ready
    requestAnimationFrame(initializeComponent);
  }, [params.photoUri]);

  // Face detection using expo-face-detector
  const runFaceDetection = useCallback(async (uri: string): Promise<boolean> => {
    try {
      setCheckingFace(true);
      setFaceDetected(false);
      const options: FaceDetector.DetectionOptions = {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
        runClassifications: FaceDetector.FaceDetectorClassifications.none,
      };
      const result = await FaceDetector.detectFacesAsync(uri, options);
      const hasFace = Array.isArray(result.faces) && result.faces.length > 0;
      setFaceDetected(hasFace);
      if (!hasFace) {
        Alert.alert('No face detected', 'Please ensure your face is clearly visible and try again.');
      }
      return hasFace;
    } catch (err) {
      console.error('Face detection error:', err);
      Alert.alert('Detection error', 'We could not analyze the photo. Please try another photo.');
      setFaceDetected(false);
      return false;
    } finally {
      setCheckingFace(false);
    }
  }, []);

  // File size validation utility
  const validateImageSize = useCallback(async (uri: string, asset?: any): Promise<boolean> => {
    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    try {
      if (Platform.OS === 'web' && asset?.fileSize) {
        // For web, use the fileSize from ImagePicker result
        if (asset.fileSize > maxSizeInBytes) {
          return false;
        }
      } else if (asset?.fileSize) {
        // For some native platforms, fileSize might be available in asset
        if (asset.fileSize > maxSizeInBytes) {
          return false;
        }
      } else {
        // For native platforms without fileSize in asset, try to get file size
        try {
          const response = await fetch(uri);
          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength) > maxSizeInBytes) {
            return false;
          }
        } catch (fetchError) {
          // If fetch fails, we can't determine file size, so assume it's okay
          console.warn('Could not fetch file size for validation:', fetchError);
        }
      }
      return true;
    } catch (error) {
      console.warn('Could not validate file size:', error);
      // If we can't check the size, assume it's okay to avoid blocking users
      return true;
    }
  }, []);

  const handleDone = async () => {
    if (!photoUri || imageError || fileSizeError) {
      Alert.alert(
        "No Valid Photo",
        "Please take a photo before proceeding.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      console.log('[PhotoQualityCheck] handleDone called, navigating to /contributor/add with photoUri:', photoUri);
      console.log('[PhotoQualityCheck] faceDetected:', faceDetected);
      console.log('[PhotoQualityCheck] Platform:', Platform.OS);

      // Navigate immediately
      if (Platform.OS === 'web') {
        console.log('[PhotoQualityCheck] Web navigation - pushing to /contributor/add');
        router.push({
          pathname: '/contributor/add',
          params: {
            photoUri: photoUri,
            isCloudinaryUrl: "false"
          }
        });
      } else {
        console.log('[PhotoQualityCheck] Native navigation - replacing to /contributor/add');
        router.replace({
          pathname: '/contributor/add',
          params: {
            photoUri: photoUri,
            isCloudinaryUrl: "false"
          }
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(
        "Processing Error",
        "There was a problem processing the image. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleNewPhoto = async () => {
    try {
      console.log('[PhotoQualityCheck] handleNewPhoto called, Platform:', Platform.OS);

      if (Platform.OS === 'web') {
        // Use file picker for web
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        if (!result.canceled && result.assets[0]) {
          console.log('[PhotoQualityCheck] Web image selected:', result.assets[0].uri);

          // Check file size before proceeding
          const isValidSize = await validateImageSize(result.assets[0].uri, result.assets[0]);
          if (!isValidSize) {
            setFileSizeError(true);
            setImageError(false);
            Alert.alert(
              "Image Too Large",
              "Please take an image with smaller size and move camera closer to the face.",
              [{ text: "OK" }]
            );
            return;
          }

          setPhotoUri(result.assets[0].uri);
          setImageError(false);
          setFileSizeError(false);
          // Run face detection
          runFaceDetection(result.assets[0].uri);
        }
        return;
      }

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take photos. Please enable it in your device settings.",
          [{ text: "OK" }]
        );
        return;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error opening camera or file picker:', error);
      Alert.alert(
        "Camera Error",
        "There was a problem accessing the camera or file picker. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Simplified camera function
  const takePicture = useCallback(async () => {
    setSavingImage(true);
    try {
      // Use optimized camera settings
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Reduced quality for better performance
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        exif: false, // Disable EXIF for better performance
        cameraType: ImagePicker.CameraType.front,
      });
      
      if (!result.canceled && result.assets[0]) {
        // Use the original URI directly
        const newUri = result.assets[0].uri;

        // Check file size before proceeding
        const isValidSize = await validateImageSize(newUri, result.assets[0]);
        if (!isValidSize) {
          setFileSizeError(true);
          setImageError(false);
          Alert.alert(
            "Image Too Large",
            "Please take an image with smaller size and move camera closer to the face.",
            [{ text: "OK" }]
          );
          setShowCamera(false);
          setSavingImage(false);
          return;
        }

        setPhotoUri(newUri);
        setImageError(false);
        setFileSizeError(false);
        setShowCamera(false);
        // Run face detection
        runFaceDetection(newUri);
      } else {
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert("Camera Error", "There was a problem capturing the photo. Please try again.");
      setShowCamera(false);
    } finally {
      setSavingImage(false);
    }
  }, [runFaceDetection]);

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle back navigation
  const handleBack = () => {
    console.log('PhotoQualityCheck: Back button pressed');
    try {
      router.back();
    } catch (error) {
      console.error('PhotoQualityCheck: Error navigating back:', error);
      try {
        router.replace('/contributor/add');
      } catch (fallbackError) {
        console.error('PhotoQualityCheck: Fallback navigation failed:', fallbackError);
        Alert.alert(
          "Navigation Error",
          "Please use your device back button to return to the previous screen.",
          [{ text: "OK" }]
        );
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6 mt-10">
        {/* Header with back button */}
        <TouchableOpacity
          onPress={handleBack}
          className="bg-gray-100 p-2 rounded-full self-start mb-6"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Title */}
        <Text className="text-3xl font-bold text-center text-[#0052CC] mb-2">Check Quality</Text>
        <Text className="text-gray-600 text-center mb-8">
          Make sure your face is not blurred or out of frame before continuing
        </Text>
        
        {/* Simplified Photo Display */}
        <View className="items-center mb-4">
          {isLoading ? (
            <View className="bg-gray-100 rounded-3xl items-center justify-center" style={{ width: imageSize, height: imageSize }}>
              <ActivityIndicator size="large" color="#0052CC" />
            </View>
          ) : imageError || fileSizeError || !photoUri ? (
            <View className="bg-gray-100 rounded-3xl items-center justify-center" style={{ width: imageSize, height: imageSize }}>
              <Text className="text-gray-500 text-center px-4">
                {imageError ? "Image could not be loaded. Please take a new photo." :
                 fileSizeError ? "Image file size is too large (max 5MB). Please take a smaller photo." :
                 "No photo taken yet."}
              </Text>
            </View>
          ) : (
            <View className="items-center">
              <Image
                source={{ uri: photoUri }}
                style={{
                  width: imageSize,
                  height: imageSize,
                  borderRadius: 20,
                }}
                resizeMode="cover"
                onError={handleImageError}
                onLoadStart={() => console.log('Image loading started')}
                onLoadEnd={() => console.log('Image loading completed')}
              />
              {/* Status indicator */}
              <View className="flex-row items-center mt-2 bg-gray-100 px-3 py-1 rounded-full">
                {checkingFace ? (
                  <ActivityIndicator size="small" color="#0052CC" />
                ) : faceDetected ? (
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                ) : (
                  <Ionicons name="warning" size={16} color="#F59E0B" />
                )}
                <Text className="text-xs ml-1 text-gray-600">
                  {checkingFace ? "Analyzing..." : faceDetected ? "Face detected" : "No face detected"}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="flex-1" />

        {/* Action Buttons */}
        <View className="space-y-4">
          <TouchableOpacity
            onPress={handleDone}
            className="bg-blue-600 p-4 rounded-xl items-center w-full"
            disabled={isLoading || checkingFace || imageError || fileSizeError || !photoUri || !faceDetected}
            style={{ opacity: (isLoading || checkingFace || imageError || fileSizeError || !photoUri || !faceDetected) ? 0.7 : 1 }}
          >
            <Text className="text-white font-semibold text-lg">
              {isLoading ? "Loading..." :
               checkingFace ? "Analyzing..." :
               imageError ? "Fix Image Error" :
               fileSizeError ? "Image Too Large" :
               !photoUri ? "Take Photo First" :
               !faceDetected ? "No Face Detected" : "Continue"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNewPhoto}
            className="p-4 items-center w-full"
            disabled={isLoading || checkingFace}
            style={{ opacity: (isLoading || checkingFace) ? 0.7 : 1 }}
          >
            <Text className="text-blue-600 font-semibold text-lg">
              {isLoading ? "Loading..." : checkingFace ? "Analyzing..." : "Take a New Photo"}
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