export const options = {
    headerShown: false, // Hide the header
};

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Vibration, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestWithdrawalCode, verifyWithdrawalCode } from '../../../services/api';
import { sendNotification, NotificationTemplates } from '../../services/notificationService';
import { useBackButtonHandler } from '../../utils/backButtonHandler';

export default function OTPScreen() {
    const router = useRouter();
    
    // Use back button handler for withdrawal OTP page
    useBackButtonHandler('/withdrawal/subpages/otp');
    
    const [pin, setPin] = useState<string>("");
    const [showKeypad, setShowKeypad] = useState<boolean>(false);
    const [withdrawAmount, setWithdrawAmount] = useState<string>("0");
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const [phoneNumber, setPhoneNumber] = useState<string>("");

    const navigateBack = () => {
        router.back();
      };

    // Fetch user ID and withdrawal amount from AsyncStorage
    useEffect(() => {
        const getData = async () => {
            try {
                const [storedUserId, storedAmount] = await Promise.all([
                    AsyncStorage.getItem('userId'),
                    AsyncStorage.getItem('withdrawAmount')
                ]);

                if (!storedUserId) {
                    console.error('User ID not found in AsyncStorage');
                    Alert.alert('Error', 'User ID not found. Please try again.');
                } else {
                    setUserId(storedUserId);
                }

                if (storedAmount) {
                    setWithdrawAmount(storedAmount);
                }
            } catch (error) {
                console.error('Error retrieving data from AsyncStorage:', error);
                Alert.alert('Error', 'Failed to load necessary data. Please try again.');
            }
        };

        getData();
    }, []);

    // Request withdrawal code on page load
    useEffect(() => {
        const sendWithdrawalCode = async () => {
            const phone = Array.isArray(params.phoneNumber)
                ? params.phoneNumber[0] || ''
                : params.phoneNumber || '';
            setPhoneNumber(phone);
            if (phone) {
                try {
                    const response = await requestWithdrawalCode(phone);
                    console.log('Withdrawal code request response:', response);
                } catch (err) {
                    console.error('Error requesting withdrawal code:', err);
                }
            }
        };
        sendWithdrawalCode();
    }, [params.phoneNumber]);

    const handleKeyPress = (digit: string) => {
        if (pin.length < 4) {
            setPin(pin + digit);
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (pin.length !== 4) {
            Vibration.vibrate(100);
            Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP.');
            return;
        }

        if (!phoneNumber) {
            Alert.alert('Error', 'Unable to process withdrawal. Missing phone number.');
            return;
        }

        setLoading(true);

        try {
            const response = await verifyWithdrawalCode(phoneNumber, pin);
            console.log('Verify withdrawal code response:', response);
            if (response.status === 'Success') {
                await sendNotification(
                    NotificationTemplates.transaction.withdrawal(withdrawAmount).title,
                    NotificationTemplates.transaction.withdrawal(withdrawAmount).body,
                    NotificationTemplates.transaction.withdrawal(withdrawAmount).type
                );
                router.replace('./success');
            } else {
                Alert.alert('Error', response.message || 'Failed to verify code.');
            }
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            const err: any = error;
            if (err && err.response && err.response.data && err.response.data.message) {
                Alert.alert('Error', err.response.data.message);
            } else if (err && err.message) {
                Alert.alert('Error', err.message);
            } else {
                Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderPinInputs = () => {
        return (
            <View className="flex-row items-center justify-center space-x-4 mt-6">
                {[0, 1, 2, 3].map((i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => setShowKeypad(true)} // Show keypad when clicked
                        className="w-12 h-12 text-center mr-2 justify-center items-center border rounded-lg"
                        style={{
                            borderColor: i < pin.length ? "#0072CE" : "#ccc",
                            backgroundColor: "#F4F4F5",
                        }}
                    >
                        <Text className="text-xl font-bold text-[#0072CE]">{pin[i] ? "•" : ""}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderKeypad = () => {
        const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "0", "✓"];
        return (
            <View className="mt-10 space-y-4 w-full">
                {Array(4)
                    .fill(null)
                    .map((_, rowIndex) => (
                        <View key={rowIndex} className="flex-row justify-between">
                            {keys.slice(rowIndex * 3, rowIndex * 3 + 3).map((key) => (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() => {
                                        if (key === "x") handleBackspace();
                                        else if (key === "✓") {
                                            if (pin.length === 4) {
                                                handleSubmit();
                                            } else {
                                                Vibration.vibrate(100);
                                            }
                                        } else {
                                            handleKeyPress(key);
                                        }
                                    }}
                                    className="w-20 h-20 bg-white justify-center items-center"
                                    disabled={loading}
                                >
                                    {key === "x" ? (
                                        <Ionicons name="backspace-outline" size={30} color="#0072CE" /> // Delete icon
                                    ) : key === "✓" ? (
                                        <MaterialIcons name="check-circle" size={30} color="#0072CE" /> // Enter icon
                                    ) : (
                                        <Text className="text-3xl font-semibold text-[#0072CE]">{key}</Text> // Regular number keys
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
            </View>
        );
    };

    // Format the amount for display
    const formattedAmount = Number(withdrawAmount).toLocaleString();

    return (
        <View className="flex-1 bg-white px-4">
            {/* Back Button */}
            <View className="flex-row items-center justify-between px-4 mt-16">
                <TouchableOpacity
                    onPress={navigateBack}
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">Withdraw</Text>
                <View className="w-10" />
            </View>

            {/* Main Content */}
            <View className="flex-1 mt-8">
                <Text className="text-[24px] font-bold text-center text-primaryText mb-3">OTP Verification</Text>
                <Text className="text-gray-500 text-center mt-2 mb-4">
                    Enter the OTP sent to your registered phone number to complete your withdrawal.
                </Text>

                {/* Amount Display */}
                <View className="bg-blue-50 py-4 px-6 rounded-xl mb-4">
                    <Text className="text-center text-gray-600">Withdrawal Amount</Text>
                    <Text className="text-center text-[20px] font-bold text-blue-600">₦{formattedAmount}</Text>
                </View>

                {renderPinInputs()}

                <TouchableOpacity className="mt-2 text-center" disabled={loading}>
                    <Text className="text-primaryText text-xl text-center">Resend Code</Text>
                </TouchableOpacity>

                <View className="flex-1 justify-end pb-4">
                    {/* Continue Button */}
                    <TouchableOpacity
                        className={`flex-row justify-center items-center py-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-[#0072CE]'}`}
                        onPress={handleSubmit}
                        disabled={loading || pin.length !== 4}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
                        ) : null}
                        <Text className="text-white text-lg mr-2 font-semibold">
                            {loading ? 'Processing...' : 'Complete Withdrawal'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Keypad */}
            {showKeypad && renderKeypad()}
        </View>
    );
}