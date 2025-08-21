import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBackButtonHandler } from '../utils/backButtonHandler';


const generalItems = [
    {
        id: 1,
        title: 'reset Passcode',
        route: '../reset',
    },

    {
        id: 2,
        title: 'notifications',
        route: '../notifications',
    },
    {
        id: 3,
        title: 'Create Transaction Pin',
        route: '/Transaction-Pin/transaction-pin',
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
    
    // Use back button handler for profile settings
    useBackButtonHandler('/profile-settings');

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = async (route: string) => {
        if (route === '/privacy') {
            // Disable click for privacy policy
            return;
        }
        if (route === '../reset') {
            // Navigate to reset passcode flow
            router.push('/reset');
            return;
        }
        router.push(route as any);
    }

    return (
        <ScrollView className="flex-1 bg-white w-full pt-10 px-4" contentContainerStyle={{ minWidth: '100%' }}>
            {/* Header */}
            <View className="flex-row items-center gap-[110px] mt-6 w-full">
            <TouchableOpacity 
              onPress={handlePreviousPage}
              className=" p-2 rounded-full mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
                <Text className="text-lg font-semibold">Settings</Text>
            </View>


            <View className="flex flex-col items-start gap-10 mt-8 w-full">
                <View className='general flex flex-col items-start gap-6 w-full'>
                    <Text className='text-base capitalize text-[#7D7D86] font-medium'>general</Text>
                    {generalItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className='flex flex-row w-full items-center justify-between'
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

                <View className='security flex flex-col items-start gap-6 w-full'>
                    <Text className='text-base capitalize text-[#7D7D86] font-medium'>security</Text>
                    {securityItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className='flex flex-row w-full items-start justify-between'
                            onPress={() => handleNextPage(item.route)}
                            disabled={item.route === '/privacy'}
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

