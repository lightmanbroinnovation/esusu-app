import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { Ionicons } from "@expo/vector-icons"; // Import icon library

export default function UploadDocumentScreen() {
  const [bvn, setBvn] = useState("");
  const [idImage, setIdImage] = useState(null);
  const [cacImage, setCacImage] = useState(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams(); // Retrieve params from the previous page

  const pickImage = async (setImage: any) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use MediaTypeOptions.Images
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log("Selected Image URI:", result.assets[0].uri); // Debugging: Log the selected image URI
      setImage(result.assets[0].uri);
    } else {
      console.log("Image selection canceled or failed."); // Debugging: Log if no image is selected
    }
  };

  const handleSubmit = () => {
    const documentData = {
      ...params, // Include data from the previous page
      bvn,
      idImage,
      cacImage,
    };

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
          maxLength={15}
          placeholder="Enter BVN number"
          placeholderTextColor="#BDBDBD"
          value={bvn}
          onChangeText={(text) => setBvn(text.replace(/[^0-9]/g, ""))}
        />

        {/* Upload ID */}
        <Text className="text-sm text-[#4F4F4F] font-semibold my-2">
          Upload ID (NIN, Voter's Card, or Driver’s License)
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
          <TouchableOpacity
            onPress={() => pickImage(setIdImage)}
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
        </View>

        {/* Upload CAC */}
        <Text className="text-sm text-[#4F4F4F] font-semibold my-2">
          Upload Your CAC Document
        </Text>
        <TouchableOpacity
          className="rounded-2xl px-4 items-center bg-[#F4F4F5]"
          onPress={() => pickImage(setCacImage)}
          style={{
            height: 160,
            backgroundColor: "#F4F4F5",
            padding: 30,
            borderWidth: 2,
            borderColor: "#E0E0E0",
            borderStyle: "dashed", // Add dashed border
          }}
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
        >
          <Text className="text-white text-base font-bold">Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
