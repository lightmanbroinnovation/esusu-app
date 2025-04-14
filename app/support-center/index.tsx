import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Switch } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';




export default function SupportCenter() {

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
                <Text className="text-lg font-semibold">Support Center</Text>
            </View>


            <View className="h-screen flex flex-col items-start gap-10 mt-12">
                <View className="flex flex-col gap-6">
                    {/* Call Support */}
                    <TouchableOpacity
                        className="flex flex-row items-start justify-between"
                    >
                        <View className="flex flex-col gap-1 w-[95%]">
                            <Text className="text-[14px] font-semibold text-black">Call Support</Text>
                            <Text className="text-[#A9A8AF] text-[12px]">
                                Speak with a representative
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Email Support */}
                    <TouchableOpacity
                        className="flex flex-row items-start justify-between"
                    >
                        <View className="flex flex-col gap-1 w-[95%]">
                            <Text className="text-[14px] font-semibold text-black">Email Support</Text>
                            <Text className="text-[#A9A8AF] text-[12px]">
                                Send us an email for detailed inquiries
                            </Text>
                        </View>
                        <Image
                            source={require('../assets/images/arrow-right.png')}
                            className="w-[16px] h-[16px]"
                        />
                    </TouchableOpacity>
                </View>

                {/* Bottom CTA box */}
                <View className="mt-8 absolute bottom-0">
                    <TouchableOpacity className="bg-[#E5F1FF] w-full px-4 py-5 rounded-lg border border-1 border-[#0066cc]">
                        <Text className="text-[#0066CC] text-start text-[14px]  font-medium">
                            Need quick help? Check our FAQs before reaching out.
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

