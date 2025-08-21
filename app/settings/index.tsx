import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, Alert, BackHandler, RefreshControl, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { fetchUser } from "@/services/api";
import StatusBarAdapter from "../components/StatusBarAdapter";
import Footer from "../components/Footer";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAllCaches, getCachedData, invalidateCache } from '../utils/dataCaching';
import { logoutUser } from '../../services/api';
import { performSoftLogout, performLogoutWithConfirmation } from '../utils/logoutUtility';
import EsusuLoader from '../components/EsusuLoader';
import NetInfo from '@react-native-community/netinfo';
import { sendNotification, NotificationTemplates } from '../services/notificationService';
import { useExitAppBackHandler } from '../utils/backButtonHandler';

// Define the UserDetails type
interface UserDetails {
    _id: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    business?: string;
    address?: string;
    city?: string;
    state?: string;
    bvn?: string;
    idImage?: string;
    cacImage?: string;
    isVerified: boolean;
    documentsVerified: boolean;
    businessLocation: boolean;
    contributorCount: number;
    accountTier: string;
    dob: string;
    gender: string;
    role: string;
    userImg?: string;
    fingerprint: boolean; // This matches the API response
}

// Menu item interface
interface MenuItem {
    label: string;
    icon: any;
    bgColor: string;
    textColor: string;
    route: string;
}

export const options = {
    headerShown: false,
};

const menuItems: MenuItem[] = [
    {
        label: "Your Operator Tier",
        icon: require("../assets/images/my_account.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/Tier",
    },
    {
        label: "My Account",
        icon: require("../assets/images/my_account.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/account",
    },
    {
        label: "Linked Banks",
        icon: require("../assets/images/card.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/link-bank",
    },
    {
        label: "Referral Program",
        icon: require("../assets/images/my_account.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/referral",
    },
    {
        label: "Settings",
        icon: require("../assets/images/settings.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/profile-settings",
    },
    {
        label: "Biometric Login",
        icon: require("../assets/images/security.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/security",
    },
    {
        label: "FAQs",
        icon: require("../assets/images/que.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/faq",
    },
    {
        label: "Support Center",
        icon: require("../assets/images/faqs.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/support-center",
    },
    {
        label: "Log Out",
        icon: require("../assets/images/logout.png"),
        bgColor: "bg-red-100",
        textColor: "text-red-500",
        route: "/login/passcode",
    },
];

const fetchSettingsData = async () => {
  const response = await fetchUser();
  if (response.status === 'Success' && response.data?.user) {
    return response.data.user;
  } else {
    throw new Error('Failed to fetch user data');
  }
};

export default function Index() {
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

    // Use exit app back handler for settings page
    useExitAppBackHandler();

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [networkAvailable, setNetworkAvailable] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkAvailable(!!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    const fetchData = async (fromRefresh = false) => {
        setLoading(true);
        setError(null);
        let cacheData = null;
        try {
            const cached = await AsyncStorage.getItem('settings_user');
            if (cached) {
                cacheData = JSON.parse(cached);
                setUserDetails(cacheData);
            }
        } catch {}
        if (!networkAvailable && cacheData) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        if (fromRefresh) {
            await invalidateCache('settings_user');
        }
        try {
            const data = await getCachedData('settings_user', fetchSettingsData);
            setUserDetails(data);
        } catch (err) {
            if (!cacheData) {
                setError('Failed to load user data');
                setUserDetails(null);
            }
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRetry = () => {
        fetchData(true);
    };

    // Enhanced logout: use comprehensive logout utility
    const handleLogout = async () => {
        try {
            console.log('About to send notification...');
            await sendNotification(
              NotificationTemplates.auth.logout.title,
              NotificationTemplates.auth.logout.body,
              NotificationTemplates.auth.logout.type
            );
            console.log('Notification sent, now performing soft logout (keeping cache)...');
            
            // Use the soft logout utility (keeps cache)
            await performSoftLogout();
            
        } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert("Error", "Failed to log out. Please try again.");
        }
    };

    const handlePress = (route: string) => {
        console.log("Navigating to:", route);

        // Handle logout specially
        if (route === "/logout") {
            // Show confirmation dialog
            Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Logout",
                        onPress: handleLogout
                    }
                ]
            );
        } else {
            try {
                // For all other routes, just navigate
                router.push(route as any);
                console.log("Navigation successful to:", route);
            } catch (error) {
                console.error("Navigation error:", error);
                Alert.alert("Error", "Failed to navigate. Please try again.");
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData(true);
        setRefreshing(false);
    };

    if (loading) {
        return <EsusuLoader />;
    }

    if (!networkAvailable && !userDetails) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>No network. Please connect to the internet to load settings.</Text>
            </View>
        );
    }

    // Render menu item
    const renderMenuItem = ({ item, index }: { item: MenuItem; index: number }) => (
        <TouchableOpacity
            className={`flex-row items-center justify-between px-5 py-4 ${
                index !== menuItems.length - 1 ? "border-b border-gray-200" : ""
            }`}
            style={{ paddingHorizontal: getResponsiveSize(20), paddingVertical: getResponsiveSize(16) }}
            onPress={() => handlePress(item.route)}
        >
            <View className="flex-row items-center flex-1">
                <View className={`${item.bgColor} rounded-md p-2 mr-3`} style={{ 
                    padding: getResponsiveSize(8),
                    marginRight: getResponsiveSize(12)
                }}>
                    <Image
                        source={item.icon}
                        style={{ width: getResponsiveSize(24), height: getResponsiveSize(24) }}
                        resizeMode="contain"
                    />
                </View>
                <Text className={`${item.textColor} font-medium`} style={{ fontSize: getResponsiveSize(16) }} numberOfLines={1}>
                    {item.label}
                </Text>
            </View>
            <Image
                source={require("../assets/images/arrow-right.png")}
                style={{ width: getResponsiveSize(16), height: getResponsiveSize(16) }}
                resizeMode="contain"
            />
        </TouchableOpacity>
    );

    // Footer component for FlatList
    const ListFooterComponent = () => (
        <View className="mt-10 flex items-center justify-center pb-10" style={{ 
            marginTop: getResponsiveSize(40),
            paddingBottom: getResponsiveSize(40),
            paddingHorizontal: getResponsiveSize(32)
        }}>
            <Text className="text-[#A2A0A8] text-center" style={{ fontSize: getResponsiveSize(14) }}>
                You joined Esusu on March 2025. It's been 1 month since then and our mission is still the same.
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-[#0074FF]">
            <StatusBarAdapter backgroundColor="#0074FF" barStyle="dark-content" />
            
            {/* Header */}
            <View className="py-8 items-center mb-5 mt-10" style={{ 
                paddingVertical: getResponsiveSize(32),
                marginBottom: getResponsiveSize(20),
                marginTop: getResponsiveSize(40)
            }}>
                <View className="rounded-full overflow-hidden bg-white justify-center items-center" style={{
                    borderRadius: getResponsiveSize(40),
                    width: getResponsiveSize(80),
                    height: getResponsiveSize(80)
                }}>
                    {userDetails?.userImg ? (
                        <Image
                            source={{ uri: userDetails.userImg }}
                            style={{ 
                                width: getResponsiveSize(80), 
                                height: getResponsiveSize(80) 
                            }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={{
                            width: getResponsiveSize(80),
                            height: getResponsiveSize(80),
                            backgroundColor: '#0072CE',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                fontSize: getResponsiveSize(32),
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                {userDetails?.firstName ? userDetails.firstName.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                    )}
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="white" className="mt-4" />
                ) : userDetails ? (
                        <>
                            <Text className="text-xl font-bold text-white mt-2" style={{ fontSize: getResponsiveSize(20) }}>
                                {userDetails?.firstName} {userDetails?.lastName}
                            </Text>
                            <Text className="text-sm text-blue-200" style={{ fontSize: getResponsiveSize(14) }}>
                                {userDetails?.email}
                            </Text>
                            
                            {/* Additional User Info */}
                            {/* <View className="mt-3 bg-white/20 rounded-lg p-3" style={{
                                marginTop: getResponsiveSize(12),
                                padding: getResponsiveSize(12),
                                borderRadius: getResponsiveSize(8)
                            }}>
                                <Text className="text-white text-xs text-center" style={{ fontSize: getResponsiveSize(10) }}>
                                    {userDetails?.accountTier?.toUpperCase()} • {userDetails?.contributorCount || 0} Contributors
                                </Text>
                                <Text className="text-white text-xs text-center mt-1" style={{ fontSize: getResponsiveSize(10) }}>
                                    {userDetails?.documentsVerified ? '✓ Verified' : '⚠ Pending'} • {userDetails?.businessLocation ? '✓ Location Set' : '⚠ Location Pending'}
                                </Text>
                            </View> */}
                        </>
                ) : null}
            </View>

            {/* Menu List */}
            <View className="flex-1 bg-white rounded-t-[32px]" style={{ 
                borderTopLeftRadius: getResponsiveSize(32),
                borderTopRightRadius: getResponsiveSize(32)
            }}>
                <FlatList
                    data={menuItems}
                    renderItem={renderMenuItem}
                    keyExtractor={(_, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: getResponsiveSize(16) }}
                    ListFooterComponent={ListFooterComponent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />

                {/* Footer */}
                <Footer />
            </View>
        </View>
    );
}
