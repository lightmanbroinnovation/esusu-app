import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, ScrollViewProps } from 'react-native';

interface CustomScrollViewProps extends ScrollViewProps {
  children: ReactNode;
}

const ScrollViewComponent: React.FC<CustomScrollViewProps> = ({ children, ...props }) => {
  return (
    <ScrollView
      {...props}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      style={[styles.scrollView, props.style]}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});

export default ScrollViewComponent; 