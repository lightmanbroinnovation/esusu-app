import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import { fetchUser } from '@/services/api';

interface UserDetails {
    id: string;
    phone: string;
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

export default function MyAccount() {
    const [dob, setDob] = useState<Date | undefined>();
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [gender, setGender] = useState<string | undefined>(undefined);
    const [showGenderPicker, setShowGenderPicker] = useState<boolean>(false);
    const [address, setAddress] = useState('');

    const router = useRouter()

    const handlePreviousPage = () => {
        router.back()
    }


    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const id = "2101";
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await fetchUser(id);
                setUserDetails(data);
            } catch (error) {
                console.error("Error fetching user details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

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
        <ScrollView className="flex-1 bg-white px-4 pt-10">
            {/* Header */}
            <View className="flex-row items-center gap-[113px] mt-[2rem]">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
                    <Image
                        source={require('../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">My Account</Text>
            </View>

            {/* Avatar */}
            <View className="items-center mt-12 mb-6">
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
            <View className="flex flex-col items-start gap-3 mt-8">
                <View className='flex flex-col gap-2 w-full'>
                    <Text className="text-base font-medium text-[#272636]">First Name</Text>
                    <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                        <TextInput
                            className="text-[#A9A8AF]"
                            value={userDetails?.firstname}
                            editable={false}
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
                            className="text-[#A9A8AF]"
                            value={userDetails?.business}
                            editable={false}
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
                            className="text-[#A9A8AF]"
                            value={userDetails?.email}
                            editable={false}
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
                            className="text-[#A9A8AF]"
                            value={userDetails?.phone}
                            editable={false}
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
                            className="text-[#A9A8AF]"
                            value={dob ? dob.toLocaleDateString() : ''}
                            editable={false} 
                        />
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Image source={require('../assets/images/calendar.png')} />
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dob || new Date()}
                            display="default"
                            onChange={onDateChange}
                        />
                    )}
                </View>

                <View className='flex flex-col gap-2 w-full'>
                    <Text className="text-base font-medium text-[#272636]">Gender</Text>
                    <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                        <TextInput
                            className="text-[#A9A8AF]"
                            value={gender || ''} 
                            editable={false}
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
                            className="text-[#A9A8AF]"
                            value={userDetails?.address}
                            editable={false}
                        />
                        <Image
                            source={require('../assets/images/lock.png')}
                        />
                    </View>
                </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity className="bg-blue-600 mt-8 py-3 rounded-md items-center">
                <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

