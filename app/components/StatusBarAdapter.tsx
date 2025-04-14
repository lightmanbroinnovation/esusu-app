import React from 'react';
import { StatusBar, StatusBarProps, View, StatusBarStyle } from 'react-native';

interface StatusBarAdapterProps {
  backgroundColor: string;
  barStyle?: 'light-content' | 'dark-content' | 'default';
}

/**
 * StatusBarAdapter provides a consistent way to style the status bar 
 * according to the current screen's background color
 */
const StatusBarAdapter: React.FC<StatusBarAdapterProps> = ({ 
  backgroundColor,
  barStyle = 'dark-content',
  ...props
}) => {
  return (
    <View style={{ backgroundColor, height: StatusBar.currentHeight }}>
      <StatusBar
        translucent
        backgroundColor={backgroundColor}
        barStyle={barStyle as StatusBarStyle}
        {...props}
      />
    </View>
  );
};

export default StatusBarAdapter; 