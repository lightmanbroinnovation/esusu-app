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

export default function UploadDocumentScreen() {
  // Console log the params received from previous screen
  const params = useLocalSearchParams();
  useEffect(() => {
    console.log('===== DOCUMENT SCREEN - RECEIVED DATA =====');
    console.log('Params received from userData screen:', JSON.stringify(params, null, 2));
    console.log('===========================================');
  }, []);

  const [bvn, setBvn] = useState("");
  const [idImage, setIdImage] = useState<string | null>(null);
  const [cacImage, setCacImage] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingCac, setUploadingCac] = useState(false);
  const [idImageUrl, setIdImageUrl] = useState<string | null>(null);
  const [cacImageUrl, setCacImageUrl] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const pickImage = async (setImage: React.Dispatch<React.SetStateAction<string | null>>, type: string) => {
    try {
      console.log(`Picking ${type} image...`);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`Selected ${type} Image URI:`, result.assets[0].uri.substring(0, 50) + '...');
        setImage(result.assets[0].uri);
        
        // After selecting, try to upload right away
        if (type === 'id') {
          uploadIdImage(result.assets[0].uri);
        } else if (type === 'cac') {
          uploadCacImage(result.assets[0].uri);
        }
      } else {
        console.log("Image selection canceled or failed.");
      }
    } catch (error) {
      console.error(`Error picking ${type} image:`, error);
      Alert.alert("Error", `Failed to select ${type} image. Please try again.`);
    }
  };

  const uploadIdImage = async (uri: string) => {
    if (!uri) return;
    try {
      setUploadingId(true);
      console.log('===== UPLOADING ID IMAGE TO CLOUDINARY =====');
      // Generate a temporary id for upload
      const tempId = (Math.random() + 1).toString(36).substring(2);
      console.log('Temporary ID for upload:', tempId);
      console.log('Starting ID image upload...');
      
      // For web platform, we might need additional checks or a mock response during development
      const cloudinaryUrl = await uploadUserDocument(uri, 'national_id', tempId);
      console.log("ID image uploaded successfully:", cloudinaryUrl);
      setIdImageUrl(cloudinaryUrl);
      console.log('==========================================');
      return cloudinaryUrl;
    } catch (error) {
      console.error("Error uploading ID image:", error);
      console.log('==========================================');
      // Handle the web platform specifically if needed
      if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
        // In web development mode, we can use a fallback image URL
        const fallbackUrl = "https://res.cloudinary.com/daskmqzyy/image/upload/v1/verification_documents/placeholder_id.jpg";
        console.log("Using fallback image URL for web development:", fallbackUrl);
        setIdImageUrl(fallbackUrl);
        return fallbackUrl;
      } else {
        Alert.alert("Upload Error", "Failed to upload ID image. Please try again.");
      }
    } finally {
      setUploadingId(false);
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
      
      // For web platform, we might need additional checks or a mock response during development
      const cloudinaryUrl = await uploadUserDocument(uri, 'cac_certificate', tempId);
      console.log("CAC image uploaded successfully:", cloudinaryUrl);
      setCacImageUrl(cloudinaryUrl);
      console.log('===========================================');
      return cloudinaryUrl;
    } catch (error) {
      console.error("Error uploading CAC image:", error);
      console.log('===========================================');
      // Handle the web platform specifically if needed
      if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
        // In web development mode, we can use a fallback image URL
        const fallbackUrl = "https://res.cloudinary.com/daskmqzyy/image/upload/v1/verification_documents/placeholder_cac.jpg";
        console.log("Using fallback image URL for web development:", fallbackUrl);
        setCacImageUrl(fallbackUrl);
        return fallbackUrl;
      } else {
        Alert.alert("Upload Error", "Failed to upload CAC document. Please try again.");
      }
    } finally {
      setUploadingCac(false);
    }
  };

  const handleSubmit = () => {
    // Validate BVN
    if (!bvn || bvn.length < 5) {
      Alert.alert("Invalid BVN", "Please enter a valid BVN number.");
      return;
    }

    // Check if both images have been uploaded
    if (!idImageUrl) {
      Alert.alert("Missing ID", "Please upload your ID document.");
      return;
    }

    if (!cacImageUrl) {
      Alert.alert("Missing CAC", "Please upload your CAC document.");
      return;
    }

    // Create verification data object
    const verificationData = {
      government_id: idImageUrl,
      business_document: cacImageUrl,
      documentType: 'national_id'
    };

    // Store the document data to pass to the next screen
    const documentData = {
      ...params, // Include data from the previous page
      bvn: bvn, // Use the BVN entered
      idImage: idImageUrl, // Use the Cloudinary URL for ID
      cacImage: cacImageUrl, // Use the Cloudinary URL for CAC
      // Pass verification data as a string for router params (will be parsed later)
      verification_data_string: JSON.stringify(verificationData)
    };

    console.log('===== DOCUMENT SCREEN - PASSING DATA =====');
    console.log('Document data prepared:', JSON.stringify({
      bvn: documentData.bvn,
      idImage: documentData.idImage ? documentData.idImage.substring(0, 30) + "..." : "missing",
      cacImage: documentData.cacImage ? documentData.cacImage.substring(0, 30) + "..." : "missing",
      verification_data_string: documentData.verification_data_string
    }, null, 2));
    console.log('==========================================');

    // Navigate to the next page with the combined data
    router.push({
      pathname: "/signup/passcode",
      params: documentData, // Pass all data to the next page
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
          Upload Your ID for Security
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
          // minLength={11}
          maxLength={11}
          placeholder="Enter BVN number"
          placeholderTextColor="#BDBDBD"
          value={bvn}
          onChangeText={(text) => setBvn(text.replace(/[^0-9]/g, ""))}
        />

        {/* Upload ID */}
        <Text className="text-sm text-[#4F4F4F] font-semibold my-2">
          Upload ID (NIN, Voter's Card, or Driver's License)
        </Text>
        <View
          className="rounded-2xl px-4 items-center bg-[#F4F4F5]"
          style={{
            height: 160,
            backgroundColor: "#F4F4F5",
            padding: 30,
            borderWidth: 2,
            borderColor: "#E0E0E0",
            borderStyle: "dashed", // Add dashed border
          }}
        >
          {uploadingId ? (
            <View className="items-center justify-center" style={{ height: 100 }}>
              <ActivityIndicator size="large" color="#0072CE" />
              <Text className="text-[#0072CE] mt-2 text-center">
                Uploading document...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => pickImage(setIdImage, 'id')}
              className="items-center"
            >
              {idImage ? (
                <Image
                  source={{ uri: idImage }}
                  style={{ width: "100%", height: 100, borderRadius: 8 }}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <View
                    className="rounded-full bg-[#CCE3FF] p-1"
                    style={{
                      width: 40,
                      height: 40,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 20,
                      backgroundColor: "#CCE3FF",
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={24} color="#0072CE" />
                  </View>
                  <Text className="text-gray-500 mt-2 text-sm">
                    Choose a file & drop it here
                  </Text>
                  <TouchableOpacity
                    className="bg-[#94b7e2] px-4 py-3 rounded-lg mt-2"
                    style={{ backgroundColor: "#CCE3FF" }} // Background color for the button
                  >
                    <Text className="text-primaryText text-sm font-medium">
                      Choose from Browser
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Upload CAC */}
        <Text className="text-sm text-[#4F4F4F] font-semibold my-2">
          Upload Your CAC Document
        </Text>
        <View
          className="rounded-2xl px-4 items-center bg-[#F4F4F5]"
          style={{
            height: 160,
            backgroundColor: "#F4F4F5",
            padding: 30,
            borderWidth: 2,
            borderColor: "#E0E0E0",
            borderStyle: "dashed", // Add dashed border
          }}
        >
          {uploadingCac ? (
            <View className="items-center justify-center" style={{ height: 100 }}>
              <ActivityIndicator size="large" color="#0072CE" />
              <Text className="text-[#0072CE] mt-2 text-center">
                Uploading document...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => pickImage(setCacImage, 'cac')}
              className="items-center"
            >
              {cacImage ? (
                <Image
                  source={{ uri: cacImage }}
                  style={{ width: "100%", height: 100, borderRadius: 8 }}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <View
                    className="rounded-full bg-[#CCE3FF] p-1"
                    style={{
                      width: 40,
                      height: 40,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 20,
                      backgroundColor: "#CCE3FF",
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={24} color="#0072CE" />
                  </View>
                  <Text className="text-gray-500 mt-2 text-sm">
                    Choose a file & drop it here
                  </Text>
                  <TouchableOpacity
                    className="bg-[#94b7e2] px-4 py-3 rounded-lg mt-2"
                    style={{ backgroundColor: "#CCE3FF" }} // Background color for the button
                  >
                    <Text className="text-primaryText text-sm font-medium">
                      Choose from Browser
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: "white", // Optional: Add background color to separate it from the content
        }}
      >
        <TouchableOpacity
          className="flex-row justify-center items-center bg-[#0072CE] py-4 rounded-lg"
          onPress={handleSubmit} // Use handleSubmit to pass data to the next page
          disabled={uploadingId || uploadingCac}
        >
          {(uploadingId || uploadingCac) ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-base font-bold ml-2">Processing...</Text>
            </View>
          ) : (
            <Text className="text-white text-base font-bold">Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
