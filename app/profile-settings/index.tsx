import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


const generalItems = [
    {
        id: 1,
        title: 'reset password',
        route: '../reset-password',
    },

    {
        id: 2,
        title: 'notifications',
        route: '../notifications',
    },
]


const securityItems = [
    {
        id: 1,
        title: 'privacy policy',
        route: '/privacy',
        text: 'Choose what data you share with us'
    },
]
export default function ProfileSetting() {

    const router = useRouter()

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = (route: string) => {
        router.push(route as any)
    }

    return (
        <ScrollView className="flex-1 bg-white px-4 pt-10">
            {/* Header */}
            <View className="flex-row items-center gap-[130px] mt-[2rem]">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
                    <Image
                        source={require('../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">Settings</Text>
            </View>


            <View className="flex flex-col items-start gap-10 mt-8">
                <View className='general flex flex-col items-start gap-6'>
                    <Text className='text-base capitalize text-[#7D7D86] font-medium'>general</Text>
                    {generalItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className='flex flex-row w-[95%] items-center justify-between'
                            onPress={() => handleNextPage(item.route)}
                        >
                            <Text className='text-[14px] font-semibold capitalize w-full'>{item.title}</Text>
                            <Image
                                source={require("../assets/images/arrow-right.png")}
                                // style={{ width: 16, height:  w16 }}
                                className="text-xl text-black"
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <View className='security flex flex-col items-start gap-6'>
                    <Text className='text-base capitalize text-[#7D7D86] font-medium'>security</Text>
                    {securityItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className='flex flex-row w-full items-start justify-between'
                            onPress={() => handleNextPage(item.route)}
                        >
                            <View className='flex flex-col items-start gap-1'>
                                <Text className='text-[14px] font-semibold capitalize w-full'>{item.title}</Text>
                                <Text className='text-[#A9A8AF] text-[12px]'>{item.text}</Text>
                            </View>
                            <Image
                                source={require("../assets/images/arrow-right.png")}
                                // style={{ width: 16, height:  w16 }}
                                className="text-xl text-black"
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

