import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, FlatList, Platform, TextInput, ActivityIndicator, Modal, ScrollView as RNScrollView, StyleSheet } from 'react-native';
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              Business Location
            </Text>
            <Text style={styles.subtitle}>
              Upload clear photos of your shop to verify your business location.
            </Text>
          </View>

          {/* Instructions/Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: 24 }]}>
              Please take photos that clearly show:
            </Text>
            <View style={{ gap: 16 }}>
              <View style={styles.instructionItem}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>The front of your business with signage</Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>Inside your shop or business premises</Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>Any official business registration displayed</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: 'left', marginBottom: 16 }]}>Upload Business Location Photo</Text>
            
            {/* State Dropdown */}
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowStateDropdown(true)}
            >
              <Text style={state ? styles.dropdownButtonText : [styles.dropdownButtonText, styles.dropdownButtonTextPlaceholder]}>
                {state || 'Select the state'}
              </Text>
              <Ionicons name="chevron-down" size={20} style={styles.dropdownIcon} />
            </TouchableOpacity>
            
            <Modal
              visible={showStateDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowStateDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TextInput
                    placeholder="Search state..."
                    value={stateSearch}
                    onChangeText={setStateSearch}
                    style={styles.searchInput}
                    placeholderTextColor="#9CA3AF"
                  />
                  <RNScrollView style={styles.dropdownList}>
                    {states.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setState(s);
                          setShowStateDropdown(false);
                          setStateSearch('');
                          fetchCities(s);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNScrollView>
                  <TouchableOpacity onPress={() => setShowStateDropdown(false)} style={styles.modalCloseButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* City Dropdown */}
            <TouchableOpacity
              style={[styles.dropdownButton, { marginTop: 8, opacity: state ? 1 : 0.6 }]}
              onPress={() => state && setShowCityDropdown(true)}
              disabled={!state}
            >
              <Text style={city ? styles.dropdownButtonText : [styles.dropdownButtonText, styles.dropdownButtonTextPlaceholder]}>
                {city || 'Select the city'}
              </Text>
              <Ionicons name="chevron-down" size={20} style={styles.dropdownIcon} />
            </TouchableOpacity>

            <Modal
              visible={showCityDropdown}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCityDropdown(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <TextInput
                    placeholder="Search city..."
                    value={citySearch}
                    onChangeText={setCitySearch}
                    style={styles.searchInput}
                    placeholderTextColor="#9CA3AF"
                  />
                  <RNScrollView style={styles.dropdownList}>
                    {cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCity(c);
                          setShowCityDropdown(false);
                          setCitySearch('');
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNScrollView>
                  <TouchableOpacity onPress={() => setShowCityDropdown(false)} style={styles.modalCloseButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Notes input */}
            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
            />

            {/* Image preview and upload button */}
            {selectedImage && (
              <Text style={styles.selectedFileText}>
                Selected: {selectedImage.name || 'Image selected'}
              </Text>
            )}

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleTakePhoto}
            >
              <View style={styles.uploadIconContainer}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
              <Text style={styles.uploadButtonText}>
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
              style={styles.submitButton}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Upload</Text>
              )}
            </TouchableOpacity>

            {successMessage && (
              <View style={styles.successMessage}>
                <Text style={styles.successMessageText}>{successMessage}</Text>
              </View>
            )}
          </View>

          {existingPhotos.length > 0 && (
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 24
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    top: 24,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 20,
    zIndex: 10
  },
  modalCloseButton: {
    marginTop: 12,
    alignSelf: 'flex-end'
  },
  headerContainer: {
    marginTop: 64,
    marginBottom: 32
  },
  title: {
    color: '#0052CC',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16
  },
  section: {
    marginTop: 16,
    marginBottom: 32
  },
  sectionTitle: {
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  numberBadge: {
    backgroundColor: '#007BFF',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  numberText: {
    color: 'white',
    fontWeight: 'bold'
  },
  instructionText: {
    color: '#374151',
    flex: 1,
    fontSize: 16
  },
  inputLabel: {
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600'
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dropdownButtonText: {
    color: '#111827'
  },
  dropdownButtonTextPlaceholder: {
    color: '#9CA3AF'
  },
  dropdownIcon: {
    color: '#9B9B9B'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '85%',
    maxHeight: 400,
    padding: 16
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    padding: 8
  },
  dropdownList: {
    maxHeight: 300
  },
  dropdownItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#222222'
  },
  closeButtonText: {
    color: '#0072CE',
    fontWeight: 'bold'
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    marginTop: 8
  },
  selectedFileText: {
    color: '#065F46',
    fontSize: 12,
    marginTop: 8
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F1FF',
    paddingVertical: 24,
    borderRadius: 16,
    marginTop: 40
  },
  uploadIconContainer: {
    backgroundColor: '#007BFF',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  uploadButtonText: {
    color: '#007BFF',
    fontSize: 20,
    fontWeight: '500'
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600'
  },
  successMessage: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16
  },
  successMessageText: {
    color: '#065F46',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    backgroundColor: '#007BFF'
  },
  doneButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default BusinessLocationUpload;