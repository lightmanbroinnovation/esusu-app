import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBackButtonHandler } from '../utils/backButtonHandler';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007BFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 8,
    marginTop: 64,
    gap: 40,
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    marginTop: 8,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  searchInput: {
    width: '90%',
  },
  scrollView: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 32,
  },
  scrollContent: {
    padding: 20,
  },
  handleBar: {
    backgroundColor: '#E5E6EB',
    height: 6,
    width: 48,
    alignSelf: 'center',
    borderRadius: 4,
    marginBottom: 32,
  },
  topicsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  topicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  viewAllText: {
    fontSize: 14,
    color: '#0095FF',
  },
  topicCard: {
    backgroundColor: '#F5F7FF',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicCardContent: {
    width: '75%',
    flexDirection: 'column',
    gap: 12,
  },
  topicCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0074FF',
    marginBottom: 4,
  },
  topicCardDescription: {
    fontSize: 14,
    color: '#272636',
  },
  viewTopicText: {
    color: '#0095FF',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
});

const FAQ = () => {
    const router = useRouter();
    
    // Use back button handler for FAQ page
    useBackButtonHandler('/faq');

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
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
                <Text style={styles.title}>Have a burning Question?</Text>
                <View style={styles.searchContainer}>
                    <Image source={require('../assets/images/Search.png')} />
                    <TextInput
                        placeholder="Search topics"
                        placeholderTextColor="#A9A8AF"
                        style={styles.searchInput}
                    />
                </View>
            </View>

            {/* Topics */}
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false} 
              style={styles.scrollView}
            >
                <View style={styles.handleBar} />

                <View style={styles.topicsHeader}>
                    <Text style={styles.topicsTitle}>Topics</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllText}>View all</Text>
                    </TouchableOpacity>
                </View>

                {topics.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => handleNextPage(item)}
                        style={styles.topicCard}
                    >
                        <View style={styles.topicCardContent}>
                            <Text style={styles.topicCardTitle}>{item.title}</Text>
                            <Text style={styles.topicCardDescription}>{item.description}</Text>
                            <Text style={styles.viewTopicText}>View Topic</Text>
                        </View>
                        {item.icon && (
                            <Image source={item.icon} resizeMode="contain" />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default FAQ;
