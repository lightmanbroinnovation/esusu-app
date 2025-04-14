import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { fetchUser } from '@/services/api';
import StatusBarAdapter from '../components/StatusBarAdapter';

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
}

// Mock data as fallback


export default function MyAccount() {
    const [dob, setDob] = useState<Date | undefined>();
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [gender, setGender] = useState<string | undefined>(undefined);
    const [showGenderPicker, setShowGenderPicker] = useState<boolean>(false);
    const [address, setAddress] = useState('');

    const router = useRouter();

    const handlePreviousPage = () => {
        router.back();
    };

    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    
    const id = "62f2"; // Using the same ID as in other screens

    const fetchUserDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching user with ID:", id);
            const data = await fetchUser(id);
            console.log("Fetched user data:", data);
            
            if (data) {
                setUserDetails(data);
                setAddress(data.address || '');
            } else {
                throw new Error("No data returned from API");
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            setError("Could not fetch your profile. Using cached data.");
            // Use mock data as fallback
            setUserDetails(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, [id, retryCount]);

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
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

    return (
        <ScrollView className="flex-1 bg-white">
            <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
            
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-10 mt-8">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
                    <Image
                        source={require('../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">My Account</Text>
                <View className="w-8" />
            </View>

            {loading ? (
                <View className="items-center justify-center py-20">
                    <ActivityIndicator size="large" color="#0052CC" />
                    <Text className="mt-4 text-gray-600">Loading your profile...</Text>
                </View>
            ) : error ? (
                <View className="items-center justify-center px-4 py-8">
                    <Text className="text-gray-600 text-center mb-4">{error}</Text>
                    <TouchableOpacity 
                        className="bg-blue-600 px-6 py-2 rounded-md"
                        onPress={handleRetry}
                    >
                        <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Avatar */}
                    <View className="items-center mt-8 mb-6">
                        <View className="relative">
                            <Image
                                source={require('../assets/images/user.png')}
                                className="w-28 h-28 rounded-full"
                            />
                            <TouchableOpacity className="absolute bottom-0 right-0 bg-[#928FFF] rounded-full p-1">
                                <Ionicons name="camera" size={18} color="white" />
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
                                    value={userDetails?.firstname}
                                    editable={false}
                                    placeholder="First Name"
                                    placeholderTextColor="#A9A8AF"
                                />
                                <Image
                                    source={require('../assets/images/lock.png')}
                                />
                            </View>
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Business Name</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                                    value={userDetails?.business}
                                    editable={false}
                                    placeholder="Business Name"
                                    placeholderTextColor="#A9A8AF"
                                />
                                <Image
                                    source={require('../assets/images/lock.png')}
                                />
                            </View>
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Email Address</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                                    value={userDetails?.email}
                                    editable={false}
                                    placeholder="Email Address"
                                    placeholderTextColor="#A9A8AF"
                                />
                                <Image
                                    source={require('../assets/images/lock.png')}
                                />
                            </View>
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Phone Number</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                                    value={userDetails?.phonenumber}
                                    editable={false}
                                    placeholder="Phone Number"
                                    placeholderTextColor="#A9A8AF"
                                />
                                <Image
                                    source={require('../assets/images/lock.png')}
                                />
                            </View>
                        </View>

                        <View className='flex flex-col gap-2 w-full'>
                            <Text className="text-base font-medium text-[#272636]">Date of Birth</Text>
                            <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                                <TextInput
                                    className="text-[#272636] flex-1"
                                    value={dob ? dob.toLocaleDateString() : ''}
                                    editable={false}
                                    placeholder="Select Date of Birth"
                                    placeholderTextColor="#A9A8AF"
                                />
                                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                    <Image source={require('../assets/images/calendar.png')} />
                                </TouchableOpacity>
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
                                    value={gender || ''} 
                                    editable={false}
                                    placeholder="Select Gender"
                                    placeholderTextColor="#A9A8AF"
                                />
                                <TouchableOpacity onPress={() => setShowGenderPicker(true)}>
                                    <Image source={require('../assets/images/arrow-down.png')} />
                                </TouchableOpacity>
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
                                    value={userDetails?.address}
                                    editable={false}
                                    placeholder="Address"
                                    placeholderTextColor="#A9A8AF"
                                />
                                <Image
                                    source={require('../assets/images/lock.png')}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity className="bg-blue-600 mx-4 mt-8 mb-10 py-3 rounded-md items-center">
                        <Text className="text-white font-semibold">Save</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

