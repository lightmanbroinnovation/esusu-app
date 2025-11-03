import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Modal, 
  Platform, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  TextInputProps, 
  TouchableOpacityProps,
  ScrollViewProps,
  ModalProps
} from 'react-native';
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Business Info</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          
          {successMessage && (
            <View style={styles.successMessage}>
              <Text style={styles.successMessageText}>{successMessage}</Text>
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add Your Business Info</Text>
            <Text style={styles.subtitle}>
              Tell us about your business so we can verify and support your operations.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter business name"
                placeholderTextColor="#9CA3AF"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={styles.flex1}>
                <Text style={styles.label}>State</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowStateDropdown(true)}
                >
                  <Text style={[styles.dropdownButtonText, state ? styles.dropdownButtonTextSelected : styles.dropdownButtonTextPlaceholder]}>
                    {state || 'Select the state'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9B9B9B" />
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
                        placeholderTextColor="#9CA3AF"
                        value={stateSearch}
                        onChangeText={setStateSearch}
                        style={styles.searchInput}
                      />
                      <ScrollView style={styles.modalScrollView}>
                        {states.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map((s) => (
                          <TouchableOpacity
                            key={s}
                            style={styles.modalItem}
                            onPress={() => {
                              setState(s);
                              setShowStateDropdown(false);
                              setStateSearch('');
                              fetchCities(s);
                            }}
                          >
                            <Text style={styles.modalItemText}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity 
                        onPress={() => setShowStateDropdown(false)} 
                        style={styles.modalCloseButton}
                      >
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>City</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, !state && styles.dropdownButtonDisabled]}
                  onPress={() => state && setShowCityDropdown(true)}
                  disabled={!state}
                >
                  <Text style={[
                    styles.dropdownButtonText, 
                    city ? styles.dropdownButtonTextSelected : styles.dropdownButtonTextPlaceholder,
                    !state && styles.dropdownButtonTextDisabled
                  ]}>
                    {city || 'Select the city'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={!state ? "#D1D5DB" : "#9B9B9B"} />
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
                        placeholderTextColor="#9CA3AF"
                        value={citySearch}
                        onChangeText={setCitySearch}
                        style={styles.searchInput}
                      />
                      <ScrollView style={styles.modalScrollView}>
                        {cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map((c) => (
                          <TouchableOpacity
                            key={c}
                            style={styles.modalItem}
                            onPress={() => {
                              setCity(c);
                              setShowCityDropdown(false);
                              setCitySearch('');
                            }}
                          >
                            <Text style={styles.modalItemText}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity 
                        onPress={() => setShowCityDropdown(false)} 
                        style={styles.modalCloseButton}
                      >
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CAC Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter CAC number"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={cacNumber}
                onChangeText={setCacNumber}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Upload Your CAC Document</Text>
              <View style={styles.uploadContainer}>
                <Ionicons name="cloud-upload-outline" size={40} color="#0072CE" />
                <Text style={styles.uploadText}>Choose a file & drop it here</Text>
                <Text style={styles.uploadSubtext}>JPEG, and PNG formats, up to 5MB</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleChooseDocument}
                >
                  <Text style={styles.uploadButtonText}>Choose from Browser</Text>
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
                {/* Show selected file name if available */}
                {cacDocumentName && Platform.OS === 'web' && (
                  <View style={styles.selectedFileContainer}>
                    <Text style={styles.selectedFileText}>Selected: {cacDocumentName}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Layout
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 24,
  },
  formContainer: {
    marginTop: 8,
    gap: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 4,
  },
  backButton: {
    borderRadius: 100,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#222',
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  
  // Success Message
  successMessage: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successMessageText: {
    color: '#065F46',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Title & Subtitle
  titleContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  title: {
    color: '#0052CC',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  
  // Form Elements
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Dropdown
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownButtonTextSelected: {
    color: '#111827',
  },
  dropdownButtonTextPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownButtonTextDisabled: {
    color: '#9CA3AF',
  },
  
  // Modal
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white', 
    borderRadius: 12, 
    width: '85%', 
    maxHeight: 400, 
    padding: 16,
  },
  searchInput: {
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 8, 
    marginBottom: 12, 
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16, 
    color: '#111827',
  },
  modalCloseButton: {
    marginTop: 12, 
    alignSelf: 'flex-end',
  },
  modalCloseButtonText: {
    color: '#0072CE', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Upload Section
  uploadContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    height: 160,
  },
  uploadText: {
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 16,
  },
  uploadSubtext: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  uploadButton: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  uploadButtonText: {
    color: '#0072CE',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedFileContainer: {
    marginTop: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
  selectedFileText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Submit Button
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  submitButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default BusinessInfoForm; 