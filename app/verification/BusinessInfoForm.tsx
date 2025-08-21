import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { uploadCacDocument } from '../../services/api';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';

interface BusinessInfoFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const BusinessInfoForm = ({ onClose, onSave }: BusinessInfoFormProps) => {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [cacDocumentFile, setCacDocumentFile] = useState<File | null>(null); // For web
  const [cacDocument, setCacDocument] = useState<string | null>(null); // For mobile URI fallback
  const [cacDocumentName, setCacDocumentName] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [identityType, setIdentityType] = useState('CAC'); // Default to CAC
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all states
  const getStatesFromApi = async () => {
    try {
      let response = await fetch('https://nga-states-lga.onrender.com/fetch');
      let json = await response.json();
      console.log('States API response:', json);
      console.log('Response type:', typeof json);
      console.log('Response keys:', Object.keys(json));
      
      // Try different possible response structures
      if (json.states) {
        console.log('Found states in json.states:', json.states);
        return json.states;
      } else if (json.data && json.data.states) {
        console.log('Found states in json.data.states:', json.data.states);
        return json.data.states;
      } else if (Array.isArray(json)) {
        console.log('Response is an array:', json);
        return json;
      } else {
        console.log('No states found in response, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  };

  // Fetch LGAs/cities for a state
  const getLgasFromApi = async (state: string) => {
    try {
      let response = await fetch(`https://nga-states-lga.onrender.com/?state=${encodeURIComponent(state)}`);
      let json = await response.json();
      console.log(`LGAs API response for state ${state}:`, json);
      console.log('Response type:', typeof json);
      console.log('Response keys:', Object.keys(json));
      
      // Try different possible response structures
      if (json.lga) {
        console.log('Found lga in json.lga:', json.lga);
        return json.lga;
      } else if (json.data && json.data.lga) {
        console.log('Found lga in json.data.lga:', json.data.lga);
        return json.data.lga;
      } else if (json.cities) {
        console.log('Found cities in json.cities:', json.cities);
        return json.cities;
      } else if (Array.isArray(json)) {
        console.log('Response is an array:', json);
        return json;
      } else {
        console.log('No LGAs found in response, returning empty array');
        return [];
      }
    } catch (error) {
      console.error(`Error fetching LGAs for state ${state}:`, error);
      return [];
    }
  };

  useEffect(() => {
    // Fetch states on mount using the new API
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

  const handleSubmit = async () => {
    const formData = {
      identityType,
      businessAddress,
      regNumber: cacNumber,
      document: Platform.OS === 'web' ? cacDocumentFile : cacDocument,
      businessName,
    };
    console.log('Business Info Form Data:', formData);
    try {
      const response = await uploadCacDocument(formData);
      if (response && (response.status === 'Success' || response.success === true)) {
        await sendNotification(
          NotificationTemplates.registration.verification.submitted.title,
          NotificationTemplates.registration.verification.submitted.body,
          NotificationTemplates.registration.verification.submitted.type
        );
        setSuccessMessage('CAC document uploaded successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
          router.push({
            pathname: '/verification/BusinessLocationUpload',
            params: { state, city }
          });
        }, 2000);
        return;
      }
      onSave(formData);
      router.push({ 
        pathname: '/verification/BusinessLocationUpload',
        params: { state, city }
      });
    } catch (error) {
      console.error('Error uploading CAC document:', error);
    }
  };

  const handleChooseDocument = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        (fileInputRef.current as HTMLInputElement).click();
      }
    } else {
      // For mobile, use a file picker (not implemented here)
    alert('Choosing document from browser (feature to be implemented)');
    setCacDocument('dummy_cac_document_uri.pdf');
      setCacDocumentName('dummy_cac_document_uri.pdf');
    }
  };

  // Handle file input change for web
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setCacDocumentFile(file);
      setCacDocumentName(file.name);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header styled like transaction-pin.tsx */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 4 }}>
            <TouchableOpacity
              style={{  borderRadius: 100, marginRight: 8 }}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>Business Info</Text>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'transparent', marginLeft: 8 }} />
          </View>
          {successMessage && (
            <View style={{ backgroundColor: '#D1FAE5', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#065F46', fontWeight: 'bold', textAlign: 'center' }}>{successMessage}</Text>
            </View>
          )}

          <View className="mt-4 mb-8">
            <Text className="text-[#0052CC] text-3xl font-bold text-center">
              Add Your Business Info
            </Text>
            <Text className="text-gray-600 text-base text-center mt-2 px-4">
              Tell us about your business so we can verify and support your operations.
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 mb-1 font-medium">Business Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="Enter business name"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Business Address</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="Enter address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
            </View>

            <View className="flex-row justify-between space-x-4">
              <View className="flex-1">
                <Text className="text-gray-700 mb-1 font-medium">State</Text>
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
                      <ScrollView style={{ maxHeight: 300 }}>
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
                      </ScrollView>
                      <TouchableOpacity onPress={() => setShowStateDropdown(false)} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
                        <Text style={{ color: '#0072CE', fontWeight: 'bold' }}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 mb-1 font-medium">City</Text>
                <TouchableOpacity
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50 flex-row justify-between items-center"
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
                      <ScrollView style={{ maxHeight: 300 }}>
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
                      </ScrollView>
                      <TouchableOpacity onPress={() => setShowCityDropdown(false)} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
                        <Text style={{ color: '#0072CE', fontWeight: 'bold' }}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">CAC Number</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                placeholder="Enter CAC number"
                keyboardType="number-pad"
                value={cacNumber}
                onChangeText={setCacNumber}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Upload Your CAC Document</Text>
              <View className="border border-dashed border-gray-400 rounded-lg p-6 items-center justify-center bg-gray-50 h-40">
                <Ionicons name="cloud-upload-outline" size={40} color="#0072CE" />
                <Text className="text-gray-600 mt-2 text-center">Choose a file & drop it here</Text>
                <Text className="text-gray-500 text-xs mt-1">JPEG, and PNG formats, up to 5MB</Text>
                <TouchableOpacity
                  className="bg-blue-100 py-2 px-4 rounded-lg mt-3"
                  onPress={handleChooseDocument}
                >
                  <Text className="text-[#0072CE] font-semibold">Choose from Browser</Text>
                </TouchableOpacity>
                {/* Hidden file input for web */}
                {Platform.OS === 'web' && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                )}
                {/* Show selected file name if available, styled inside the parent */}
                {cacDocumentName && Platform.OS === 'web' && (
                  <View style={{ marginTop: 8, backgroundColor: '#F0FDF4', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'stretch', alignItems: 'flex-start' }}>
                    <Text style={{ color: '#166534', fontSize: 13, fontWeight: '500' }}>Selected: {cacDocumentName}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity 
            className="bg-[#007BFF] py-4 rounded-xl mt-8"
            onPress={handleSubmit}
          >
            <Text className="text-white text-center text-lg font-medium">
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BusinessInfoForm; 