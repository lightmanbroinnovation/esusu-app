import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Switch } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';




export default function Topic() {

    const router = useRouter()

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = (route: string) => {
        router.push(route as any)
    }

    return (
        <ScrollView className="flex-1 px-4 pt-10">
            {/* Header */}
            <View className="flex-row items-center gap-[110px] mt-[2rem]">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
                    <Image
                        source={require('../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">Topic</Text>
            </View>


            <View className="h-screen flex flex-col items-start gap-2 mt-12">
                <Text className="text-[18px] font-semibold text-[#007BFF] mb-3">How to Get Started</Text>

                {/* Body */}
                <Text className="text-[#6B7280] text-[14px] mb-4">
                    To start using Esusu, you need to create an account by providing your details and verifying your phone number.
                </Text>

                <Text className="text-black text-[14px] font-semibold mb-1">Verifying Your Business</Text>
                <Text className="text-[#6B7280] text-[14px] mb-4">
                    For security and trust, agents must complete KYB verification by uploading their CAC certificate, a
                    government-issued ID, and photos of their shop.
                </Text>

                <Text className="text-black text-[14px] font-semibold mb-1">Onboarding Contributors</Text>
                <Text className="text-[#6B7280] text-[14px] mb-6">
                    Once verified, you can register contributors by entering their details and setting up their contribution plans.
                </Text>

                {/* Feedback section */}
                <Text className="text-[#007BFF] text-[14px] mb-4">Did that help solve your question?</Text>

                <View className="flex-row flex gap-5">
                    <TouchableOpacity className="bg-[#E5F1FF] px-7 py-3 rounded-full">
                        <Text className="text-[#007BFF] font-semibold">Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-[#E5F1FF] px-7 py-3 rounded-full">
                        <Text className="text-[#007BFF] font-semibold">No</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

