import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadVerificationDocument, uploadBusinessLocationPhoto } from '../../services/cloudinary';
import * as Location from 'expo-location';

interface DocumentQualityCheckProps {
  documentType: string;
  documentImage: string; // URI of the document image
  isLoading?: boolean;
  onBack: () => void;
  onConfirm: (cloudinaryUrl: string) => void;
  onRetake: () => void;
}

// Define content types for validation
enum ContentType {
  DOCUMENT = 'document',
  BUILDING = 'building',
  UNKNOWN = 'unknown'
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
  const [checking, setChecking] = useState(false);
  const [documentValid, setDocumentValid] = useState<boolean | null>(null);
  const [contentDetected, setContentDetected] = useState<ContentType>(ContentType.UNKNOWN);
  const [isContentValidated, setIsContentValidated] = useState(false);
  
  // New state for Cloudinary upload
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Simulate document validation and content detection
  useEffect(() => {
    if (documentImage && !imageError) {
      setChecking(true);
      
      // Simulate processing time for analysis
      const timer = setTimeout(() => {
        // For document types, detect if an actual document is present
        const expectedContent = documentType === 'business_location' 
          ? ContentType.BUILDING 
          : ContentType.DOCUMENT;
          
        // Simulate detection with 80% accuracy for demo
        // In a real app, this would be replaced with actual ML/AI detection
        const detectionResult = Math.random();
        const detectedContent = detectionResult > 0.8 
          ? ContentType.UNKNOWN 
          : (detectionResult > 0.2 ? expectedContent : (expectedContent === ContentType.DOCUMENT ? ContentType.BUILDING : ContentType.DOCUMENT));
        
        setContentDetected(detectedContent);
        
        // Content is valid if it matches what we expect
        const isValidContent = detectedContent === expectedContent;
        setIsContentValidated(true);
        
        // For documents, also check quality/clarity
        let isDocumentValid = false;
        
        if (documentType !== 'business_location') {
          // 90% success rate for document quality check
          const isDocumentQualityGood = Math.random() > 0.1;
          isDocumentValid = isDocumentQualityGood && isValidContent;
          setDocumentValid(isDocumentValid);
        } else {
          // For buildings, just use content validation
          isDocumentValid = isValidContent;
          setDocumentValid(isValidContent);
        }
        
        setChecking(false);
        
        // If document is valid, upload to Cloudinary
        if (isDocumentValid) {
          uploadToCloudinary();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [documentImage, imageError, documentType]);
  
  // Function to upload to Cloudinary
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
          // Get location directly if available
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
          // Upload without location data if there's an error
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
      
      // Log the Cloudinary response
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
    switch(documentType) {
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
    setDocumentValid(null);
    setContentDetected(ContentType.UNKNOWN);
    setIsContentValidated(false);
    setUploadStatus('idle');
    setCloudinaryUrl(null);
    Alert.alert(
      "Image Error",
      "There was a problem loading the image. Please try taking another photo.",
      [{ text: "OK" }]
    );
  };
  
  // Get content validation status message
  const getContentValidationMessage = () => {
    if (!isContentValidated || contentDetected === ContentType.UNKNOWN) {
      return null;
    }
    
    const expectedContent = documentType === 'business_location' 
      ? ContentType.BUILDING 
      : ContentType.DOCUMENT;
    
    if (contentDetected !== expectedContent) {
      if (expectedContent === ContentType.DOCUMENT) {
        return {
          message: "No valid document detected in the image",
          icon: "close-circle",
          color: "#F44336"
        };
      } else {
        return {
          message: "No building detected in the image",
          icon: "close-circle",
          color: "#F44336"
        };
      }
    }
    
    return {
      message: documentType === 'business_location' 
        ? "Building detected ✓" 
        : "Document detected ✓",
      icon: "checkmark-circle",
      color: "#4CAF50"
    };
  };
  
  // Get document quality validation status
  const getDocumentQualityStatus = () => {
    // Only show quality status for documents, not buildings
    // And only if the content type is already validated as a document
    if (documentType === 'business_location' || contentDetected !== ContentType.DOCUMENT) {
      return null;
    }
    
    if (checking) {
      return {
        message: "Analyzing document quality...",
        icon: "hourglass-outline",
        color: "#0052CC"
      };
    } else if (documentValid === true) {
      return {
        message: "Document quality good ✓",
        icon: "checkmark-circle",
        color: "#4CAF50"
      };
    } else if (documentValid === false) {
      return {
        message: "Document quality poor. Consider retaking the photo.",
        icon: "alert-circle",
        color: "#FF9800"
      };
    }
    return null;
  };
  
  // Get upload status message
  const getUploadStatus = () => {
    switch (uploadStatus) {
      case 'uploading':
        return {
          message: "Uploading image to server...",
          icon: "cloud-upload-outline",
          color: "#0052CC"
        };
      case 'success':
        return {
          message: "Image uploaded successfully ✓",
          icon: "cloud-done-outline",
          color: "#4CAF50"
        };
      case 'error':
        return {
          message: `Upload failed: ${uploadError || 'Please try again'}`,
          icon: "cloud-offline-outline",
          color: "#F44336"
        };
      default:
        return null;
    }
  };
  
  const contentStatus = getContentValidationMessage();
  const documentQualityStatus = getDocumentQualityStatus();
  const uploadStatusInfo = getUploadStatus();
  const isBusinessLocation = documentType === 'business_location';
  const aspectRatio = isBusinessLocation ? 16/9 : 4/3;
  
  // Check if the image is valid to enable the Done button
  const isValidForSubmission = () => {
    // Need both valid content/quality AND successful upload
    if (uploadStatus !== 'success' || !cloudinaryUrl) {
      return false;
    }
    
    // For business location, just need to detect a building
    if (documentType === 'business_location') {
      return contentDetected === ContentType.BUILDING;
    }
    
    // For documents, need both valid content type and acceptable quality
    return contentDetected === ContentType.DOCUMENT && documentValid === true;
  };
  
  const handleConfirm = () => {
    if (cloudinaryUrl && isValidForSubmission()) {
      onConfirm(cloudinaryUrl);
    } else if (uploadStatus === 'error') {
      // If there was an upload error, try again
      uploadToCloudinary();
    }
  };
  
  // Get document guidelines
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
        <View style={{width: 40}} />
      </View>
      
      <View style={dqStyles.innerWrap}>
        <Text style={dqStyles.instructions}>
          {getInstructions()}
        </Text>
        
        {/* Document/Location Image */}
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
        
        {/* Quality Check Status */}
        <View style={dqStyles.analysisCard}>
          <Text style={dqStyles.analysisTitle}>Image Analysis</Text>
          
          {/* Content Detection Status */}
          {checking ? (
            <View style={dqStyles.rowCenter}>
              <ActivityIndicator size="small" color="#0052CC" style={{ marginRight: 8 }} />
              <Text style={dqStyles.mutedText}>
                Analyzing image...
              </Text>
            </View>
          ) : contentStatus ? (
            <View style={dqStyles.rowCenter}>
              <Ionicons name={contentStatus.icon as any} size={20} color={contentStatus.color} style={{ marginRight: 8 }} />
              <Text style={{ color: contentStatus.color }}>
                {contentStatus.message}
              </Text>
            </View>
          ) : null}
          
          {/* Document Quality Status */}
          {documentQualityStatus && (
            <View style={dqStyles.rowCenter}>
              <Ionicons name={documentQualityStatus.icon as any} size={20} color={documentQualityStatus.color} style={{ marginRight: 8 }} />
              <Text style={{ color: documentQualityStatus.color }}>
                {documentQualityStatus.message}
              </Text>
            </View>
          )}
          
          {/* Upload Status */}
          {uploadStatusInfo && (
            <View style={dqStyles.rowCenter}>
              {uploadStatus === 'uploading' ? (
                <ActivityIndicator size="small" color="#0052CC" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name={uploadStatusInfo.icon as any} size={20} color={uploadStatusInfo.color} style={{ marginRight: 8 }} />
              )}
              <Text style={{ color: uploadStatusInfo.color }}>
                {uploadStatusInfo.message}
              </Text>
            </View>
          )}
        </View>
        
        {/* Guidelines */}
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
      
      {/* Bottom Buttons */}
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
            {uploadStatus === 'error' ? 'Retry Upload' : 'Done'}
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
  imagePlaceholder: { width: '100%', aspectRatio: 4/3, backgroundColor: '#E5E7EB', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#6B7280', marginTop: 8 },
  image: { width: '100%', borderRadius: 12 },
  analysisCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16 },
  analysisTitle: { color: '#1F2937', fontWeight: '600', marginBottom: 12 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mutedText: { color: '#6B7280' },
  tipsCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 16 },
  tipsTitle: { color: '#1E3A8A', fontWeight: '600', marginBottom: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tipText: { color: '#374151' },
  bottomBar: { padding: 16, flexDirection: 'row', columnGap: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  retakeBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' },
  retakeText: { color: '#374151', fontWeight: '500' },
  primaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryEnabled: { backgroundColor: '#0052CC' },
  warningBtn: { backgroundColor: '#F59E0B' },
  disabledBtn: { backgroundColor: '#D1D5DB' },
  primaryText: { color: '#FFFFFF', fontWeight: '600' },
});