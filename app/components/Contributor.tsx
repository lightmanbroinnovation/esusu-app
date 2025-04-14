import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Contributor: React.FC = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ninNumber, setNinNumber] = useState('');
  const [language, setLanguage] = useState('');
  const [image, setImage] = useState('');
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [account, setAccount] = useState(null);

  const handleNext = () => {
    if (validateForm()) {
      // Log all form data before proceeding
      console.log('Image data before navigation:', JSON.stringify({
        photoUri: image,
        imageUrl: cloudinaryUrl,
        isCloudinaryUrl: !!cloudinaryUrl
      }));
      
      router.push({
        pathname: '/contributor/agent-verification',
        params: {
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phoneNumber,
          ninNumber: ninNumber,
          language: language,
          photoUri: image,
          imageUrl: cloudinaryUrl,
          isCloudinaryUrl: !!cloudinaryUrl ? "true" : "false"
        }
      });
    }
  };

  const validateForm = () => {
    // Implement form validation logic here
    return true; // Placeholder return, actual implementation needed
  };

  return (
    <View>
      {/* Render your form components here */}
    </View>
  );
};

export default Contributor; 