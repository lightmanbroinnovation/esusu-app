import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Switch, Linking, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';


export default function SupportCenter() {

    const router = useRouter()
    
    // Use back button handler for support center
    useBackButtonHandler('/support-center');

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = (route: string) => {
        router.push(route as any)
    }

    // Support contact details
    const supportPhoneNumber = '+2348012345678'; // Call support number
    const whatsappNumber = '+2349160135000'; // WhatsApp support number
    const supportEmail = 'support@esusuapp.com'; // Replace with your support email

    const handleCallSupport = () => {
        const url = `tel:${supportPhoneNumber}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                if (!supported) {
                    Alert.alert('Error', 'Phone call is not supported on this device.');
                } else {
                    return Linking.openURL(url);
                }
            })
            .catch((err) => Alert.alert('Error', 'Failed to open dialer.'));
    };

    const handleWhatsAppSupport = () => {
        // Remove any non-digit characters except the + sign
        const cleanNumber = whatsappNumber.replace(/[^\d+]/g, '');
        // WhatsApp URL format
        const whatsappUrl = `https://wa.me/${cleanNumber}`;

        // Try to open WhatsApp directly, as canOpenURL might not work reliably in all environments
        Linking.openURL(whatsappUrl)
            .then(() => {
                console.log('WhatsApp opened successfully');
            })
            .catch((err) => {
                console.error('Failed to open WhatsApp:', err);
                // Fallback: try alternative WhatsApp URL format
                const alternativeUrl = `whatsapp://send?phone=${cleanNumber}`;
                Linking.canOpenURL(alternativeUrl)
                    .then((supported) => {
                        if (supported) {
                            return Linking.openURL(alternativeUrl);
                        } else {
                            Alert.alert('Error', 'WhatsApp is not available on this device. Please install WhatsApp or contact support through another method.');
                        }
                    })
                    .catch((err2) => {
                        Alert.alert('Error', 'Unable to open WhatsApp. Please check if WhatsApp is installed and try again.');
                    });
            });
    };

    const handleEmailSupport = () => {
        const url = `mailto:${supportEmail}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                if (!supported) {
                    Alert.alert('Error', 'Email is not supported on this device.');
                } else {
                    return Linking.openURL(url);
                }
            })
            .catch((err) => Alert.alert('Error', 'Failed to open email app.'));
    };

    const [networkAvailable, setNetworkAvailable] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkAvailable(!!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    return (
        <ScrollView className="flex-1 px-4 pt-10 bg-white">
            {/* Header */}
            <View className="flex-row items-center mt-[2rem]">
            <TouchableOpacity 
              onPress={handlePreviousPage}
              className=" p-2 rounded-full mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
                <Text className="text-lg font-semibold">Support Center</Text>
            </View>


            <View className="h-screen flex flex-col items-start gap-10 mt-12">
                <View className="flex flex-col gap-6">
                    {/* Call Support */}
                    <TouchableOpacity
                        className="flex flex-row items-start justify-between"
                        onPress={handleCallSupport}
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
                        onPress={handleEmailSupport}
                    >
                        <View className="flex flex-col gap-1 w-[95%]">
                            <Text className="text-[14px] font-semibold text-black">Email Support</Text>
                            <Text className="text-[#A9A8AF] text-[12px]">
                                Send us an email for detailed inquiries
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                    </TouchableOpacity>

                    {/* Chat Support */}
                    <TouchableOpacity
                        className="flex flex-row items-start justify-between"
                        onPress={handleWhatsAppSupport}
                    >
                        <View className="flex flex-col gap-1 w-[95%]">
                            <Text className="text-[14px] font-semibold text-black">WhatsApp Support</Text>
                            <Text className="text-[#A9A8AF] text-[12px]">
                                Chat with our support team on WhatsApp
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
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

