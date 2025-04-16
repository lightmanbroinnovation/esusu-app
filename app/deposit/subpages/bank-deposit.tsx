import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


export default function BankDeposit() {

    const router = useRouter()

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = () => {
        router.push('/deposit/subpages/success')
    }

    return (
        <ScrollView className="flex-1 bg-white px-4 pt-10">
            {/* Header */}
            <View className="flex-row items-center gap-[110px] mt-[2rem]">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
                    <Image
                        source={require('../../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">Deposit</Text>
            </View>

            <View className='h-screen flex flex-col'>
                {/*we woild fetch from the BE later for this deposit-bank card */}
                <View className='card px-[1rem] pt-5'>
                    <View className='flex flex-col gap-2'>
                        <Text className='text-[#0074ff] text-[28px] font-semibold'>Make your Deposit</Text>
                        <Text className='text-[#272636]'>Transfer the amount before the timer runs out. A new account will be generated if time expires.</Text>
                    </View>


                    <View>
                        <Text className='text-[#272636] font-semibold mt-8'>Account Details</Text>

                        <View className='flex flex-col gap-6 bg-[#0074FF] py-10 px-4 rounded-xl mt-4'>
                            <View className='bank flex flex-row items-center justify-between'>
                                <Text className='capitalize font-medium text-white'>bank:</Text>
                                <Text className='text-white'>XYZ Bank</Text>
                            </View>
                            <View className='bank flex flex-row items-center justify-between'>
                                <Text className='capitalize font-medium text-white'>account:</Text>
                                <Text className='text-white'>1234567890</Text>
                            </View>
                            <View className='bank flex flex-row items-center justify-between'>
                                <Text className='capitalize font-medium text-white'>account name</Text>
                                <Text className='text-white'>AjoMarket Temporary Account</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity className='bg-[#0074FF] w-full flex items-center rounded-xl justify-center py-4 absolute bottom-0' onPress={handleNextPage}>
                    <Text className='text-white text-base font-bold'>I've paid</Text>
                </TouchableOpacity>
            </View>


        </ScrollView>
    );
}

