import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
// TODO: Replace with Moti Skeleton

import { fetchUser, updateUser } from '@/services/api';
import { uploadUserDocument } from '../utils/documentUtils';
import StatusBarAdapter from '../components/StatusBarAdapter';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';

interface UserDetails {
    id: string;
    phonenumber: string;
    pin: string;
    firstname: string;
    lastname: string;
    email: string;
    business: string;
    address: string;
    city: string;
    state: string;
    bvn: string;
    idImage: string;
    cacImage: string;
    isVerified: boolean;
    gender?: string;
    dob?: string;
    userImg?: string;
}

const fetchAccountData = async () => {
  const response = await fetchUser();
  if (response.status === 'Success' && response.data?.user) {
    return response.data.user;
  } else {
    throw new Error('Failed to fetch user data');
  }
};

const normalizeUser = (user: any): UserDetails => ({
  id: user._id || user.id || '',
  firstname: user.firstName || user.firstname || '',
  lastname: user.lastName || user.lastname || '',
  email: user.email || '',
  phonenumber: user.phoneNumber || user.phonenumber || '',
  business: user.business || '',
  address: user.address || '',
  city: user.city || '',
  state: user.state || '',
  bvn: user.bvn || '',
  idImage: user.idImage || '',
  cacImage: user.cacImage || '',
  isVerified: user.isVerified ?? true,
  userImg: user.userImg,
  gender: user.gender || '',
  dob: user.dob || '',
  pin: user.pin || '', // Ensure pin is always present
});

function MyAccount() {
    const router = useRouter();
    
    // Use back button handler for account page
    useBackButtonHandler('/account');
    
    const [dob, setDob] = useState<Date | undefined>();
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [gender, setGender] = useState<string | undefined>(undefined);
    const [showGenderPicker, setShowGenderPicker] = useState<boolean>(false);
    const [address, setAddress] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    // Responsive sizing based on screen width
    const getResponsiveSize = (baseSize: number) => {
        const { width } = require('react-native').Dimensions.get('window');
        if (width < 375) {
            return baseSize * 0.9; // Small phones
        } else if (width < 414) {
            return baseSize; // Medium phones
        } else {
            return baseSize * 1.1; // Large phones and tablets
        }
    };

    const handlePreviousPage = () => {
        router.back();
    };

    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [networkAvailable, setNetworkAvailable] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkAvailable(!!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    const fetchData = async (fromRefresh = false) => {
        setLoading(true);
        setError(null);
        let cacheData = null;
        try {
            const cached = await AsyncStorage.getItem('account_user');
            if (cached) {
                const parsed = JSON.parse(cached);
                setUserDetails(normalizeUser(parsed));
                cacheData = parsed;
            }
        } catch {}
        if (!networkAvailable && cacheData) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        if (fromRefresh) {
            await invalidateCache('account_user');
        }
        try {
            const data = await getCachedData('account_user', fetchAccountData);
            setUserDetails(normalizeUser(data));
        } catch (err) {
            if (!cacheData) {
                setError('Could not fetch your profile. Please try again later.');
                setUserDetails(null);
            }
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData(true);
        setRefreshing(false);
    };

    if (loading) {
        return <EsusuLoader />;
    }

    const handleRetry = () => {
        fetchData(true);
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'set') {
            const currentDate = selectedDate || dob;
            setShowDatePicker(false);
            setDob(currentDate);
        } else {
            setShowDatePicker(false);
        }
    };
    
    // Handle image upload
    const handleImageUpload = async () => {
        try {
            // Request permissions
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'We need access to your media library to upload photos');
                    return;
                }
            }
            
            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                
                // Upload to Cloudinary
                setUploadingImage(true);
                
                try {
                    if (!userDetails?.id) {
                        throw new Error("User ID not available");
                    }
                    
                    console.log("Uploading profile image to Cloudinary...");
                    const cloudinaryUrl = await uploadUserDocument(
                        selectedImage.uri, 
                        'profile_image', 
                        userDetails.id
                    );
                    
                    if (cloudinaryUrl) {
                        // Update user data with new image URL
                        const updatedUser = await updateUser(userDetails.id, {
                            ...userDetails,
                            userImg: cloudinaryUrl
                        });
                        
                        // Update local state
                        setUserDetails({
                            ...userDetails,
                            userImg: cloudinaryUrl
                        });
                        
                        Alert.alert("Success", "Profile photo updated successfully");
                    }
                } catch (error) {
                    console.error("Error uploading image:", error);
                    Alert.alert("Upload Failed", "There was a problem uploading your image. Please try again.");
                } finally {
                    setUploadingImage(false);
                }
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "There was a problem selecting your image.");
        }
    };
    
    // Since all fields are read-only, we only show the user profile
    // We don't need a save button functionality
    const handleSaveProfile = () => {
        Alert.alert(
            "View Only Mode", 
            "Profile information can only be viewed, not edited.",
            [{ text: "OK" }]
        );
    };

    return (
        <ScrollView style={{flex:1, backgroundColor: '#fff'}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
            
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-8 pb-4 bg-white">
                <TouchableOpacity onPress={handlePreviousPage}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
                <Text className="text-lg font-semibold">My Account</Text>
                <View className="w-8" />
            </View>

                    {/* Profile Section */}
                    <View className="items-center mb-6">
                      <View className="relative">
                        <View className="rounded-full overflow-hidden bg-white justify-center items-center" style={{
                          borderRadius: getResponsiveSize(40),
                          width: getResponsiveSize(80),
                          height: getResponsiveSize(80)
                        }}>
                          {uploadingImage ? (
                            <View style={{
                              width: getResponsiveSize(80),
                              height: getResponsiveSize(80),
                              backgroundColor: '#E5E7EB',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <ActivityIndicator size="large" color="#0052CC" />
                            </View>
                          ) : userDetails?.userImg ? (
                            <Image
                              source={{ uri: userDetails.userImg }}
                              style={{ 
                                width: getResponsiveSize(80), 
                                height: getResponsiveSize(80) 
                              }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{
                              width: getResponsiveSize(80),
                              height: getResponsiveSize(80),
                              backgroundColor: '#0072CE',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <Text style={{
                                fontSize: getResponsiveSize(32),
                                fontWeight: 'bold',
                                color: 'white'
                              }}>
                                {userDetails?.firstname ? userDetails.firstname.charAt(0).toUpperCase() : 'U'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity 
                          className="absolute bottom-0 right-0 bg-[#928FFF] rounded-full p-1"
                          style={{
                            padding: getResponsiveSize(4),
                            borderRadius: getResponsiveSize(12)
                          }}
                          onPress={handleImageUpload}
                          disabled={uploadingImage}
                        >
                          <Ionicons name="camera" size={getResponsiveSize(18)} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Input Fields */}
                    <View className="flex flex-col items-start gap-3 mt-4 px-4">
                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">First Name</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                            value={userDetails?.firstname || ''}
                                    editable={false}
                                    placeholder="First Name"
                                    placeholderTextColor="#A9A8AF"
                                />
                        <Image source={require('../assets/images/lock.png')} />
                            </View>
                        </View>
                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Last Name</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                            value={userDetails?.lastname || ''}
                                    editable={false}
                                    placeholder="Last Name"
                                    placeholderTextColor="#A9A8AF"
                                />
                        <Image source={require('../assets/images/lock.png')} />
                            </View>
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Business Name</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                            value={userDetails?.business || ''}
                                    editable={false}
                                    placeholder="Business Name"
                                    placeholderTextColor="#A9A8AF"
                                />
                        <Image source={require('../assets/images/lock.png')} />
                            </View>
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Email Address</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                            value={userDetails?.email || ''}
                                    editable={false}
                                    placeholder="Email Address"
                                    placeholderTextColor="#A9A8AF"
                                />
                        <Image source={require('../assets/images/lock.png')} />
                            </View>
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Phone Number</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                            value={userDetails?.phonenumber || ''}
                                    editable={false}
                                    placeholder="Phone Number"
                                    placeholderTextColor="#A9A8AF"
                                />
                        <Image source={require('../assets/images/lock.png')} />
                            </View>
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Date of Birth</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                                    value={userDetails?.dob ? new Date(userDetails.dob).toLocaleDateString() : ''}
                                    editable={false}
                                    placeholder="Date of Birth"
                                    placeholderTextColor="#A9A8AF"
                                />
                        <Image source={require('../assets/images/lock.png')} />
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={dob || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Gender</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                                    value={gender || userDetails?.gender || ''} 
                                    editable={false}
                                    placeholder="Gender"
                                    placeholderTextColor="#A9A8AF"
                                />
                        <Image source={require('../assets/images/lock.png')} />
                            </View>

                            {showGenderPicker && (
                                <Picker
                                    selectedValue={gender}
                                    onValueChange={(itemValue) => {
                                        setGender(itemValue);
                                        setShowGenderPicker(false);
                                    }}
                                    style={{ height: 50, width: '100%' }}
                                >
                                    <Picker.Item label="Select Gender" value="" />
                                    <Picker.Item label="Male" value="Male" />
                                    <Picker.Item label="Female" value="Female" />
                                    <Picker.Item label="Other" value="Other" />
                                </Picker>
                            )}
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Address</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                            value={userDetails?.address || ''}
                                    editable={false}
                                    placeholder="Address"
                                    placeholderTextColor="#A9A8AF"
                                />
                        <Image source={require('../assets/images/lock.png')} />
                            </View>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity 
                        className="bg-blue-600 mx-4 mt-8 mb-10 py-3 rounded-md items-center"
                        onPress={handleSaveProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text className="text-white font-semibold">Back to Dashboard</Text>
                        )}
                    </TouchableOpacity>

            {/* Show error or loading as a banner, not as a full screen */}
            {loading && (
                <View style={{padding: 8, alignItems: 'center'}}>
                    <ActivityIndicator size="small" color="#0052CC" />
                    <Text style={{color:'#A9A8AF'}}>Loading...</Text>
                </View>
            )}
        </ScrollView>
    );
}

export default MyAccount;

