import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StandardHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
}

const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  backgroundColor = 'white'
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor, 
        paddingTop: insets.top + 10,
        paddingLeft: 16,
        paddingRight: 16
      }
    ]}>
      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        )}
        
        <Text style={styles.title}>{title}</Text>
        
        {rightComponent ? (
          <View style={styles.rightComponent}>
            {rightComponent}
          </View>
        ) : (
          <View style={styles.placeholderRight} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    height: 56,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  rightComponent: {
    width: 40,
  },
  placeholderRight: {
    width: 40,
  }
});

export default StandardHeader; 