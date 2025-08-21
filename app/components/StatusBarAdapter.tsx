import React from 'react';
import { StatusBar, StatusBarProps, View, StatusBarStyle, Platform, Dimensions } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StatusBarAdapterProps {
  backgroundColor?: string;
  barStyle?: 'light-content' | 'dark-content' | 'default';
}

/**
 * StatusBarAdapter provides a consistent way to style the status bar 
 * according to the current screen's background color with improved mobile responsiveness
 */
const StatusBarAdapter: React.FC<StatusBarAdapterProps> = ({ 
  backgroundColor = '#E6F3FF', // Default to light blue
  barStyle = 'dark-content',
  ...props
}) => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  
  // Use transparent for root index
  const bgColor = pathname === '/' ? 'transparent' : backgroundColor;
  
  // Calculate proper status bar height for different devices
  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      return insets.top;
    } else {
      // Android status bar height
      return StatusBar.currentHeight || 24;
    }
  };

  return (
    <View style={{ 
      backgroundColor: bgColor, 
      height: getStatusBarHeight(),
      width: '100%'
    }}>
      <StatusBar
        translucent
        backgroundColor={bgColor}
        barStyle={barStyle as StatusBarStyle}
        {...props}
      />
    </View>
  );
};

export default StatusBarAdapter; 