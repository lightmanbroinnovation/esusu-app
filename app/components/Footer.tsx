import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from 'expo-router';

const Footer = () => {
  const router = useRouter();
  const pathname = usePathname();

  const getActivePageFromPath = () => {
    if (pathname.includes('/dashboard')) return 'home';
    if (pathname.includes('/contributors')) return 'contributors';
    if (pathname.includes('/commission')) return 'commission';
    if (pathname.includes('/settings') || pathname.includes('/profile')) return 'settings';
    return 'home'; // Default fallback
  };
  
  const activePage = getActivePageFromPath();

  const handlePress = (page: 'home' | 'contributors' | 'commission' | 'settings') => {
    console.log(`Navigating to ${page}`);
    
    // Use specific paths based on the page parameter
    switch (page) {
      case 'home':
        router.push('/dashboard');
        break;
      case 'contributors':
        router.push('/contributors/ContributorsScreen');
        break;
      case 'commission':
        router.push('/commission');
        break;
      case 'settings':
        router.push('/settings');
        break;
      default:
        console.error("Unknown page:", page);
    }
  };

  return (
    <View className="flex-row justify-around items-center bg-gray-50 py-2 drop-shadow-md">
      {/* Home Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("home")}
      >
        <View className={`p-2 ${activePage === "home" ? "bg-[#E5F1FF] rounded-2xl px-4" : ""}`}>
          <Ionicons 
            name="home"
            size={18} 
            color={activePage === "home" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "home" ? "text-[#0052CC] font-medium" : "text-gray-500"}`}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Contributor Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("contributors")}
      >
        <View className={`p-2 ${activePage === "contributors" ? "bg-[#E5F1FF] rounded-2xl px-4" : ""}`}>
          <Ionicons 
            name="people-outline"
            size={18}
            color={activePage === "contributors" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "contributors" ? "text-[#0052CC] font-medium" : "text-gray-500"}`}>
          Contributor
        </Text>
      </TouchableOpacity>

      {/* Commission Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("commission")}
      >
        <View className={`p-2 ${activePage === "commission" ? "bg-[#E5F1FF] rounded-2xl px-4" : ""}`}>
          <Ionicons 
            name="wallet-outline"
            size={18}
            color={activePage === "commission" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "commission" ? "text-[#0052CC] font-medium" : "text-gray-500"}`}>
          Commission
        </Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("settings")}
      >
        <View className={`p-2 ${activePage === "settings" ? "bg-[#E5F1FF] rounded-2xl px-4" : ""}`}>
          <Ionicons 
            name="person-outline"
            size={18}
            color={activePage === "settings" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "settings" ? "text-[#0052CC] font-medium" : "text-gray-500"}`}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
