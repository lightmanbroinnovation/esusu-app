import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const topics = [
    {
        id: 1,
        title: 'How to Get Started',
        description: 'Learn how to set up your account, verify your business, and start managing contributions.',
        icon: require('../assets/images/bank.png'),
        content: {
            mainDescription: 'To start using Esusu, you need to create an account by providing your details and verifying your phone number.',
            sections: [
                {
                    title: 'Creating Your Account',
                    content: "Download the Esusu app and click on 'Sign Up'. Fill in your personal details including your name, email, and phone number. Choose a secure PIN that you'll use to access your account."
                },
                {
                    title: 'Verifying Your Business',
                    content: 'For security and trust, agents must complete KYB verification by uploading their CAC certificate, a government-issued ID, and photos of their shop. This process typically takes 24-48 hours for approval.'
                },
                {
                    title: 'Onboarding Contributors',
                    content: 'Once verified, you can register contributors by entering their details and setting up their contribution plans. Make sure to collect accurate information and explain the contribution terms clearly.'
                },
                {
                    title: 'Setting Up Your First Collection',
                    content: 'Create a new collection group, set the contribution amount, frequency (daily, weekly, or monthly), and add your contributors. You can start receiving contributions once everything is set up.'
                }
            ]
        }
    },
    {
        id: 2,
        title: 'Managing Contributions',
        description: 'Understand how to deposit, withdraw, and set reminders for contributors.',
        icon: require('../assets/images/piggy.png'),
        content: {
            mainDescription: 'Learn how to effectively manage contributions, track payments, and handle withdrawals for your contributors.',
            sections: [
                {
                    title: 'Recording Contributions',
                    content: 'When a contributor makes a payment, record it immediately in the app. You can enter the amount, select the contributor, and choose the payment method. The app will automatically update their contribution status.'
                },
                {
                    title: 'Setting Reminders',
                    content: 'Set up automatic reminders for your contributors. You can customize reminder frequency and message content. Contributors will receive SMS notifications when their payments are due.'
                },
                {
                    title: 'Managing Withdrawals',
                    content: "Process withdrawal requests through the app. Verify the contributor's identity, confirm their eligible amount, and complete the withdrawal. All transactions are recorded for transparency."
                },
                {
                    title: 'Tracking Progress',
                    content: 'Monitor contribution progress through the dashboard. View individual and group statistics, payment histories, and generate reports for your records.'
                }
            ]
        }
    },
    {
        id: 3,
        title: 'Account & Security',
        description: 'Update your details, change your password, or report suspicious activity.',
        icon: require('../assets/images/security.png'),
        content: {
            mainDescription: 'Keep your account secure and up-to-date with these important security features and account management tools.',
            sections: [
                {
                    title: 'Updating Account Information',
                    content: 'Regularly update your personal and business information to maintain account accuracy. You can change your contact details, business address, and other profile information at any time.'
                },
                {
                    title: 'Security Features',
                    content: 'Enable two-factor authentication for extra security. Change your PIN periodically and never share it with anyone. Use biometric login if available on your device.'
                },
                {
                    title: 'Suspicious Activity',
                    content: 'Report any unauthorized transactions or suspicious activity immediately. Our security team will investigate and help protect your account.'
                },
                {
                    title: 'Account Recovery',
                    content: 'If you forget your PIN or lose access to your account, use the recovery process. Verify your identity through registered email or phone number to regain access.'
                }
            ]
        }
    },
    {
        id: 4,
        title: 'Payment & Transactions',
        description: 'Find out about payment methods, payout rules, and transaction limits.',
        icon: require('../assets/images/piggy.png'),
        content: {
            mainDescription: 'Understanding payment methods, transaction limits, and payout rules is crucial for smooth operations.',
            sections: [
                {
                    title: 'Accepted Payment Methods',
                    content: 'We accept cash payments, bank transfers, and mobile money. Each payment method is recorded and tracked in the system for accountability.'
                },
                {
                    title: 'Transaction Limits',
                    content: 'Daily transaction limits apply for security. Individual contributions are capped at ₦100,000 per transaction, and daily withdrawal limits are set at ₦500,000.'
                },
                {
                    title: 'Payout Rules',
                    content: 'Payouts are processed within 24 hours of request. Contributors must complete their cycle or meet emergency withdrawal criteria to be eligible.'
                },
                {
                    title: 'Transaction History',
                    content: 'Access detailed transaction history for up to 12 months. Download statements and receipts for your records or tax purposes.'
                }
            ]
        }
    }
];

const FAQ = () => {
    const router = useRouter();

    const handlePreviousPage = () => {
        router.back();
    };

    const handleNextPage = (topic: typeof topics[0]) => {
        router.push({
            pathname: '/Topic',
            params: { topicData: JSON.stringify(topic) }
        });
    };

    return (
        <View className="flex-1 bg-[#007BFF]">
            {/* Header */}
            <View className="px-5 pt-12 pb-2 flex flex-col items-center mt-16 gap-10 w-full">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3 absolute left-4 top-0'>
                    <Image
                        source={require('../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-white text-[32px] mt-2 font-semibold mb-2">Have a burning Question?</Text>
                <View className="bg-white rounded-full w-full px-4 py-5 flex flex-row gap-4 items-center">
                    <Image source={require('../assets/images/Search.png')} />
                    <TextInput
                        placeholder="Search topics"
                        placeholderTextColor="#A9A8AF"
                        className='w-[90%]'
                    />
                </View>
            </View>

            {/* Topics */}
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} className='bg-white rounded-t-[32px] mt-8'>
                <View className='bg-[#E5E6EB] h-[6px] w-[48px] flex mx-auto rounded-md mb-8'></View>

                <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-[14px] font-semibold text-black">Topics</Text>
                    <TouchableOpacity>
                        <Text className="text-[14px] text-[#0095FF]">View all</Text>
                    </TouchableOpacity>
                </View>

                {topics.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => handleNextPage(item)}
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
