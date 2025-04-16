import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


export default function Recepient() {

    const router = useRouter()

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = () => {
        router.push('/withdrawal/subpages/success')
    }

    const [accountNumber, setAccountNumber] = useState('')
    const [bank, setBank] = useState('')
    const [accountName, setAccountName] = useState('')


    return (
        <ScrollView className="flex-1 bg-white px-4 pt-10">
            {/* Header */}
            <View className="flex-row items-center gap-[110px] mt-[2rem]">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
                    <Image
                        source={require('../../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">Recipient</Text>
            </View>

            <Text className="text-center mt-6">Please provide the details you would like to withdraw to below.</Text>

            {/* password change input */}
            <View className='h-screen flex flex-col items-center'>
                <View className='mt-10 flex flex-col items-start gap-[16px]'>
                    <View className='flex flex-col gap-2 w-full'>
                        <Text className="text-base font-medium text-[#272636]">What is the account number?</Text>
                        <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                            <TextInput
                                className="text-[#A9A8AF] w-full"
                                placeholder='Enter Account Number'
                                value={accountNumber}
                                onChangeText={setAccountNumber}
                            />
                        </View>
                    </View>

                    <View className='flex flex-col gap-2 w-full'>
                        <Text className="text-base font-medium text-[#272636]">Select Bank</Text>
                        <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                            <TextInput
                                className="text-[#A9A8AF] w-full"
                                placeholder="Select Bank"
                                value={bank}
                                onChangeText={setBank}
                            />
                        </View>
                    </View>

                    <View className='flex flex-col gap-2 w-full'>
                        <Text className="text-base font-medium text-[#272636]">Account Name</Text>
                        <View className='bg-[#F4F4F5] flex flex-row items-center justify-between px-[1rem] py-[0.9rem] rounded-lg'>
                            <TextInput
                                className="text-[#A9A8AF] w-full"
                                placeholder="Account Name"
                                value={accountName}
                                onChangeText={setAccountName}
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity className='bg-[#0074FF] w-full flex items-center rounded-xl justify-center py-4 absolute bottom-0' onPress={handleNextPage}>
                    <Text className='text-white text-base font-bold'>Done</Text>
                </TouchableOpacity>
            </View>


        </ScrollView>
    );
}

