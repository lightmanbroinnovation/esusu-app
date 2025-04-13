
import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { fetchUser } from "@/services/api";

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
        route: "../account",
    },
    {
        label: "Linked Banks",
        icon: require("../assets/images/card.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "../link-bank",
    },
    {
        label: "Settings",
        icon: require("../assets/images/settings.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "../profile-settings",
    },
    {
        label: "FAQs",
        icon: require("../assets/images/que.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "../faq",
    },
    {
        label: "Support Center",
        icon: require("../assets/images/faqs.png"),
        bgColor: "bg-blue-100",
        textColor: "text-gray-800",
        route: "../support-center",
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
    const id = "2101"; 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
          try {
            const data = await fetchUser(id);
            setUserDetails(data);
          } catch (error) {
            console.error("Error fetching user details:", error);
          } finally {
            setLoading(false); 
          }
        };
      
        fetchDetails();
      }, [id]);
      

    const handlePress = (route: string) => {
        router.push(route as any);
    };

    return (
        <View className="bg-[#0074FF] h-screen">
            {/* Header */}
            <View className="py-8 items-center mb-5 mt-10">
                <View className="rounded-full overflow-hidden bg-white justify-center items-center">
                    <Image
                        source={require("../assets/images/user.png")}
                        style={{ width: 80, height: 80 }}
                        resizeMode="contain"
                    />
                </View>
                {loading ? (
                    <ActivityIndicator color="white" className="mt-4" />
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
            <View className="bg-white rounded-[32px] pt-4 shadow-md h-screen">
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
                <View className="mt-10 flex items-center justify-center mx-8">
                    <Text className="text-[14px] text-[#A2A0A8] text-center">You joined Esusu on March 2025. It’s been 1 month since then and our mission is still the same.</Text>
                </View>
            </View>
        </View>
    );
}
