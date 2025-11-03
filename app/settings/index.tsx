import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList, SafeAreaView, Alert, BackHandler, RefreshControl, Dimensions, StyleSheet } from "react-native";
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
        bgColor: "#DBEAFE",
        textColor: "#1F2937",
        route: "/Tier",
    },
    {
        label: "My Account",
        icon: require("../assets/images/my_account.png"),
        bgColor: "#DBEAFE",
        textColor: "#1F2937",
        route: "/account",
    },
    {
        label: "Linked Banks",
        icon: require("../assets/images/card.png"),
        bgColor: "#DBEAFE",
        textColor: "#1F2937",
        route: "/link-bank",
    },
    {
        label: "Referral Program",
        icon: require("../assets/images/my_account.png"),
        bgColor: "#DBEAFE",
        textColor: "#1F2937",
        route: "/referral",
    },
    {
        label: "Settings",
        icon: require("../assets/images/settings.png"),
        bgColor: "#DBEAFE",
        textColor: "#1F2937",
        route: "/profile-settings",
    },
    {
        label: "Biometric Login",
        icon: require("../assets/images/security.png"),
        bgColor: "#DBEAFE",
        textColor: "#1F2937",
        route: "/security",
    },
    {
        label: "FAQs",
        icon: require("../assets/images/que.png"),
        bgColor: "#DBEAFE",
        textColor: "#1F2937",
        route: "/faq",
    },
    {
        label: "Support Center",
        icon: require("../assets/images/faqs.png"),
        bgColor: "#DBEAFE",
        textColor: "#1F2937",
        route: "/support-center",
    },
    {
        label: "Log Out",
        icon: require("../assets/images/logout.png"),
        bgColor: "#FEE2E2",
        textColor: "#EF4444",
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
    if (route === "/login/passcode") {
      // Navigate to passcode with phone parameter
      try {
        const userPhone = userDetails?.phoneNumber;
        if (userPhone) {
          router.push({
            pathname: '/login/passcode',
            params: { phone: userPhone, loginMethod: 'phone' }
          });
        } else {
          Alert.alert("Error", "Phone number not found. Please log in again.");
        }
      } catch (error) {
        console.error("Navigation error:", error);
        Alert.alert("Error", "Failed to navigate. Please try again.");
      }
    } else if (route === "/logout") {
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
            <View style={styles.noNetworkContainer}>
                <Text style={styles.noNetworkText}>No network. Please connect to the internet to load settings.</Text>
            </View>
        );
    }

    // Create dynamic styles function
    const getStyles = (): any => ({
        noNetworkContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        noNetworkText: {
            textAlign: 'center',
            paddingHorizontal: 20,
        },
        container: {
            flex: 1,
            backgroundColor: '#0074FF',
        },
        header: {
            paddingVertical: getResponsiveSize(32),
            marginBottom: getResponsiveSize(20),
            marginTop: getResponsiveSize(40),
            alignItems: 'center',
        },
        avatarContainer: {
            borderRadius: getResponsiveSize(40),
            width: getResponsiveSize(80),
            height: getResponsiveSize(80),
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarImage: {
            width: getResponsiveSize(80),
            height: getResponsiveSize(80),
        },
        avatarPlaceholder: {
            width: getResponsiveSize(80),
            height: getResponsiveSize(80),
            backgroundColor: '#0072CE',
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarInitial: {
            fontSize: getResponsiveSize(32),
            fontWeight: 'bold',
            color: '#FFFFFF',
        },
        userName: {
            fontSize: getResponsiveSize(20),
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginTop: 8,
        },
        userEmail: {
            fontSize: getResponsiveSize(14),
            color: '#BFDBFE',
        },
        contentContainer: {
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: getResponsiveSize(32),
            borderTopRightRadius: getResponsiveSize(32),
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: getResponsiveSize(20),
            paddingVertical: getResponsiveSize(16),
        },
        menuItemContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        menuIconContainer: (bgColor: string) => ({
            backgroundColor: bgColor,
            borderRadius: 6,
            padding: getResponsiveSize(8),
            marginRight: getResponsiveSize(12),
        }),
        menuIcon: {
            width: getResponsiveSize(24),
            height: getResponsiveSize(24),
        },
        menuText: (textColor: string) => ({
            color: textColor,
            fontWeight: '500',
            fontSize: getResponsiveSize(16),
        }),
        menuArrow: {
            width: getResponsiveSize(16),
            height: getResponsiveSize(16),
        },
        listFooter: {
            marginTop: getResponsiveSize(40),
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: getResponsiveSize(40),
            paddingHorizontal: getResponsiveSize(32),
        },
    });

    // Render menu item
    const renderMenuItem = ({ item, index }: { item: MenuItem; index: number }) => {
        const dynamicStyles = getStyles();
        return (
            <TouchableOpacity
                style={[
                    dynamicStyles.menuItem,
                    index !== menuItems.length - 1 && styles.menuItemBorder
                ]}
                onPress={() => handlePress(item.route)}
            >
                <View style={dynamicStyles.menuItemContent}>
                    <View style={dynamicStyles.menuIconContainer(item.bgColor)}>
                        <Image
                            source={item.icon}
                            style={dynamicStyles.menuIcon}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={dynamicStyles.menuText(item.textColor)} numberOfLines={1}>
                        {item.label}
                    </Text>
                </View>
                <Image
                    source={require("../assets/images/arrow-right.png")}
                    style={dynamicStyles.menuArrow}
                    resizeMode="contain"
                />
            </TouchableOpacity>
        );
    };

    // Footer component for FlatList
    const ListFooterComponent = () => {
        const dynamicStyles = getStyles();
        return (
            <View style={dynamicStyles.listFooter}>
                {/* <Text style={{ fontSize: getResponsiveSize(14), color: '#A2A0A8', textAlign: 'center' }}>
                    You joined Esusu on March 2025. It's been 1 month since then and our mission is still the same.
                </Text> */}
            </View>
        );
    };

    const dynamicStyles = getStyles();

    return (
        <View style={dynamicStyles.container}>
            {/* <StatusBarAdapter backgroundColor="#0074FF" barStyle="dark-content" /> */}
            
            {/* Header */}
            <View style={dynamicStyles.header}>
                <View style={dynamicStyles.avatarContainer}>
                    {userDetails?.userImg ? (
                        <Image
                            source={{ uri: userDetails.userImg }}
                            style={dynamicStyles.avatarImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={dynamicStyles.avatarPlaceholder}>
                            <Text style={dynamicStyles.avatarInitial}>
                                {userDetails?.firstName ? userDetails.firstName.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </View>
                    )}
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="white" style={{ marginTop: 16 }} />
                ) : userDetails ? (
                    <>
                        <Text style={dynamicStyles.userName}>
                            {userDetails?.firstName} {userDetails?.lastName}
                        </Text>
                        <Text style={dynamicStyles.userEmail}>
                            {userDetails?.email}
                        </Text>
                    </>
                ) : null}
            </View>

            {/* Menu List */}
            <View style={dynamicStyles.contentContainer}>
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

const styles = StyleSheet.create({
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
});
