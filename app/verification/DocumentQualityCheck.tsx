import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadVerificationDocument, uploadBusinessLocationPhoto } from '../../services/cloudinary';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';

interface DocumentQualityCheckProps {
  documentType: string;
  documentImage: string; // URI of the document image
  isLoading?: boolean;
  onBack: () => void;
  onConfirm: (cloudinaryUrl: string) => void;
  onRetake: () => void;
}

const DocumentQualityCheck = ({
  documentType,
  documentImage,
  isLoading = false,
  onBack,
  onConfirm,
  onRetake
}: DocumentQualityCheckProps) => {
  const [imageError, setImageError] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'verifying' | 'uploading' | 'success' | 'error'>('idle');
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auto-verify and upload when image is available
  useEffect(() => {
    if (documentImage && !imageError && uploadStatus === 'idle') {
      verifyAndUpload();
    }
  }, [documentImage, imageError]);

  const verifyDocument = async (): Promise<boolean> => {
    try {
      setUploadStatus('verifying');

      // Get image info to check basic properties
      const imageInfo = await ImageManipulator.manipulateAsync(
        documentImage,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      // Basic validation: Check if image exists and has reasonable dimensions
      if (!imageInfo || !imageInfo.width || !imageInfo.height) {
        throw new Error('Invalid image dimensions');
      }

      // For ID documents, expect landscape or portrait orientation with reasonable aspect ratio
      if (documentType !== 'business_location') {
        const aspectRatio = imageInfo.width / imageInfo.height;

        // ID cards are typically landscape (1.5-1.7) or portrait (0.6-0.7)
        // Reject if it looks like a square selfie or unusual ratio
        if (aspectRatio > 0.9 && aspectRatio < 1.1) {
          // Nearly square - might be a selfie
          setUploadError('Image appears to be a selfie or square photo. Please capture the ID document.');
          return false;
        }

        // Check minimum resolution (at least 400px on shortest side)
        const minDimension = Math.min(imageInfo.width, imageInfo.height);
        if (minDimension < 400) {
          setUploadError('Image resolution too low. Please take a clearer photo.');
          return false;
        }
      } else {
        // For business location, just check minimum resolution
        const minDimension = Math.min(imageInfo.width, imageInfo.height);
        if (minDimension < 400) {
          setUploadError('Image resolution too low. Please take a clearer photo.');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Document verification error:', error);
      // If verification fails technically, allow upload but log the error
      return true;
    }
  };

  const verifyAndUpload = async () => {
    try {
      // Verify document first
      const isValid = await verifyDocument();

      if (!isValid) {
        setUploadStatus('error');
        Alert.alert(
          "Verification Failed",
          uploadError || "The image doesn't appear to be a valid document. Please try again.",
          [{ text: "OK" }]
        );
        return;
      }

      // If verification passes, proceed to upload
      await uploadToCloudinary();
    } catch (error) {
      console.error("Verification and upload error:", error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const uploadToCloudinary = async () => {
    try {
      setUploadStatus('uploading');
      setUploadError(null);

      // Get user ID from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      let url: string;

      // Upload based on document type
      if (documentType === 'business_location') {
        console.log("Uploading business location to Cloudinary...");

        // For business location photos, try to get location data
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();

          let locationInfo = {};

          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High
            });

            if (location && location.coords) {
              locationInfo = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date().getTime()
              };
              console.log("Retrieved current location data:", locationInfo);
            }
          } else {
            console.log("Location permission not granted");
          }

          url = await uploadBusinessLocationPhoto(
            documentImage,
            userId,
            locationInfo
          );
        } catch (error) {
          console.log("Error getting location data:", error);
          url = await uploadBusinessLocationPhoto(
            documentImage,
            userId,
            {}
          );
        }
      } else {
        console.log(`Uploading ${documentType} to Cloudinary...`);
        url = await uploadVerificationDocument(
          documentImage,
          documentType,
          userId
        );
      }

      console.log(`CLOUDINARY RESPONSE - ${documentType === 'business_location' ? 'Business Location' : 'Government ID'}:`, JSON.stringify({
        success: true,
        url: url,
        documentType: documentType
      }));

      setCloudinaryUrl(url);
      setUploadStatus('success');
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      setUploadError(error instanceof Error ? error.message : 'Unknown upload error');
      setUploadStatus('error');

      Alert.alert(
        "Upload Error",
        "There was a problem uploading your image. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const getTitle = () => {
    switch (documentType) {
      case 'drivers_license':
        return "Driver's License";
      case 'national_id':
        return "National Identity Card";
      case 'passport':
        return "Passport";
      case 'business_location':
        return "Business Location";
      default:
        return "Document";
    }
  };

  const getInstructions = () => {
    return documentType === 'business_location'
      ? "Ensure your business building is clearly visible in the frame"
      : "Please make sure your card details are clear to read with no blur or glare";
  };

  const handleImageError = () => {
    setImageError(true);
    setUploadStatus('idle');
    setCloudinaryUrl(null);
    Alert.alert(
      "Image Error",
      "There was a problem loading the image. Please try taking another photo.",
      [{ text: "OK" }]
    );
  };

  const getUploadStatus = () => {
    switch (uploadStatus) {
      case 'verifying':
        return {
          message: "Verifying document...",
          icon: "document-text-outline",
          color: "#0052CC"
        };
      case 'uploading':
        return {
          message: "Uploading to server...",
          icon: "cloud-upload-outline",
          color: "#0052CC"
        };
      case 'success':
        return {
          message: "Document verified & uploaded ✓",
          icon: "checkmark-circle",
          color: "#4CAF50"
        };
      case 'error':
        return {
          message: uploadError || 'Verification/Upload failed',
          icon: "alert-circle",
          color: "#F44336"
        };
      default:
        return null;
    }
  };

  const uploadStatusInfo = getUploadStatus();
  const isBusinessLocation = documentType === 'business_location';
  const aspectRatio = isBusinessLocation ? 16 / 9 : 4 / 3;

  const isValidForSubmission = () => {
    return uploadStatus === 'success' && !!cloudinaryUrl;
  };

  const handleConfirm = () => {
    if (cloudinaryUrl && isValidForSubmission()) {
      onConfirm(cloudinaryUrl);
    } else if (uploadStatus === 'error') {
      verifyAndUpload();
    }
  };

  const getDocumentGuidelines = () => {
    switch (documentType) {
      case 'drivers_license':
        return [
          "Ensure all four corners are visible",
          "Make sure text is readable",
          "Remove plastic covers or holders that cause glare"
        ];
      case 'national_id':
        return [
          "Both sides of National ID card must be captured",
          "Ensure the photo and text are clear",
          "All details should be legible"
        ];
      case 'passport':
        return [
          "Open to the photo page",
          "All details should be visible and clear",
          "Avoid flash reflections on the page"
        ];
      case 'business_location':
        return [
          "Capture the front of your business with signage",
          "Ensure the building is clearly visible",
          "Include any street signs or addresses if possible"
        ];
      default:
        return [];
    }
  };

  const guidelines = getDocumentGuidelines();

  return (
    <SafeAreaView style={dqStyles.container}>
      <View style={dqStyles.headerRow}>
        <TouchableOpacity
          onPress={onBack}
          style={dqStyles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={dqStyles.headerTitle}>{getTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={dqStyles.innerWrap}>
        <Text style={dqStyles.instructions}>
          {getInstructions()}
        </Text>

        <View style={dqStyles.imageWrap}>
          {imageError || !documentImage ? (
            <View style={dqStyles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#999" />
              <Text style={dqStyles.placeholderText}>Image not available</Text>
            </View>
          ) : (
            <Image
              source={{ uri: documentImage }}
              style={[dqStyles.image, { aspectRatio }]}
              resizeMode="cover"
              onError={handleImageError}
            />
          )}
        </View>

        <View style={dqStyles.analysisCard}>
          <Text style={dqStyles.analysisTitle}>Status</Text>
          {uploadStatusInfo && (
            <View style={dqStyles.rowCenter}>
              {(uploadStatus === 'uploading' || uploadStatus === 'verifying') ? (
                <ActivityIndicator size="small" color="#0052CC" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name={uploadStatusInfo.icon as any} size={20} color={uploadStatusInfo.color} style={{ marginRight: 8 }} />
              )}
              <Text style={{ color: uploadStatusInfo.color, flex: 1 }}>
                {uploadStatusInfo.message}
              </Text>
            </View>
          )}
        </View>

        <View style={dqStyles.tipsCard}>
          <Text style={dqStyles.tipsTitle}>Tips for best results:</Text>
          {guidelines.map((guideline, index) => (
            <View key={index} style={dqStyles.tipRow}>
              <MaterialIcons name="check-circle" size={16} color="#0052CC" style={{ marginRight: 6 }} />
              <Text style={dqStyles.tipText}>{guideline}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={dqStyles.bottomBar}>
        <TouchableOpacity
          onPress={onRetake}
          style={dqStyles.retakeBtn}
        >
          <Text style={dqStyles.retakeText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          style={[dqStyles.primaryBtn,
          isValidForSubmission() ? dqStyles.primaryEnabled :
            (uploadStatus === 'error' ? dqStyles.warningBtn : dqStyles.disabledBtn)
          ]}
          disabled={!isValidForSubmission() && uploadStatus !== 'error'}
        >
          <Text style={dqStyles.primaryText}>
            {uploadStatus === 'error' ? 'Retry' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DocumentQualityCheck;

const dqStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  backBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  innerWrap: { flex: 1, paddingHorizontal: 16 },
  instructions: { color: '#374151', textAlign: 'center', marginBottom: 16 },
  imageWrap: { alignItems: 'center', marginBottom: 16 },
  imagePlaceholder: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#E5E7EB', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#6B7280', marginTop: 8 },
  image: { width: '100%', borderRadius: 12 },
  analysisCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16 },
  analysisTitle: { color: '#1F2937', fontWeight: '600', marginBottom: 12 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mutedText: { color: '#6B7280' },
  tipsCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 16 },
  tipsTitle: { color: '#1E3A8A', fontWeight: '600', marginBottom: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tipText: { color: '#374151', flex: 1 },
  bottomBar: { padding: 16, flexDirection: 'row', columnGap: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  retakeBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' },
  retakeText: { color: '#374151', fontWeight: '500' },
  primaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryEnabled: { backgroundColor: '#0052CC' },
  warningBtn: { backgroundColor: '#F59E0B' },
  disabledBtn: { backgroundColor: '#D1D5DB' },
  primaryText: { color: '#FFFFFF', fontWeight: '600' },
});