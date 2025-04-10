import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useRouter } from "expo-router";

const Dashboard = () => {
    const router = useRouter();

    const navigateToWithdrawal = () => {
        // router.push('/withdrawal/index');
    };

    const navigateToDeposit = () => {
        // router.push('/deposit/index');
    };
    const navigateToSettings = () => {
        router.push('./settings/');
    };

    return (
        <View className="flex-1 justify-center items-center bg-gray-100 p-4">
            <Text className="text-2xl font-bold text-gray-800 mb-6">Dashboard</Text>
            <TouchableOpacity
                className="bg-primaryBg py-4 px-6 rounded-lg mb-4 w-3/4 items-center"
                onPress={navigateToWithdrawal}
            >
                <Text className="text-primary font-semibold text-lg">Go to Withdrawal</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="bg-primaryBg py-4 px-6 rounded-lg w-3/4 items-center"
                onPress={navigateToDeposit}
            >
                <Text className="text-primary font-semibold text-lg">Go to Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className="bg-primaryBg py-4 px-6 rounded-lg w-3/4 items-center"
                onPress={navigateToSettings}
            >
                <Text className="text-primary font-semibold text-lg">Go to Settings</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Dashboard;