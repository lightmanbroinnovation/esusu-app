import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Switch, 
  Linking, 
  Alert, 
  StyleSheet, 
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';


const SupportCenter = () => {
    const router = useRouter();
    
    // Use back button handler for support center
    useBackButtonHandler('/support-center');

    const handlePreviousPage = () => {
        router.back();
    };

    const handleNextPage = (route: string) => {
        router.push(route as any);
    };

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
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handlePreviousPage} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Support Center</Text>
                </View>

                <View style={styles.supportOptions}>
                    <TouchableOpacity 
                        style={styles.optionCard}
                        onPress={handleCallSupport}
                        activeOpacity={0.8}
                    >
                        <View style={styles.optionContent}>
                            <View style={[styles.optionIconContainer, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="call" size={20} color="#25D366" />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Call Support</Text>
                                <Text style={styles.optionSubtitle}>{supportPhoneNumber}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A9A8AF" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.optionCard}
                        onPress={handleEmailSupport}
                        activeOpacity={0.8}
                    >
                        <View style={styles.optionContent}>
                            <View style={[styles.optionIconContainer, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="mail" size={20} color="#25D366" />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Email Support</Text>
                                <Text style={styles.optionSubtitle}>{supportEmail}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A9A8AF" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.optionCard}
                        onPress={handleWhatsAppSupport}
                        activeOpacity={0.8}
                    >
                        <View style={styles.optionContent}>
                            <View style={[styles.optionIconContainer, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Chat on WhatsApp</Text>
                                <Text style={styles.optionSubtitle}>{whatsappNumber}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A9A8AF" />
                    </TouchableOpacity>
                </View>

                {/* Bottom CTA box */}
                <View style={styles.ctaBox}>
                    <TouchableOpacity style={styles.ctaButton} onPress={() => handleNextPage('/faq')}>
                        <Text style={styles.ctaText}>Need quick help? Check our FAQs before reaching out.</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24,
        position: 'relative',
        width: '100%',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 0,
    },
    supportOptions: {
        marginBottom: 24,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#666666',
    },
    ctaBox: {
        marginTop: 16,
        backgroundColor: '#F5F9FF',
        borderRadius: 12,
        padding: 16,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ctaText: {
        flex: 1,
        fontSize: 14,
        color: '#0066CC',
        fontWeight: '500',
    },
});

export default SupportCenter;
