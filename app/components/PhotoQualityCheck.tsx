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
  Dimensions,
  StyleSheet
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// expo-face-detector has been removed as it's deprecated
// TODO: Implement face detection with react-native-vision-camera if needed

export const PhotoQualityCheck = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Simplified state management
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [fileSizeError, setFileSizeError] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get screen dimensions for responsive sizing
  const { width } = Dimensions.get('window');
  const imageSize = useMemo(() => Math.min(width * 0.7, 280), [width]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    content: {
      flex: 1,
      padding: 24,
      marginTop: 40,
    },
    backButton: {
      backgroundColor: '#F3F4F6',
      padding: 8,
      borderRadius: 999,
      alignSelf: 'flex-start',
      marginBottom: 24,
    },
    title: {
      fontSize: 30,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#0052CC',
      marginBottom: 8,
    },
    subtitle: {
      color: '#4B5563',
      textAlign: 'center',
      marginBottom: 32,
    },
    photoContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    photoPlaceholder: {
      backgroundColor: '#F3F4F6',
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoPlaceholderText: {
      color: '#6B7280',
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    photo: {
      alignItems: 'center',
    },
    photoImage: {
      borderRadius: 20,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusText: {
      fontSize: 12,
      marginLeft: 4,
      color: '#4B5563',
    },
    spacer: {
      flex: 1,
    },
    actionsContainer: {
      marginTop: 16,
    },
    continueButton: {
      backgroundColor: '#2563EB',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      width: '100%',
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 18,
    },
    newPhotoButton: {
      padding: 16,
      alignItems: 'center',
      width: '100%',
    },
    newPhotoButtonText: {
      color: '#2563EB',
      fontWeight: '600',
      fontSize: 18,
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
    savingIndicator: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      padding: 32,
      borderRadius: 12,
    },
    savingText: {
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

  // Simplified initialization - no heavy operations
  useEffect(() => {
    const initializeComponent = () => {
      try {
        if (params.photoUri && typeof params.photoUri === 'string') {
          console.log('PhotoQualityCheck: Received photoUri:', params.photoUri);

          // Check if it's already a Cloudinary URL
          // For photo validation we treat any uri the same
          setPhotoUri(params.photoUri);
          setImageError(false);
          setFileSizeError(false);
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
          // Face detection removed - expo-face-detector is deprecated
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
        // Face detection removed - expo-face-detector is deprecated
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
  }, []);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header with back button */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Check Quality</Text>
        <Text style={styles.subtitle}>
          Make sure your face is not blurred or out of frame before continuing
        </Text>

        {/* Simplified Photo Display */}
        <View style={styles.photoContainer}>
          {isLoading ? (
            <View style={[styles.photoPlaceholder, { width: imageSize, height: imageSize }]}>
              <ActivityIndicator size="large" color="#0052CC" />
            </View>
          ) : imageError || fileSizeError || !photoUri ? (
            <View style={[styles.photoPlaceholder, { width: imageSize, height: imageSize }]}>
              <Text style={styles.photoPlaceholderText}>
                {imageError ? "Image could not be loaded. Please take a new photo." :
                  fileSizeError ? "Image file size is too large (max 5MB). Please take a smaller photo." :
                    "No photo taken yet."}
              </Text>
            </View>
          ) : (
            <View style={styles.photo}>
              <Image
                source={{ uri: photoUri }}
                style={[
                  styles.photoImage,
                  {
                    width: imageSize,
                    height: imageSize,
                  }
                ]}
                resizeMode="cover"
                onError={handleImageError}
                onLoadStart={() => console.log('Image loading started')}
                onLoadEnd={() => console.log('Image loading completed')}
              />
              {/* Photo quality indicator */}
              <View style={styles.statusIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.statusText}>
                  Photo ready
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.spacer} />

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleDone}
            style={[
              styles.continueButton,
              { opacity: (isLoading || imageError || fileSizeError || !photoUri) ? 0.7 : 1 }
            ]}
            disabled={isLoading || imageError || fileSizeError || !photoUri}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? "Loading..." :
                imageError ? "Fix Image Error" :
                  fileSizeError ? "Image Too Large" :
                    !photoUri ? "Take Photo First" : "Continue"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNewPhoto}
            style={[
              styles.newPhotoButton,
              { opacity: isLoading ? 0.7 : 1 }
            ]}
            disabled={isLoading}
          >
            <Text style={styles.newPhotoButtonText}>
              {isLoading ? "Loading..." : "Take a New Photo"}
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
        <View style={styles.cameraModalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.cameraModalContent}>
              {savingImage ? (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.savingText}>Saving photo...</Text>
                </View>
              ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={styles.cameraInstruction}>Position your face in the frame</Text>

                  {/* Camera UI */}
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
                      style={styles.cameraControlButton}
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