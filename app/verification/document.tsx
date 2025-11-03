import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { Ionicons } from "@expo/vector-icons"; // Import icon library
import { uploadUserDocument } from "../utils/documentUtils"; // Import upload function
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';

export default function UploadDocumentScreen() {
  // Console log the params received from previous screen
  const params = useLocalSearchParams();
  useEffect(() => {
    console.log('===== DOCUMENT SCREEN - RECEIVED DATA =====');
    console.log('Params received from userData screen:', JSON.stringify(params, null, 2));
    console.log('===========================================');
  }, []);

  const [bvn, setBvn] = useState("");
  const [cacImage, setCacImage] = useState<string | null>(null);
  const [uploadingCac, setUploadingCac] = useState(false);
  const [cacImageUrl, setCacImageUrl] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const pickImage = async () => {
    try {
      console.log('Picking CAC image...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Selected CAC Image URI:', result.assets[0].uri.substring(0, 50) + '...');
        setCacImage(result.assets[0].uri);
        
        // After selecting, try to upload right away
        uploadCacImage(result.assets[0].uri);
      } else {
        console.log("Image selection canceled or failed.");
      }
    } catch (error) {
      console.error('Error picking CAC image:', error);
      Alert.alert("Error", 'Failed to select CAC image. Please try again.');
    }
  };

  const uploadCacImage = async (uri: string) => {
    if (!uri) return;
    try {
      setUploadingCac(true);
      console.log('===== UPLOADING CAC IMAGE TO CLOUDINARY =====');
      // Generate a temporary id for upload
      const tempId = (Math.random() + 1).toString(36).substring(2);
      console.log('Temporary ID for upload:', tempId);
      console.log('Starting CAC image upload...');
      
      const result = await uploadUserDocument(uri, 'cac_certificate', tempId);
      console.log("CAC image upload result:", result);
      
      // Check if we got a valid URL back
      if (typeof result === 'string' && result.startsWith('http')) {
        console.log("CAC image uploaded successfully:", result);
        setCacImageUrl(result);
        console.log('===========================================');
        return result;
      } else {
        // Handle the case where we get an object with error or other invalid response
        console.error("Invalid upload response:", result);
        throw new Error("Invalid upload response");
      }
    } catch (error) {
      console.error("Error uploading CAC image:", error);
      console.log('===========================================');
      
      // Provide fallback for development or when upload fails
      const fallbackUrl = "https://res.cloudinary.com/daskmqzyy/image/upload/v1/verification_documents/placeholder_cac.jpg";
      console.log("Using fallback image URL:", fallbackUrl);
      setCacImageUrl(fallbackUrl);
      
      if (Platform.OS !== 'web' || process.env.NODE_ENV !== 'development') {
        Alert.alert(
          "Upload Warning", 
          "We're having trouble uploading your document, but we can proceed with a placeholder for now.",
          [{ text: "Continue" }]
        );
      }
      
      return fallbackUrl;
    } finally {
      setUploadingCac(false);
    }
  };

  const handleSubmit = async () => {
    // Validate BVN
    if (!bvn || bvn.length < 5) {
      Alert.alert("Invalid BVN", "Please enter a valid BVN number.");
      return;
    }

    // If upload failed, we should still have the fallback cacImageUrl
    // but if for some reason it's not set, we'll handle that case
    if (!cacImageUrl) {
      // Set fallback URL
      const fallbackUrl = "https://res.cloudinary.com/daskmqzyy/image/upload/v1/verification_documents/placeholder_cac.jpg";
      setCacImageUrl(fallbackUrl);
      Alert.alert(
        "Document Upload Issue", 
        "We're having trouble with your document upload but will proceed with a placeholder for now.",
        [{ text: "Continue" }]
      );
    }

    // Create verification data object
    const verificationData = {
      business_document: cacImageUrl,
      documentType: 'cac_certificate'
    };

    // Device notification
    await sendNotification(
      NotificationTemplates.registration.verification.submitted.title,
      NotificationTemplates.registration.verification.submitted.body,
      NotificationTemplates.registration.verification.submitted.type
    );

    // Store the document data to pass to the next screen
    const documentData = {
      ...params, // Include data from the previous page
      bvn: bvn,
      cacImage: cacImageUrl,
      verification_data_string: JSON.stringify(verificationData)
    };

    console.log('===== DOCUMENT SCREEN - PASSING DATA =====');
    try {
      console.log('Document data prepared:', JSON.stringify({
        bvn: documentData.bvn,
        cacImage: documentData.cacImage && typeof documentData.cacImage === 'string' ? 
          documentData.cacImage.substring(0, 30) + "..." : "missing",
        verification_data_string: documentData.verification_data_string
      }, null, 2));
    } catch (error) {
      console.error('Error preparing document data log:', error);
    }
    console.log('==========================================');

    // Navigate to the next page with the combined data
    router.push({
      pathname: "/signup/passcode",
      params: documentData,
    });
  };

  return (
    <View
      style={[docStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* Header */}
      <View style={docStyles.headerRow}>
        <TouchableOpacity
          style={docStyles.headerBack}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
        <Text style={docStyles.stepText}>Step 3 of 4</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 10 }}>
        {/* Title */}
        <Text style={docStyles.title}>
          Upload Your Business Document
        </Text>
        <Text style={docStyles.subtitle}>
          To ensure security & compliance, please provide your details.
        </Text>

        {/* BVN Input */}
        <Text style={docStyles.label}>BVN Number</Text>
        <TextInput
          style={[docStyles.fullInput, { backgroundColor: "#F4F4F5" }]}
          keyboardType="numeric"
          maxLength={11}
          placeholder="Enter BVN number"
          placeholderTextColor="#BDBDBD"
          value={bvn}
          onChangeText={(text) => setBvn(text.replace(/[^0-9]/g, ""))}
        />

        {/* Upload CAC */}
        <Text style={docStyles.label}>
          Upload CAC Certificate
        </Text>
        <View
          style={docStyles.uploadBox}
        >
          {uploadingCac ? (
            <View style={docStyles.center100}>
              <ActivityIndicator size="large" color="#0072CE" />
              <Text style={docStyles.progressText}>
                Uploading document...
              </Text>
            </View>
          ) : cacImage ? (
            <View style={docStyles.itemsCenter}>
              <Image
                source={{ uri: cacImage }}
                style={{ width: 100, height: 100, borderRadius: 8 }}
              />
              <TouchableOpacity
                onPress={pickImage}
                style={{ marginTop: 8 }}
              >
                <Text style={docStyles.linkText}>Change Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              style={docStyles.itemsCenter}
            >
              <View
                style={docStyles.uploadIconCircle}
              >
                <Ionicons name="cloud-upload-outline" size={24} color="white" />
              </View>
              <Text style={docStyles.linkTextCenter}>
                Click to upload CAC certificate
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={docStyles.primaryBtn}
          onPress={handleSubmit}
        >
          <Text style={docStyles.primaryText}>
            Continue
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const docStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 8 },
  headerBack: { flexDirection: 'row', alignItems: 'center' },
  stepText: { fontWeight: '600' },
  title: { color: '#0072CE', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4F4F4F', marginBottom: 16 },
  label: { fontSize: 14, color: '#4F4F4F', fontWeight: '600', marginBottom: 4 },
  fullInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 24, backgroundColor: '#F4F4F5' },
  uploadBox: { borderRadius: 16, paddingHorizontal: 16, alignItems: 'center', backgroundColor: '#F4F4F5', height: 160, padding: 30, borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  center100: { alignItems: 'center', justifyContent: 'center', height: 100 },
  progressText: { color: '#0072CE', marginTop: 8, textAlign: 'center' },
  itemsCenter: { alignItems: 'center' },
  linkText: { color: '#0072CE' },
  uploadIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0072CE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  linkTextCenter: { color: '#0072CE', textAlign: 'center' },
  primaryBtn: { backgroundColor: '#0072CE', borderRadius: 12, paddingVertical: 16, marginTop: 32 },
  primaryText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});
