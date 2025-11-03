import React from "react";
import { View, TouchableOpacity, Text, Dimensions, StyleSheet } from "react-native";
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
    <View style={[
      styles.container,
      {
        paddingVertical: getResponsiveSize(8),
        paddingHorizontal: getResponsiveSize(16)
      }
    ]}>
      {/* Home Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { 
            opacity: disabled ? 0.5 : 1,
          }
        ]}
        onPress={() => handlePress("home")}
        disabled={disabled}
      >
        <View style={[
          styles.iconContainer,
          activePage === "home" && styles.iconContainerActive,
          {
            padding: getResponsiveSize(8),
            borderRadius: activePage === "home" ? getResponsiveSize(16) : 0,
            paddingHorizontal: activePage === "home" ? getResponsiveSize(16) : getResponsiveSize(8)
          }
        ]}>
          <Ionicons 
            name="home"
            size={getResponsiveSize(18)} 
            color={activePage === "home" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text style={[
          styles.buttonText,
          activePage === "home" && styles.buttonTextActive,
          {
            fontSize: getResponsiveSize(12),
            marginTop: getResponsiveSize(4)
          }
        ]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Contributor Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { 
            opacity: disabled ? 0.5 : 1,
          }
        ]}
        onPress={() => handlePress("contributors")}
        disabled={disabled}
      >
        <View style={[
          styles.iconContainer,
          activePage === "contributors" && styles.iconContainerActive,
          {
            padding: getResponsiveSize(8),
            borderRadius: activePage === "contributors" ? getResponsiveSize(16) : 0,
            paddingHorizontal: activePage === "contributors" ? getResponsiveSize(16) : getResponsiveSize(8)
          }
        ]}>
          <Ionicons 
            name="people-outline"
            size={getResponsiveSize(18)}
            color={activePage === "contributors" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text style={[
          styles.buttonText,
          activePage === "contributors" && styles.buttonTextActive,
          {
            fontSize: getResponsiveSize(12),
            marginTop: getResponsiveSize(4)
          }
        ]}>
          Contributor
        </Text>
      </TouchableOpacity>

      {/* Commission Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { 
            opacity: (disabled || disableCommissionButton) ? 0.5 : 1,
          }
        ]}
        onPress={() => handlePress("commission")}
        disabled={disabled || disableCommissionButton}
      >
        <View style={[
          styles.iconContainer,
          activePage === "commission" && styles.iconContainerActive,
          {
            padding: getResponsiveSize(8),
            borderRadius: activePage === "commission" ? getResponsiveSize(16) : 0,
            paddingHorizontal: activePage === "commission" ? getResponsiveSize(16) : getResponsiveSize(8)
          }
        ]}>
          <Ionicons 
            name="wallet-outline"
            size={getResponsiveSize(18)}
            color={activePage === "commission" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text style={[
          styles.buttonText,
          activePage === "commission" && styles.buttonTextActive,
          {
            fontSize: getResponsiveSize(12),
            marginTop: getResponsiveSize(4)
          }
        ]}>
          Commission
        </Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity
        style={[
          styles.button,
          { 
            opacity: disabled ? 0.5 : 1,
          }
        ]}
        onPress={() => handlePress("settings")}
        disabled={disabled}
      >
        <View style={[
          styles.iconContainer,
          activePage === "settings" && styles.iconContainerActive,
          {
            padding: getResponsiveSize(8),
            borderRadius: activePage === "settings" ? getResponsiveSize(16) : 0,
            paddingHorizontal: activePage === "settings" ? getResponsiveSize(16) : getResponsiveSize(8)
          }
        ]}>
          <Ionicons 
            name="person-outline"
            size={getResponsiveSize(18)}
            color={activePage === "settings" ? "#0052CC" : "#8F92A1"}
          />
        </View>
        <Text style={[
          styles.buttonText,
          activePage === "settings" && styles.buttonTextActive,
          {
            fontSize: getResponsiveSize(12),
            marginTop: getResponsiveSize(4)
          }
        ]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  button: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    padding: 8,
  },
  iconContainerActive: {
    backgroundColor: '#E5F1FF',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 12,
    marginTop: 4,
    color: '#6B7280',
  },
  buttonTextActive: {
    color: '#0052CC',
    fontWeight: '500',
  },
});

export default Footer;
