import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderContainerProps {
  children: ReactNode;
  backgroundColor?: string;
  withBorder?: boolean;
}

/**
 * HeaderContainer provides consistent margins and styling for headers across the app
 * with improved mobile responsiveness
 */
const HeaderContainer: React.FC<HeaderContainerProps> = ({
  children,
  backgroundColor = 'white',
  withBorder = true,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  
  // Responsive padding based on screen size
  const getResponsivePadding = () => {
    if (width < 375) {
      return 12; // Small phones
    } else if (width < 414) {
      return 16; // Medium phones
    } else {
      return 20; // Large phones and tablets
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight ?? 36,
          paddingHorizontal: getResponsivePadding(),
          borderBottomWidth: withBorder ? StyleSheet.hairlineWidth : 0,
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 12,
    borderBottomColor: '#E0E0E0',
  },
});

export default HeaderContainer; 