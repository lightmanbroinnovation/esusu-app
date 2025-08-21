import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendNotification, NotificationTemplates } from '../services/notificationService';
import NetInfo from '@react-native-community/netinfo';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from './EsusuLoader';
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';

const DURATION_OPTIONS = [
  { label: 'Daily', value: 'daily', minDays: 30 },
  { label: 'Weekly', value: 'weekly', minDays: 28 }, // 4 weeks
  { label: 'Monthly', value: 'monthly', minDays: 180 }, // 6 months
  { label: 'Yearly', value: 'yearly', minDays: 365 },
];

interface SavingsPlanSetupProps {
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
}

export default function SavingsPlanSetup() {
  const [savingsData, setSavingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('SavingsPlanSetup', 15);

  const router = useRouter();
  const params = useLocalSearchParams();
  const [depositAmount, setDepositAmount] = useState('');
  const [duration, setDuration] = useState('daily');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(moment().add(30, 'days').toDate());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    // Update end date when duration or start date changes
    const selected = DURATION_OPTIONS.find(opt => opt.value === duration);
    if (selected) {
      setEndDate(moment(startDate).add(selected.minDays, 'days').toDate());
    }
  }, [duration, startDate]);

  const navigateBack = () => {
    router.back();
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      if (!depositAmount) {
        alert('Please enter the deposit amount.');
        setLoading(false);
        return;
      }
      // Build FormData
      const formData = new FormData();
      formData.append('firstName', String(params.firstName));
      formData.append('lastName', String(params.lastName));
      formData.append('middleName', String(params.middleName));
      formData.append('phoneNumber', String(params.phoneNumber));
      formData.append('nin', String(params.nin));
      formData.append('gender', String(params.gender));
      formData.append('language', String(params.language));
      formData.append('depositAmount', String(depositAmount));
      formData.append('duration', String(duration));
      // Format dob as ISO date string
      const dobString = Array.isArray(params.dob) ? params.dob[0] : params.dob;
      formData.append('dob', new Date(dobString).toISOString());
      // Append the photo as a file (cast as any for React Native FormData)
      formData.append('photo', {
        uri: String(params.photo),
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      // Get auth token
      const token = await AsyncStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      const response = await fetch('https://esusu-server.onrender.com/api/contributor', {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok || response.status === 201 || responseData.status === 'Success') {
        await sendNotification(
          NotificationTemplates.contributor.added(String(params.firstName) || 'Contributor').title,
          NotificationTemplates.contributor.added(String(params.firstName) || 'Contributor').body,
          NotificationTemplates.contributor.added(String(params.firstName) || 'Contributor').type
        );
        setLoading(false);
        router.replace({ pathname: '/contributor/success', params: { contributor: 'true' } });
        return;
      } else {
        throw new Error(`Server error: ${response.status} - ${responseData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      setLoading(false);
      const err: any = error;
      let errorMsg = 'There was a problem adding the contributor. Please try again.';
      if (err && err.response && err.response.data && err.response.data.message) {
        errorMsg = err.response.data.message;
      } else if (err && err.message) {
        errorMsg = err.message;
      }
      alert(errorMsg);
    }
  };

  const fetchData = async (fromRefresh = false) => {
    // Check if we can fetch data
    if (!fromRefresh && !fetchGuard.canFetch()) {
      console.log('🚨 Data fetch blocked by guard');
      return;
    }

    // Check render guard
    if (!renderGuard.checkRender()) {
      console.log('🚨 Render blocked by guard');
      return;
    }

    setLoading(true);
    setError(null);
    let cacheData = null;
    
    try {
      const cached = await AsyncStorage.getItem('savings_plan');
      if (cached) {
        cacheData = JSON.parse(cached);
        setSavingsData(cacheData);
      }
    } catch {}
    
    if (!networkAvailable && cacheData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    if (fromRefresh) {
      await invalidateCache('savings_plan');
    }
    
    try {
      // Record the fetch attempt
      fetchGuard.recordFetch();
      
      // For now, just set some default data since the API function doesn't exist
      const data = { plan: 'basic', amount: 1000, frequency: 'daily' };
      setSavingsData(data);
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load savings plan data');
        setSavingsData(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only fetch data once on mount
    if (!fetchGuard.isInitialized()) {
      fetchData();
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Top Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 40 :44, marginBottom: 16 }}>
        <TouchableOpacity onPress={navigateBack} style={{ marginLeft: 16,  padding: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 56 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#222' }}>Add New User</Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Deposit Amount */}
        <Text style={{ fontSize: 16, color: '#222', marginBottom: 8, marginTop: 8 }}>Deposit Amount</Text>
        <View style={{ backgroundColor: '#F5F5F7', borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 18, color: '#888', marginLeft: 16 }}>₦</Text>
          <TextInput
            style={{ flex: 1, fontSize: 18, color: '#888', padding: 16, backgroundColor: 'transparent' }}
            placeholder="2,000"
            placeholderTextColor="#B0B0B0"
            value={depositAmount}
            onChangeText={setDepositAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Duration */}
        <Text style={{ fontSize: 16, color: '#222', marginBottom: 8 }}>Duration</Text>
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          {DURATION_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setDuration(opt.value)}
              style={{
                flex: 1,
                marginRight: opt.value !== 'yearly' ? 12 : 0,
                backgroundColor: duration === opt.value ? '#0A9447' : '#007AFF',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: duration === opt.value ? 2 : 0,
                borderColor: duration === opt.value ? '#D1FADF' : 'transparent',
                position: 'relative',
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{opt.label}</Text>
              {duration === opt.value && (
                <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#22C55E', borderRadius: 100 }}>
                  <Ionicons name="checkmark" size={18} color="white" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Date */}
        <Text style={{ fontSize: 16, color: '#222', marginBottom: 8 }}>Start Date</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#F5F5F7', borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 16 }}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={{ flex: 1, color: '#6B7280', fontSize: 16 }}>
            Starts Today: {moment(startDate).format('MMM D, YYYY')}
          </Text>
          <Ionicons name="calendar" size={22} color="#007AFF" />
        </TouchableOpacity>

        {/* End Date */}
        <Text style={{ fontSize: 16, color: '#222', marginBottom: 8 }}>End Date</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#F5F5F7', borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 32 }}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={{ flex: 1, color: '#6B7280', fontSize: 16 }}>
            Ends: {moment(endDate).format('MMM D, YYYY')}
          </Text>
          <Ionicons name="calendar" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Date Picker Modals */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
          minimumDate={new Date()}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              // Enforce minimum end date
              const selected = DURATION_OPTIONS.find(opt => opt.value === duration);
              const minEndDate = moment(startDate).add(selected?.minDays || 0, 'days');
              if (moment(selectedDate).isBefore(minEndDate)) {
                alert(`End date must be at least ${selected?.minDays} days after the start date.`);
                setEndDate(minEndDate.toDate());
              } else {
                setEndDate(selectedDate);
              }
            }
          }}
          minimumDate={moment(startDate).add(DURATION_OPTIONS.find(opt => opt.value === duration)?.minDays || 0, 'days').toDate()}
        />
      )}

      {/* Confirm Button */}
      <View style={{ padding: 20, paddingBottom: 32 }}>
        <TouchableOpacity
          onPress={handleNext}
          style={{ backgroundColor: '#007AFF', borderRadius: 20, paddingVertical: 18, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>Confirm & Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}; 