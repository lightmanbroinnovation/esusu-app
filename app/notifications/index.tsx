import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Switch } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBackButtonHandler } from '../utils/backButtonHandler';



export default function Notifications() {

    // Use back button handler for notifications
    useBackButtonHandler('/notifications');

    const [settings, setSettings] = useState({
        transactionAlerts: true,
        securityAlerts: false,
        generalUpdates: false,
    });

    const toggleSwitch = (key: keyof typeof settings) => {
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const router = useRouter()

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = (route: string) => {
        router.push(route as any)
    }

    return (
        <ScrollView className="px-4 pt-10 bg-white">
            {/* Header */}
            <View className="flex-row items-center gap-[100px] mt-6">
            <TouchableOpacity 
              onPress={handlePreviousPage}
              className=" p-2 rounded-full mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
                <Text className="text-lg font-semibold">Notification</Text>
            </View>


            <View className="flex flex-col items-start gap-10 mt-12">
                <View className="flex flex-row items-start justify-between w-full">
                    <View className="flex flex-col gap-1 w-[80%]">
                        <Text className="text-[14px] font-semibold text-black">Transaction Alerts</Text>
                        <Text className="text-[#A9A8AF] text-[12px]">
                            Get notified when contributions are deposited or withdrawn
                        </Text>
                    </View>
                    <Switch
                        value={settings.transactionAlerts}
                        onValueChange={() => toggleSwitch('transactionAlerts')}
                        trackColor={{ false: '#ccc', true: '#0074FF' }} // Customize toggle color
                        thumbColor="#fff"
                    />
                </View>

                <View className="flex flex-row items-start justify-between w-full">
                    <View className="flex flex-col gap-1 w-[80%]">
                        <Text className="text-[14px] font-semibold text-black">Security Alerts</Text>
                        <Text className="text-[#A9A8AF] text-[12px]">
                            Receive alerts for suspicious activities or login attempts.
                        </Text>
                    </View>
                    <Switch
                        value={settings.securityAlerts}
                        onValueChange={() => toggleSwitch('securityAlerts')}
                        trackColor={{ false: '#ccc', true: '#0074FF' }}
                        thumbColor="#fff"
                    />
                </View>

                <View className="flex flex-row items-start justify-between w-full">
                    <View className="flex flex-col gap-1 w-[80%]">
                        <Text className="text-[14px] font-semibold text-black">General Updates</Text>
                        <Text className="text-[#A9A8AF] text-[12px]">
                            Stay informed about app updates, new features, and announcements.
                        </Text>
                    </View>
                    <Switch
                        value={settings.generalUpdates}
                        onValueChange={() => toggleSwitch('generalUpdates')}
                        trackColor={{ false: '#ccc', true: '#0074FF' }}
                        thumbColor="#fff"
                    />
                </View>
            </View>
        </ScrollView>
    );
}

