import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { fetchUser } from "@/services/api";
import StatusBarAdapter from "../components/StatusBarAdapter";
import Footer from "../components/Footer";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the UserDetails type
interface UserDetails {
    id: string;
    phone: string;
    pin: string;
    firstname: string;
    lastname: string;
    email: string;
    business: string;
    address: string;
    city: string;
    state: string;
    bvn: string;
    idImage: string;
    cacImage: string;
    isVerified: boolean;
    userImg?: string;
}

export const options = {
    headerShown: false,
};

const menuItems = [
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
        label: "Settings",
        icon: require("../assets/images/settings.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "/profile-settings",
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
        route: "/logout",
    },
];

export default function Index() {
    const router = useRouter();
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // Get user ID from AsyncStorage
    useEffect(() => {
        const getUserId = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('userId');
                const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
                
                if (!isLoggedIn || !storedUserId) {
                    // User is not logged in, redirect to login
                    router.replace('/login');
                    return;
                }
                
                setUserId(storedUserId);
            } catch (error) {
                console.error('Error retrieving user ID:', error);
                // Use a default ID as fallback
                setUserId('62f2');
            }
        };
        
        getUserId();
    }, []);

    // Fetch user details when userId is available
    useEffect(() => {
        if (!userId) return;
        fetchDetails();
    }, [userId, retryCount]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!userId) {
                throw new Error("No user ID available");
            }
            const data = await fetchUser(userId);
            setUserDetails(data);
            setRetryCount(0); // Reset retry count on success
        } catch (error) {
            console.error("Error fetching user details:", error);
            setError("Unable to load user details. Please try again.");
            // For demonstration - using mock data when API fails
            setUserDetails({
                id: userId || "62f2",
                phone: "08012345678",
                pin: "1234",
                firstname: "John",
                lastname: "Doe",
                email: "john@example.com",
                business: "Sample Business",
                address: "123 Main St",
                city: "Lagos",
                state: "Lagos",
                bvn: "12345678901",
                idImage: "",
                cacImage: "",
                isVerified: true,
                userImg: undefined
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setRetryCount(prevCount => prevCount + 1);
    };

    const handleLogout = async () => {
        try {
            // Clear all user-related data from AsyncStorage
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userPhone');
            await AsyncStorage.removeItem('isLoggedIn');
            
            console.log("Successfully logged out");
            
            // Navigate to login screen
            router.replace("/login");
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

    return (
        <View className="flex-1 bg-[#0074FF]">
            <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
            
            {/* Header */}
            <View className="py-8 items-center mb-5 mt-10">
                <View className="rounded-full overflow-hidden bg-white justify-center items-center">
                    <Image
                        source={userDetails?.userImg 
                            ? { uri: userDetails.userImg } 
                            : require("../assets/images/user.png")}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                    />
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color="white" className="mt-4" />
                ) : error ? (
                    <View className="items-center mt-2">
                        <Text className="text-white text-center mb-2">{error}</Text>
                        <TouchableOpacity 
                            onPress={handleRetry}
                            className="bg-white px-4 py-2 rounded-full"
                        >
                            <Text className="text-blue-600 font-medium">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Text className="text-xl font-bold text-white mt-2">
                            {userDetails?.firstname} {userDetails?.lastname}
                        </Text>
                        <Text className="text-sm text-blue-200">Agent ID: {userDetails?.id}</Text>
                    </>
                )}
            </View>

            {/* Menu List */}
            <View className="flex-1 bg-white rounded-t-[32px]">
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
                >
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className={`flex-row items-center justify-between px-5 py-4 ${index !== menuItems.length - 1 ? "border-b border-gray-200" : ""
                                }`}
                            onPress={() => handlePress(item.route)}
                        >
                            <View className="flex-row items-center">
                                <View className={`${item.bgColor} rounded-md p-2 mr-3`}>
                                    <Image
                                        source={item.icon}
                                        style={{ width: 24, height: 24 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text className={`text-base ${item.textColor} font-medium`}>{item.label}</Text>
                            </View>
                            <Image
                                source={require("../assets/images/arrow-right.png")}
                                style={{ width: 16, height: 16 }}
                                resizeMode="contain"
                                className="text-lg"
                            />
                        </TouchableOpacity>
                    ))}

                    {/* joining date */}
                    <View className="mt-10 flex items-center justify-center mx-8 pb-10">
                        <Text className="text-[14px] text-[#A2A0A8] text-center">You joined Esusu on March 2025. It's been 1 month since then and our mission is still the same.</Text>
                    </View>
                </ScrollView>

                {/* Footer */}
                <Footer />
            </View>
        </View>
    );
}
