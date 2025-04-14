import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const topics = [
    {
        id: 1,
        title: 'How to Get Started',
        description: 'Learn how to set up your account, verify your business, and start managing contributions.',
        icon: require('../assets/images/bank.png'),
        route: '../Topic',
    },
    {
        id: 2,
        title: 'Managing Contributions',
        description: 'Understand how to deposit, withdraw, and set reminders for contributors.',
        icon: require('../assets/images/piggy.png'),
        route: '../Topic',
    },
    {
        id: 3,
        title: 'Account & Security',
        description: 'Update your details, change your password, or report suspicious activity.',
        route: '../Topic',
    },
    {
        id: 4,
        title: 'Payment & Transactions',
        description: 'Find out about payment methods, payout rules, and transaction limits.',
        route: '../Topic',
    },
];

const FAQ = () => {


    const router = useRouter()

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = (route: string) => {
        router.push(route as any)
    }
    return (
        <View className="flex-1 bg-[#007BFF]">
            {/* Header */}
            <View className="px-5 pt-12 pb-6 flex flex-col items-center mt-20 gap-10 w-full">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3 absolute left-4 top-0'>
                    <Image
                        source={require('../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-white text-[32px] mt-2 font-semibold mb-2">Have a burning Question?</Text>
                <View  className="bg-white rounded-full w-full px-4 py-5 flex flex-row gap-4">
                    <Image source={require('../assets/images/Search.png')} />
                    <TextInput
                        placeholder="Search transactions"
                        placeholderTextColor="#A9A8AF"
                        className='w-[90%]'
                    />
                </View>
            </View>

            {/* Topics */}
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} className='bg-white rounded-t-[32px] mt-8'>
                <View className='bg-[#E5E6EB] h-[6px] w-[48px] flex mx-auto rounded-md mb-8'>

                </View>

                <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-[14px] font-semibold text-black">Topics</Text>
                    <TouchableOpacity>
                        <Text className="text-[14px] text-[#0095FF]">View all</Text>
                    </TouchableOpacity>
                </View>

                {topics.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => handleNextPage(item.route)}
                        className="bg-[#F5F7FF] p-4 mb-4 rounded-xl flex-row justify-between items-center"
                    >
                        <View className="w-[75%] flex flex-col gap-3">
                            <Text className="text-[14px] font-semibold text-[#0074FF] mb-1">{item.title}</Text>
                            <Text className="text-[14px] text-[#272636]">{item.description}</Text>
                            <Text className="text-[#0095FF] font-semibold text-[12px] mt-1">View Topic</Text>
                        </View>
                        {item.icon && (
                            <Image source={item.icon} className="" resizeMode="contain" />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default FAQ;
