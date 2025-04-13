import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


export default function ReetPassword() {

    const router = useRouter()

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = (route: string) => {
        router.push(route as any)
    }

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')


    return (
        <ScrollView className="flex-1 bg-white px-4 pt-10">
            {/* Header */}
            <View className="flex-row items-center gap-[100px] mt-[2rem]">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
                    <Image
                        source={require('../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">Reset Password</Text>
            </View>

            {/* password change input */}
            <View className='h-screen flex flex-col items-center'>
                <View className='mt-10 flex flex-col items-start gap-[16px]'>
                    <View className='flex flex-col gap-2 w-full'>
                        <Text className="text-base font-medium text-[#272636]">Current Password</Text>
                        <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                            <TextInput
                                className="text-[#A9A8AF] w-full"
                                placeholder='Enter Current Password'
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                        </View>
                    </View>

                    <View className='flex flex-col gap-2 w-full'>
                        <Text className="text-base font-medium text-[#272636]">New Password</Text>
                        <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                            <TextInput
                                className="text-[#A9A8AF] w-full"
                                placeholder="Enter New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                        </View>
                    </View>

                    <View className='flex flex-col gap-2 w-full'>
                        <Text className="text-base font-medium text-[#272636]">Retype Password</Text>
                        <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                            <TextInput
                                className="text-[#A9A8AF] w-full"
                                placeholder="Enter Retyped Password"
                                value={confirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity className='bg-[#0074FF] w-full flex items-center rounded-xl justify-center py-4 absolute bottom-0'>
                    <Text className='text-white text-base font-bold'>Save</Text>
                </TouchableOpacity>
            </View>


        </ScrollView>
    );
}

