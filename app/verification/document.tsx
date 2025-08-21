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
      className="flex-1 bg-white px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 mt-2">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} />
        </TouchableOpacity>
        <Text className="font-semibold">Step 3 of 4</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 10 }}>
        {/* Title */}
        <Text className="text-[#0072CE] text-[24px] font-bold mb-2">
          Upload Your Business Document
        </Text>
        <Text className="text-base text-[#4F4F4F] mb-4">
          To ensure security & compliance, please provide your details.
        </Text>

        {/* BVN Input */}
        <Text className="text-sm text-[#4F4F4F] font-semibold mb-1">BVN Number</Text>
        <TextInput
          className="border border-[#E0E0E0] rounded-lg px-4 py-3 mb-6 bg-[#F4F4F5]"
          keyboardType="numeric"
          style={{
            backgroundColor: "#F4F4F5",
          }}
          maxLength={11}
          placeholder="Enter BVN number"
          placeholderTextColor="#BDBDBD"
          value={bvn}
          onChangeText={(text) => setBvn(text.replace(/[^0-9]/g, ""))}
        />

        {/* Upload CAC */}
        <Text className="text-sm text-[#4F4F4F] font-semibold my-2">
          Upload CAC Certificate
        </Text>
        <View
          className="rounded-2xl px-4 items-center bg-[#F4F4F5]"
          style={{
            height: 160,
            backgroundColor: "#F4F4F5",
            padding: 30,
            borderWidth: 2,
            borderColor: "#E0E0E0",
            borderStyle: "dashed",
          }}
        >
          {uploadingCac ? (
            <View className="items-center justify-center" style={{ height: 100 }}>
              <ActivityIndicator size="large" color="#0072CE" />
              <Text className="text-[#0072CE] mt-2 text-center">
                Uploading document...
              </Text>
            </View>
          ) : cacImage ? (
            <View className="items-center">
              <Image
                source={{ uri: cacImage }}
                style={{ width: 100, height: 100, borderRadius: 8 }}
              />
              <TouchableOpacity
                onPress={pickImage}
                className="mt-2"
              >
                <Text className="text-[#0072CE]">Change Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              className="items-center"
            >
              <View
                className="w-12 h-12 rounded-full bg-[#0072CE] items-center justify-center mb-2"
              >
                <Ionicons name="cloud-upload-outline" size={24} color="white" />
              </View>
              <Text className="text-[#0072CE] text-center">
                Click to upload CAC certificate
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-[#0072CE] rounded-xl py-4 mt-8"
          onPress={handleSubmit}
        >
          <Text className="text-white text-center font-semibold text-base">
            Continue
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
