import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from 'expo-router';

const Footer = () => {
  const [activePage, setActivePage] = useState("Home");
  const router = useRouter();

  const handlePress = (page: 'home' | 'contributors' | 'commission' | 'settings') => {
    setActivePage(page);
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
    <View className="flex-row justify-around items-center bg-white py-3 border-t border-gray-200">
      {/* Home Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("home")}
      >
        <View className={`p-2 ${activePage === "Home" ? "bg-[#E5F1FF] rounded-full" : ""}`}>
          <Ionicons 
            name="home"
            size={22} 
            color={activePage === "Home" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "Home" ? "text-[#0052CC] font-medium" : "text-gray-500"}`}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Contributor Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("contributors")}
      >
        <View className={`p-2 ${activePage === "Contributor" ? "bg-[#E5F1FF] rounded-full" : ""}`}>
          <Ionicons 
            name="people-outline"
            size={22}
            color={activePage === "Contributor" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "Contributor" ? "text-[#0052CC] font-medium" : "text-gray-500"}`}>
          Contributor
        </Text>
      </TouchableOpacity>

      {/* Commission Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("commission")}
      >
        <View className={`p-2 ${activePage === "Commission" ? "bg-[#E5F1FF] rounded-full" : ""}`}>
          <Ionicons 
            name="wallet-outline"
            size={22}
            color={activePage === "Commission" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "Commission" ? "text-[#0052CC] font-medium" : "text-gray-500"}`}>
          Commission
        </Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("settings")}
      >
        <View className={`p-2 ${activePage === "Profile" ? "bg-[#E5F1FF] rounded-full" : ""}`}>
          <Ionicons 
            name="person-outline"
            size={22}
            color={activePage === "Profile" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "Profile" ? "text-[#0052CC] font-medium" : "text-gray-500"}`}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
