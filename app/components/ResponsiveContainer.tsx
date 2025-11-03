import React, { ReactNode } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  safeArea?: boolean;
}

/**
 * ResponsiveContainer provides adaptive layout for different screen sizes
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  padding = 'medium',
  safeArea = true,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

  // Responsive padding based on screen size
  const getPadding = () => {
    const basePadding = (() => {
      switch (padding) {
        case 'none': return 0;
        case 'small': return 12;
        case 'medium': return 16;
        case 'large': return 20;
        default: return 16;
      }
    })();

    // Adjust for screen size
    if (width < 375) {
      return basePadding * 0.8; // Small phones
    } else if (width < 414) {
      return basePadding; // Medium phones
    } else {
      return basePadding * 1.2; // Large phones and tablets
    }
  };

  // Responsive text scaling
  const getResponsiveTextSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9;
    } else if (width < 414) {
      return baseSize;
    } else {
      return baseSize * 1.1;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: getPadding(),
        paddingTop: safeArea ? (Platform.OS === 'ios' ? insets.top : 0) : 0,
        paddingBottom: safeArea ? insets.bottom : 0,
      }}
    >
      {children}
    </View>
  );
};

export default ResponsiveContainer; 