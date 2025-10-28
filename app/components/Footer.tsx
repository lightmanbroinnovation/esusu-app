import React from "react";
import { View, TouchableOpacity, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from 'expo-router';

interface FooterProps {
  disabled?: boolean;
  disableCommissionButton?: boolean;
}

const Footer = ({ disabled = false, disableCommissionButton = false }: FooterProps) => {
  const router = useRouter();
  const pathname = usePathname();
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

  // Unread count is now managed by the notification context

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
    <View className="flex-row justify-around items-center bg-gray-50 py-2 drop-shadow-md" style={{
      paddingVertical: getResponsiveSize(8),
      paddingHorizontal: getResponsiveSize(16)
    }}>
      {/* Home Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("home")}
        disabled={disabled}
        style={{ 
          opacity: disabled ? 0.5 : 1,
          alignItems: 'center',
          flex: 1
        }}
      >
        <View className={`p-2 ${activePage === "home" ? "bg-[#E5F1FF] rounded-2xl px-4" : ""}`} style={{
          padding: getResponsiveSize(8),
          borderRadius: activePage === "home" ? getResponsiveSize(16) : 0,
          paddingHorizontal: activePage === "home" ? getResponsiveSize(16) : getResponsiveSize(8)
        }}>
          <Ionicons 
            name="home"
            size={getResponsiveSize(18)} 
            color={activePage === "home" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "home" ? "text-[#0052CC] font-medium" : "text-gray-500"}`} style={{
          fontSize: getResponsiveSize(12),
          marginTop: getResponsiveSize(4)
        }}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Contributor Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("contributors")}
        disabled={disabled}
        style={{ 
          opacity: disabled ? 0.5 : 1,
          alignItems: 'center',
          flex: 1
        }}
      >
        <View className={`p-2 ${activePage === "contributors" ? "bg-[#E5F1FF] rounded-2xl px-4" : ""}`} style={{
          padding: getResponsiveSize(8),
          borderRadius: activePage === "contributors" ? getResponsiveSize(16) : 0,
          paddingHorizontal: activePage === "contributors" ? getResponsiveSize(16) : getResponsiveSize(8)
        }}>
          <Ionicons 
            name="people-outline"
            size={getResponsiveSize(18)}
            color={activePage === "contributors" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "contributors" ? "text-[#0052CC] font-medium" : "text-gray-500"}`} style={{
          fontSize: getResponsiveSize(12),
          marginTop: getResponsiveSize(4)
        }}>
          Contributor
        </Text>
      </TouchableOpacity>

      {/* Commission Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("commission")}
        disabled={disabled || disableCommissionButton}
        style={{ 
          opacity: (disabled || disableCommissionButton) ? 0.5 : 1,
          alignItems: 'center',
          flex: 1
        }}
      >
        <View className={`p-2 ${activePage === "commission" ? "bg-[#E5F1FF] rounded-2xl px-4" : ""}`} style={{
          padding: getResponsiveSize(8),
          borderRadius: activePage === "commission" ? getResponsiveSize(16) : 0,
          paddingHorizontal: activePage === "commission" ? getResponsiveSize(16) : getResponsiveSize(8)
        }}>
          <Ionicons 
            name="wallet-outline"
            size={getResponsiveSize(18)}
            color={activePage === "commission" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "commission" ? "text-[#0052CC] font-medium" : "text-gray-500"}`} style={{
          fontSize: getResponsiveSize(12),
          marginTop: getResponsiveSize(4)
        }}>
          Commission
        </Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        className="items-center"
        onPress={() => handlePress("settings")}
        disabled={disabled}
        style={{ 
          opacity: disabled ? 0.5 : 1,
          alignItems: 'center',
          flex: 1
        }}
      >
        <View className={`p-2 ${activePage === "settings" ? "bg-[#E5F1FF] rounded-2xl px-4" : ""}`} style={{
          padding: getResponsiveSize(8),
          borderRadius: activePage === "settings" ? getResponsiveSize(16) : 0,
          paddingHorizontal: activePage === "settings" ? getResponsiveSize(16) : getResponsiveSize(8)
        }}>
          <Ionicons 
            name="person-outline"
            size={getResponsiveSize(18)}
            color={activePage === "settings" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text className={`text-xs mt-1 ${activePage === "settings" ? "text-[#0052CC] font-medium" : "text-gray-500"}`} style={{
          fontSize: getResponsiveSize(12),
          marginTop: getResponsiveSize(4)
        }}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
