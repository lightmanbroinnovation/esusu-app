import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, FlatList, Platform, TextInput, ActivityIndicator, Modal, ScrollView as RNScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { uploadBusinessLocation } from '../../services/api';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';

// Define location image interface to match the one in VerificationController
interface LocationImage {
  uri: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
}

interface BusinessLocationUploadProps {
  onClose: () => void;
  onTakePhoto: () => void;
  existingPhotos?: string[];
  locationData?: LocationImage[];
}

const BusinessLocationUpload = ({ 
  onClose, 
  onTakePhoto, 
  existingPhotos = [], 
  locationData = [] 
}: BusinessLocationUploadProps) => {
  
  // Format coordinates to be human-readable
  const formatCoordinates = (lat?: number, lng?: number) => {
    if (lat === undefined || lng === undefined) return "No location data";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };
  
  // Format timestamp to a readable date/time
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Find location data for a photo if available
  const getLocationData = (photoUri: string) => {
    const photo = locationData.find(p => p.uri === photoUri);
    return photo;
  };

  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Fetch all states (copied from BusinessInfoForm)
  const getStatesFromApi = async () => {
    try {
      let response = await fetch('https://nga-states-lga.onrender.com/fetch');
      let json = await response.json();
      if (json.states) return json.states;
      if (json.data && json.data.states) return json.data.states;
      if (Array.isArray(json)) return json;
      return [];
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  };

  // Fetch LGAs/cities for a state (copied from BusinessInfoForm)
  const getLgasFromApi = async (state: string) => {
    try {
      let response = await fetch(`https://nga-states-lga.onrender.com/?state=${encodeURIComponent(state)}`);
      let json = await response.json();
      if (json.lga) return json.lga;
      if (json.data && json.data.lga) return json.data.lga;
      if (json.cities) return json.cities;
      if (Array.isArray(json)) return json;
      return [];
    } catch (error) {
      console.error(`Error fetching LGAs for state ${state}:`, error);
      return [];
    }
  };

  useEffect(() => {
    const fetchStates = async () => {
      const stateList = await getStatesFromApi();
      setStates(stateList);
    };
    fetchStates();
  }, []);

  const fetchCities = async (stateName: string) => {
    setCities([]);
    setCity('');
    const cityList = await getLgasFromApi(stateName);
    setCities(cityList);
  };

  // Handle image selection (web)
  const handleChooseImage = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        (fileInputRef.current as HTMLInputElement).click();
      }
    } else {
      // For mobile, use a file picker or camera (not implemented here)
      alert('Image upload for mobile not implemented');
    }
  };

  // Handle file input change for web
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Get geolocation after image is selected
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedImage) return;
    setIsUploading(true);
    try {
      const payload = {
        locationImage: selectedImage,
        longitude,
        latitude,
        city,
        state,
        notes
      };
      const response = await uploadBusinessLocation(payload);
      if ((response && response.status === 'Success') || response.success === true) {
        await sendNotification(
          NotificationTemplates.registration.verification.submitted.title,
          NotificationTemplates.registration.verification.submitted.body,
          NotificationTemplates.registration.verification.submitted.type
        );
        setSuccessMessage('Business location uploaded successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
          window.location.href = '/verification/';
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading business location:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Replace the old Choose Image button and inputs here
  const handleTakePhoto = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        (fileInputRef.current as HTMLInputElement).click();
      }
    } else {
      alert('Image upload for mobile not implemented');
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-6">
          <TouchableOpacity 
            className="absolute right-6 top-6 bg-gray-100 p-2 rounded-full z-10"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          <View className="mt-16 mb-8">
            <Text className="text-[#0052CC] text-3xl font-bold text-center">
              Business Location
            </Text>
            <Text className="text-gray-600 text-base text-center mt-2 px-4">
              Upload clear photos of your shop to verify your business location.
            </Text>
          </View>

          {/* Instructions/Notes moved to top */}
          <View className="mt-4 mb-8">
            <Text className="text-gray-700 mb-6 text-center">
              Please take photos that clearly show:
            </Text>
            <View className="space-y-4">
              <View className="flex-row items-center">
                <View className="bg-[#007BFF] rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Text className="text-white font-bold">1</Text>
                </View>
                <Text className="text-gray-700 flex-1">The front of your business with signage</Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-[#007BFF] rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Text className="text-white font-bold">2</Text>
                </View>
                <Text className="text-gray-700 flex-1">Inside your shop or business premises</Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-[#007BFF] rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Text className="text-white font-bold">3</Text>
                </View>
                <Text className="text-gray-700 flex-1">Any official business registration displayed</Text>
              </View>
            </View>
          </View>

          <View className="mt-4 mb-8">
            <Text className="text-gray-700 mb-4 font-semibold">Upload Business Location Photo</Text>
            {/* State Dropdown */}
            <TouchableOpacity
              className="border border-gray-300 rounded-lg p-3 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setShowStateDropdown(true)}
            >
              <Text className={state ? "text-gray-800" : "text-gray-400"}>{state || 'Select the state'}</Text>
              <Ionicons name={'chevron-down'} size={20} color="#9B9B9B" />
            </TouchableOpacity>
            <Modal
              visible={showStateDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowStateDropdown(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'white', borderRadius: 12, width: '85%', maxHeight: 400, padding: 16 }}>
                  <TextInput
                    placeholder="Search state..."
                    value={stateSearch}
                    onChangeText={setStateSearch}
                    style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 12, padding: 8 }}
                  />
                  <RNScrollView style={{ maxHeight: 300 }}>
                    {states.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}
                        onPress={() => {
                          setState(s);
                          setShowStateDropdown(false);
                          setStateSearch('');
                          fetchCities(s);
                        }}
                      >
                        <Text style={{ fontSize: 16, color: '#222' }}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNScrollView>
                  <TouchableOpacity onPress={() => setShowStateDropdown(false)} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
                    <Text style={{ color: '#0072CE', fontWeight: 'bold' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {/* City Dropdown */}
            <TouchableOpacity
              className="border border-gray-300 rounded-lg p-3 bg-gray-50 flex-row justify-between items-center mt-2"
              onPress={() => state && setShowCityDropdown(true)}
              disabled={!state}
            >
              <Text className={city ? "text-gray-800" : "text-gray-400"}>{city || 'Select the city'}</Text>
              <Ionicons name={'chevron-down'} size={20} color="#9B9B9B" />
            </TouchableOpacity>
            <Modal
              visible={showCityDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCityDropdown(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: 'white', borderRadius: 12, width: '85%', maxHeight: 400, padding: 16 }}>
                  <TextInput
                    placeholder="Search city..."
                    value={citySearch}
                    onChangeText={setCitySearch}
                    style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 12, padding: 8 }}
                  />
                  <RNScrollView style={{ maxHeight: 300 }}>
                    {cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}
                        onPress={() => {
                          setCity(c);
                          setShowCityDropdown(false);
                          setCitySearch('');
                        }}
                      >
                        <Text style={{ fontSize: 16, color: '#222' }}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNScrollView>
                  <TouchableOpacity onPress={() => setShowCityDropdown(false)} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
                    <Text style={{ color: '#0072CE', fontWeight: 'bold' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {/* Notes input */}
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-gray-50 mt-2"
              placeholder="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
            />
            {/* Image preview and upload button */}
            {selectedImage && (
              <Text className="text-green-700 text-xs mt-2">Selected: {selectedImage.name || 'Image selected'}</Text>
            )}
            <TouchableOpacity
              className="flex-row items-center justify-center bg-[#E5F1FF] py-6 rounded-xl mt-10"
              onPress={() => {
                if (Platform.OS === 'web') {
                  if (fileInputRef.current) {
                    (fileInputRef.current as HTMLInputElement).click();
                  }
                } else {
                  alert('Image upload for mobile not implemented');
                }
              }}
            >
              <View className="bg-[#007BFF] rounded-full w-12 h-12 items-center justify-center mr-4">
                <Ionicons name="camera" size={24} color="white" />
              </View>
              <Text className="text-[#007BFF] text-xl font-medium">
                Take Photo
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            )}
            <TouchableOpacity
              className="bg-[#007BFF] py-3 rounded-lg mt-4"
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-center font-semibold">Upload</Text>
              )}
            </TouchableOpacity>
            {successMessage && (
              <View style={{ backgroundColor: '#D1FAE5', borderRadius: 8, padding: 12, marginTop: 16 }}>
                <Text style={{ color: '#065F46', fontWeight: 'bold', textAlign: 'center' }}>{successMessage}</Text>
              </View>
            )}
          </View>

          {existingPhotos.length > 0 && (
            <TouchableOpacity 
              className="py-4 rounded-xl mt-6 bg-[#007BFF]"
              onPress={onClose}
            >
              <Text className="text-white text-center text-lg font-medium">
                Done
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BusinessLocationUpload; 