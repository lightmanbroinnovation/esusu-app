import React from 'react';
import { StatusBar, StatusBarProps, View, StatusBarStyle } from 'react-native';
import { usePathname } from 'expo-router';

interface StatusBarAdapterProps {
  backgroundColor?: string;
  barStyle?: 'light-content' | 'dark-content' | 'default';
}

/**
 * StatusBarAdapter provides a consistent way to style the status bar 
 * according to the current screen's background color
 */
const StatusBarAdapter: React.FC<StatusBarAdapterProps> = ({ 
  backgroundColor = '#E6F3FF', // Default to light blue
  barStyle = 'dark-content',
  ...props
}) => {
  const pathname = usePathname();
  
  // Use transparent for root index
  const bgColor = pathname === '/' ? 'transparent' : backgroundColor;
  
  return (
    <View style={{ backgroundColor: bgColor, height: StatusBar.currentHeight }}>
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