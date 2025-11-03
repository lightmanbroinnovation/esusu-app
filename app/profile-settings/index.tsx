import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import NetInfo from '@react-native-community/netinfo';
// import EsusuLoader from '../components/EsusuLoader';
// import StatusBarAdapter from '../components/StatusBarAdapter';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBackButtonHandler } from '../utils/backButtonHandler';

const generalItems = [
    {   
        id: 1,
        title: 'Reset Passcode',
        route: '../reset',
        icon: 'key-outline',
        description: 'Change your current passcode'
    },
    {
        id: 2,
        title: 'Notifications',
        route: '../notifications/settings',
        icon: 'notifications-outline',
        description: 'Manage notification preferences'
    },
    {
        id: 3,
        title: 'Transaction PIN',
        route: '/Transaction-Pin/transaction-pin',
        icon: 'lock-closed-outline',
        description: 'Set up transaction security'
    },
]


const securityItems = [
    {
        id: 1,
        title: 'Privacy Policy',
        route: '/privacy',
        icon: 'shield-checkmark-outline',
        description: 'Choose what data you share with us',
        disabled: true
    },
    {
        id: 2,
        title: 'Terms of Service',
        route: '/terms',
        icon: 'document-text-outline',
        description: 'Read our terms and conditions',
        disabled: true
    },
    {
        id: 3,
        title: 'Help & Support',
        route: '/support',
        icon: 'help-circle-outline',
        description: 'Get help and contact support',
        disabled: true
    },
]
export default function ProfileSetting() {

    const router = useRouter()
    const { width, height } = Dimensions.get('window');

    // Responsive sizing based on screen width
    const getResponsiveSize = (baseSize: number) => {
        if (width < 375) {
            return baseSize * 0.9; // Small phones
        } else if (width < 414) {
            return baseSize; // Medium phones
        } else {
            return baseSize * 1.1; // Large phones and tablets
        }
    };

    // Use back button handler for profile settings
    useBackButtonHandler('/profile-settings');

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = async (route: string, disabled: boolean = false) => {
        if (disabled) {
            // Show message for disabled items
            return;
        }
        if (route === '../reset') {
            // Navigate to reset passcode flow
            router.push('/reset');
            return;
        }
        router.push(route as any);
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
      },
      scrollView: {
        flex: 1,
      },
      header: {
        backgroundColor: '#FFFFFF',
        paddingTop: 24,
        paddingBottom: 24,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginTop: 40,
      },
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      backButton: {
        width: 40,
        height: 40,
        borderRadius: 999,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
      },
      headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
      },
      headerSpacer: {
        width: 40,
        height: 40,
      },
    });

    return (
        <View style={styles.container}>
            {/* <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" /> */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            onPress={handlePreviousPage}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={20} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </View>

                <View style={{ paddingHorizontal: getResponsiveSize(16), paddingTop: getResponsiveSize(24) }}>
                    {/* General Section */}
                    <View style={{ marginBottom: getResponsiveSize(32) }}>
                        <Text style={{
                            fontSize: getResponsiveSize(12),
                            fontWeight: '600',
                            color: '#6B7280',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: getResponsiveSize(16)
                        }}>
                            General
                        </Text>
                        <View style={{
                            backgroundColor: 'white',
                            borderRadius: getResponsiveSize(16),
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            borderWidth: 1,
                            borderColor: '#F3F4F6',
                            overflow: 'hidden'
                        }}>
                            {generalItems.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: getResponsiveSize(24),
                                        paddingVertical: getResponsiveSize(16),
                                        borderBottomWidth: index !== generalItems.length - 1 ? 1 : 0,
                                        borderBottomColor: '#F3F4F6'
                                    }}
                                    onPress={() => handleNextPage(item.route)}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{
                                            width: getResponsiveSize(48),
                                            height: getResponsiveSize(48),
                                            borderRadius: getResponsiveSize(12),
                                            backgroundColor: '#EFF6FF',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: getResponsiveSize(16)
                                        }}>
                                            <Ionicons name={item.icon as any} size={22} color="#3B82F6" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                fontSize: getResponsiveSize(16),
                                                fontWeight: '600',
                                                color: '#111827',
                                                marginBottom: getResponsiveSize(2)
                                            }}>
                                                {item.title}
                                            </Text>
                                            <Text style={{
                                                fontSize: getResponsiveSize(14),
                                                color: '#6B7280'
                                            }}>
                                                {item.description}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Security Section */}
                    {/* <View style={{ marginBottom: getResponsiveSize(32) }}>
                        <Text style={{
                            fontSize: getResponsiveSize(12),
                            fontWeight: '600',
                            color: '#6B7280',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: getResponsiveSize(16)
                        }}>
                            Security & Privacy
                        </Text>
                        <View style={{
                            backgroundColor: 'white',
                            borderRadius: getResponsiveSize(16),
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            borderWidth: 1,
                            borderColor: '#F3F4F6',
                            overflow: 'hidden'
                        }}>
                            {securityItems.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: getResponsiveSize(24),
                                        paddingVertical: getResponsiveSize(16),
                                        borderBottomWidth: index !== securityItems.length - 1 ? 1 : 0,
                                        borderBottomColor: '#F3F4F6',
                                        opacity: item.disabled ? 0.5 : 1
                                    }}
                                    onPress={() => handleNextPage(item.route, item.disabled)}
                                    disabled={item.disabled}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{
                                            width: getResponsiveSize(48),
                                            height: getResponsiveSize(48),
                                            borderRadius: getResponsiveSize(12),
                                            backgroundColor: item.disabled ? '#F9FAFB' : '#EFF6FF',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: getResponsiveSize(16)
                                        }}>
                                            <Ionicons
                                                name={item.icon as any}
                                                size={22}
                                                color={item.disabled ? "#6B7280" : "#3B82F6"}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                fontSize: getResponsiveSize(16),
                                                fontWeight: '600',
                                                color: item.disabled ? '#9CA3AF' : '#111827',
                                                marginBottom: getResponsiveSize(2)
                                            }}>
                                                {item.title}
                                            </Text>
                                            <Text style={{
                                                fontSize: getResponsiveSize(14),
                                                color: '#6B7280'
                                            }}>
                                                {item.description}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {item.disabled && (
                                            <Text style={{
                                                fontSize: getResponsiveSize(10),
                                                color: '#9CA3AF',
                                                marginRight: getResponsiveSize(8)
                                            }}>
                                                Coming Soon
                                            </Text>
                                        )}
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color={item.disabled ? "#D1D5DB" : "#9CA3AF"}
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View> */}

                    {/* App Info Section */}
                    {/* <View style={{ marginBottom: getResponsiveSize(32) }}>
                        <View style={{
                            backgroundColor: 'white',
                            borderRadius: getResponsiveSize(16),
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            borderWidth: 1,
                            borderColor: '#F3F4F6',
                            padding: getResponsiveSize(24)
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: getResponsiveSize(16)
                            }}>
                                <View style={{
                                    width: getResponsiveSize(48),
                                    height: getResponsiveSize(48),
                                    borderRadius: getResponsiveSize(12),
                                    backgroundColor: '#3B82F6',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: getResponsiveSize(16)
                                }}>
                                    <Ionicons name="information-circle" size={22} color="white" />
                                </View>
                                <View>
                                    <Text style={{
                                        fontSize: getResponsiveSize(16),
                                        fontWeight: '600',
                                        color: '#111827'
                                    }}>
                                        About Esusu
                                    </Text>
                                    <Text style={{
                                        fontSize: getResponsiveSize(14),
                                        color: '#6B7280'
                                    }}>
                                        Version 1.0.0
                                    </Text>
                                </View>
                            </View>
                            <Text style={{
                                fontSize: getResponsiveSize(14),
                                color: '#6B7280',
                                lineHeight: getResponsiveSize(20)
                            }}>
                                Esusu is your trusted partner for community savings and financial growth.
                                Manage your contributions, track your progress, and achieve your financial goals together.
                            </Text>
                        </View>
                    </View> */}
                </View>
            </ScrollView>
        </View>
    );
}

