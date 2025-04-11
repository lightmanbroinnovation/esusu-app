import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  Image,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const AddContributor = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ninNumber, setNinNumber] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [hasImage, setHasImage] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Check if returning from photo quality check with an image
  useEffect(() => {
    if (params.photoUri) {
      setImageUri(params.photoUri as string);
      setHasImage(true);
    }
  }, [params]);

  const navigateBack = () => {
    router.back();
  };

  const handleAddImage = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status === 'granted') {
        // Open camera
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
        
        if (!result.canceled) {
          // Navigate to photo quality check with image URI
          router.push({
            pathname: '/contributor/photo-quality',
            params: { photoUri: result.assets[0].uri }
          });
        }
      } else {
        alert('Camera permission is required to take pictures');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // If camera fails, just navigate to photo quality check
      router.push('/contributor/photo-quality');
    }
  };

  const handleNext = () => {
    // Navigate to agent verification screen
    router.push('/contributor/agent-verification');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center p-4">
          <TouchableOpacity 
            onPress={navigateBack}
            className="bg-gray-100 p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center">Add New User</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView className="flex-1 px-4">
          {/* Title */}
          <Text className="text-3xl font-bold text-[#0052CC] mt-4">Add New User</Text>
          <Text className="text-gray-700 mb-6">Help your customer start their Esusu journey</Text>
          
          {/* Profile Image Section */}
          <View className="items-center mb-6">
            {hasImage ? (
              <View className="mb-2">
                <Image 
                  source={imageUri ? { uri: imageUri } : require('../../assets/images/icon.png')} 
                  className="w-24 h-24 rounded-2xl"
                />
                <TouchableOpacity onPress={handleAddImage}>
                  <Text className="text-green-500 text-center mt-2 font-medium">+ Change Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity 
                  onPress={handleAddImage}
                  className="bg-gray-50 w-full p-16 rounded-xl mb-2 items-center justify-center"
                >
                  <Image 
                    source={require('../../assets/images/icon.png')} 
                    className="w-20 h-24 rounded-2xl"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddImage}>
                  <Text className="text-green-500 text-center font-medium">+ Add User Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Form Fields */}
          <View className="space-y-4">
            {/* First Name */}
            <View>
              <Text className="text-gray-700 mb-1">First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                className="bg-gray-100 p-4 rounded-xl"
              />
            </View>
            
            {/* Last Name */}
            <View>
              <Text className="text-gray-700 mb-1">Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                className="bg-gray-100 p-4 rounded-xl"
              />
            </View>
            
            {/* Phone Number */}
            <View>
              <Text className="text-gray-700 mb-1">Phone Number</Text>
              <View className="flex-row">
                <View className="bg-gray-100 p-4 rounded-xl w-20 flex-row items-center justify-center mr-2">
                  <Image
                    source={require('../../assets/images/icon.png')}
                    style={{width: 24, height: 16}}
                  />
                  <Text className="ml-2">NG</Text>
                </View>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  className="bg-gray-100 p-4 rounded-xl flex-1"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            
            {/* NIN */}
            <View>
              <Text className="text-gray-700 mb-1">National Identity Number (NIN)</Text>
              <TextInput
                value={ninNumber}
                onChangeText={setNinNumber}
                placeholder="Enter NIN"
                className="bg-gray-100 p-4 rounded-xl"
                keyboardType="numeric"
              />
            </View>
            
            {/* Language Selection */}
            <View>
              <Text className="text-gray-700 mb-1">Language</Text>
              <View className="flex-row justify-between">
                {['English', 'Yoruba', 'Hausa', 'Igbo'].map((language) => (
                  <TouchableOpacity 
                    key={language}
                    className={`py-3 px-5 rounded-full ${selectedLanguage === language ? 'bg-[#E5F1FF]' : 'bg-gray-100'}`}
                    onPress={() => setSelectedLanguage(language)}
                  >
                    <Text 
                      className={selectedLanguage === language ? 'text-blue-600' : 'text-gray-500'}
                    >
                      {language}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View className="h-24" />
        </ScrollView>
        
        {/* Bottom Button */}
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity 
            onPress={handleNext}
            className="bg-blue-600 p-4 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-lg">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AddContributor; 