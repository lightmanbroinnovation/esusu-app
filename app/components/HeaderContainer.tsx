import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderContainerProps {
  children: ReactNode;
  backgroundColor?: string;
  withBorder?: boolean;
}

/**
 * HeaderContainer provides consistent margins and styling for headers across the app
 */
const HeaderContainer: React.FC<HeaderContainerProps> = ({
  children,
  backgroundColor = 'white',
  withBorder = true,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight ?? 36,
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomColor: '#E0E0E0',
  },
});

export default HeaderContainer; 