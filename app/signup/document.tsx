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
  Dimensions,
  KeyboardAvoidingView,
  StyleSheet
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { Ionicons } from "@expo/vector-icons"; // Import icon library
import { uploadUserDocument } from "../utils/documentUtils"; // Import upload function
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function UploadDocumentScreen() {
  const router = useRouter();
  
  // Use back button handler for signup document page
  useBackButtonHandler('/signup/document');
  
  // Console log the params received from previous screen
  const params = useLocalSearchParams();
  const { width, height } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  // Responsive sizing based on screen width
  const getResponsiveSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9; // Small phones
    } else if (width < 414) {
      return baseSize; // Medium phones
    } else {
      return baseSize * 1.1; // Large phones and tablets
    }
  };

  useEffect(() => {
    console.log('===== DOCUMENT SCREEN - RECEIVED DATA =====');
    console.log('Params received from userData screen:', JSON.stringify(params, null, 2));
    console.log('===========================================');
  }, []);

  const [bvn, setBvn] = useState("");
  const [cacImage, setCacImage] = useState<string | null>(null);
  const [uploadingCac, setUploadingCac] = useState(false);
  const [cacImageUrl, setCacImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info' | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);

  // Helper function to set message with auto-clear
  const setMessageWithTimeout = (msg: string, type: 'error' | 'info', timeoutMs: number = 4000) => {
    // Clear any existing timeout
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }
    
    setMessage(msg);
    setMessageType(type);
    
    // Set new timeout to clear message
    const timeout = setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, timeoutMs);
    
    setMessageTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, [messageTimeout]);

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
      setMessageWithTimeout("Failed to select CAC image. Please try again.", "error", 4000);
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
        setMessageWithTimeout("We're having trouble uploading your document, but we can proceed with a placeholder for now.", "info", 4000);
      }
      
      return fallbackUrl;
    } finally {
      setUploadingCac(false);
    }
  };

  const handleSubmit = () => {
    // Validate BVN
    if (!bvn.trim()) {
      setMessageWithTimeout("Please enter your BVN", "error", 3000);
      return;
    }

    if (bvn.length !== 11) {
      setMessageWithTimeout("BVN must be exactly 11 digits", "error", 3000);
      return;
    }

    // Navigate to next screen with document data
    router.push({
      pathname: "/signup/security",
      params: {
        ...params,
        bvn: bvn.trim(),
        cacImageUrl: cacImageUrl || "",
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top + getResponsiveSize(16),
              paddingBottom: insets.bottom + getResponsiveSize(16),
              paddingHorizontal: getResponsiveSize(24),
            }
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { marginBottom: getResponsiveSize(24) }]}>
            <TouchableOpacity
              style={[styles.backButton, { padding: getResponsiveSize(8) }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
            </TouchableOpacity>
            <Text style={[styles.stepText, { fontSize: getResponsiveSize(16) }]}>Step 4 of 4</Text>
          </View>

          <View style={[styles.titleContainer, { marginTop: getResponsiveSize(16) }]}>
            <Text style={[styles.title, { fontSize: getResponsiveSize(24) }]}>
              Upload Documents
            </Text>
            <Text style={[styles.subtitle, { fontSize: getResponsiveSize(16) }]}>
              Please provide your BVN and upload your CAC certificate for verification.
            </Text>
          </View>

          {message && (
            <View style={[
              styles.messageContainer,
              { 
                marginTop: getResponsiveSize(16),
                marginBottom: getResponsiveSize(16),
                padding: getResponsiveSize(12),
                backgroundColor: messageType === 'error' ? '#FFD6D6' : '#D6F5FF',
                borderRadius: getResponsiveSize(8)
              }
            ]}>
              <Text style={[
                styles.messageText,
                { 
                  color: messageType === 'error' ? '#D92D20' : '#0072CE',
                  fontSize: getResponsiveSize(14)
                }
              ]}>
                {message}
              </Text>
            </View>
          )}

          {/* BVN Input */}
          <View style={[styles.inputContainer, { marginTop: getResponsiveSize(32) }]}>
            <Text style={[styles.inputLabel, { fontSize: getResponsiveSize(14) }]}>
              BVN (Bank Verification Number)
            </Text>
            <TextInput
              placeholder="Enter your 11-digit BVN"
              value={bvn}
              onChangeText={setBvn}
              keyboardType="numeric"
              maxLength={11}
              placeholderTextColor="#BDBDBD"
              style={[
                styles.textInput,
                {
                  paddingHorizontal: getResponsiveSize(12),
                  paddingVertical: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8),
                  fontSize: getResponsiveSize(16)
                }
              ]}
            />
          </View>

          {/* CAC Upload */}
          <View style={[styles.uploadContainer, { marginTop: getResponsiveSize(24) }]}>
            <Text style={[styles.uploadLabel, { fontSize: getResponsiveSize(14) }]}>
              CAC Certificate
            </Text>
            <TouchableOpacity
              onPress={pickImage}
              style={[
                styles.uploadButton,
                {
                  borderWidth: getResponsiveSize(2),
                  borderRadius: getResponsiveSize(8),
                  padding: getResponsiveSize(16),
                  minHeight: getResponsiveSize(120)
                }
              ]}
              disabled={uploadingCac}
            >
              {cacImage ? (
                <View style={styles.uploadContent}>
                  <Image
                    source={{ uri: cacImage }}
                    style={[
                      styles.uploadedImage,
                      {
                        width: getResponsiveSize(80),
                        height: getResponsiveSize(80),
                        borderRadius: getResponsiveSize(8),
                        marginBottom: getResponsiveSize(8)
                      }
                    ]}
                  />
                  <Text style={[styles.uploadText, { fontSize: getResponsiveSize(14) }]}>
                    {uploadingCac ? "Uploading..." : "Image selected"}
                  </Text>
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <Ionicons 
                    name="cloud-upload-outline"
                    size={getResponsiveSize(40)}
                    color="#0072CE"
                    style={{ marginBottom: getResponsiveSize(8) }}
                  />
                  <Text style={[styles.uploadText, { fontSize: getResponsiveSize(14) }]}>
                    {uploadingCac ? "Uploading..." : "Tap to upload CAC certificate"}
                  </Text>
                </View>
              )}
              {uploadingCac && (
                <ActivityIndicator 
                  size="small"
                  color="#0072CE"
                  style={{ marginTop: getResponsiveSize(8) }}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <View style={[styles.submitContainer, { 
            marginTop: getResponsiveSize(32),
            marginBottom: getResponsiveSize(16)
          }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  paddingVertical: getResponsiveSize(16),
                  borderRadius: getResponsiveSize(8)
                }
              ]}
              onPress={handleSubmit}
            >
              <Text style={[styles.submitButtonText, { fontSize: getResponsiveSize(18) }]}>
                Continue
              </Text>
              <Ionicons name="arrow-forward" size={getResponsiveSize(20)} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    fontWeight: '600',
    color: '#4F4F4F',
  },
  titleContainer: {
    marginTop: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#0072CE',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4F4F4F',
  },
  messageContainer: {
    marginVertical: 16,
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 32,
  },
  inputLabel: {
    color: '#4F4F4F',
    marginBottom: 4,
  },
  textInput: {
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F4F4F5',
  },
  uploadContainer: {
    marginTop: 24,
  },
  uploadLabel: {
    color: '#4F4F4F',
    marginBottom: 4,
  },
  uploadButton: {
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadText: {
    color: '#0072CE',
    fontWeight: '500',
    textAlign: 'center',
  },
  submitContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#0072CE',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
});
